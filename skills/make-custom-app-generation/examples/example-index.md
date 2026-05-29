# Example App Index

These examples are copied from the Make custom app workspace. Use them as implementation patterns, not as provider templates with reusable endpoint facts.

| Example | Coverage |
|---------|----------|
| `apps/daytona` | Bearer API key auth, sandbox lifecycle actions, RPC-backed selectors, universal Make an API Call, upload/readback script, and icon workflow. |
| `apps/rindegastos` | Large production-ready REST app, Bearer company token, search/list/read/create/update/status modules, RPCs, generated endpoint matrix, full upload script. |
| `apps/actaport` | OAuth authorization-code/refresh connection, dynamic realm/tenant parameters, many generated modules, RPC selectors, real webhook lifecycle and instant trigger. |
| `apps/2captcha` | API key task workflow, create/get/report action families, async task result polling, multiple CAPTCHA task body variants, generator-driven modules. |
| `apps/ably` | HTTP Basic auth from key name/secret, realtime REST endpoints, channel/message/presence searches, token request action, stats/time reads. |
| `apps/accuranker` | Token auth header, required `fields` query usage, limit/offset list pagination, read/list/create modules, RPC-backed account/domain/tag selectors. |
| `apps/abuselpdb` | Threat-intel API patterns, check/search/report/blacklist actions, query/body parameter mix, abuse confidence score filters. |
| `apps/activitysmith` | Bearer API key auth, live activity lifecycle actions, streaming/update payloads, push notification body modeling. |
| `apps/add-to-wallet` | API key header auth, configurable base URL pattern from source automation docs, create pass and credit read actions. |
| `apps/agify` | Small production-ready query API, API key query parameter auth, batch array query handling, minimal specific modules plus universal call. |

## Supporting Scripts

| Script Folder | Purpose |
|---------------|---------|
| `scripts/2captcha` | Generator for task/action variants. |
| `scripts/actaport` | Generator for large OAuth/RPC/webhook app. |
| `scripts/add-to-wallet` | Generator for a compact n8n-derived API app. |
| `scripts/agify` | Generator for a small query API with batch support. |
| `scripts/daytona` | Upload and runtime smoke-test scripts. |
| `scripts/rindegastos` | Generator and upload workflow for a large production app. |

## Pattern Lookup

- **OAuth plus webhooks:** `apps/actaport`
- **Bearer token with upload readback:** `apps/daytona`, `apps/rindegastos`
- **HTTP Basic:** `apps/ably`
- **Token prefix header:** `apps/accuranker`
- **API key in query:** `apps/agify`, `apps/2captcha`
- **API key in header:** `apps/add-to-wallet`
- **RPC-backed selectors:** `apps/actaport`, `apps/accuranker`, `apps/daytona`, `apps/rindegastos`
- **Instant trigger/webhook lifecycle:** `apps/actaport`
- **Async create/result/report pattern:** `apps/2captcha`
- **Small app generator:** `scripts/agify`
- **Large endpoint-matrix generator:** `scripts/actaport`, `scripts/rindegastos`
