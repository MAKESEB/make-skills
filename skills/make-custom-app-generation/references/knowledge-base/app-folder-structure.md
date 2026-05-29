# Make App Folder Structure

## Standard Structure

Every Make app follows this exact folder structure:

```
your-app-name/
├── assets/
│   └── icon.png                    # App icon (required, 64x64px)
├── base.imljson                     # Global configuration
├── metadata.json                    # App metadata
├── readme.md                        # Optional documentation
├── connections/                     # Authentication configs
│   └── connection-name/
│       ├── api.imljson             # OAuth endpoints
│       ├── metadata.json           # Connection metadata
│       ├── parameters.imljson      # Auth parameters
│       ├── scope.imljson          # OAuth scopes
│       └── scopes.imljson         # Scope definitions
├── modules/                         # App functionality
│   └── module-name/
│       ├── api.imljson             # API call configuration
│       ├── expect.imljson          # Input parameters
│       ├── interface.imljson       # Output structure
│       ├── metadata.json           # Module metadata
│       ├── parameters.imljson      # Parameter processing
│       ├── samples.imljson         # Sample data
│       └── scope.imljson          # Module scopes
├── functions/                       # Custom JavaScript
│   └── function-name/
│       ├── code.js                 # Function implementation
│       └── test.js                 # Unit tests
├── rpcs/                           # Dynamic data (dropdowns)
│   └── rpc-name/
│       ├── api.imljson             # RPC API call
│       ├── metadata.json           # RPC metadata
│       └── parameters.imljson      # RPC parameters
└── webhooks/                       # Webhook configurations
    └── webhook-name/
        ├── api.imljson             # Webhook endpoint
        ├── attach.imljson          # Register webhook
        ├── detach.imljson          # Remove webhook
        ├── metadata.json           # Webhook metadata
        ├── parameters.imljson      # Webhook parameters
        ├── scope.imljson          # Webhook scopes
        └── update.imljson         # Update webhook
```

## File Naming Conventions

### Required Files
- `base.imljson` - Global app configuration
- `metadata.json` - App metadata
- `assets/icon.png` - App icon (64x64px PNG)

### Connection Files
- `connections/[connection-name]/metadata.json` - Connection type and label
- `connections/[connection-name]/parameters.imljson` - Auth parameters
- `connections/[connection-name]/api.imljson` - OAuth endpoints (if OAuth)
- `connections/[connection-name]/scope.imljson` - OAuth scopes (if OAuth)
- `connections/[connection-name]/scopes.imljson` - Scope definitions (if OAuth)

### Module Files
- `modules/[module-name]/metadata.json` - Module type and info
- `modules/[module-name]/api.imljson` - API call configuration
- `modules/[module-name]/expect.imljson` - Input parameters
- `modules/[module-name]/interface.imljson` - Output structure
- `modules/[module-name]/samples.imljson` - Sample response data
- `modules/[module-name]/parameters.imljson` - Parameter processing
- `modules/[module-name]/scope.imljson` - Module-specific scopes

### Function Files
- `functions/[function-name]/code.js` - JavaScript implementation
- `functions/[function-name]/test.js` - Unit tests

### RPC Files
- `rpcs/[rpc-name]/api.imljson` - RPC API call
- `rpcs/[rpc-name]/metadata.json` - RPC metadata
- `rpcs/[rpc-name]/parameters.imljson` - RPC parameters

### Webhook Files
- `webhooks/[webhook-name]/metadata.json` - Webhook metadata
- `webhooks/[webhook-name]/api.imljson` - Webhook endpoint
- `webhooks/[webhook-name]/attach.imljson` - Register webhook
- `webhooks/[webhook-name]/detach.imljson` - Remove webhook
- `webhooks/[webhook-name]/update.imljson` - Update webhook
- `webhooks/[webhook-name]/parameters.imljson` - Webhook parameters
- `webhooks/[webhook-name]/scope.imljson` - Webhook scopes

## Folder Structure Examples

### Simple API Integration
```
simple-api/
├── assets/
│   └── icon.png
├── base.imljson
├── metadata.json
├── connections/
│   └── api-key/
│       ├── metadata.json
│       └── parameters.imljson
└── modules/
    ├── create-record/
    │   ├── api.imljson
    │   ├── expect.imljson
    │   ├── interface.imljson
    │   ├── metadata.json
    │   └── samples.imljson
    └── search-records/
        ├── api.imljson
        ├── expect.imljson
        ├── interface.imljson
        ├── metadata.json
        └── samples.imljson
```

### OAuth App with Webhooks
```
oauth-app/
├── assets/
│   └── icon.png
├── base.imljson
├── metadata.json
├── connections/
│   └── oauth2/
│       ├── api.imljson
│       ├── metadata.json
│       ├── parameters.imljson
│       ├── scope.imljson
│       └── scopes.imljson
├── modules/
│   ├── create-item/
│   │   ├── api.imljson
│   │   ├── expect.imljson
│   │   ├── interface.imljson
│   │   ├── metadata.json
│   │   ├── samples.imljson
│   │   └── scope.imljson
│   └── list-items/
│       ├── api.imljson
│       ├── expect.imljson
│       ├── interface.imljson
│       ├── metadata.json
│       ├── samples.imljson
│       └── scope.imljson
├── rpcs/
│   └── get-categories/
│       ├── api.imljson
│       ├── metadata.json
│       └── scope.imljson
└── webhooks/
    └── item-created/
        ├── api.imljson
        ├── attach.imljson
        ├── detach.imljson
        ├── metadata.json
        ├── parameters.imljson
        └── scope.imljson
```

### Complex App with Functions
```
complex-app/
├── assets/
│   └── icon.png
├── base.imljson
├── metadata.json
├── connections/
│   └── custom-auth/
│       ├── metadata.json
│       └── parameters.imljson
├── modules/
│   ├── process-data/
│   │   ├── api.imljson
│   │   ├── expect.imljson
│   │   ├── interface.imljson
│   │   ├── metadata.json
│   │   ├── parameters.imljson
│   │   └── samples.imljson
│   └── transform-data/
│       ├── api.imljson
│       ├── expect.imljson
│       ├── interface.imljson
│       ├── metadata.json
│       ├── parameters.imljson
│       └── samples.imljson
├── functions/
│   ├── format-date/
│   │   ├── code.js
│   │   └── test.js
│   ├── validate-input/
│   │   ├── code.js
│   │   └── test.js
│   └── transform-object/
│       ├── code.js
│       └── test.js
└── rpcs/
    ├── list-options/
    │   ├── api.imljson
    │   └── metadata.json
    └── get-categories/
        ├── api.imljson
        └── metadata.json
```

## File Extensions

- `.imljson` - Make-specific JSON files (most configuration)
- `.json` - Standard JSON files (metadata)
- `.js` - JavaScript files (functions)
- `.md` - Markdown files (documentation)
- `.png` - PNG images (icon)

## Directory Naming Rules

1. **Lowercase with hyphens**: `create-record`, `list-items`
2. **Descriptive**: Name should indicate functionality
3. **Consistent**: Use same naming pattern throughout app
4. **No spaces**: Use hyphens instead of spaces
5. **No special characters**: Only letters, numbers, and hyphens

## Common Patterns

### Module Naming
- **Actions**: `create-X`, `update-X`, `delete-X`, `upload-X`
- **Triggers**: `watch-X`, `new-X`, `updated-X`
- **Searches**: `search-X`, `list-X`, `find-X`

### Connection Naming
- **API Key**: `api-key`, `token`
- **OAuth**: `oauth2`, `oauth`
- **Basic Auth**: `basic`, `basic-auth`
- **Custom**: `custom-auth`, `custom`

### RPC Naming
- **Lists**: `list-X`, `get-X-list`
- **Options**: `get-X-options`, `X-options`
- **Dependent**: `get-X-by-Y`

### Webhook Naming
- **Create events**: `X-created`, `new-X`
- **Update events**: `X-updated`, `X-changed`
- **Delete events**: `X-deleted`, `X-removed`

## Best Practices

1. **Consistent naming**: Use same pattern across all modules
2. **Clear descriptions**: Module names should be self-explanatory
3. **Logical grouping**: Group related functionality together
4. **Version control**: Keep structure consistent across versions
5. **Documentation**: Include readme.md with app overview

## Required vs Optional Files

### Always Required
- `base.imljson`
- `metadata.json`
- `assets/icon.png`
- At least one connection configuration
- At least one module

### Optional
- `readme.md`
- `functions/` (only if custom logic needed)
- `rpcs/` (only if dynamic data needed)
- `webhooks/` (only for instant triggers)
- `parameters.imljson` (only if parameter processing needed)
- `scope.imljson` (only for OAuth apps)

## Common Mistakes

1. **Missing required files**: Forgetting base.imljson or metadata.json
2. **Wrong file extensions**: Using .json instead of .imljson
3. **Inconsistent naming**: Mixed naming patterns
4. **Missing icon**: Apps need a 64x64px PNG icon
5. **Empty folders**: Don't create empty folders
6. **Case sensitivity**: Use lowercase for all folder names