#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="${ROOT_DIR}/apps/rindegastos"
APP_VERSION="${RINDEGASTOS_APP_VERSION:-1}"
CONNECTION_LABEL="${RINDEGASTOS_CONNECTION_LABEL:-Rinde Gastos API Token}"

if [[ -z "${MAKE_API_KEY:-}" || -z "${MAKE_ZONE:-}" ]]; then
  echo "MAKE_API_KEY and MAKE_ZONE are required for remote upload." >&2
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

validate_make_zone() {
  local zone="$1"
  case "${zone}" in
    *[!A-Za-z0-9.-]*|.*|*-|*..*|*/*|http:*|https:*)
      echo "Invalid MAKE_ZONE: ${zone}" >&2
      return 1
      ;;
  esac
  if [[ "${zone}" != *.make.com ]]; then
    echo "Invalid MAKE_ZONE: ${zone}; expected a make.com zone hostname" >&2
    return 1
  fi
}

make_auth_curl_config() {
  local content_type="${1:-application/json}"
  local curl_config
  curl_config="$(mktemp)"
  {
    printf 'header = "Authorization: Token %s"\n' "${MAKE_API_KEY}"
    printf 'header = "Content-Type: %s"\n' "${content_type}"
  } > "${curl_config}"
  printf '%s' "${curl_config}"
}

ensure_icon_512() {
  local icon_path="${APP_DIR}/assets/icon.png"
  if [[ -f "${icon_path}" ]] && file "${icon_path}" | grep -q 'PNG image data, 512 x 512'; then
    return 0
  fi
  if [[ -f "${icon_path}" ]]; then
    sips -s format png -z 512 512 "${icon_path}" --out "${icon_path}" >/dev/null
  fi
  if ! file "${icon_path}" | grep -q 'PNG image data, 512 x 512'; then
    echo "Rinde Gastos icon must be a 512x512 PNG at ${icon_path}. Run scripts/fetch-app-logos.sh rindegastos first." >&2
    exit 1
  fi
}

upload_icon() {
  local remote_app_name="$1"
  local icon_path="${APP_DIR}/assets/icon.png"
  local sdk_version="${MAKE_APPS_SDK_VERSION:-2.5.0}"

  if make_cli sdk-apps set-icon --help >/dev/null 2>&1; then
    make_cli sdk-apps set-icon "${remote_app_name}" "${APP_VERSION}" "${icon_path}" >/dev/null
    local cli_readback
    cli_readback="$(mktemp)"
    make_cli sdk-apps get-icon "${remote_app_name}" "${APP_VERSION}" "${cli_readback}" >/dev/null
    if ! file "${cli_readback}" | grep -q 'PNG image data, 512 x 512'; then
      echo "Rinde Gastos icon readback was not a 512x512 PNG" >&2
      file "${cli_readback}" >&2 || true
      rm -f "${cli_readback}"
      exit 1
    fi
    rm -f "${cli_readback}"
    return 0
  fi

  local body readback code info curl_config
  body="$(mktemp)"
  curl_config="$(make_auth_curl_config image/png)"
  code="$(curl -sS --config "${curl_config}" -o "${body}" -w '%{http_code}' -X PUT "https://${MAKE_ZONE}/api/v2/sdk/apps/${remote_app_name}/${APP_VERSION}/icon" \
    -H "imt-apps-sdk-version: ${sdk_version}" \
    --data-binary "@${icon_path}" || true)"
  rm -f "${curl_config}"
  if [[ "${code}" != "200" && "${code}" != "204" ]]; then
    echo "Icon upload failed with HTTP ${code}: $(tr -d '\n' < "${body}" | cut -c1-300)" >&2
    rm -f "${body}"
    exit 1
  fi
  rm -f "${body}"
  readback="$(mktemp)"
  curl_config="$(make_auth_curl_config image/png)"
  code="$(curl -sS -L --config "${curl_config}" -o "${readback}" -w '%{http_code}' "https://${MAKE_ZONE}/api/v2/sdk/apps/${remote_app_name}/${APP_VERSION}/icon/512" \
    -H "imt-apps-sdk-version: ${sdk_version}" || true)"
  rm -f "${curl_config}"
  info="$(file "${readback}")"
  rm -f "${readback}"
  if [[ "${code}" != "200" || "${info}" != *'PNG image data, 512 x 512'* ]]; then
    echo "Icon readback failed with HTTP ${code}; ${info}" >&2
    exit 1
  fi
}

metadata_value() {
  ruby -rjson -e 'data = JSON.parse(File.read(ARGV[0])); print(data.fetch(ARGV[1]))' "$1" "$2"
}

api_request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local curl_config

  validate_make_zone "${MAKE_ZONE}"
  curl_config="$(make_auth_curl_config application/json)"

  if [[ -n "${body}" ]]; then
    set +e
    curl -fsS --config "${curl_config}" -X "${method}" "https://${MAKE_ZONE}/api/v2${path}" \
      --data "${body}"
    local curl_status=$?
    set -e
  else
    set +e
    curl -fsS --config "${curl_config}" -X "${method}" "https://${MAKE_ZONE}/api/v2${path}"
    local curl_status=$?
    set -e
  fi
  rm -f "${curl_config}"
  return "${curl_status}"
}

extract_app_name() {
  APP_PREFIX="$1" APP_LABEL_ENV="$2" APP_DESCRIPTION_ENV="$3" ruby -rjson -e '
    items = Array(JSON.parse(STDIN.read))
    matches = items.select do |item|
      name = item["name"].to_s
      label = item["label"].to_s
      description = item["description"].to_s
      name == ENV["APP_PREFIX"] ||
        name.start_with?(ENV["APP_PREFIX"] + "-") ||
        (label == ENV["APP_LABEL_ENV"] && description == ENV["APP_DESCRIPTION_ENV"])
    end
    match = matches.find { |item| item["name"] == ENV["APP_PREFIX"] } || matches.first
    print(match && match["name"].to_s)
  '
}

extract_connection_name() {
  TARGET_LABEL="${CONNECTION_LABEL}" ruby -rjson -e '
    data = JSON.parse(STDIN.read)
    items =
      case data
      when Array then data
      when Hash then
        data["appConnections"] ||
        Array(data["appConnection"]).compact ||
        data["connections"] ||
        data["items"] ||
        data["data"] ||
        []
      else []
      end
    items = Array(items)
    match = items.find { |item| item["label"] == ENV["TARGET_LABEL"] } || items.first
    print(match && (match["name"] || match["id"] || ""))
  '
}

APP_NAME="${RINDEGASTOS_APP_NAME:-$(metadata_value "${APP_DIR}/metadata.json" name)}"
APP_LABEL="${RINDEGASTOS_APP_LABEL:-$(metadata_value "${APP_DIR}/metadata.json" label)}"
APP_DESCRIPTION="${RINDEGASTOS_APP_DESCRIPTION:-$(metadata_value "${APP_DIR}/metadata.json" description)}"
APP_THEME="${RINDEGASTOS_APP_THEME:-$(metadata_value "${APP_DIR}/metadata.json" theme)}"
APP_LANGUAGE="${RINDEGASTOS_APP_LANGUAGE:-$(metadata_value "${APP_DIR}/metadata.json" language)}"
APP_AUDIENCE="${RINDEGASTOS_APP_AUDIENCE:-$(metadata_value "${APP_DIR}/metadata.json" audience)}"

echo "Checking Make authentication..."
validate_make_zone "${MAKE_ZONE}"
make_cli whoami >/dev/null
ensure_icon_512

apps_json="$(make_cli sdk-apps list --output=json)"
remote_app_name="$(printf '%s' "${apps_json}" | extract_app_name "${APP_NAME}" "${APP_LABEL}" "${APP_DESCRIPTION}")"

echo "Ensuring app exists..."
if [[ -z "${remote_app_name}" ]]; then
  create_json="$(make_cli sdk-apps create \
    --name="${APP_NAME}" \
    --label="${APP_LABEL}" \
    --description="${APP_DESCRIPTION}" \
    --theme="${APP_THEME}" \
    --language="${APP_LANGUAGE}" \
    --audience="${APP_AUDIENCE}" \
    --private)"

  remote_app_name="$(printf '%s' "${create_json}" | ruby -rjson -e '
    data = JSON.parse(STDIN.read)
    print(data.dig("app", "name") || data["name"] || "")
  ')"
fi

if [[ -z "${remote_app_name}" ]]; then
  apps_json="$(make_cli sdk-apps list --output=json)"
  remote_app_name="$(printf '%s' "${apps_json}" | extract_app_name "${APP_NAME}" "${APP_LABEL}" "${APP_DESCRIPTION}")"
fi

if [[ -z "${remote_app_name}" ]]; then
  echo "Could not determine the remote app name after creation/listing." >&2
  exit 1
fi

echo "Uploading app base section..."
make_cli sdk-apps set-section \
  --name="${remote_app_name}" \
  --version="${APP_VERSION}" \
  --section=base \
  --body="$(json_compact "${APP_DIR}/base.imljson")" >/dev/null

echo "Uploading app docs..."
make_cli sdk-apps set-docs \
  --name="${remote_app_name}" \
  --version="${APP_VERSION}" \
  --docs="$(cat "${APP_DIR}/readme.md")" >/dev/null

echo "Ensuring connection exists..."
connections_json="$(api_request GET "/sdk/apps/${remote_app_name}/connections")"
connection_name="$(printf '%s' "${connections_json}" | extract_connection_name)"

if [[ -z "${connection_name}" ]]; then
  api_request POST "/sdk/apps/${remote_app_name}/connections" "$(cat <<JSON
{"label":"${CONNECTION_LABEL}","type":"apikey"}
JSON
)" >/dev/null

  connections_json="$(api_request GET "/sdk/apps/${remote_app_name}/connections")"
  connection_name="$(printf '%s' "${connections_json}" | extract_connection_name)"
fi

if [[ -z "${connection_name}" ]]; then
  echo "Could not determine the remote connection name after creation." >&2
  exit 1
fi

echo "Uploading connection sections for ${connection_name}..."
api_request PUT \
  "/sdk/apps/connections/${connection_name}/api" \
  "$(json_compact "${APP_DIR}/connections/api-key/api.imljson")" >/dev/null

api_request PUT \
  "/sdk/apps/connections/${connection_name}/parameters" \
  "$(json_compact "${APP_DIR}/connections/api-key/parameters.imljson")" >/dev/null

while IFS= read -r metadata_file; do
  module_dir="$(dirname "${metadata_file}")"
  module_name="$(metadata_value "${metadata_file}" name)"
  module_label="$(metadata_value "${metadata_file}" label)"
  module_description="$(metadata_value "${metadata_file}" description)"
  module_type_id="$(metadata_value "${metadata_file}" typeId)"

  echo "Ensuring module exists: ${module_name}"
  if ! make_cli sdk-modules get \
    --app-name="${remote_app_name}" \
    --app-version="${APP_VERSION}" \
    --module-name="${module_name}" >/dev/null 2>&1; then
    make_cli sdk-modules create \
      --app-name="${remote_app_name}" \
      --app-version="${APP_VERSION}" \
      --name="${module_name}" \
      --type-id="${module_type_id}" \
      --label="${module_label}" \
      --description="${module_description}" \
      --module-init-mode=blank >/dev/null
  fi

  make_cli sdk-modules update \
    --app-name="${remote_app_name}" \
    --app-version="${APP_VERSION}" \
    --module-name="${module_name}" \
    --label="${module_label}" \
    --description="${module_description}" \
    --connection="${connection_name}" >/dev/null

  for section in api expect interface samples; do
    section_file="${module_dir}/${section}.imljson"
    if [[ -f "${section_file}" ]]; then
      echo "Uploading ${module_name} section: ${section}"
      make_cli sdk-modules set-section \
        --app-name="${remote_app_name}" \
        --app-version="${APP_VERSION}" \
        --module-name="${module_name}" \
        --section="${section}" \
        --body="$(json_compact "${section_file}")" >/dev/null
    fi
  done
done < <(find "${APP_DIR}/modules" -mindepth 2 -maxdepth 2 -name metadata.json | sort)

echo "Uploading app icon..."
upload_icon "${remote_app_name}"

echo "Remote Rinde Gastos app sync complete."
echo "App: ${remote_app_name}"
echo "Connection: ${connection_name}"
echo "Modules: $(find "${APP_DIR}/modules" -mindepth 2 -maxdepth 2 -name metadata.json | wc -l | tr -d ' ')"
echo "Icon: uploaded_verified"
