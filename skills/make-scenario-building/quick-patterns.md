---
name: quick-patterns
description: Compressed Make-first call chains for API transport, orchestration, custom logic, and HTTP fallback.
---

# Quick Patterns

Use these role-level patterns only after the user confirms the use case. Resolve every concrete app, module, connection, scenario, shell, account, and resource from current Make metadata. Provider names and native action modules are not routing defaults.

## External data read

```text
1. Resolve provider/account ambiguity
2. Load make-api-shell-connection-workflow
3. Discover app versions and the exact API-call module
4. Reuse a suitable connection and verified read-only API shell
5. Run the narrowest provider-relative GET request
6. Inspect the execution result before expanding the query
```

If no app version exposes a suitable API-call module, use the generic Make HTTP API shell with a Make-managed connection or keychain.

## External action

```text
1. Resolve provider/account and intended mutation
2. Load make-api-shell-connection-workflow
3. Discover the exact app API-call module and connection
4. Reuse or provision the verified API shell
5. Obtain explicit confirmation for the concrete write
6. Execute through Make and verify the resulting provider state
```

Do not replace this transport path with a native Create/Update/Delete/Send module merely because such a module exists.

## Trigger plus external transport

```text
Normal Make trigger
→ Make API Shell read/action
→ visible router/iterator/aggregator/error handling as needed
→ Make API Shell action when an external write follows
```

Normal modules own the trigger and visible orchestration. API Shell owns separable external-system data and actions.

## Custom logic between API operations

```text
Make API Shell read
→ Connected Code custom logic
→ Make API Shell action
```

Use this only when transformation, normalization, decisions, pagination, deduplication, idempotency, or another explicit business rule requires code. If Connected Code is unavailable, verify and use the normal Make Code module. Do not use API Shell as a custom-code fallback.

## Generic Make HTTP fallback

```text
1. Prove no suitable app-specific API-call module exists across current app versions
2. Inspect current http:MakeRequest metadata and credential types
3. Reuse or request a Make-managed keychain/connection
4. Build the documented three-module HTTP shell
5. Validate on-demand before scheduling or webhook exposure
```

Browser use, local curl, and provider SDK execution are not automatic fallbacks.

## Common verification tail

```text
validate blueprint/interface
→ create or reuse scenario
→ activate only when required
→ run narrow smoke test
→ inspect status/output/logs
→ apply requested schedule only after proof
```

Always report the selected execution surface, discovered Make metadata, scenario ID, execution ID, account/connection ambiguity, and any credential handoff. Public templates may be consulted for structural concepts such as routing, aggregation, and mapper shape, but never copy their provider modules, connection labels, resource IDs, or tenant metadata as a routing decision.
