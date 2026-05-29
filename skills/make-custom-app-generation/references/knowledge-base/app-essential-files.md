# Essential Files for Make Apps

## Required Files Overview

Every Make app must have these essential files to function properly:

1. **base.imljson** - Global app configuration
2. **metadata.json** - App metadata and settings
3. **assets/icon.png** - App icon (64x64px)
4. **At least one connection** - Authentication configuration
5. **At least one module** - App functionality

## base.imljson - Global Configuration

This file contains global settings that apply to all API calls in your app.

### Basic API Configuration
```json
{
    "baseUrl": "https://api.example.com/v1",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
}
```

### Advanced Configuration with Error Handling
```json
{
    "baseUrl": "https://api.example.com/v1",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Make.com Integration/1.0"
    },
    "response": {
        "error": {
            "400": {
                "message": "[400] Bad Request: {{body.error.message}}"
            },
            "401": {
                "message": "[401] Authentication failed. Please check your credentials."
            },
            "403": {
                "message": "[403] Access forbidden. Check your permissions."
            },
            "404": {
                "message": "[404] Resource not found: {{body.error.message}}"
            },
            "429": {
                "type": "RateLimitError",
                "message": "[429] Rate limit exceeded. Please try again in {{body.retry_after}} seconds."
            },
            "500": {
                "message": "[500] Internal server error. Please try again later."
            },
            "message": "[{{statusCode}}] {{body.error.message || body.message || 'Unknown error'}}"
        }
    },
    "log": {
        "sanitize": [
            "request.headers.authorization",
            "request.body.password",
            "response.body.access_token",
            "response.body.refresh_token"
        ]
    }
}
```

### Dynamic Base URL Configuration
```json
{
    "baseUrl": "https://{{if(connection.environment === 'sandbox', 'sandbox-api', 'api')}}.example.com/v1",
    "headers": {
        "Authorization": "{{if(connection.authType === 'apiKey', 'Bearer ' + connection.apiKey, 'Basic ' + base64(connection.username + ':' + connection.password))}}",
        "Accept": "application/json"
    }
}
```

## metadata.json - App Metadata

This file contains basic information about your app.

### Basic Metadata
```json
{
    "name": "example-app",
    "label": "Example App",
    "description": "Integration with Example API for managing resources",
    "version": 1,
    "author": "Your Name",
    "url": "https://example.com",
    "theme": "#667eea",
    "language": "en",
    "countries": null,
    "audience": "global"
}
```

### Advanced Metadata with Regions
```json
{
    "name": "advanced-app",
    "label": "Advanced App",
    "description": "Advanced integration with comprehensive features",
    "version": 2,
    "author": "Your Company",
    "url": "https://yourcompany.com",
    "theme": "#2563eb",
    "language": "en",
    "countries": ["US", "CA", "GB", "AU"],
    "audience": "global",
    "tags": ["productivity", "automation", "api"]
}
```

## Connection Configuration

Every app needs at least one connection for authentication.

### API Key Connection
```json
// connections/api-key/metadata.json
{
    "name": "api-key",
    "label": "API Key",
    "type": "api-key"
}

// connections/api-key/parameters.imljson
[
    {
        "name": "apiKey",
        "type": "password",
        "label": "API Key",
        "required": true,
        "help": "Enter your API key from the service dashboard"
    }
]
```

### OAuth Connection
```json
// connections/oauth/metadata.json
{
    "name": "oauth",
    "label": "OAuth 2.0",
    "type": "oauth2"
}

// connections/oauth/api.imljson
{
    "authorize": {
        "url": "https://example.com/oauth/authorize",
        "qs": {
            "client_id": "{{parameters.clientId}}",
            "redirect_uri": "{{oauth.redirectUri}}",
            "response_type": "code",
            "scope": "read write"
        }
    },
    "token": {
        "url": "https://example.com/oauth/token",
        "method": "POST",
        "body": {
            "code": "{{query.code}}",
            "grant_type": "authorization_code",
            "client_id": "{{parameters.clientId}}",
            "client_secret": "{{parameters.clientSecret}}",
            "redirect_uri": "{{oauth.redirectUri}}"
        }
    }
}
```

## Module Configuration

Every app needs at least one module to provide functionality.

### Basic Action Module
```json
// modules/create-item/metadata.json
{
    "name": "create-item",
    "label": "Create Item",
    "description": "Creates a new item in the system",
    "connection": "api-key",
    "type": "action"
}

// modules/create-item/api.imljson
{
    "url": "/items",
    "method": "POST",
    "body": {
        "name": "{{parameters.name}}",
        "description": "{{parameters.description}}",
        "category": "{{parameters.category}}"
    },
    "response": {
        "output": "{{body.data}}"
    }
}

// modules/create-item/expect.imljson
[
    {
        "name": "name",
        "type": "text",
        "label": "Name",
        "required": true
    },
    {
        "name": "description",
        "type": "text",
        "label": "Description"
    },
    {
        "name": "category",
        "type": "select",
        "label": "Category",
        "options": "rpc://getCategories"
    }
]

// modules/create-item/interface.imljson
[
    {
        "name": "id",
        "type": "text",
        "label": "ID"
    },
    {
        "name": "name",
        "type": "text",
        "label": "Name"
    },
    {
        "name": "description",
        "type": "text",
        "label": "Description"
    },
    {
        "name": "createdAt",
        "type": "date",
        "label": "Created At"
    }
]
```

## Icon Requirements

The app icon must be:
- **Format**: PNG
- **Size**: 512x512 pixels for remote SDK icon upload
- **Location**: `assets/icon.png`
- **Design**: Clear, simple, recognizable
- **Colors**: Match your brand/service

See `references/knowledge-base/release-icon-logo-upload-workflow.md` for logo.dev fetching and the official VS Code Apps SDK icon upload endpoint.

## File Validation Checklist

### Required Files
- [ ] `base.imljson` exists and has valid JSON
- [ ] `metadata.json` exists with required fields
- [ ] `assets/icon.png` exists and is a 512x512 PNG
- [ ] At least one connection folder exists
- [ ] At least one module folder exists

### Connection Validation
- [ ] Connection has `metadata.json` with name, label, type
- [ ] Connection has `parameters.imljson` if parameters needed
- [ ] OAuth connections have `api.imljson` with authorize/token URLs
- [ ] Connection type matches authentication method

### Module Validation
- [ ] Module has `metadata.json` with name, label, description, type
- [ ] Module has `api.imljson` with URL and method
- [ ] Module has `expect.imljson` for input parameters
- [ ] Module has `interface.imljson` for output structure
- [ ] Module connection matches existing connection name

## Common File Errors

### Invalid JSON
```json
// ❌ Wrong - missing quotes
{
    name: "test",
    value: 123
}

// ✅ Correct - proper JSON
{
    "name": "test",
    "value": 123
}
```

### Missing Required Fields
```json
// ❌ Wrong - missing required metadata
{
    "name": "test-app"
}

// ✅ Correct - all required fields
{
    "name": "test-app",
    "label": "Test App",
    "description": "A test application",
    "version": 1,
    "author": "Developer",
    "url": "https://example.com",
    "theme": "#667eea",
    "language": "en",
    "audience": "global"
}
```

### Incorrect File Extensions
```
❌ Wrong extensions:
- base.json (should be base.imljson)
- api.json (should be api.imljson)
- expect.json (should be expect.imljson)

✅ Correct extensions:
- base.imljson
- api.imljson
- expect.imljson
- metadata.json
```

## Best Practices

1. **Start Simple**: Begin with basic configurations, add complexity gradually
2. **Test Incrementally**: Test each file as you create it
3. **Use Consistent Naming**: Follow naming conventions across all files
4. **Include Error Handling**: Always include error handling in base.imljson
5. **Sanitize Logs**: Always sanitize sensitive data in logs
6. **Document Everything**: Use clear labels and descriptions
7. **Version Control**: Track changes to all configuration files
8. **Validate JSON**: Use JSON validators to check syntax
9. **Test Connections**: Verify authentication works before building modules
10. **Plan Structure**: Design your app structure before creating files
