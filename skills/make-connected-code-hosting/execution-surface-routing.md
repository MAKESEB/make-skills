# Execution surface routing

Use this reference before building any scenario for a custom-code request.

## Decision rule

Classify the work before checking a code runtime. API transport, orchestration, and real custom logic are separate roles.

| Task shape and evidence | Route |
| --- | --- |
| External-system, SaaS, or API data or actions | Use `make-api-shell-connection-workflow`. Prefer a discovered app-specific API-call module; use its generic Make HTTP API shell when no suitable app-specific API-call module exists. |
| One-off pagination, batching, retries, or multi-step external API work | Use local agent code to orchestrate repeated Make API-shell calls. Keep the authenticated transport in Make; do not host the loop in Connected Code unless it must become durable, scheduled, webhook-triggered, or reusable. |
| Triggering, control flow, routing, mapping, or binary-file handling that normal Make modules express | Use `make-scenario-building` and normal Make modules for orchestration. |
| Real custom logic, with `connected-code` and `connected-code:ExecuteConnectedCode` present in current workspace metadata | Continue with this skill and build Connected Code. |
| Real custom logic, with Connected Code genuinely absent or unavailable | Discover and verify the normal Make Code module (`code:ExecuteCode`) and use it when its current interface supports the task. |
| Metadata lookup fails transiently or returns an unexplained authorization error | Diagnose access first. Do not label the app unavailable from one failed lookup. |
| User references the removed E2B skill | State that `make-e2b-code-execution` is deprecated and removed. Do not provide E2B setup or workaround instructions; select Connected Code or the normal Make Code module through the same availability gate. |

Service, HTTP, SQL, database, and Email examples in this skill illustrate implementation options only after a real custom-logic route has been selected. They do not override the generic Make-first roles above.

## Availability gate

Run this gate only for real custom logic:

1. Resolve the active Make zone, organization, and team.
2. Search current Make metadata for the `connected-code` app.
3. List its modules and confirm the exact `ExecuteConnectedCode` module id and version.
4. Read the current module interface before choosing parameters or connection binders.
5. Record the evidence in the response as one of:
   - `route: connected-code`
   - `route: make-code`
   - `route: make-api-shell` when classification stopped the custom-code path before this gate
   - `route: blocked — metadata/access unresolved`

With Make MCP, use current app discovery and module metadata tools such as `apps_recommend`, `app_modules_list`, and `app-module_get`. With REST, discover the app in the active organization/team and inspect its current version rather than assuming a globally visible catalog entry is usable in the workspace.

A `401`, `403`, timeout, or malformed metadata response is not by itself proof that Connected Code is absent. Resolve zone, authentication, scope, and team context first. Fall back only after the active workspace cannot expose the app/module or a workspace limitation is confirmed.

## Connected Code branch

When the gate passes for real custom logic:

1. For API access inseparable from the custom logic, prefer a selected service App from the current Connected Code catalog.
2. If no service App matches, the Connected Code HTTP App may implement that custom logic; it is not a transport-routing fallback.
3. Derive the current `connectionType`, binder, and mapper schema from metadata.
4. Author code with the correct helper:
   - HTTP/service Apps: `connection.fetch(...)`
   - PostgreSQL/MySQL Apps: `connection.sql.query(...)`
   - generic Email App: `connection.email.*`
5. Build on-demand first, complete the user-managed connection handoff, run a smoke test, and only then apply scheduling or webhook exposure.

The connection options in this branch are implementation details, not reasons to route ordinary API transport through Connected Code.

Connected Code is hosted Make code. Use it when the user needs the code to
live in Make, run on a schedule, respond to a webhook, keep reusable workflow
logic, or expose a durable automation surface. Do not use it merely because an
ad-hoc API-shell loop needs code for pagination or batching.

## E2B deprecation boundary

`make-e2b-code-execution` is deprecated and removed from this repository. Do not provide E2B setup, credential, runner, or workaround instructions here. Select Connected Code when available; otherwise inspect and use the normal Make Code module when it supports the requested custom-code task.

## Normal Make Code fallback branch

When Connected Code is unavailable for custom code:

1. Discover and verify the current `code:ExecuteCode` module and version; do not rely on stale mapper assumptions.
2. Read the current module interface and choose only a supported language, input shape, dependency shape, and output contract.
3. Keep secrets out of code and mapped inputs. Use normal Make modules for orchestration and a Make API shell for separable external-system transport.
4. Build and run a narrow test, inspect the real output bundle, and report `route: make-code` with module/version evidence.

## Make API-shell primary transport branch

For external-system, SaaS, or API data and actions, select this branch before checking Connected Code:

1. Record `route: make-api-shell` and the external-system API transport role.
2. Load and follow `make-api-shell-connection-workflow`.
3. Discover the target system's current Make app, exact API-call module, module connection type, and credential-request type.
4. Reuse or request the connection according to that skill.
5. Build its three-module shell contract:
   - `scenario-service:StartSubscenario`
   - one discovered app-specific API-call module
   - `scenario-service:ReturnData`
6. Return the response body from the actual middle API-call module. The standard example uses module id `3`, so its ExpectDataAny mapping is `data: {{3.body}}`; never replace it with `{{3}}` or a guessed `.data` field. If a UI export renumbers modules, use the real middle module id.
7. Explicitly set and verify the scenario interface before the first `/run` call.
8. Run a narrow request and inspect the real execution bundle before reporting success.
9. If no suitable app-specific API-call module exists, build the generic Make HTTP API shell described by that skill.
10. For one-off multi-step work, write local agent code that calls the shell
    repeatedly, resolves target IDs before writes, batches conservatively, and
    verifies the final state. If an existing shell or scenario is too broad,
    build a new narrow shell instead of stopping or running the broad one.

Do not copy raw credentials into code, switch to a direct SDK, or invent an API-call module. Named systems in examples are illustrative and do not change this generic route.

## Handoff contract

A route change must be visible in the final response:

```text
routing: external-system API transport
route: make-api-shell-connection-workflow
app/module: <discovered app and API-call module | generic Make HTTP API shell>
connection: <reused | credential request required>
verification: <scenario id, execution id, result>
```
