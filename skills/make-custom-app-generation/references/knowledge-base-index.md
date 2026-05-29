# Make Custom App Knowledge Base Index

The Make custom app knowledge base references from `/Users/s.mertens/Documents/GitHub/App-vibe-coding-make.com/knowledgebase` are bundled, unshortened, in `references/knowledge-base/`, except for source archive and case-study files intentionally removed from this skill.

The remaining 28 source files are preserved at full length. The skill filenames are renamed for readability, and internal cross-references are retargeted to those readable skill filenames. The original source filename is kept in the mapping below so future agents can trace every document back to the source corpus.

## Naming Scheme

| Prefix | Meaning |
|--------|---------|
| `foundation-` | High-level generation rules, overview material, reusable patterns, and troubleshooting. |
| `app-` | Make custom app folder structure, required files, base config, metadata, and app layout. |
| `auth-` | Connection types, auth modeling, and credential handling. |
| `api-` | API request/response, error, and shell-call behavior. |
| `modules-` | Module definitions, parameters, IML, RPCs, webhooks, triggers, searches, and actions. |
| `release-` | Upload, public readiness, icon/logo, and Make SDK release workflow. |
| `api-shells-` | Make API-call shell workflows that support connected code tooling. |

Do not replace these files with summaries, delete additional uncommon files, or shorten copied content. If any file is renamed again, update `SKILL.md`, this index, internal markdown links, package outputs, and repository docs that point at the path.

## Core Build Path

Read these first for most custom app work:

1. `references/knowledge-base/foundation-llm-development-rules.md` - non-negotiable generation rules.
2. `references/knowledge-base/app-folder-structure.md` - local Make app folder layout.
3. `references/knowledge-base/app-essential-files.md` - required app, connection, and module files.
4. `references/knowledge-base/modules-patterns.md` - module type and API section patterns.
5. `references/knowledge-base/modules-parameter-types.md` - expected field types and parameter modeling.
6. `references/knowledge-base/release-connection-upload-learnings.md` - remote connection upload behavior.
7. `references/knowledge-base/release-icon-logo-upload-workflow.md` - logo generation and icon upload.
8. `references/knowledge-base/release-complete-module-public-workflow.md` - public workflow for complete modules.

## Topic Map

| Topic | Read |
|-------|------|
| Start or audit a generator | `references/knowledge-base/foundation-llm-development-rules.md`, `references/knowledge-base/foundation-llm-development-guide.md`, `references/knowledge-base/foundation-common-patterns.md` |
| Understand the app folder contract | `references/knowledge-base/app-folder-structure.md`, `references/knowledge-base/app-essential-files.md`, `references/knowledge-base/app-structure-and-metadata.md` |
| Configure base, metadata, and SDK identity | `references/knowledge-base/app-base-configuration.md`, `references/knowledge-base/app-metadata-configuration.md` |
| Model connections and authentication | `references/knowledge-base/auth-connection-types.md`, `references/knowledge-base/auth-connections-and-authentication.md`, `references/knowledge-base/api-shells-make-connection-request-skill.md` |
| Design API calls and error handling | `references/knowledge-base/api-patterns.md`, `references/knowledge-base/api-communication.md`, `references/knowledge-base/api-error-handling.md`, `references/knowledge-base/foundation-troubleshooting.md` |
| Build actions, searches, triggers, and parameters | `references/knowledge-base/modules-patterns.md`, `references/knowledge-base/modules-actions-triggers-searches.md`, `references/knowledge-base/modules-parameter-types.md`, `references/knowledge-base/modules-parameters-and-user-inputs.md` |
| Use IML and custom functions | `references/knowledge-base/modules-iml-and-custom-functions.md` |
| Add dynamic selectors and OData RPCs | `references/knowledge-base/modules-rpc-patterns.md`, `references/knowledge-base/modules-rpc-odata-patterns.md` |
| Add instant triggers and lifecycle webhooks | `references/knowledge-base/modules-webhooks.md` |
| Upload, publish, and verify the app | `references/knowledge-base/release-connection-upload-learnings.md`, `references/knowledge-base/release-icon-logo-upload-workflow.md`, `references/knowledge-base/release-complete-module-public-workflow.md` |
| Study API shell workflow patterns | `references/knowledge-base/api-shells-generic-api-call-shell-workflow.md`, `references/knowledge-base/api-shells-make-connection-request-skill.md` |

## Complete Source Map

| Skill reference file | Original source file | Purpose |
|----------------------|----------------------|---------|
| `references/knowledge-base/foundation-llm-development-rules.md` | `00-LLM-DEVELOPMENT-RULES.md` | Non-negotiable rules for generating real, uploadable Make apps. |
| `references/knowledge-base/foundation-overview.md` | `01-OVERVIEW.md` | Knowledge-base overview and conceptual entry point. |
| `references/knowledge-base/foundation-llm-development-guide.md` | `19-LLM-DEVELOPMENT-GUIDE.md` | Full LLM development workflow guidance. |
| `references/knowledge-base/foundation-common-patterns.md` | `20-COMMON-PATTERNS.md` | Common reusable SDK app patterns. |
| `references/knowledge-base/foundation-troubleshooting.md` | `21-TROUBLESHOOTING.md` | Debugging guidance for app generation and SDK issues. |
| `references/knowledge-base/app-folder-structure.md` | `02-FOLDER-STRUCTURE.md` | Required custom app directory layout. |
| `references/knowledge-base/app-essential-files.md` | `03-ESSENTIAL-FILES.md` | Required app, connection, module, and supporting files. |
| `references/knowledge-base/app-base-configuration.md` | `04-BASE-CONFIG.md` | `base.imljson` patterns and app-level request behavior. |
| `references/knowledge-base/app-metadata-configuration.md` | `05-METADATA-CONFIG.md` | SDK app metadata patterns. |
| `references/knowledge-base/app-structure-and-metadata.md` | `app structure and metadata.md` | Additional app layout and metadata details. |
| `references/knowledge-base/auth-connection-types.md` | `06-CONNECTION-TYPES.md` | Supported connection/auth categories. |
| `references/knowledge-base/auth-connections-and-authentication.md` | `connections and authentication.md` | Connection parameter and authentication design details. |
| `references/knowledge-base/api-patterns.md` | `15-API-PATTERNS.md` | Request construction and API pattern catalog. |
| `references/knowledge-base/api-communication.md` | `api communication.md` | API communication semantics and examples. |
| `references/knowledge-base/api-error-handling.md` | `error handling.md` | Error response handling and reporting patterns. |
| `references/knowledge-base/modules-patterns.md` | `07-MODULE-PATTERNS.md` | Module API, type, and section patterns. |
| `references/knowledge-base/modules-parameter-types.md` | `08-PARAMETER-TYPES.md` | Make parameter/input type reference. |
| `references/knowledge-base/modules-actions-triggers-searches.md` | `modules actions triggers searches.md` | Actions, searches, and trigger module design. |
| `references/knowledge-base/modules-parameters-and-user-inputs.md` | `parameters and user inputs.md` | User-facing parameters, filters, and input modeling. |
| `references/knowledge-base/modules-iml-and-custom-functions.md` | `iml and custom functions.md` | IML usage and custom function guidance. |
| `references/knowledge-base/modules-rpc-patterns.md` | `remote procedure calls rpcs.md` | RPC-backed dynamic selector patterns. |
| `references/knowledge-base/modules-rpc-odata-patterns.md` | `remote procedure calls rpcs1.md` | OData/RPC-specific selector patterns. |
| `references/knowledge-base/modules-webhooks.md` | `webhooks.md` | Webhook lifecycle and instant trigger guidance. |
| `references/knowledge-base/release-connection-upload-learnings.md` | `22-CONNECTION-UPLOAD-LEARNINGS.md` | Make SDK connection upload behavior and gotchas. |
| `references/knowledge-base/release-icon-logo-upload-workflow.md` | `26-APP-ICON-LOGO-UPLOAD-WORKFLOW.md` | 512x512 icon generation, upload, and readback workflow. |
| `references/knowledge-base/release-complete-module-public-workflow.md` | `27-COMPLETE-APP-MODULE-PUBLIC-WORKFLOW.md` | Complete public-ready module workflow. |
| `references/knowledge-base/api-shells-make-connection-request-skill.md` | `make-connection-request.SKILL (1).md` | Credential request workflow used by Make API shells. |
| `references/knowledge-base/api-shells-generic-api-call-shell-workflow.md` | `make-generic-api-call-shell-workflow (1).md` | Generic Make API-call shell workflow. |
