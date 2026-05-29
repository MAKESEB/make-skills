# App Icon and Logo Upload Workflow

This repository uses 512x512 PNG app icons for remote Make SDK app icons.

## Source of truth

The official VS Code Apps SDK uploads app icons in:

```text
https://github.com/integromat/vscode-apps-sdk
src/commands/AppCommands.js
```

The relevant implementation uses:

```text
PUT /api/v2/sdk/apps/<appName>/<version>/icon
Content-Type: image/png
Authorization: Token <MAKE_API_KEY>
imt-apps-sdk-version: <extension-version>
Body: raw PNG stream
```

Read back a stored icon with:

```text
GET /api/v2/sdk/apps/<appName>/<version>/icon/512
```

Do not upload to `/icon/512`; that path is for readback. Upload to `/icon`.

## Local logo generation/fetch

Use `scripts/fetch-app-logos.sh` to fetch 512x512 PNG logos from `img.logo.dev` based on each app's `metadata.json` `url` domain.

Requirements:

```bash
LOGO_DEV_TOKEN=... ./scripts/fetch-app-logos.sh <app-slug>
```

Or put the token in `.env.local`:

```bash
LOGO_DEV_TOKEN=...
```

Examples:

```bash
./scripts/fetch-app-logos.sh 2captcha ably daytona
APP_LIST="2captcha,ably,daytona" ./scripts/fetch-app-logos.sh
./scripts/fetch-app-logos.sh       # all local app folders
```

The script writes:

```text
apps/<app>/assets/icon.png
```

and verifies it is `PNG image data, 512 x 512`.

## Remote icon upload

Use `scripts/upload-app-icons.sh` after apps have been uploaded and recorded in `generated/make-upload-progress.json`:

```bash
./scripts/upload-app-icons.sh 2captcha ably
./scripts/upload-app-icons.sh      # all apps in progress JSON
```

The script:

1. Reads `generated/make-upload-progress.json`.
2. Uses each app's `zone`, `remoteAppName`, `version`, and local `iconPath`.
3. Verifies the icon is a 512x512 PNG.
4. Uploads using the official VS Code SDK endpoint:
   `PUT /api/v2/sdk/apps/<app>/<version>/icon`.
5. Verifies remote readback via `/icon/512`.

## Full ready-app upload behavior

`scripts/upload-ready-apps.sh` now includes icon handling by default:

1. Ensures `apps/<app>/assets/icon.png` is 512x512 PNG.
2. If `LOGO_DEV_TOKEN` is set and the icon is missing/wrong-sized, fetches a brand logo from `img.logo.dev`.
3. Otherwise resizes an existing PNG to 512x512 as a fallback.
4. Uploads the app objects.
5. Uploads and verifies the icon using the official SDK endpoint.

Disable remote icon upload only for debugging:

```bash
UPLOAD_ICONS=0 ./scripts/upload-ready-apps.sh <app>
```

## Environment variables

`.env.local` may contain:

```bash
MAKE_API_KEY=...
MAKE_ZONE=eu1.make.com
LOGO_DEV_TOKEN=...
MAKE_APPS_SDK_VERSION=2.5.0
UPLOAD_ICONS=1
```

Scripts treat `.env.local` values as defaults. Explicitly exported variables win, so zone-specific retries keep working:

```bash
MAKE_ZONE=we.make.com ./scripts/upload-ready-apps.sh rindegastos
```

## Verification commands

Local icon verification:

```bash
file apps/<app>/assets/icon.png
```

Remote icon readback without exposing the API key in process arguments:

```bash
cfg="$(mktemp)"
printf 'header = "Authorization: Token %s"\n' "${MAKE_API_KEY}" > "$cfg"
printf 'header = "imt-apps-sdk-version: 2.5.0"\n' >> "$cfg"
curl -fsSL --config "$cfg" \
  -o /tmp/icon.png \
  "https://${MAKE_ZONE}/api/v2/sdk/apps/<remote-app>/1/icon/512"
rm -f "$cfg"
file /tmp/icon.png
```

Expected result:

```text
PNG image data, 512 x 512
```
