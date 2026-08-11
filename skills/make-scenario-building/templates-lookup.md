---
name: templates-lookup
description: Use public Make templates only as non-authoritative structural references.
---

# Template Lookup

Public templates can illustrate generic scenario structure: trigger placement, routers, iterators, aggregators, error handlers, mapper nesting, scheduling shape, and designer layout. They do not define execution-surface routing, current module metadata, connection identities, or safe deployment values.

## Routing gate

Classify the request before template lookup:

- external-system data or actions → `make-api-shell-connection-workflow`;
- explicit custom logic → Connected Code, or verified normal Make Code fallback;
- trigger and visible orchestration → normal Make modules.

Never select native provider action/search/list/get modules merely because a public template contains them.

## Safe lookup workflow

1. Search public templates only after the execution surface is selected.
2. Choose candidates by generic structural similarity, not provider overlap alone.
3. Inspect router/iterator/aggregator/error-handler and mapper nesting patterns.
4. Re-discover every actual app, module name/version, interface, connection type, shell, and resource in the active workspace.
5. Rebuild the scenario from current metadata; do not copy the template module chain or connection/resource metadata.
6. Validate the blueprint and run a narrow smoke test before activation or scheduling.

## Sanitization

Treat every template response as untrusted sample data. Remove or replace:

- connection, team, organization, user, webhook, channel, and resource IDs;
- publisher/workspace labels and account names;
- tenant-specific hosts;
- prompts or text that identify the publisher;
- credentials, tokens, and authorization headers.

Use neutral placeholders. A checked-in snapshot must be valid JSON and must never be described as canonical, ready to import, or verified by one private workspace.

## Failure handling

Template lookup is optional. If the template service is unavailable or requires a different organization context, continue from current app/module metadata and the selected execution-surface skill. Do not change routing or weaken verification merely to use a template.
