#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACT_ROOT="${ROOT_DIR}/.omx/state/daytona-hello-world-shell"
mkdir -p "${ARTIFACT_ROOT}"

TEAM_ID="${TEAM_ID:-1219}"
MAKE_ZONE="${MAKE_ZONE:-we.make.com}"
APP_IMT_NAME="${APP_IMT_NAME:-app#daytona-api-call-to21vy}"
APP_MODULE_NAME="${APP_MODULE_NAME:-makeAnApiCall}"
APP_VERSION="${APP_VERSION:-1}"
CONNECTION_NAME="${CONNECTION_NAME:-Daytona API Key Shell Test}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR="${ARTIFACT_ROOT}/${TIMESTAMP}"
mkdir -p "${RUN_DIR}"

if [[ -z "${MAKE_API_KEY:-}" || -z "${DAYTONA_API_KEY:-}" ]]; then
  echo "MAKE_API_KEY and DAYTONA_API_KEY are required." >&2
  exit 1
fi

make_cli() {
  if command -v make-cli >/dev/null 2>&1; then
    make-cli "$@"
  else
    npx -y @makehq/cli "$@"
  fi
}

json_compact() {
  ruby -rjson -e 'puts JSON.generate(JSON.parse(File.read(ARGV[0])))' "$1"
}

write_json() {
  local path="$1"
  shift
  cat > "${path}" <<EOF
$*
EOF
}

extract_first_matching_connection_id() {
  ruby -rjson -e '
    items = JSON.parse(STDIN.read)
    app_imt_name = ARGV[0]
    connection_name = ARGV[1]
    hits = items.select do |item|
      item["accountName"] == app_imt_name && item["name"] == connection_name
    end
    abort("Ambiguous connection match for #{connection_name}") if hits.length > 1
    print(hits[0] && hits[0]["id"])
  ' "$APP_IMT_NAME" "$CONNECTION_NAME"
}

extract_json_path() {
  local key="$1"
  ruby -rjson -e '
    target = ARGV[0]
    data = JSON.parse(STDIN.read)
    def find_key(obj, target)
      case obj
      when Hash
        return obj[target] if obj.key?(target)
        obj.each_value do |value|
          found = find_key(value, target)
          return found unless found.nil?
        end
      when Array
        obj.each do |value|
          found = find_key(value, target)
          return found unless found.nil?
        end
      end
      nil
    end
    result = find_key(data, target)
    if result.is_a?(String) || result.is_a?(Numeric) || result == true || result == false
      print(result)
    elsif !result.nil?
      print(JSON.generate(result))
    end
  ' "$key"
}

api_post_json() {
  local path="$1"
  local body="$2"
  curl -sS -X POST \
    -H "Authorization: Bearer ${DAYTONA_API_KEY}" \
    -H "Content-Type: application/json" \
    "https://app.daytona.io/api${path}" \
    -d "${body}"
}

write_connection_summary() {
  local path="$1"
  local source_json="$2"
  printf '%s' "${source_json}" | ruby -rjson -e '
    data = JSON.parse(STDIN.read)
    summary =
      if data.is_a?(Array)
        data
          .select { |item| item["accountName"] == ARGV[0] && item["name"] == ARGV[1] }
          .map do |item|
            {
              "id" => item["id"],
              "name" => item["name"],
              "accountName" => item["accountName"],
              "accountType" => item["accountType"],
              "teamId" => item["teamId"]
            }
          end
      else
        {
          "id" => data["id"],
          "name" => data["name"],
          "accountName" => data["accountName"],
          "accountType" => data["accountType"],
          "teamId" => data["teamId"]
        }
      end
    File.write(ARGV[2], JSON.pretty_generate(summary) + "\n")
  ' "$APP_IMT_NAME" "$CONNECTION_NAME" "$path"
}

scenario_id=""

cleanup() {
  if [[ -n "${scenario_id}" ]]; then
    make_cli scenarios deactivate --scenario-id="${scenario_id}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "Reusing or creating Make connection..."
connections_json="$(make_cli connections list --team-id="${TEAM_ID}" --output=json)"
write_connection_summary "${RUN_DIR}/connection-summary.json" "${connections_json}"
connection_id="$(printf '%s' "${connections_json}" | extract_first_matching_connection_id)"

if [[ -z "${connection_id}" ]]; then
  create_connection_json="$(
    make_cli connections create \
      --name="${CONNECTION_NAME}" \
      --account-name="${APP_IMT_NAME}" \
      --team-id="${TEAM_ID}" \
      --data="{\"apiKey\":\"${DAYTONA_API_KEY}\"}" \
      --output=json
  )"
  write_connection_summary "${RUN_DIR}/connection-create.json" "${create_connection_json}"
  connection_id="$(printf '%s' "${create_connection_json}" | extract_json_path "id")"
fi

if [[ -z "${connection_id}" ]]; then
  echo "Could not resolve Make connection id." >&2
  exit 1
fi

echo "Verifying Make connection ${connection_id}..."
make_cli connections verify --connection-id="${connection_id}" > "${RUN_DIR}/connection-verify.txt"

echo "Creating disposable Daytona sandbox..."
sandbox_name="make-hello-world-${TIMESTAMP}"
sandbox_create_body="$(cat <<EOF
{"name":"${sandbox_name}","snapshot":"daytonaio/sandbox:0.6.0","target":"eu","autoStopInterval":15,"autoArchiveInterval":60,"labels":{"purpose":"make-test","owner":"codex","created_at":"${TIMESTAMP}"}}
EOF
)"
sandbox_create_json="$(api_post_json "/sandbox" "${sandbox_create_body}")"
printf '%s\n' "${sandbox_create_json}" > "${RUN_DIR}/sandbox-create.json"
sandbox_id="$(printf '%s' "${sandbox_create_json}" | extract_json_path "id")"

if [[ -z "${sandbox_id}" ]]; then
  echo "Could not create Daytona sandbox." >&2
  exit 1
fi

echo "Running direct Daytona endpoint preflight on ${sandbox_id}..."
preflight_body='{"command":"sh -lc '\''echo endpoint-ok'\''","timeout":10}'
preflight_json="$(api_post_json "/toolbox/${sandbox_id}/toolbox/process/execute" "${preflight_body}")"
printf '%s\n' "${preflight_json}" > "${RUN_DIR}/direct-preflight.json"

if [[ "$(printf '%s' "${preflight_json}" | extract_json_path "exitCode")" != "0" ]] || ! printf '%s' "${preflight_json}" | rg -q 'endpoint-ok'; then
  echo "Daytona direct endpoint preflight failed." >&2
  exit 1
fi

scenario_name="TEST ONLY - Daytona Hello World JS Shell - ${TIMESTAMP}"
blueprint_file="${RUN_DIR}/scenario-blueprint.json"
interface_file="${RUN_DIR}/scenario-interface.json"
probe_payload_file="${RUN_DIR}/scenario-probe-payload.json"
hello_payload_file="${RUN_DIR}/scenario-hello-payload.json"

write_json "${blueprint_file}" "{
  \"name\": \"${scenario_name}\",
  \"flow\": [
    {
      \"id\": 2,
      \"mapper\": {},
      \"module\": \"scenario-service:StartSubscenario\",
      \"version\": 2,
      \"metadata\": {
        \"restore\": {},
        \"designer\": { \"x\": 0, \"y\": 0 },
        \"interface\": [
          { \"name\": \"path\", \"type\": \"text\", \"label\": \"Path\", \"required\": true, \"multiline\": false },
          { \"name\": \"body\", \"type\": \"any\", \"label\": \"Body\", \"required\": false },
          { \"name\": \"header\", \"type\": \"any\", \"label\": \"Headers\", \"required\": false },
          { \"name\": \"method\", \"type\": \"text\", \"label\": \"Method\", \"required\": true, \"multiline\": false }
        ]
      },
      \"parameters\": {}
    },
    {
      \"id\": 3,
      \"filter\": null,
      \"mapper\": {
        \"url\": \"{{2.path}}\",
        \"body\": \"{{2.body}}\",
        \"method\": \"{{2.method}}\",
        \"headers\": \"{{2.header}}\"
      },
      \"module\": \"${APP_IMT_NAME}:${APP_MODULE_NAME}\",
      \"version\": ${APP_VERSION},
      \"metadata\": {
        \"expect\": [
          { \"help\": \"Relative Daytona API path, for example /sandbox or /organizations.\", \"name\": \"url\", \"type\": \"text\", \"label\": \"Path\", \"required\": true },
          {
            \"name\": \"method\",
            \"type\": \"select\",
            \"label\": \"Method\",
            \"default\": \"GET\",
            \"options\": [
              { \"label\": \"GET\", \"value\": \"GET\" },
              { \"label\": \"POST\", \"value\": \"POST\" },
              { \"label\": \"PUT\", \"value\": \"PUT\" },
              { \"label\": \"PATCH\", \"value\": \"PATCH\" },
              { \"label\": \"DELETE\", \"value\": \"DELETE\" }
            ],
            \"required\": true
          },
          {
            \"help\": \"Additional headers only. Do not add Authorization here.\",
            \"name\": \"headers\",
            \"spec\": [
              { \"name\": \"key\", \"type\": \"text\", \"label\": \"Key\" },
              { \"name\": \"value\", \"type\": \"text\", \"label\": \"Value\" }
            ],
            \"type\": \"array\",
            \"label\": \"Headers\"
          },
          { \"help\": \"Optional request body for POST, PUT, and PATCH requests.\", \"name\": \"body\", \"type\": \"any\", \"label\": \"Body\" }
        ],
        \"restore\": {
          \"expect\": {
            \"method\": { \"mode\": \"edit\" },
            \"headers\": { \"mode\": \"edit\" }
          },
          \"parameters\": {
            \"__IMTCONN__\": {
              \"data\": { \"scoped\": \"true\", \"connection\": \"${APP_IMT_NAME}\" },
              \"label\": \"${CONNECTION_NAME}\"
            }
          }
        },
        \"designer\": { \"x\": 300, \"y\": 0 },
        \"parameters\": [
          { \"name\": \"__IMTCONN__\", \"type\": \"account:${APP_IMT_NAME}\", \"label\": \"Connection\", \"required\": true }
        ]
      },
      \"parameters\": {
        \"__IMTCONN__\": ${connection_id}
      }
    },
      {
        \"id\": 1,
        \"mapper\": {
          \"data\": \"{{3.body.result}}\"
        },
        \"module\": \"scenario-service:ReturnData\",
        \"version\": 2,
      \"metadata\": {
        \"expect\": [
          { \"name\": \"data\", \"type\": \"any\", \"label\": \"\" }
        ],
        \"designer\": { \"x\": 600, \"y\": 0 }
      },
      \"parameters\": {}
    }
  ],
  \"metadata\": {
    \"zone\": \"${MAKE_ZONE}\",
    \"notes\": [],
    \"instant\": false,
    \"version\": 1,
    \"designer\": { \"orphans\": [] },
    \"scenario\": {
      \"dlq\": false,
      \"slots\": null,
      \"dataloss\": false,
      \"maxErrors\": 3,
      \"autoCommit\": true,
      \"roundtrips\": 1,
      \"sequential\": false,
      \"confidential\": false,
      \"freshVariables\": false,
      \"autoCommitTriggerLast\": true
    }
  },
  \"scheduling\": { \"type\": \"on-demand\" },
  \"interface\": {
    \"input\": [
      { \"name\": \"path\", \"type\": \"text\", \"label\": \"Path\", \"required\": true, \"multiline\": false },
      { \"name\": \"body\", \"type\": \"any\", \"label\": \"Body\", \"required\": false },
      { \"name\": \"header\", \"type\": \"any\", \"label\": \"Headers\", \"required\": false },
      { \"name\": \"method\", \"type\": \"text\", \"label\": \"Method\", \"required\": true, \"multiline\": false }
    ],
    \"output\": [
      { \"name\": \"data\", \"type\": \"any\", \"label\": \"Data\", \"required\": false }
    ]
  }
}"

write_json "${interface_file}" "{
  \"input\": [
    { \"name\": \"path\", \"type\": \"text\", \"label\": \"Path\", \"required\": true, \"multiline\": false },
    { \"name\": \"body\", \"type\": \"any\", \"label\": \"Body\", \"required\": false },
    { \"name\": \"header\", \"type\": \"any\", \"label\": \"Headers\", \"required\": false },
    { \"name\": \"method\", \"type\": \"text\", \"label\": \"Method\", \"required\": true, \"multiline\": false }
  ],
  \"output\": [
    { \"name\": \"data\", \"type\": \"any\", \"label\": \"Data\", \"required\": false }
  ]
}"

echo "Creating Make test scenario..."
scenario_create_json="$(
  make_cli scenarios create \
    --team-id="${TEAM_ID}" \
    --scheduling='{"type":"on-demand"}' \
    --blueprint="$(json_compact "${blueprint_file}")" \
    --confirmed \
    --output=json
)"
printf '%s\n' "${scenario_create_json}" > "${RUN_DIR}/scenario-create.json"
scenario_id="$(printf '%s' "${scenario_create_json}" | extract_json_path "id")"

if [[ -z "${scenario_id}" ]]; then
  echo "Could not resolve created scenario id." >&2
  exit 1
fi

echo "Setting scenario interface..."
make_cli scenarios set-interface \
  --scenario-id="${scenario_id}" \
  --interface="$(json_compact "${interface_file}")" >/dev/null

make_cli scenarios get --scenario-id="${scenario_id}" --output=json > "${RUN_DIR}/scenario-get.json"
make_cli scenarios interface --scenario-id="${scenario_id}" --output=json > "${RUN_DIR}/scenario-interface-get.json"

echo "Activating test scenario..."
make_cli scenarios activate --scenario-id="${scenario_id}" >/dev/null

write_json "${probe_payload_file}" "{
  \"path\": \"/toolbox/${sandbox_id}/toolbox/process/execute\",
  \"method\": \"POST\",
  \"header\": [],
  \"body\": {
    \"command\": \"sh -lc 'node --version || bun --version || deno --version'\",
    \"timeout\": 10
  }
}"

write_json "${hello_payload_file}" "{
  \"path\": \"/toolbox/${sandbox_id}/toolbox/process/execute\",
  \"method\": \"POST\",
  \"header\": [],
  \"body\": {
    \"command\": \"sh -lc 'node -e \\\"console.log(\\\\\\\"Hello World\\\\\\\")\\\" || bun -e \\\"console.log(\\\\\\\"Hello World\\\\\\\")\\\" || deno eval \\\"console.log(\\\\\\\"Hello World\\\\\\\")\\\"'\",
    \"timeout\": 10
  }
}"

echo "Running JS runtime probe through Make..."
probe_response="$(
  make_cli scenarios run \
    --scenario-id="${scenario_id}" \
    --data="$(json_compact "${probe_payload_file}")" \
    --responsive \
    --output=json
)"
printf '%s\n' "${probe_response}" > "${RUN_DIR}/probe-response.json"

probe_result="$(printf '%s' "${probe_response}" | extract_json_path "data")"
if [[ -z "${probe_result}" ]]; then
  probe_result="$(printf '%s' "${probe_response}" | extract_json_path "result")"
fi

if [[ -z "${probe_result}" ]] || ! printf '%s' "${probe_result}" | rg -q 'node|bun|deno|^v[0-9]'; then
  echo "Runtime probe did not report a JavaScript runtime." >&2
  exit 1
fi

echo "Running Hello World through Make..."
hello_response="$(
  make_cli scenarios run \
    --scenario-id="${scenario_id}" \
    --data="$(json_compact "${hello_payload_file}")" \
    --responsive \
    --output=json
)"
printf '%s\n' "${hello_response}" > "${RUN_DIR}/hello-response.json"

hello_output="$(printf '%s' "${hello_response}" | extract_json_path "data")"
if [[ -z "${hello_output}" ]]; then
  hello_output="$(printf '%s' "${hello_response}" | extract_json_path "result")"
fi

if [[ -z "${hello_output}" ]] || ! printf '%s' "${hello_output}" | rg -q 'Hello World'; then
  echo "Hello World output not found in scenario response." >&2
  exit 1
fi

execution_id="$(printf '%s' "${hello_response}" | extract_json_path "executionId")"
if [[ -z "${execution_id}" ]]; then
  echo "No execution id found in Hello World scenario response." >&2
  exit 1
fi

make_cli executions get-detail \
  --scenario-id="${scenario_id}" \
  --execution-id="${execution_id}" \
  --output=json > "${RUN_DIR}/execution-detail.json"

execution_status="$(extract_json_path "status" < "${RUN_DIR}/execution-detail.json")"
if [[ "${execution_status}" != "SUCCESS" ]]; then
  echo "Execution detail status is not SUCCESS." >&2
  exit 1
fi

echo "Deactivating test scenario..."
make_cli scenarios deactivate --scenario-id="${scenario_id}" >/dev/null

make_cli scenarios get --scenario-id="${scenario_id}" --output=json > "${RUN_DIR}/scenario-final.json"
scenario_active="$(extract_json_path "isActive" < "${RUN_DIR}/scenario-final.json")"
if [[ "${scenario_active}" != "false" ]]; then
  echo "Scenario did not end in deactivated state." >&2
  exit 1
fi

echo "Daytona Hello World shell run complete."
echo "Scenario ID: ${scenario_id}"
echo "Connection ID: ${connection_id}"
echo "Sandbox ID: ${sandbox_id}"
echo "Artifacts: ${RUN_DIR}"
