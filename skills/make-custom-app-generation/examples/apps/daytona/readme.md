# Daytona Make Custom App

Production-ready local Make custom app for Daytona.

API facts used: Daytona API reference at `https://www.daytona.io/docs/en/tools/api/`; base URL `https://app.daytona.io/api`; authentication is `Authorization: Bearer <api key>`. The API documents sandbox, snapshot, API key, organization, and toolbox endpoints.

Modules focus on likely Make automations: sandbox lifecycle, command execution, snapshots, preview URLs, plus Make an API Call. RPC selectors are backed by documented `GET /sandbox` and `GET /snapshots` list endpoints. No webhooks or polling triggers are included because the source did not document webhook lifecycle registration; list endpoints expose cursor/page parameters but no trigger-safe event cursor semantics.
