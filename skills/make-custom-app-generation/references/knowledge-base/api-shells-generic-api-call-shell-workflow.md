# Generic Make API-call shell workflow

## Goal
Build one reusable scenario pattern for many apps:
- `scenario-service:StartSubscenario`
- one dynamic app-specific `Make API Call` module in the middle
- `scenario-service:ReturnData`

The middle module is the only thing that changes per app.

Examples:
- Gmail: `google-email:makeAnApiCall`
- Outlook: `microsoft-email:makeApiCall`
- HubSpot: `hubspotcrm:MakeAPICall`

## Core idea
The scenario shell stays stable.
The app-specific package/module in the middle is discovered from Make search or IMT app metadata.
Once the correct package and module are known, the shell blueprint can be generated without relying on the builder to create the entire scenario.

Important:
- Gmail, Outlook, and HubSpot in this document are **examples only**
- they are not the source of truth
- the source of truth is always live Make evidence:
  - IMT metadata
  - `/connections`
  - credential request endpoints

## Stable shell structure

### 1. Input module
Use:
- `scenario-service:StartSubscenario`

Expose these input fields:
- `path`
- `method`
- `header`
- `body`

These become the generic proxy contract.

### 2. Dynamic middle module
Use the app-specific Make API-call module.
Examples:
- `google-email:makeAnApiCall`
- `microsoft-email:makeApiCall`
- `hubspotcrm:MakeAPICall`

Typical mapper:
```json
{
  "url": "{{2.path}}",
  "method": "{{2.method}}",
  "headers": "{{2.header}}",
  "body": "{{2.body}}"
}
```

### 3. Output module
Use:
- `scenario-service:ReturnData`

Typical mapper:
```json
{
  "data": "{{3.body}}"
}
```

Depending on the package, `{{3}}` or `{{3.data}}` may be more appropriate, but `{{3.body}}` is a common result shape for Make API-call modules.

## What search/discovery is actually needed for
Search and metadata lookup are mainly useful for discovery, not necessarily for full blueprint generation.

What discovery needs to return:
- app/package name
- app version
- exact API-call module name
- ideally the connection type / required scopes

Examples confirmed from live reverse-engineering:
- Outlook:
  - app: `microsoft-email`
  - version: `2`
  - API-call module: `makeApiCall`
- HubSpot:
  - app: `hubspotcrm`
  - version: `2`
  - API-call module: `MakeAPICall`
- Gmail:
  - app: `google-email`
  - version: `4`
  - API-call module: `makeAnApiCall`

## How app discovery was confirmed
Live browser-session network capture showed:
- app search runs under the Make builder at `https://we.make.com/1219/scenarios/add`
- Make fetches app metadata from endpoints like:
  - `/api/v2/imt/apps/microsoft-email/2`
  - `/api/v2/imt/apps/hubspotcrm/2`
- the builder also returns app recommendations and relevant module names

This means there are two practical discovery strategies:

### Strategy A: use builder search
Prompt the UI search with the user intent, then extract:
- app/package
- version
- relevant modules

### Strategy B: use local example seeds only as hints
For common apps, keep a few example seeds as hints, but do not treat them as canonical values.
Canonical values must come from live Make APIs at runtime.

## Generic build flow

### Step 1: determine the middle module
For a user request like:
- "Connect Outlook"
- "Connect HubSpot"
- "Connect Slack"

Resolve:
- package/app name
- package version
- API-call module name

Example result for Outlook:
```json
{
  "appName": "microsoft-email",
  "appVersion": 2,
  "moduleName": "makeApiCall"
}
```

### Step 1.5: determine both type layers correctly

Do not mix these two concepts:

1. **Scenario/module connection parameter type**
- used in blueprint metadata / `__IMTCONN__`
- examples:
  - Gmail shell: `account:google-email`
  - Outlook shell: `account:azure`

2. **Connection / credential request type**
- used in `GET /connections` and credential request creation
- examples:
  - Gmail: `google-email`
  - Outlook: `azure`

Verified live example on `teamId=17`:
- `GET /api/v2/connections?teamId=17&type[]=google-email` returned a Gmail connection
- `GET /api/v2/connections?teamId=17&type[]=account:google-email` returned an empty list

Therefore:
- use `google-email` for connection listing and fallback credential creation
- use `account:google-email` only in scenario module metadata / `__IMTCONN__`

### Step 2: generate shell blueprint
Construct a blueprint with:
- StartSubscenario at x=0
- dynamic MakeAPICall module at x=300
- ReturnData at x=600

Only the middle module varies.

### Step 3: create or update the scenario
Observed in live traffic:
- Make writes scenario draft-like changes via:
  - `PUT /api/v2/scenarios/0/recovery?organizationId=...&teamId=...`
- Public API / SDK also supports scenario create/update with blueprint payloads:
  - `POST /api/v2/scenarios`
  - `PATCH /api/v2/scenarios/{id}`

Practical recommendation:
- use public API create/update for stable automation
- treat the recovery endpoint as internal/editor behavior observed from the UI

Safety rule:
- before any `PUT`, `PATCH`, or `DELETE` call, ask the user for explicit confirmation
- explain the risk in 2 sentences and give 1 example tied to the user's scenario

### Step 4: request the missing connection
If the module has no connection yet, create a credential request.

Decision ladder:
1. Try:
   - `POST /api/v2/credential-requests/requests/v2`
2. If it returns `403` with `allow_credential_requests`, try:
   - `POST /api/v2/credential-requests/actions/create-by-credentials`
3. Only if you explicitly know the workspace still depends on legacy behavior, consider:
   - `POST /api/v2/credential-requests/requests`

Why V2 is good:
- you specify `appName` + `appModules`
- Make derives the needed credential type(s)
- this is better than hardcoding connection types whenever possible

Example V2 body:
```json
{
  "name": "Outlook API shell connection",
  "teamId": 1219,
  "description": "Authorize Outlook for the generic Make API-call shell scenario.",
  "credentials": [
    {
      "appName": "microsoft-email",
      "appModules": ["makeApiCall"],
      "appVersion": 2,
      "nameOverride": "seb-outlook-api"
    }
  ],
  "provider": {
    "providerMakeUserId": 994996
  }
}
```

Verified practical fallback:
- `POST /api/v2/credential-requests/actions/create-by-credentials`

Use this if:
- `requests/v2` is blocked by workspace feature flags
- and you know the exact connection request type already

Verified Gmail readonly fallback payload:
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

Verified fallback result:
- `status: 200`
- response contained:
  - `request.id`
  - `credentials[0].id`
  - `publicUri`

## Step 5: wait for authorization
The credential request returns a `publicUri`.
The user opens it and authorizes the app.

After authorization, inspect via:
- `GET /api/v2/credential-requests/requests/{requestId}/detail`

This returns the associated credentials and their states.

## Step 6: update the shell with the real connection ID
Once a connection is authorized, update the middle module:
- set `parameters.__IMTCONN__` to the real connection ID
- optionally add restore/metadata for a nicer editor UX

Then the scenario can be used immediately through the generic input/output contract.

## Why this pattern is powerful
It gives one generalized runtime interface for many apps:
- path
- method
- header
- body

So downstream automation does not care whether the target is:
- Gmail
- Outlook
- HubSpot
- another app

It only cares which shell scenario is active.

## Generic runtime rule
The runtime should stay generic:
- code orchestrates the workflow
- Make provides API access and auth
- the shell is only an access adapter

Correct runtime order:
1. inspect available connections
2. reuse an existing one if possible
3. ask the user to choose only if multiple viable connections exist
4. create a credential request only if none exists
5. patch / activate / run the shell after authorization

## Important caveat: module naming is not fully standardized
The module is conceptually always “Make API Call”, but naming differs by package:
- `makeAnApiCall`
- `makeApiCall`
- `MakeAPICall`

Therefore, discovery must capture the exact module identifier.
Do not assume the casing or spelling.

## Outlook-specific findings
Confirmed from a live builder session:
- app: `microsoft-email`
- version: `2`
- useful modules:
  - `watchMessages`
  - `listMessages`
  - `getAMessage`
  - `listAttachments`
  - `downloadAnAttachment`
  - `makeApiCall`

Scopes shown by the builder:
- search/get/list attachments/watch:
  - `Mail.Read`
  - `offline_access`
  - `User.Read`
- Make API Call:
  - `Mail.ReadWrite`
  - `offline_access`
  - `User.Read`

So for a truly generic Outlook API-call shell, request credentials suitable for `makeApiCall`.

## HubSpot-specific finding
Confirmed from live metadata/network capture:
- app: `hubspotcrm`
- version: `2`
- API-call module: `MakeAPICall`

## Troubleshooting

### Problem: V2 returns feature error
Observed live:
- `User does not have the 'allow_credential_requests' feature enabled.`

Fix:
- fall back to `actions/create-by-credentials`

### Problem: other LLM gets 403 while you expect Gmail auth request to work
Most common causes:
- it used `requests/v2` instead of `actions/create-by-credentials`
- it used `account:google-email` instead of `google-email` for connection listing or request creation
- it mixed `credentials` and `connections` payload shapes
- it used `Bearer ...` instead of `Authorization: Token ...`

### Problem: `/connections` says no Gmail connections exist
Check the type:
- correct: `type[]=google-email`
- wrong for connection listing: `type[]=account:google-email`

## Recommended automation contract
Build a small internal object like this:
```json
{
  "appName": "microsoft-email",
  "appVersion": 2,
  "moduleName": "makeApiCall",
  "scenarioModule": "microsoft-email:makeApiCall",
  "credentialRequest": {
    "appName": "microsoft-email",
    "appModules": ["makeApiCall"],
    "appVersion": 2
  }
}
```

Then the rest of the shell generation is deterministic.

## Operational sequence
1. User says which integration they want.
2. Discover `appName`, `appVersion`, `moduleName`.
3. Build shell blueprint.
4. Create scenario or patch scenario.
5. Create credential request.
6. User authorizes connection.
7. Fetch request detail / credential state.
8. Resolve actual connection ID.
9. Patch scenario middle module with `__IMTCONN__`.
10. Use shell as dynamic API endpoint.

## Files used in this project
- Original Gmail shell blueprint:
  - `/Users/sebastianmertens/Downloads/Gmail Connection Test .blueprint.json`
- Reverse-engineering notes:
  - local browser-capture notes for app discovery and module naming
- This workflow doc:
  - `/Users/sebastianmertens/Downloads/make-generic-api-call-shell-workflow.md`

## Bottom line
Yes: the architecture is valid.
Use IMT/search discovery, then generate the shell blueprint yourself, request credentials, patch in the connection ID, and run the scenario through a stable generic API-call contract.

Gmail and Outlook are only examples.
They must never override live Make evidence from IMT, `/connections`, and the actual credential request endpoints.
