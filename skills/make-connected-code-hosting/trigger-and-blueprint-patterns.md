# Trigger and blueprint patterns

Use normal Make modules for scenario entry and visible control flow. Use Connected Code for custom logic, and use Make API Shell for separable external-system data or actions.

Apply these patterns only after [execution surface routing](./execution-surface-routing.md) confirms that `connected-code:ExecuteConnectedCode` is available in the active workspace. If it is unavailable for custom logic, do not substitute placeholders into these blueprints; continue with the verified normal Make Code fallback described in that reference.

## On-demand smoke pattern

Use this pattern before leaving a scenario scheduled or exposed by webhook:

```text
Connected Code
```

Create with on-demand scheduling, activate, run once, inspect status, then deactivate. This proves the code and connection before any recurring schedule is enabled.

Blueprint example: [examples/blueprints/on-demand-connected-code.json](./examples/blueprints/on-demand-connected-code.json)

## Scheduled pattern

```text
Scenario schedule -> Connected Code -> Make API Shell when an external action follows
```

Scheduling is scenario-level. There is no scheduler module. For live testing, create as on-demand first, then apply the real schedule only after the smoke test passes.

Use when the user says:

- every morning at 09:00
- daily
- hourly
- weekly

Blueprint example: [examples/blueprints/scheduled-postgres-smoke.json](./examples/blueprints/scheduled-postgres-smoke.json)

## Webhook pattern

```text
Custom webhook -> Connected Code -> webhook response
```

Control the webhook payload interface. Map webhook fields into the Connected Code `input` array. Keep custom parsing, normalization, and validation in code.

Typical input mapping:

```json
"input": [
  { "name": "text", "value": "{{1.text}}" },
  { "name": "channel", "value": "{{1.channel}}" },
  { "name": "metadata", "value": "{{1.metadata}}" }
]
```

Blueprint example: [examples/blueprints/webhook-normalize.json](./examples/blueprints/webhook-normalize.json)

## Normal modules around code

Use normal Make modules around Connected Code when they add product value:

- trigger modules for incoming events;
- routers for visible high-level branches;
- iterators/aggregators when the visual flow needs per-item or collected execution;
- binary-file operation modules when that workflow step must remain visible in the scenario.

Use Make API Shell for separable external-system data or actions before or after the custom-logic step. Do not turn a normal delivery/action module into the default transport merely to make the canvas look explicit.

Do not rebuild complex business rules as a large chain of normal modules when the request is code-shaped. Put the logic in Connected Code.

## Handoff after blueprint

If the blueprint contains an unselected connection or keychain, stop with:

```text
Blueprint generated. Please create or select the required Make connection in the scenario editor, then reply when it is ready.
```

Then verify only after the user confirms the connection is ready.
