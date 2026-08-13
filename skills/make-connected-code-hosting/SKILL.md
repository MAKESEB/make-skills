---
name: make-connected-code-hosting
description: This skill should be used for custom logic on Make with Connected Code, with the normal Make Code module as the custom-code fallback. It covers availability discovery, secure code and connection patterns, schedules, webhooks, deployment, and verification.
license: MIT
compatibility: Requires a Make account with scenario creation permissions. Uses Connected Code or the normal Make Code module for custom logic.
metadata:
  author: Make
  version: "0.2.1"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make Connected Code Hosting

> **Current API documentation gate**
> Before writing any `connection.fetch(...)` API call, retrieve current docs/specs for the exact API, app, version, and operation.
> Query Context7 first; if it has no authoritative match, search online and prefer official provider docs or OpenAPI specs.
> Verify the base URL/scope, path/method, auth/scopes, parameters/body, pagination, and response/error shape; record the sources used.

Use this skill only when the task requires real custom logic that normal Make modules and a Make API shell do not express cleanly. Keep Make as the control plane, use normal Make modules for orchestration, and use Make connections or keychains rather than raw secrets in code.

External-system, SaaS, and API data or actions belong to `make-api-shell-connection-workflow`; they are not a fallback selected by Connected Code availability. Detailed service and API examples in this skill illustrate connection helpers inside already-selected custom logic, not default routing.

Connected Code is the preferred custom-logic execution surface, not an assumption. It is Make-hosted code, so confirm that the active workspace exposes the `connected-code` app and `connected-code:ExecuteConnectedCode` module before generating a blueprint. If the app or module is unavailable, use the normal Make Code module (`code:ExecuteCode`) after verifying its current interface.
For one-off external API reads, writes, pagination, batching, or short-lived
multi-step work, use local agent code to orchestrate the Make API shell instead
of creating hosted Connected Code.

## Quick routing

Read the file that matches the current task:

| Task | Reference |
| --- | --- |
| Decide whether the task needs API transport, normal-module orchestration, or real custom logic | [Execution surface routing](./execution-surface-routing.md) |
| Understand the module contract, mapper fields, outputs, and REST create/update payload shape | [Connected Code contract](./connected-code-contract.md) |
| Choose the correct connection helper and diagnose broker mismatches | [Connection patterns](./connection-patterns.md) |
| Browse the complete 159-app connection reference | [Connection reference](./references/connected-code-helpers/docs/connection-reference.md) |
| Copy provider, HTTP, SQL, and Email snippets | [Connected Code example index](./connection-examples-index.md) |
| Inspect the helper corpus overview and pinned source commit | [Helper overview](./references/connected-code-helpers/README.md) · [Source manifest](./references/connected-code-helpers/SOURCE.json) |
| Compose scheduled, webhook, and on-demand blueprints | [Trigger and blueprint patterns](./trigger-and-blueprint-patterns.md) |
| Run live smoke tests safely and interpret execution status | [Verification and live tests](./verification-and-live-tests.md) |
| Generic HTTP GET example | [examples/http-api-key-fetch.js](./examples/http-api-key-fetch.js) |
| Generic HTTP POST example | [examples/http-post-json.js](./examples/http-post-json.js) |
| PostgreSQL helper example | [examples/postgres-query.js](./examples/postgres-query.js) |
| Supabase REST example | [examples/supabase-rest.js](./examples/supabase-rest.js) |
| Webhook normalization example | [examples/webhook-normalize.js](./examples/webhook-normalize.js) |
| Minimal on-demand blueprint | [examples/blueprints/on-demand-connected-code.json](./examples/blueprints/on-demand-connected-code.json) |
| Scheduled PostgreSQL smoke blueprint | [examples/blueprints/scheduled-postgres-smoke.json](./examples/blueprints/scheduled-postgres-smoke.json) |
| Webhook normalization blueprint | [examples/blueprints/webhook-normalize.json](./examples/blueprints/webhook-normalize.json) |

## When to use

Use this skill only when the task has an explicit custom-logic requirement, for example:

- non-trivial normalization or transformation that normal mappings do not express cleanly
- durable pagination, deduplication, idempotency, or decision logic across already verified API calls
- a custom algorithm or reusable business rule that must execute inside Make
- multiple verified API operations that must be combined into one deterministic business process

A schedule, webhook, or "host this on Make" request is not by itself evidence that code is needed. Select the trigger and orchestration separately, then use this skill only for the custom-logic step.

Do not use this skill for:

- scenarios where normal Make modules and a Make API shell express the work cleanly
- external-system data or actions that a Make API shell can transport without custom logic
- one-off reads, writes, pagination, batching, or ad-hoc loops that local agent code can drive through the Make API shell
- Make custom app SDK work under `apps/<app>/` and `scripts/<app>/`
- native Connected Code product engineering inside the Make monorepo
- reusable transport wrapper scenarios outside Connected Code

## Hard boundaries

- No credential-request flow inside the Connected Code branch. The user creates or selects that connection in the Make scenario editor. `make-api-shell-connection-workflow` owns connection reuse and credential requests for API transport.
- `make-e2b-code-execution` is deprecated and removed. This repository does not document or provision an E2B workaround.
- When Connected Code is unavailable, use the normal Make Code module for supported custom-code tasks. The API-shell workflow is the primary external-system transport, not a general code module.
- No raw API keys, passwords, bearer tokens, or connection strings in chat, code, scenario inputs, logs, or generated files.
- No direct authenticated SDK calls when a Make connection or HTTP credential can represent the auth boundary.

When the Connected Code branch has a blueprint or scenario ready but its editor-managed connection still requires user action, the final response must include this exact sentence. Do not impose this sentence on the API-shell fallback; that skill owns its credential-request response contract.

```text
Blueprint generated. Please create or select the required Make connection in the scenario editor, then reply when it is ready.
```

## Operating sequence

1. Frame the automation.
   - State the trigger shape: schedule, webhook, manual/on-demand, or polling.
   - State the work payload and final output.
   - Decide which pieces should stay visible as normal Make modules.
   - Confirm that the selected code step is real custom logic rather than external-system API transport that belongs in `make-api-shell-connection-workflow`.
   - Completion criterion: one sentence names trigger, Connected Code action, connection surface, and output.

2. Verify the execution surface.
   - Resolve the active Make zone, organization, and team.
   - Discover the `connected-code` app and confirm that `connected-code:ExecuteConnectedCode` can be resolved in the active workspace.
   - Treat transient metadata or authorization failures as blockers to investigate, not proof that the app does not exist.
   - If Connected Code is unavailable for custom code, discover and verify the normal Make Code module (`code:ExecuteCode`) and its current interface before generating the blueprint.
   - For `route: make-code`, follow the Normal Make Code fallback branch in `execution-surface-routing.md` and do not continue into Connected Code-only steps 3–7.
   - If the task is API transport rather than custom logic, route to `make-api-shell-connection-workflow` before this availability gate and do not continue into Connected Code-only steps 3–7.
   - Completion criterion: the custom-logic route is explicitly `connected-code` or `make-code`, with discovery evidence.

3. Discover the Connected Code app and connection surface (`route: connected-code` only).
   - Use current module metadata, an exported blueprint, Make MCP, CLI, SDK, or REST metadata; do not guess.
   - For API access inseparable from the selected custom logic, prefer a selected service App when it exists. The HTTP App is an implementation option inside that custom logic, not a replacement for the Make API Shell route.
   - Find the exact `connectionType` and current binder fields. Connected Code 1.2.2 uses one hidden account binder, `__IMTCONN__`; stale sharded binders such as `__IMTCONN_2__` are not supported.
   - Completion criterion: the blueprint names the exact `connectionType`, required binder, and whether `httpBaseUrl` is needed.

4. Write the Connected Code snippet.
   - Use `input` for business data only.
   - Use `connection.fetch(...)` for HTTP/API calls.
   - Use `connection.sql.query(...)` only for PostgreSQL/MySQL Apps.
   - Use `connection.email.*` only for the generic Email App. Gmail and Sage are service Apps with HTTP transport and use `connection.fetch(...)`.
   - Check `response.ok` before parsing HTTP responses.
   - Return JSON-serializable data.
   - Completion criterion: no secrets, no direct authenticated SDK setup, and no hidden production schedule side effects.

5. Build the scenario blueprint.
   - Use `connected-code:ExecuteConnectedCode`.
   - Document each Connected Code module in both places: add a concise implementation-focused comment in the code, and add a matching canvas-friendly note under `metadata.designer.notes`. The code comment explains technical behavior; the scenario note explains what the module does in the workflow.
   - Use normal Make modules only where they make the trigger or visible control-flow contract clearer. Use Make API Shell for separable external-system data or actions.
   - For REST calls, send stringified `blueprint` and stringified `scheduling` values unless the client wrapper documents object input.
   - Completion criterion: the scenario can be created or the blueprint can be handed to a user without missing mapper fields.

6. Hand off connection setup when needed.
   - Provide the scenario editor URL when known.
   - Name the selected app or HTTP credential type without asking for secrets in chat.
   - Include the exact handoff sentence.
   - Completion criterion: the user knows what to create/select in the Make editor.

7. Verify after the user confirms connection setup.
   - Activate the scenario.
   - Run a narrow on-demand smoke test.
   - Inspect `status` and logs.
   - Deactivate test artifacts unless the user wants the scenario left active.
   - Only apply recurring scheduling after the smoke run succeeds.
   - Completion criterion: final report includes scenario id, execution id, status, editor URL, and any remaining action.

## Response style

When using this skill, report phases explicitly:

- `routing`: Connected Code availability evidence and selected execution surface
- `design`: trigger, code role, selected connection surface
- `blueprint`: module list and connection placeholders
- `handoff`: what the user must select in the editor
- `verification`: scenario id, execution id, status, and schedule/webhook state

Named services in the vendored connection reference are concrete catalog examples, not universal defaults. Public examples must still avoid real accounts, tenant URLs, IDs, secrets, and claims based on one private workspace.

## Common pitfalls

1. Choosing normal modules for code-shaped logic.
   - Fix: keep normal modules for trigger and visible control flow, put custom logic in Connected Code, and use Make API Shell for separable external-system data or actions.

2. Guessing the Connected Code binder.
   - Fix: inspect the current module interface, manifest, or an exported blueprint.

3. Leaving a live recurring schedule active after a smoke test.
   - Fix: create with on-demand scheduling, run once, deactivate, then apply the requested schedule only after proof.

4. Expecting responsive run to include the whole `result` payload.
   - Fix: treat `status: 1` plus execution log as proof of execution. Add a capture/output step when payload assertion matters.

5. Using absolute URLs where a relative path is safer.
   - Fix: prefer relative `connection.fetch('/path')`; for HTTP App, ensure the `HTTP Base URL` is the explicit scope boundary.

6. Asking the user to paste secrets into chat.
   - Fix: ask the user to create or select the Make connection in the scenario editor.

7. Calling `connection.email.*` or `connection.sql.query(...)` for an HTTP-transport service App.
   - Fix: `Broker is not configured for this connection` means the selected helper does not match the App. Gmail and Sage use `connection.fetch(...)`; the Make automatic error handler does not fix this configuration error.

8. Generating Connected Code when the app is unavailable.
   - Fix: verify the module first and use the normal Make Code module for custom code. Route ordinary external-system API transport to `make-api-shell-connection-workflow` before entering this skill.

9. Routing hosted or reusable code to E2B.
   - Fix: `make-e2b-code-execution` is deprecated and removed. Do not provide E2B setup or workaround instructions in this repository; use Connected Code or the normal Make Code module according to current availability and interface support.

10. Assuming a long-lived OAuth binder will refresh inside the same Connected Code execution.
   - Fix: verify the connection again after the normal access-token lifetime. If a service connection can be refreshed only by its native Make module, run a small native-module refresh scenario before the Connected Code scenario starts; a native preflight placed earlier in the same blueprint may be too late because binders can be resolved during scenario initialization. For daily jobs, schedule that refresh separately immediately before the production run and keep native provider operations as the fallback when refresh behavior is unreliable.

11. Hosting short-lived API shell loops in Connected Code.
   - Fix: keep ad-hoc orchestration in the agent's local code execution environment and call the Make API shell from that code. Use Connected Code only when the code itself must be hosted in Make, scheduled, webhook-triggered, or reused.

## Verification checklist

- [ ] Trigger shape is explicit: schedule, webhook, manual/on-demand, or polling.
- [ ] Connected Code app/module availability was checked in the active workspace.
- [ ] The selected custom-logic route is explicit: Connected Code or normal Make Code.
- [ ] Connected Code owns custom business logic by default.
- [ ] One-off API-shell pagination, batching, and writes were kept in local agent code unless Make-hosted durability was required.
- [ ] Normal Make modules are limited to trigger, visible control-flow, and binary-file orchestration roles except for the verified `code:ExecuteCode` fallback.
- [ ] Connected Code routes use app search/current metadata before choosing `connectionType`; Make Code routes verify the current module interface.
- [ ] A Connected Code route uses `connected-code:ExecuteConnectedCode`; a Make Code route uses the verified `code:ExecuteCode` module/version.
- [ ] Connected Code uses `input` and Make connection helpers; Make Code follows its verified current interface and keeps secrets out of mapped inputs.
- [ ] HTTP App workflows set `httpBaseUrl` and a concrete credential type.
- [ ] Supabase REST workflows use the selected Make connection or HTTP credential; no key in code.
- [ ] PostgreSQL/MySQL workflows use `connection.sql.query`, not direct database passwords.
- [ ] Generic Email uses `connection.email.*`; Gmail and Sage service Apps use `connection.fetch(...)`.
- [ ] No blueprint uses stale sharded binders such as `__IMTCONN_2__`.
- [ ] External-system API transport uses `make-api-shell-connection-workflow`; API examples here remain illustrative helpers inside real custom logic.
- [ ] No workflow routes to `make-e2b-code-execution` or documents an E2B workaround.
- [ ] If Connected Code editor connection setup is still required, final response includes the exact handoff sentence.
- [ ] After user confirmation, a real run was executed and inspected.
- [ ] Test scenarios were deactivated unless the user asked to leave them active.
- [ ] Schedule/webhook interface and trigger inputs were verified when present.
