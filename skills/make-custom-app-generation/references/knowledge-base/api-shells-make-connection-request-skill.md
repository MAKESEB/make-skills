---
name: make-connection-request
description: Build a generic Make API-call shell scenario for any supported app using IMT app discovery, then create and resolve the required connection request with a reusable production workflow.
version: 1.1.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [make, imt, credential-requests, scenario, blueprint, api-call, automation]
---

# Make Connection Request Skill

Goal: create a reusable Make scenario shell with this stable structure:
- StartSubscenario
- one app-specific "Make an API Call" module in the middle
- ReturnData

The middle module is discovered from IMT app metadata.

This workflow is designed so another LLM or automation agent can reproduce exactly what was done here.

## What this skill solves

Use this skill when a user says things like:
- "Connect Outlook"
- "Connect HubSpot"
- "Create a generic API-call scenario for app X"
- "Create the Make scenario and request the missing connection"

This skill explains how to:
1. Find the Make app/package name
2. Find the exact API-call module name
3. Build the shell blueprint
4. Upload the scenario through the Make API
5. Create the credential request
6. Resolve the created connection ID after authorization
7. Patch the scenario with that connection ID
8. Run the scenario as a generic API proxy

## Big idea

Do NOT rely on builder-generated scenarios for final production output.
Use IMT/search only for fuzzy discovery when needed.

The robust production approach is:
- discover app/module via IMT endpoints
- generate the blueprint yourself
- create the scenario via public API
- create the credential request via public API
- patch the scenario once the connection is authorized

## Required safety prompt for write operations

Before any `PUT`, `PATCH`, or `DELETE` call, pause and ask the user for explicit confirmation.
Explain the risk in exactly 2 sentences and include 1 example tailored to the user's use case.
Use this 5-line prompt:

```text
You asked me to <PUT/PATCH/DELETE> <resource>.
Risk: this can overwrite or remove existing Make scenario data and may break live runs.
Risk: a wrong module, mapper, or connection value can require manual repair or reauthorization.
Example: for your <app> shell, updating <field/resource> could replace the current connection mapping and stop the scenario until it is fixed.
Reply with YES to proceed, or tell me what to change first.
```

## Stable shell design

### Module 1: StartSubscenario
Use:
- `scenario-service:StartSubscenario`

Expose these inputs:
- `path`
- `method`
- `header`
- `body`

These four inputs become the generic runtime contract.

### Module 2: app-specific API-call module
Examples already confirmed:
- Gmail: `google-email:makeAnApiCall`
- Outlook: `microsoft-email:makeApiCall`
- HubSpot: `hubspotcrm:MakeAPICall`

Typical mapper:
```json
{
  "url": "{{2.path}}",
  "method": "{{2.method}}",
  "headers": "{{2.header}}",
  "body": "{{2.body}}"
}
```

### Module 3: ReturnData
Use:
- `scenario-service:ReturnData`

Typical mapper:
```json
{
  "data": "{{3.body}}"
}
```

Note: some apps may return `{{3}}` or `{{3.data}}` as the more useful shape, but `{{3.body}}` is a good default for API-call style modules.

## Important discovery rule

The API-call module name is NOT standardized across apps.
Examples:
- `makeAnApiCall`
- `makeApiCall`
- `MakeAPICall`
- `MakeAnAPICall`
- `ActionMakeAnApiCall`

Therefore you must discover the exact module name from IMT metadata.
Never guess the casing.

## Required APIs

### A. IMT app discovery
List apps:
- `GET /api/v2/imt/apps?organizationId=ORG_ID&teamId=TEAM_ID&scoredSearch=true`

Get one app in detail:
- `GET /api/v2/imt/apps/{appName}/{version}`

### B. Scenario APIs
Create scenario:
- `POST /api/v2/scenarios?confirmed=true`

Update scenario:
- `PATCH /api/v2/scenarios/{scenarioId}?confirmed=true`

Activate scenario:
- `POST /api/v2/scenarios/{scenarioId}/start`

Run scenario:
- `POST /api/v2/scenarios/{scenarioId}/run`

Inspect scenario interface:
- `GET /api/v2/scenarios/{scenarioId}/interface`

Inspect scenario blueprint:
- `GET /api/v2/scenarios/{scenarioId}/blueprint`

### C. Connection / credential APIs
List connections by type:
- `GET /api/v2/connections?teamId=TEAM_ID&type[]=TYPE`

Preferred if available in your plan/features:
- `POST /api/v2/credential-requests/requests/v2`

Practical fallback that has been verified on `we.make.com`:
- `POST /api/v2/credential-requests/actions/create-by-credentials`

Deprecated legacy fallback:
- `POST /api/v2/credential-requests/requests`

Inspect authorized credential request:
- `GET /api/v2/credential-requests/requests/{requestId}/detail`

## Authentication format
Use Make API token in header:
```text
Authorization: Token YOUR_API_KEY
```

## Zone and base URL
Ask the user which Make zone/base URL their workspace uses before generating any request URLs or blueprint metadata.
Default the examples below to `BASE_URL=https://us1.make.com`, but the real host may be another Make zone such as `us2.make.com`, `eu1.make.com`, or `eu2.make.com`, or a legacy Integromat host.
Use the same host consistently in all API calls, and set blueprint `metadata.zone` to the host only, for example `us1.make.com`.

## Step 1: discover the app and module from IMT

### 1.1 List all apps
Request:
```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  "${BASE_URL}/api/v2/imt/apps?organizationId=ORG_ID&teamId=TEAM_ID&scoredSearch=true"
```

This returns a large `apps` array.
Each app contains versions and module definitions.

### 1.2 Find only apps that expose an API-call module
Search module names case-insensitively for:
- `makeapicall`
- `makeanapicall`

A reliable heuristic is:
- lower-case module name
- check if it contains `makeapicall` or `makeanapicall`

### 1.3 App examples already confirmed

Outlook / Microsoft 365 Email:
- `appName`: `microsoft-email`
- `appVersion`: `2`
- API-call module: `makeApiCall`
- full module id: `microsoft-email:makeApiCall`

HubSpot:
- `appName`: `hubspotcrm`
- `appVersion`: `2`
- API-call module: `MakeAPICall`
- full module id: `hubspotcrm:MakeAPICall`

Gmail:
- `appName`: `google-email`
- `appVersion`: `4`
- API-call module: `makeAnApiCall`
- full module id: `google-email:makeAnApiCall`

## Step 2: inspect one app in detail

Example for HubSpot:
```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  "${BASE_URL}/api/v2/imt/apps/hubspotcrm/2"
```

Use the response to confirm:
- app label
- module groups
- exact module names

## Step 3: choose the connection type

There are two different type concepts and you must not mix them:

1. **Scenario/module connection parameter type**
- used in blueprint metadata / `__IMTCONN__`
- examples:
  - Gmail shell: `account:google-email`
  - Outlook shell: `account:azure`

2. **Connection / credential request type**
- used when listing connections and when creating credential requests
- examples:
  - Gmail: `google-email`
  - Outlook: `azure`

How to determine it:
1. Inspect an existing working module blueprint if available
2. Inspect UI metadata if available
3. Derive it from app metadata / observed restore data

Known verified mappings from this project:
- Gmail:
  - scenario/module connection parameter: `account:google-email`
  - connection listing / request type: `google-email`
- Outlook:
  - scenario/module connection parameter: `account:azure`
  - connection listing / request type: `azure`

### Reality check that was verified live
For `teamId=17` on `https://we.make.com`:
- `GET /api/v2/connections?teamId=17&type[]=google-email` returned a Gmail connection
- `GET /api/v2/connections?teamId=17&type[]=account:google-email` returned an empty list

This means:
- use `google-email` when querying `GET /connections`
- use `account:google-email` only inside scenario module metadata / blueprint connection parameters

## Step 4: build the shell blueprint

Note: ask the user which zone/base URL they use before generating the blueprint.
This example uses `us1.make.com`; replace it when the user's workspace is on a different Make zone or a legacy Integromat host.

Template structure:
```json
{
  "name": "APP API Call Shell",
  "flow": [
    {
      "id": 2,
      "module": "scenario-service:StartSubscenario",
      "version": 2,
      "parameters": {},
      "mapper": {},
      "metadata": {
        "designer": {"x": 0, "y": 0},
        "restore": {},
        "interface": [
          {"name": "path", "type": "text", "required": false, "multiline": false},
          {"name": "body", "type": "any", "required": false},
          {"name": "header", "type": "any", "required": false},
          {"name": "method", "type": "text", "required": false, "multiline": false}
        ]
      }
    },
    {
      "id": 3,
      "module": "APP:MakeApiCallModuleName",
      "version": APP_VERSION,
      "parameters": {},
      "filter": null,
      "mapper": {
        "url": "{{2.path}}",
        "method": "{{2.method}}",
        "headers": "{{2.header}}",
        "body": "{{2.body}}"
      },
      "metadata": {
        "designer": {
          "x": 300,
          "y": 0,
          "messages": [
            {
              "category": "setup",
              "severity": "error",
              "message": "Connection: Value must not be empty."
            }
          ]
        }
      }
    },
    {
      "id": 1,
      "module": "scenario-service:ReturnData",
      "version": 2,
      "parameters": {},
      "mapper": {"data": "{{3.body}}"},
      "metadata": {
        "designer": {"x": 600, "y": 0},
        "expect": [{"name": "data", "type": "any", "label": ""}]
      }
    }
  ],
  "metadata": {
    "instant": false,
    "version": 1,
    "scenario": {
      "roundtrips": 1,
      "maxErrors": 3,
      "autoCommit": true,
      "autoCommitTriggerLast": true,
      "sequential": false,
      "slots": null,
      "confidential": false,
      "dataloss": false,
      "dlq": false,
      "freshVariables": false
    },
    "designer": {"orphans": []},
    "zone": "us1.make.com",
    "notes": []
  }
}
```

Also provide interface metadata separately:
```json
{
  "input_spec": [... same four fields ...],
  "output_spec": [{"name": "data", "type": "any", "required": false}]
}
```

## Step 5: upload the scenario

### Create a new scenario
```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  -H 'content-type: application/json' \
  -X POST \
  "${BASE_URL}/api/v2/scenarios?confirmed=true" \
  --data @payload.json
```

Immediately read the create response and persist the returned scenario ID as `SCENARIO_ID`.
If the response does not contain a valid scenario ID, stop and surface the raw response to the user.
Never continue to `PATCH`, `/start`, `/run`, `/interface`, or `/blueprint` with an empty, null, or undefined `SCENARIO_ID`.

Where `payload.json` contains:
```json
{
  "teamId": 1219,
  "scheduling": "{\"type\":\"on-demand\"}",
  "blueprint": "{...stringified blueprint...}",
  "metadata": {
    "input_spec": [...],
    "output_spec": [...]
  }
}
```

Important:
- `blueprint` must be JSON-stringified in the request body
- `metadata` carries input/output spec
- omit extra top-level blueprint fields not allowed by the scenario schema
- extract and persist `SCENARIO_ID` from the create response before doing anything else
- if `SCENARIO_ID` is missing, abort instead of building a URL like `/api/v2/scenarios/undefined/start`

### Update an existing scenario
Before sending this `PATCH` call, use the required safety prompt above and wait for explicit confirmation.
Also verify that `SCENARIO_ID` is defined and non-empty before building the request URL.

```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  -H 'content-type: application/json' \
  -X PATCH \
  "${BASE_URL}/api/v2/scenarios/SCENARIO_ID?confirmed=true" \
  --data @payload.json
```

## Step 6: create the credential request

### Decision ladder
Use this exact order:

1. Try `POST /api/v2/credential-requests/requests/v2`
2. If it returns `403` with `allow_credential_requests`, try:
   - `POST /api/v2/credential-requests/actions/create-by-credentials`
3. If `actions/create-by-credentials` is unavailable in the target environment, only then consider the deprecated:
   - `POST /api/v2/credential-requests/requests`

Do not jump directly to the deprecated endpoint unless you know the workspace requires it.

### Preferred future-proof option: requests/v2
Use when feature is enabled for the account/workspace.

Example:
```json
{
  "name": "Outlook API shell connection",
  "teamId": 1219,
  "description": "Authorize Outlook for generic API shell scenario.",
  "credentials": [
    {
      "appName": "microsoft-email",
      "appModules": ["makeApiCall"],
      "appVersion": 2,
      "nameOverride": "seb-outlook-api-shell"
    }
  ],
  "provider": {
    "providerMakeUserId": 994996
  }
}
```

### Verified fallback that worked in this project: create-by-credentials
Use when you know the exact connection request type and `requests/v2` is blocked by workspace feature flags.

Example for Gmail readonly:
```json
{
  "name": "gmail API shell connection",
  "description": "Authorize Gmail readonly access for generic shell scenario.",
  "teamId": 17,
  "connections": [
    {
      "type": "google-email",
      "description": "Gmail readonly connection",
      "scope": ["https://www.googleapis.com/auth/gmail.readonly"],
      "nameOverride": "gmail-shell-debug"
    }
  ]
}
```

Example for Outlook read shell:
```json
{
  "name": "outlook API shell connection",
  "description": "Authorize Outlook for API shell scenario.",
  "teamId": 17,
  "connections": [
    {
      "type": "azure",
      "description": "Outlook API shell connection",
      "scope": ["Mail.Read", "offline_access", "User.Read"],
      "nameOverride": "seb-outlook-api-shell"
    }
  ]
}
```

### What was verified live on `we.make.com`

This exact request shape succeeded on `teamId=17`:

```json
{
  "name": "gmail API shell connection",
  "description": "Authorize gmail for tenant-scoped API shell execution.",
  "teamId": 17,
  "connections": [
    {
      "type": "google-email",
      "description": "Gmail readonly connection for debugging",
      "scope": ["https://www.googleapis.com/auth/gmail.readonly"],
      "nameOverride": "gmail-shell-debug"
    }
  ]
}
```

The successful response included:
- `request.id`
- `credentials[0].id`
- `publicUri`

This is the strongest known fallback when `requests/v2` is feature-blocked.

## Step 7: wait for authorization

The credential request returns:
- `request.id`
- `publicUri`

The user must open the `publicUri` and authorize the connection.

## Step 8: resolve the real connection ID

After the user authorizes, inspect:
```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  "${BASE_URL}/api/v2/credential-requests/requests/REQUEST_ID/detail"
```

Look for:
- `credentials[0].state == authorized`
- `credentials[0].remoteId`

That `remoteId` is the real Make connection ID.

Examples confirmed in this project:
- Outlook shell connection remoteId: `15543`
- Basti Gmail shell connection remoteId: `15544`

## Step 9: patch the scenario with the connection ID
Before patching, verify that both `SCENARIO_ID` and `CONNECTION_ID` are defined.
If either value is missing, stop and report which earlier step failed.

Update the middle module:
- set `parameters.__IMTCONN__ = CONNECTION_ID`
- set `metadata.restore.parameters.__IMTCONN__`
- set `metadata.parameters[0].type`
- optionally fill `expect`

### Outlook example middle module
```json
{
  "id": 3,
  "module": "microsoft-email:makeApiCall",
  "version": 2,
  "parameters": {
    "__IMTCONN__": 15543
  },
  "mapper": {
    "url": "{{2.path}}",
    "method": "{{2.method}}",
    "headers": "{{2.header}}",
    "body": "{{2.body}}"
  },
  "metadata": {
    "restore": {
      "parameters": {
        "__IMTCONN__": {
          "label": "seb-outlook-api-shell",
          "data": {
            "scoped": "true",
            "connection": "azure"
          }
        }
      }
    },
    "parameters": [
      {
        "name": "__IMTCONN__",
        "type": "account:azure",
        "label": "Connection",
        "required": true
      }
    ]
  }
}
```

### Gmail example middle module
```json
{
  "id": 3,
  "module": "google-email:makeAnApiCall",
  "version": 4,
  "parameters": {
    "__IMTCONN__": 15544
  },
  "mapper": {
    "url": "{{2.path}}",
    "method": "{{2.method}}",
    "headers": "{{2.header}}",
    "body": "{{2.body}}"
  },
  "metadata": {
    "restore": {
      "parameters": {
        "__IMTCONN__": {
          "label": "basti-gmail-api-shell",
          "data": {
            "scoped": "true",
            "connection": "google-email"
          }
        }
      }
    },
    "parameters": [
      {
        "name": "__IMTCONN__",
        "type": "account:google-email",
        "label": "Connection",
        "required": true
      }
    ]
  }
}
```

## Step 10: activate the scenario
Only call `/start` after confirming that `SCENARIO_ID` is present from the create response or a known existing scenario.
If `SCENARIO_ID` is missing, do not guess, do not substitute `undefined`, and do not make the request.

```bash
curl -sS \
  -H "authorization: Token $API_KEY" \
  -H 'accept: application/json' \
  -X POST \
  "${BASE_URL}/api/v2/scenarios/SCENARIO_ID/start"
```

## Step 11: run the shell

### Generic run request
```json
{
  "data": {
    "path": "...",
    "method": "GET",
    "header": [],
    "body": null
  },
  "responsive": true
}
```

### Outlook note
For Outlook shell tests in this project, working paths were:
- `/v1.0/me/messages?$top=2`
- `v1.0/me/messages?$top=2`

Non-working variants were:
- `/me/messages?...`
- `me/messages?...`

So for Outlook, use `v1.0/...` paths.

### Gmail note
For Gmail shell tests in this project, working paths were like:
- `v1/users/me/messages?maxResults=5&q=...`
- `v1/users/me/messages/{messageId}?format=full`
- `v1/users/me/messages/{messageId}/attachments/{attachmentId}`

## Confirmed scenarios created in this project

### Outlook shell
- Scenario ID: `38036`
- Connection ID after auth: `15543`

### Basti Gmail shell
- Scenario ID: `38050`
- Connection ID after auth: `15544`

## Troubleshooting

### Problem: requests/v2 returns feature error
Observed error:
- `User does not have the 'allow_credential_requests' feature enabled.`

Fix:
- use `actions/create-by-credentials` instead
- do not waste time retrying the same V2 payload if the feature is disabled

### Problem: other LLM gets 403 even though the workspace can create a request
Most common causes:
- it used `requests/v2` instead of `actions/create-by-credentials`
- it used `account:google-email` instead of `google-email` for connection listing or request creation
- it mixed `credentials` and `connections` payload shapes
- it used `Bearer ...` instead of `Authorization: Token ...`

### Problem: `GET /connections` says no Gmail connections even though one exists
Cause:
- wrong type parameter

Fix:
- use `type[]=google-email`
- not `type[]=account:google-email`

### Problem: scenario run says not activated
Fix:
- start the scenario via `/scenarios/{id}/start`

### Problem: Outlook Graph path returns `Invalid version: me`
Cause:
- path missing `v1.0`

Fix:
- use `/v1.0/...`

### Problem: Gmail fetch returns intermittent 502 / non-JSON response
Fix:
- retry message/attachment fetches with backoff

## Minimal information required to automate a new app
To automate a new app using this skill, the agent needs only:
- `appName`
- `appVersion`
- exact API-call module name
- connection type for `__IMTCONN__`
- requested scopes

Then the rest is deterministic.

## Bottom line
This skill provides the production path for scenario creation.
Use IMT app discovery to find the app/module, build the shell yourself, create the credential request, resolve the connection ID, patch the shell, activate it, and run it.
