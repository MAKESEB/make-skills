# Connection Types and Authentication

## Overview

Connections define how your Make app authenticates with the target API. Each connection type has specific configuration requirements and use cases.

## Connection Types

1. **API Key** - Simple token-based authentication
2. **OAuth 2.0** - Industry standard for secure authorization
3. **Basic Auth** - Username/password authentication
4. **Custom** - Custom authentication schemes
5. **No Auth** - Public APIs with no authentication

⚠️ **Critical Connection Upload Issues**: Connection creation and parameter upload via SDK has known limitations. See [release-connection-upload-learnings.md](release-connection-upload-learnings.md) for comprehensive troubleshooting, including 404 errors, type mapping bugs, and manual workarounds.

## API Key Authentication

### Simple API Key
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

## Critical Connection Validation Rules

⚠️ **IMPORTANT**: Never use example domains or generic endpoints for connection validation. Always use the actual API's authentication endpoint.

### Common Mistakes to Avoid
```json
// ❌ WRONG - Generic example that will fail
{
    "url": "https://www.example.com/api/whoami",
    "method": "GET"
}

// ❌ WRONG - Non-existent endpoint
{
    "url": "/whoami",
    "method": "GET"
}

// ✅ CORRECT - Use actual API authentication endpoint
{
    "url": "/token",
    "method": "POST",
    "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    "body": {
        "form": {
            "username": "{{parameters.username}}",
            "password": "{{parameters.password}}",
            "grant_type": "password"
        }
    }
}
```

### Real API Examples
```json
// OpenAI API
{
    "url": "https://api.openai.com/v1/models",
    "method": "GET",
    "headers": {
        "Authorization": "Bearer {{parameters.apiKey}}"
    }
}

// GitHub API
{
    "url": "https://api.github.com/user",
    "method": "GET",
    "headers": {
        "Authorization": "Bearer {{parameters.token}}"
    }
}

// Stripe API
{
    "url": "https://api.stripe.com/v1/account",
    "method": "GET",
    "headers": {
        "Authorization": "Bearer {{parameters.apiKey}}"
    }
}
```

### API Key with Environment
```json
// connections/api-key/parameters.imljson
[
    {
        "name": "apiKey",
        "type": "password",
        "label": "API Key",
        "required": true,
        "help": "Enter your API key"
    },
    {
        "name": "environment",
        "type": "select",
        "label": "Environment",
        "required": true,
        "default": "production",
        "options": [
            {
                "label": "Production",
                "value": "production"
            },
            {
                "label": "Sandbox",
                "value": "sandbox"
            }
        ]
    }
]
```

### API Key with Custom Headers
```json
// connections/custom-api-key/parameters.imljson
[
    {
        "name": "apiKey",
        "type": "password",
        "label": "API Key",
        "required": true
    },
    {
        "name": "clientId",
        "type": "text",
        "label": "Client ID",
        "required": true
    }
]
```

## OAuth 2.0 Authentication

### Basic OAuth 2.0
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
        "url": "https://accounts.service.com/oauth/authorize",
        "qs": {
            "client_id": "{{parameters.clientId}}",
            "redirect_uri": "{{oauth.redirectUri}}",
            "response_type": "code",
            "scope": "{{join(scopes, ' ')}}"
        }
    },
    "token": {
        "url": "https://accounts.service.com/oauth/token",
        "method": "POST",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "body": {
            "code": "{{query.code}}",
            "grant_type": "authorization_code",
            "client_id": "{{parameters.clientId}}",
            "client_secret": "{{parameters.clientSecret}}",
            "redirect_uri": "{{oauth.redirectUri}}"
        },
        "response": {
            "data": {
                "accessToken": "{{body.access_token}}",
                "refreshToken": "{{body.refresh_token}}",
                "expires": "{{addSeconds(now, body.expires_in)}}"
            }
        }
    },
    "refresh": {
        "url": "https://accounts.service.com/oauth/token",
        "method": "POST",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "body": {
            "grant_type": "refresh_token",
            "refresh_token": "{{data.refreshToken}}",
            "client_id": "{{parameters.clientId}}",
            "client_secret": "{{parameters.clientSecret}}"
        },
        "response": {
            "data": {
                "accessToken": "{{body.access_token}}",
                "refreshToken": "{{body.refresh_token}}",
                "expires": "{{addSeconds(now, body.expires_in)}}"
            }
        }
    }
}

// connections/oauth/parameters.imljson
[
    {
        "name": "clientId",
        "type": "text",
        "label": "Client ID",
        "required": true
    },
    {
        "name": "clientSecret",
        "type": "password",
        "label": "Client Secret",
        "required": true
    }
]
```

### OAuth with Scopes
```json
// connections/oauth/scopes.imljson
[
    {
        "name": "read",
        "label": "Read access"
    },
    {
        "name": "write",
        "label": "Write access"
    },
    {
        "name": "admin",
        "label": "Admin access"
    }
]

// connections/oauth/scope.imljson
[
    "read",
    "write"
]
```

### OAuth with PKCE
```json
// connections/oauth-pkce/api.imljson
{
    "authorize": {
        "url": "https://accounts.service.com/oauth/authorize",
        "qs": {
            "client_id": "{{parameters.clientId}}",
            "redirect_uri": "{{oauth.redirectUri}}",
            "response_type": "code",
            "scope": "{{join(scopes, ' ')}}",
            "code_challenge": "{{oauth.codeChallenge}}",
            "code_challenge_method": "S256"
        }
    },
    "token": {
        "url": "https://accounts.service.com/oauth/token",
        "method": "POST",
        "body": {
            "code": "{{query.code}}",
            "grant_type": "authorization_code",
            "client_id": "{{parameters.clientId}}",
            "redirect_uri": "{{oauth.redirectUri}}",
            "code_verifier": "{{oauth.codeVerifier}}"
        }
    }
}
```

## Basic Authentication

### Username/Password
```json
// connections/basic/metadata.json
{
    "name": "basic",
    "label": "Basic Authentication",
    "type": "basic"
}

// connections/basic/parameters.imljson
[
    {
        "name": "username",
        "type": "text",
        "label": "Username",
        "required": true
    },
    {
        "name": "password",
        "type": "password",
        "label": "Password",
        "required": true
    }
]
```

### Basic Auth with Domain
```json
// connections/basic-domain/parameters.imljson
[
    {
        "name": "domain",
        "type": "text",
        "label": "Domain",
        "required": true,
        "help": "Enter your organization domain (e.g., company.com)"
    },
    {
        "name": "username",
        "type": "text",
        "label": "Username",
        "required": true
    },
    {
        "name": "password",
        "type": "password",
        "label": "Password",
        "required": true
    }
]
```

## Custom Authentication

### Custom Headers
```json
// connections/custom/metadata.json
{
    "name": "custom",
    "label": "Custom Authentication",
    "type": "custom"
}

// connections/custom/parameters.imljson
[
    {
        "name": "apiKey",
        "type": "password",
        "label": "API Key",
        "required": true
    },
    {
        "name": "clientId",
        "type": "text",
        "label": "Client ID",
        "required": true
    },
    {
        "name": "signature",
        "type": "password",
        "label": "Signature",
        "required": true
    }
]
```

### JWT Token Authentication
```json
// connections/jwt/parameters.imljson
[
    {
        "name": "privateKey",
        "type": "password",
        "label": "Private Key",
        "required": true,
        "help": "Enter your RSA private key in PEM format"
    },
    {
        "name": "keyId",
        "type": "text",
        "label": "Key ID",
        "required": true
    },
    {
        "name": "issuer",
        "type": "text",
        "label": "Issuer",
        "required": true
    }
]
```

## Real-World Examples

### Stripe Connection
```json
// connections/stripe/metadata.json
{
    "name": "stripe",
    "label": "Stripe",
    "type": "api-key"
}

// connections/stripe/parameters.imljson
[
    {
        "name": "secretKey",
        "type": "password",
        "label": "Secret Key",
        "required": true,
        "help": "Enter your Stripe secret key (starts with sk_)"
    },
    {
        "name": "webhookEndpointSecret",
        "type": "password",
        "label": "Webhook Endpoint Secret",
        "required": false,
        "help": "Enter webhook endpoint secret for signature verification"
    }
]
```

### HubSpot OAuth Connection
```json
// connections/hubspot/metadata.json
{
    "name": "hubspot",
    "label": "HubSpot",
    "type": "oauth2"
}

// connections/hubspot/api.imljson
{
    "authorize": {
        "url": "https://app.hubspot.com/oauth/authorize",
        "qs": {
            "client_id": "{{parameters.clientId}}",
            "redirect_uri": "{{oauth.redirectUri}}",
            "response_type": "code",
            "scope": "{{join(scopes, ' ')}}",
            "state": "{{oauth.state}}"
        }
    },
    "token": {
        "url": "https://api.hubapi.com/oauth/v1/token",
        "method": "POST",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "body": {
            "grant_type": "authorization_code",
            "client_id": "{{parameters.clientId}}",
            "client_secret": "{{parameters.clientSecret}}",
            "redirect_uri": "{{oauth.redirectUri}}",
            "code": "{{query.code}}"
        },
        "response": {
            "data": {
                "accessToken": "{{body.access_token}}",
                "refreshToken": "{{body.refresh_token}}",
                "expires": "{{addSeconds(now, body.expires_in)}}"
            }
        }
    }
}

// connections/hubspot/scopes.imljson
[
    {
        "name": "contacts",
        "label": "Contacts"
    },
    {
        "name": "content",
        "label": "Content"
    },
    {
        "name": "reports",
        "label": "Reports"
    },
    {
        "name": "social",
        "label": "Social Media"
    },
    {
        "name": "automation",
        "label": "Marketing Automation"
    }
]
```

### Salesforce OAuth Connection
```json
// connections/salesforce/api.imljson
{
    "authorize": {
        "url": "https://{{ifempty(parameters.domain, 'login')}}.salesforce.com/services/oauth2/authorize",
        "qs": {
            "response_type": "code",
            "client_id": "{{parameters.clientId}}",
            "redirect_uri": "{{oauth.redirectUri}}",
            "scope": "{{join(scopes, ' ')}}",
            "state": "{{oauth.state}}"
        }
    },
    "token": {
        "url": "https://{{ifempty(parameters.domain, 'login')}}.salesforce.com/services/oauth2/token",
        "method": "POST",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "body": {
            "grant_type": "authorization_code",
            "client_id": "{{parameters.clientId}}",
            "client_secret": "{{parameters.clientSecret}}",
            "redirect_uri": "{{oauth.redirectUri}}",
            "code": "{{query.code}}"
        }
    }
}

// connections/salesforce/parameters.imljson
[
    {
        "name": "clientId",
        "type": "text",
        "label": "Client ID",
        "required": true
    },
    {
        "name": "clientSecret",
        "type": "password",
        "label": "Client Secret",
        "required": true
    },
    {
        "name": "domain",
        "type": "text",
        "label": "Domain",
        "required": false,
        "help": "Leave empty for production, use 'test' for sandbox"
    }
]
```

## Connection Testing

### Test Connection Function
```javascript
// functions/test-connection/code.js
function testConnection(connection) {
    const headers = {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Accept': 'application/json'
    };
    
    return fetch('https://api.service.com/user', {
        method: 'GET',
        headers: headers
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        return {
            success: true,
            message: `Connected successfully as ${data.name}`,
            data: data
        };
    })
    .catch(error => {
        return {
            success: false,
            message: `Connection failed: ${error.message}`
        };
    });
}
```

## Advanced OAuth Patterns

### OAuth with Refresh Token Rotation
```json
{
    "refresh": {
        "condition": "{{data.expires < addMinutes(now, 5)}}",
        "url": "https://accounts.service.com/oauth/token",
        "method": "POST",
        "body": {
            "grant_type": "refresh_token",
            "refresh_token": "{{data.refreshToken}}",
            "client_id": "{{parameters.clientId}}",
            "client_secret": "{{parameters.clientSecret}}"
        },
        "response": {
            "data": {
                "accessToken": "{{body.access_token}}",
                "refreshToken": "{{body.refresh_token || data.refreshToken}}",
                "expires": "{{addSeconds(now, body.expires_in)}}"
            }
        }
    }
}
```

### OAuth with Multiple Scopes
```json
// connections/oauth/scopes.imljson
[
    {
        "name": "read:user",
        "label": "Read user profile"
    },
    {
        "name": "read:contacts",
        "label": "Read contacts"
    },
    {
        "name": "write:contacts",
        "label": "Write contacts"
    },
    {
        "name": "read:companies",
        "label": "Read companies"
    },
    {
        "name": "write:companies",
        "label": "Write companies"
    }
]
```

## Connection Parameter Types

### Text Input
```json
{
    "name": "username",
    "type": "text",
    "label": "Username",
    "required": true,
    "help": "Enter your username"
}
```

### Password Input
```json
{
    "name": "password",
    "type": "password",
    "label": "Password",
    "required": true,
    "help": "Enter your password"
}
```

### Select Dropdown
```json
{
    "name": "environment",
    "type": "select",
    "label": "Environment",
    "required": true,
    "default": "production",
    "options": [
        {
            "label": "Production",
            "value": "production"
        },
        {
            "label": "Sandbox",
            "value": "sandbox"
        }
    ]
}
```

### Boolean Checkbox
```json
{
    "name": "useSSL",
    "type": "boolean",
    "label": "Use SSL",
    "default": true,
    "help": "Enable SSL encryption"
}
```

### Number Input
```json
{
    "name": "timeout",
    "type": "number",
    "label": "Timeout (seconds)",
    "default": 30,
    "minimum": 1,
    "maximum": 300
}
```

## Best Practices

1. **Use Appropriate Types**: Choose the right connection type for your API
2. **Secure Storage**: Use password type for sensitive data
3. **Clear Labels**: Provide descriptive labels and help text
4. **Test Connections**: Always include connection testing
5. **Handle Errors**: Implement proper error handling for auth failures
6. **Scope Management**: Use minimal required scopes for OAuth
7. **Token Refresh**: Implement automatic token refresh for OAuth
8. **Validation**: Validate connection parameters before use
9. **Documentation**: Document connection setup process
10. **Security**: Never log sensitive authentication data

## Common Mistakes

1. **Wrong Connection Type**: Using OAuth for simple API key auth
2. **Missing Parameters**: Not including required connection parameters
3. **Insecure Logging**: Logging sensitive authentication data
4. **No Error Handling**: Not handling authentication errors
5. **Hardcoded Values**: Using hardcoded credentials instead of parameters
6. **Excessive Scopes**: Requesting more permissions than needed
7. **No Refresh Logic**: Not implementing token refresh for OAuth
8. **Invalid URLs**: Using incorrect OAuth URLs
9. **Missing Validation**: Not validating connection parameters
10. **Poor UX**: Confusing labels or missing help text