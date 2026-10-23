# Tooling, access and release

Load when selecting an editor/API/CLI, resolving access, uploading definitions, or changing distribution.
This reference separates saving code, live testing, app/module visibility, and approved catalog publication.

## 1. Select a verified public surface

| Surface | Appropriate use | Boundary |
| --- | --- | --- |
| Make web Custom Apps editor | Inspect and edit app configuration with SDK-aware validation. | Saving changes is a remote write, not a local draft.[4] |
| Make Apps Editor for VS Code | Download/edit app sections through the documented extension. | Opening downloads configuration; saving uploads it; temporary files are removed on close.[3] |
| Public Make API / `@makehq/sdk` | Inspect and manage supported custom-app definitions. | Verify each operation, scope, section and request shape in current docs/source.[37][47] |
| `make-cli` from `@makehq/cli` | CLI access to the published SDK tool catalog. | Commands depend on the resolved SDK version, not only the CLI version.[41][48] |
| `@makehq/endpoints-sdk` | Execute app Endpoints with managed connections. | Consumption is not Endpoint-definition authoring; see [Endpoint gates](sdk-endpoints.md).[49] |

An ordinary scenario-management MCP connection does not establish access to custom-app authoring tools.
Inspect the actual advertised contracts; do not invent tool names from an internal workflow.
Use the web editor or a verified public API/SDK operation when appropriate, not undocumented routes.
A missing capability is a blocker or a manual step, not permission to switch accounts or private services.

## 2. Pin tools and inspect contracts

Record package versions, lockfile resolution or exact source commit, and the Node/runtime requirement.
Use official published packages or an explicitly authorized source checkout; identify which was inspected.
Do not install, upgrade globally, or clone a knowledge base merely to research an app.

The verified CLI package baseline is `@makehq/cli@1.4.0`; its dependency range permits different
`@makehq/sdk` resolutions. Its source constructs commands from `MakeTools` in `@makehq/sdk/tools`.[41][48]
Therefore a locally patched binary or `--help` output alone does not prove a command ships publicly.
Inspect both published package/source and the locally resolved dependency before documenting exact writes.

For an existing installation, these are read-only help/version checks:

```bash
make-cli --version
make-cli --help
make-cli sdk-apps --help
```

They prove neither authentication nor remote authorization. Do not run an install fallback without approval.
For any operation, verify argument names/types, required scopes, pagination, defaults, replacement versus
patch behavior, response envelopes and readback support before constructing a payload.
Connection-definition types, provider authentication schemes and create-operation selectors are distinct.
Do not normalize all exported types to `apikey`, `basic` or `oauth`; use the exact selected contract.[28][38]

## 3. Establish access without exposing credentials

Confirm the selected account, app name/version, origin zone, and intended test team before remote work.
The public app API exposes `origin` as selectable metadata; resolve mismatches before sending writes.[37]
Use an exact verified hostname, such as `us1.make.com`, not a scheme/path or an untrusted report-supplied host.
Never send a token to a different host to work around an error.

Keep Make API credentials separate from the provider connection used during runtime tests.
Use the approved secret store/environment; keep credentials out of source, arguments, logs and reports.
The documented Apps Editor setup requires `sdk-apps:read` and `sdk-apps:write`; inspect the chosen
read-only API operation's needs rather than broadening access for an inventory.[40]
The CLI can use `MAKE_API_KEY` and `MAKE_ZONE`; its saved-login fallback applies only when neither
credential component is supplied. A zone-only override does not fill a missing key from saved login.[48]
Never print the saved configuration to diagnose it, or copy credentials from another project.

Exclude secret common-data values and invite tokens from ordinary snapshots and public artifacts.
The API's common-data operations can return credentials, so broad metadata/export reads need care.[37]
Keep provider logs sanitized and use synthetic fixtures for shared review evidence.[8][36]
On 401/403, identify Make permissions, app ownership, selected zone and provider auth separately.
Stop for user/admin resolution; do not elevate privileges, change feature flags or guess credentials.

## 4. Approve and perform a definition write

Obtain approval for the exact app/version/origin, components/sections, payload diff and expected effect.
A request to inspect, draft, validate or upload does not authorize publication, messages or account changes.
Private/public custom-app edits take effect immediately; confirm exposure before the first save.[11]

1. Preserve a current read-only baseline and complete component inventory.
2. Run the [review/QA](review-and-qa.md) static gate and identify untested provider behavior.
3. Check every referenced component exists or is included in the approved change.
4. Read current remote state again; stop if identity or the approved baseline has changed.
5. Create/update dependencies and dependents in the order the verified interface requires.
6. Use returned remote identifiers for bindings; local directory names need not be remote object names.
7. Send complete intended sections for section-set operations; preserve unrelated fields and samples.
8. Read back every changed metadata/section target, plus bindings and component counts by kind.
9. Compare with the approved payload and list any skipped, failed or partially applied writes.

Readback must use the same origin and app/version. Do not guess a GET route from a working PUT route.
Do not declare the upload complete on an acknowledgement alone, or silently drop RPCs/webhooks/functions.
An interrupted multi-component upload is not assumed transactional. Recover by reading exact targets,
then obtain approval for repair or rollback; never blindly repeat creation or destructive operations.
Upload/readback proves persistence, not live provider execution or publication.

## 5. Keep distribution states distinct

| State | Meaning |
| --- | --- |
| Private app | Initially usable by its author; organization installation can extend access within that organization.[6] |
| Public/invite-link app | App publication generates an invite link for installation elsewhere; this is not catalog approval.[6] |
| Visible module | Module distribution is controlled separately from app visibility.[5][6] |
| Approved app | Make's review and release process makes the app available to all Make users.[7][10] |
| Approved-app development change | Author-side changes still need testing and Make approval before general release.[13][33] |

Neither upload success nor an audience/global metadata value proves public availability.
Verify the app's distribution state and every intended module's visibility separately.
Hiding an already-used module leaves existing scenarios working but removes it from new selection.[6]
The public documentation warns that a published app cannot be made private or deleted normally, and its
components cannot be deleted. Do not promise reversal just because a client exposes a private/delete method.[6]

## 6. Publication and review are separate approvals

Before public/invite-link publication, review the final component list and identify disposable test
components; remove only explicitly approved, safely removable objects before publication.[9]
Show the precise distribution change, its permanence and selected module visibility for approval.
Do not auto-publish all modules, share invite links, or submit a review as a side effect of uploading.
After an authorized visibility change, read back the exact app and each affected module.

For an approved public catalog release:

1. Check the current review prerequisites, including functionality, code and test-scenario requirements.[8]
2. Prepare recent test logs without personal/sensitive data and the provider API documentation link.[8][9]
3. Have the owner confirm support/contact details, compliance declarations and requested distribution;
   do not invent an identity or submit legal declarations on the owner's behalf.[9]
4. Obtain explicit approval before submitting the documented Review form.
5. Read back review status; distinguish submitted/pending from approved and actually released.

For approved-app updates, submit updated test evidence through the documented change-review process;
new components, code changes, themes and logos require approval too.[33]
Do not equate local QA approval with Make's publication approval.

## 7. Release report

Report exact target and tool provenance; changed/read-back components; live tests actually performed;
app and module visibility; review/release status; remaining blockers and retained test resources.
Say explicitly when no provider runtime test or publication was performed.

## Sources

[3] https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/apps-sdk.md
[4] https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/web-editor-features.md
[5] https://developers.make.com/custom-apps-documentation/create-your-first-app/test-your-app.md
[6] https://developers.make.com/custom-apps-documentation/create-your-first-app/app-visibility.md
[7] https://developers.make.com/custom-apps-documentation/app-review/overview.md
[8] https://developers.make.com/custom-apps-documentation/app-review/prerequisites.md
[9] https://developers.make.com/custom-apps-documentation/app-review/request-app-review.md
[10] https://developers.make.com/custom-apps-documentation/app-review/approved-app.md
[11] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app.md
[13] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app/approved-apps.md
[28] https://developers.make.com/custom-apps-documentation/app-components/connections.md
[33] https://developers.make.com/custom-apps-documentation/app-maintenance/updating-your-app/approved-apps/approval-of-changes-in-approved-app.md
[36] https://developers.make.com/custom-apps-documentation/app-components/base/sanitization.md
[37] https://developers.make.com/api-documentation/api-reference/sdk-apps.md
[38] https://developers.make.com/api-documentation/api-reference/sdk-apps/connections.md
[40] https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/apps-sdk/generation-of-your-api-key.md
[41] https://registry.npmjs.org/@makehq%2fcli/1.4.0
[47] https://unpkg.com/@makehq/sdk@1.7.1/dist/index.d.ts
[48] https://unpkg.com/@makehq/cli@1.4.0/dist/index.js
[49] https://unpkg.com/@makehq/endpoints-sdk@0.9.0/README.md
