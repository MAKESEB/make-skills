# Complete App, Module, Icon, and Public Visibility Workflow

Use this workflow when turning a minimal Make SDK app scaffold into a complete uploaded app.

## 1. Build full app files

A production-ready app must contain:

```text
apps/<app>/
  metadata.json
  base.imljson
  readme.md
  assets/icon.png
  connections/<connection>/metadata.json
  connections/<connection>/parameters.imljson
  connections/<connection>/api.imljson
  modules/make-api-call/...
  modules/<specific-module>/...
```

The universal **Make an API Call** module is required, but it is not sufficient unless the app is explicitly marked as a minimal shell scaffold. A production-ready app must also include specific modules from real API endpoints.

## 2. Upload app objects and all module sections

Use the generic uploader:

```bash
./scripts/upload-ready-apps.sh <app>
```

The uploader must create or update, in order:

1. SDK app object
2. app `base` section
3. app docs/readme
4. connection object
5. connection `api` and `parameters` sections
6. every module object with the correct `typeId`
7. module connection binding
8. every module `api`, `expect`, `interface`, and `samples` section
9. app icon

For module-only re-uploads when the icon is already verified, use:

```bash
UPLOAD_ICONS=0 ./scripts/upload-ready-apps.sh <app>
```

Report `icon=skipped` honestly when using `UPLOAD_ICONS=0`.

## 3. App icons

Use 512x512 PNG icons.

Preferred Make CLI commands:

```bash
make-cli sdk-apps set-icon <remote-app> 1 apps/<app>/assets/icon.png
make-cli sdk-apps get-icon <remote-app> 1 /tmp/<app>-icon.png
file /tmp/<app>-icon.png
```

Expected readback:

```text
PNG image data, 512 x 512
```

Raw SDK endpoint, used by the old VS Code Apps SDK and by the CLI internally:

```text
PUT /api/v2/sdk/apps/<appName>/<version>/icon
GET /api/v2/sdk/apps/<appName>/<version>/icon/512
```

Do not upload to `/icon/512`; that route is readback only.

## 4. Make app and module public visibility

App visibility and module visibility are separate. `audience: "global"` does not make an app public, and making the app public does not reliably make every module public.

Preferred Make CLI commands:

```bash
make-cli sdk-apps set-public <remote-app> 1
make-cli sdk-modules set-public <remote-app> 1 <module-name>
```

Rollback commands:

```bash
make-cli sdk-modules set-private <remote-app> 1 <module-name>
make-cli sdk-apps set-private <remote-app> 1
```

Raw SDK endpoints, discovered from the old VS Code Apps SDK:

```text
POST /api/v2/sdk/apps/<appName>/<version>/public
POST /api/v2/sdk/apps/<appName>/<version>/private
POST /api/v2/sdk/apps/<appName>/<version>/modules/<moduleName>/public
POST /api/v2/sdk/apps/<appName>/<version>/modules/<moduleName>/private
```

Public visibility can be eventually consistent. If a module still reads back as `public: false`, retry that module's public endpoint and verify again.

## 5. Required readback verification

After upload and public visibility changes, verify:

```bash
make-cli sdk-apps get --name=<remote-app> --version=1 --output=json
make-cli sdk-modules list --app-name=<remote-app> --app-version=1 --output=json
make-cli sdk-apps get-section --name=<remote-app> --version=1 --section=base --output=json
make-cli sdk-connections get-section --connection-name=<remote-connection> --section=api --output=json
make-cli sdk-modules get-section --app-name=<remote-app> --app-version=1 --module-name=<representative-module> --section=api --output=json
```

Pass criteria:

- app `public` is `true`
- every module `public` is `true`
- remote module count equals local generated module count
- representative module `api.url` matches the local module file
- app base URL matches local `base.imljson`
- connection API URL matches local connection validation endpoint

Only claim live third-party API functionality if provider credentials were actually used. Upload/readback proves Make SDK object state, not provider execution.

## 6. n8n-source full app factory

Use the Hermes/Codex factory script to derive one full Make app from one exact n8n package source:

```bash
scripts/n8n-full-app-codex-factory.sh <app-slug> <npm-package> [package-version]
```

The script does the repeatable outer orchestration:

1. prefetches the exact NPM package into `tmp/n8n-source/<app-slug>`
2. writes a strict Codex prompt to `generated/n8n-full-app-prompts/<app-slug>.md`
3. runs Codex with an isolated no-MCP profile by default (`CODEX_HOME=~/.codex-n8n-make-worker`)
4. requires Codex to inspect package source and generate `apps/<app-slug>/` plus `scripts/<app-slug>/generate-<app-slug>-app.mjs`
5. validates generator syntax, generated JSON/IML, icon dimensions, placeholder scan, and module guard
6. optionally uploads, uploads/verifies icons, marks the app and every module public, and reads back public flags

Examples:

```bash
# Generate and validate local files only
RUN_UPLOAD=0 scripts/n8n-full-app-codex-factory.sh activitysmith n8n-nodes-activitysmith 1.0.5

# Generate, upload, and make app/modules public
RUN_UPLOAD=1 MAKE_PUBLIC=1 scripts/n8n-full-app-codex-factory.sh ada n8n-nodes-ada 0.1.6

# Create a stacked branch/PR against the scaffold branch
CREATE_BRANCH=1 CREATE_PR=1 RUN_UPLOAD=0 \
  scripts/n8n-full-app-codex-factory.sh myapp n8n-nodes-myapp 1.2.3
```

Codex must not invent endpoints. The exact package source is the primary source of truth: credentials, validation request, base URL, generic request helper, node routing, resource descriptions, and request builders. If these facts are missing, write a blocked report instead of generating a fake app.

## 7. Secret handling

Never print or commit API keys. For raw curl fallbacks, write `Authorization: Token ...` to a restrictive temporary curl config file and delete it immediately after use.
