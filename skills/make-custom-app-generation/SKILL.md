---
name: make-custom-app-generation
description: This skill should be used when creating, repairing, validating, packaging, or uploading Make.com custom apps from API documentation. Use for SDK app folders with base.imljson, metadata.json, connection definitions, module api/expect/interface/samples files, RPCs, webhooks, universal Make an API Call modules, app generators, upload scripts, logo/icon upload, and production-readiness checks.
license: MIT
metadata:
  author: Make
  version: "0.1.3"
  homepage: https://www.make.com
  repository: https://github.com/integromat/make-skills
---

# Make Custom App Generation

Build real, uploadable Make custom apps from real API documentation. Do not leave placeholder service names, placeholder domains, example endpoints, generic response paths, or unverified auth assumptions in generated app files.

## Resource Routing

Read only the files needed for the current task:

| Need | Read |
|------|------|
| Start a custom app build or choose references | `references/knowledge-base-index.md`, then the Core Build Path files listed there |
| Choose patterns from working apps | `examples/example-index.md` |
| Understand folder and required files | `references/knowledge-base/app-folder-structure.md`, `references/knowledge-base/app-essential-files.md` |
| Configure base/auth/metadata | `references/knowledge-base/app-base-configuration.md`, `references/knowledge-base/app-metadata-configuration.md`, `references/knowledge-base/auth-connection-types.md`, `references/knowledge-base/auth-connections-and-authentication.md` |
| Design API calls and errors | `references/knowledge-base/api-patterns.md`, `references/knowledge-base/api-communication.md`, `references/knowledge-base/api-error-handling.md` |
| Design modules and parameters | `references/knowledge-base/modules-patterns.md`, `references/knowledge-base/modules-actions-triggers-searches.md`, `references/knowledge-base/modules-parameter-types.md`, `references/knowledge-base/modules-parameters-and-user-inputs.md` |
| Add IML, RPCs, or webhooks | `references/knowledge-base/modules-iml-and-custom-functions.md`, `references/knowledge-base/modules-rpc-patterns.md`, `references/knowledge-base/modules-rpc-odata-patterns.md`, `references/knowledge-base/modules-webhooks.md` |
| Upload to Make | `references/knowledge-base/release-connection-upload-learnings.md`, `references/knowledge-base/release-icon-logo-upload-workflow.md`, `references/knowledge-base/release-complete-module-public-workflow.md` |
| Debug SDK or IML issues | `references/knowledge-base/foundation-common-patterns.md`, `references/knowledge-base/foundation-troubleshooting.md`, `references/knowledge-base/modules-iml-and-custom-functions.md` |

Make Custom App Knowledge Base references are bundled under `references/knowledge-base/`. `references/knowledge-base-index.md` maps each readable skill filename back to the original source filename. Ten representative app implementations are bundled under `examples/apps/`, with supporting generator/upload scripts under `examples/scripts/` where available.

## Workflow

### 1. Discover The API

Gather facts from real API documentation before generating files:

- base URL and versioning model
- auth type, credential fields, and exact header/query/body placement
- lightweight connection validation endpoint
- endpoint names, methods, paths, query params, body params, and response shapes
- list response array paths, pagination model, and error response formats
- webhook registration lifecycle when the API supports real callbacks
- logo/icon source suitable for a 512x512 PNG

If API facts are missing, inspect docs or examples first. Do not invent endpoints or mark an app production-ready from guesses.

### 2. Classify The App

Every generated app is one of:

- `minimal-shell-scaffold`: intentionally universal-only. README and generated report must say it is not product-complete.
- `production-ready`: universal Make an API Call plus specific modules from a real endpoint matrix.

For production-ready apps, include specific modules for list/search, read, create, update, delete/status, webhook/instant trigger, and RPC-backed selectors where the source API supports them.

### 3. Generate The Folder

Use this structure:

```text
apps/<app-name>/
  assets/icon.png
  base.imljson
  metadata.json
  readme.md
  connections/<connection-name>/
    metadata.json
    parameters.imljson
    api.imljson
  modules/<module-dir>/
    metadata.json
    api.imljson
    expect.imljson
    interface.imljson
    samples.imljson
```

For large APIs, prefer a generator under `scripts/<app-name>/generate-<app-name>-app.mjs`. The generator should emit normal Make app JSON/IML files, keep endpoint metadata close to the generator, and avoid hand-maintaining repeated module files.

### 4. Apply Make App Rules

- Set a real `baseUrl` in `base.imljson`.
- Add `Accept` and `Content-Type` where appropriate.
- Sanitize authorization headers, API keys, access tokens, refresh tokens, and credential request bodies in logs.
- Connection validation does not inherit the app base; use a full validation URL in `connections/<connection>/api.imljson`.
- Use Make connection type enums such as `apikey`, `basic`, `oauth`, or `other` for remote connection creation.
- Include a universal `make-api-call` module, usually `typeId: 12`.
- Use `typeId: 9` for search/list modules, `typeId: 4` for action/read/create/update/status modules, and `typeId: 10` only when a matching webhook folder exists.
- Use `rpcs/` and `rpc://` fields for safe dynamic selectors from real list/load-options endpoints.
- Preserve falsy valid filter values such as `0` and `false`; avoid `ifempty()` where those values are meaningful.

### 5. Verify Locally

Run the relevant local checks before upload:

```bash
node scripts/<app-name>/generate-<app-name>-app.mjs
bash -n scripts/<app-name>/upload-<app-name>-app.sh
node --check scripts/<app-name>/generate-<app-name>-app.mjs
test ! -f scripts/validate-rpc-webhook-gates.mjs || node scripts/validate-rpc-webhook-gates.mjs
ruby -rjson -e 'ARGV.each { |f| JSON.parse(File.read(f)) }; puts "ok"' $(find apps/<app-name> -type f \( -name '*.json' -o -name '*.imljson' \) | sort)
file apps/<app-name>/assets/icon.png
```

Adjust commands to the current repository layout. If the repository does not include `scripts/validate-rpc-webhook-gates.mjs`, apply the RPC and webhook rules from `references/knowledge-base/modules-patterns.md`, `references/knowledge-base/modules-rpc-patterns.md`, and `references/knowledge-base/modules-webhooks.md`.

### 6. Upload And Read Back

Upload scripts should:

- require `MAKE_API_KEY` and `MAKE_ZONE`
- prefer local `make-cli`, falling back to `npx -y @makehq/cli`
- create/find the remote SDK app
- upload base and docs
- create/find the remote connection object with Make's expected connection type enum
- upload connection `api` and `parameters` sections through non-versioned endpoints
- create/update modules, bind each module to the connection, and upload `api`, `expect`, `interface`, and `samples`
- upload a 512x512 PNG icon and verify `/icon/512` readback
- print remote app name, connection name, module count, and icon status without exposing secrets

After upload, read back remote module count, base URL, connection API section, and one representative module API section. Upload/readback proves the custom app exists; live third-party functionality still requires testing with a real provider credential.

## Example Selection

Use `examples/example-index.md` to choose a model implementation:

- Start from `daytona` or `rindegastos` for complete upload workflow patterns.
- Start from `actaport` when OAuth, RPCs, and real webhooks are needed together.
- Start from `2captcha`, `ably`, `accuranker`, or `abuselpdb` for varied auth and endpoint matrices.
- Start from `activitysmith`, `add-to-wallet`, or `agify` for smaller focused APIs and payload patterns.

Copy patterns, not provider names. Replace every endpoint, auth rule, response path, and sample with facts from the target API.

## Completion Checklist

- API docs inspected and facts captured.
- App classification declared in README/report.
- Required folder shape present.
- Universal Make an API Call module present.
- Production-ready apps include specific endpoint modules.
- RPC references have matching `rpcs/<name>` definitions.
- Instant triggers have matching `webhooks/<hook>` lifecycle files.
- Connection validation uses a full URL and sanitized logs.
- App icon is a real 512x512 PNG.
- Local JSON/IML validation passes.
- Upload script syntax check passes.
- Remote upload and readback are verified before claiming Make SDK availability.
