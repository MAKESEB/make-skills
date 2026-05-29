# Base Configuration (base.imljson)

## Overview

The `base.imljson` file contains global configuration that applies to all API calls in your Make app. This includes base URLs, headers, authentication, error handling, and logging configuration.

## Basic Structure

```json
{
    "baseUrl": "https://api.example.com/v1",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    },
    "response": {
        "error": {
            "message": "[{{statusCode}}] {{body.error.message}}"
        }
    },
    "log": {
        "sanitize": ["request.headers.authorization"]
    }
}
```

## Authentication Patterns

### API Key Authentication
```json
{
    "baseUrl": "https://api.example.com/v1",
    "headers": {
        "Authorization": "Bearer {{connection.apiKey}}",
        "Accept": "application/json"
    }
}
```

### Basic Authentication
```json
{
    "baseUrl": "https://api.example.com/v1",
    "headers": {
        "Authorization": "Basic {{base64(connection.username + ':' + connection.password)}}",
        "Accept": "application/json"
    }
}
```

### OAuth 2.0 Authentication
```json
{
    "baseUrl": "https://api.example.com/v1",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "Accept": "application/json"
    }
}
```

### Custom Authentication Header
```json
{
    "baseUrl": "https://api.example.com/v1",
    "headers": {
        "X-API-Key": "{{connection.apiKey}}",
        "X-Client-ID": "{{connection.clientId}}",
        "Accept": "application/json"
    }
}
```

### Multiple Authentication Methods
```json
{
    "baseUrl": "https://api.example.com/v1",
    "headers": {
        "Authorization": "{{if(connection.authType === 'bearer', 'Bearer ' + connection.accessToken, 'Basic ' + base64(connection.username + ':' + connection.password))}}",
        "Accept": "application/json"
    }
}
```

## Dynamic Base URL Configuration

### Environment-Based URLs
```json
{
    "baseUrl": "https://{{if(connection.environment === 'sandbox', 'sandbox-api', 'api')}}.example.com/v1",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}"
    }
}
```

### Region-Based URLs
```json
{
    "baseUrl": "https://{{connection.region || 'us'}}.api.example.com/v1",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}"
    }
}
```

### Subdomain-Based URLs
```json
{
    "baseUrl": "https://{{connection.subdomain}}.example.com/api/v1",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}"
    }
}
```

## Error Handling Patterns

### Basic Error Handling
```json
{
    "response": {
        "error": {
            "message": "[{{statusCode}}] {{body.error.message || body.message || 'Unknown error'}}"
        }
    }
}
```

### Status Code Specific Errors
```json
{
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
                "message": "[404] Resource not found."
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
    }
}
```

### Complex Error Handling with Conditions
```json
{
    "response": {
        "error": {
            "type": "{{if(body.error.type, body.error.type, 'RuntimeError')}}",
            "message": "{{if(body.error.code, '[' + body.error.code + '] ')}}{{if(body.error.param, 'Parameter: ' + body.error.param + '\\n\\n')}}{{body.error.message}}{{if(body.error.doc_url, '\\n\\nReference: ' + body.error.doc_url)}}",
            "400": {
                "message": "{{if(body.errors, multiErrors(body.errors), body.error.message)}}"
            },
            "422": {
                "message": "{{if(body.errors, multiErrors(body.errors), body.error.message)}}"
            }
        }
    }
}
```

## Logging and Security

### Basic Sanitization
```json
{
    "log": {
        "sanitize": [
            "request.headers.authorization",
            "response.body.access_token",
            "response.body.refresh_token"
        ]
    }
}
```

### Comprehensive Sanitization
```json
{
    "log": {
        "sanitize": [
            "request.headers.authorization",
            "request.body.password",
            "request.body.client_secret",
            "request.body.code",
            "response.body.access_token",
            "response.body.refresh_token",
            "request.body.shared_link.password",
            "request.headers.x-api-key"
        ]
    }
}
```

## Advanced Headers Configuration

### User Agent and Version Headers
```json
{
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Make.com Integration/1.0",
        "X-Client-Version": "1.0.0"
    }
}
```

### Conditional Headers
```json
{
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "Accept": "application/json",
        "Content-Type": "{{if(method === 'GET', 'application/json', 'application/json')}}",
        "X-API-Version": "{{connection.apiVersion || '2023-10-01'}}"
    }
}
```

### Custom Headers for Specific APIs
```json
{
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "Accept": "application/json",
        "X-RateLimit-Limit": "1000",
        "X-Request-ID": "{{uuid()}}",
        "X-Client-Name": "make-integration"
    }
}
```

## Query String Parameters

### Global Query Parameters
```json
{
    "baseUrl": "https://api.example.com/v1",
    "qs": {
        "api_version": "2023-10-01",
        "format": "json"
    }
}
```

### Conditional Query Parameters
```json
{
    "baseUrl": "https://api.example.com/v1",
    "qs": {
        "api_version": "{{connection.apiVersion || '2023-10-01'}}",
        "include_metadata": "{{if(connection.includeMetadata, 'true', undefined)}}"
    }
}
```

## Real-World Examples

### Stripe-like Configuration
```json
{
    "baseUrl": "https://api.stripe.com/v1",
    "headers": {
        "Authorization": "Bearer {{connection.secretKey}}",
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2023-10-16"
    },
    "response": {
        "error": {
            "type": "{{if(body.error.type, body.error.type, 'api_error')}}",
            "message": "{{if(body.error.code, '[' + body.error.code + '] ')}}{{body.error.message}}{{if(body.error.doc_url, '\\n\\nReference: ' + body.error.doc_url)}}",
            "400": {
                "message": "{{if(body.error.param, 'Parameter: ' + body.error.param + '\\n\\n')}}{{body.error.message}}"
            }
        }
    },
    "log": {
        "sanitize": [
            "request.headers.authorization"
        ]
    }
}
```

### HubSpot-like Configuration
```json
{
    "baseUrl": "https://api.hubapi.com",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    },
    "response": {
        "error": {
            "400": {
                "message": "{{if(body.errors, multiErrors(body.errors), body.message)}}"
            },
            "401": {
                "message": "[401] Authentication failed. Please check your access token."
            },
            "403": {
                "message": "[403] Access forbidden. Check your scopes and permissions."
            },
            "message": "[{{statusCode}}] {{body.message || 'Unknown error'}}"
        }
    },
    "log": {
        "sanitize": [
            "request.headers.authorization",
            "response.body.access_token",
            "response.body.refresh_token"
        ]
    }
}
```

### Box-like Configuration
```json
{
    "baseUrl": "https://api.box.com/2.0",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Make.com Box Integration"
    },
    "response": {
        "error": {
            "400": {
                "message": "[400] Bad Request: {{body.message || body.error_description}}"
            },
            "401": {
                "message": "[401] Authentication failed. Token may be expired."
            },
            "403": {
                "message": "[403] Access forbidden. Check your permissions."
            },
            "404": {
                "message": "[404] Resource not found."
            },
            "409": {
                "message": "[409] Conflict: {{body.message}}"
            },
            "429": {
                "type": "RateLimitError",
                "message": "[429] Rate limit exceeded. Please try again later."
            },
            "message": "[{{statusCode}}] {{body.message || body.error_description || 'Unknown error'}}"
        }
    },
    "log": {
        "sanitize": [
            "request.headers.authorization",
            "response.body.access_token",
            "response.body.refresh_token"
        ]
    }
}
```

## Testing and Validation

### Testing Base Configuration
```json
{
    "baseUrl": "https://{{if(connection.environment === 'test', 'test-api', 'api')}}.example.com/v1",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "X-Test-Mode": "{{if(connection.environment === 'test', 'true', 'false')}}"
    }
}
```

## Common Patterns and Best Practices

### 1. Always Include Error Handling

**⚠️ CRITICAL: Use Dynamic Error Handling**

Hardcoding error messages for specific status codes is not ideal. Instead, use dynamic error extraction that returns the actual error code and message from the API response.

```json
// ❌ DON'T: Hardcoded error messages for each status code
{
    "response": {
        "error": {
            "400": {
                "message": "[400] Bad Request: Invalid input data"
            },
            "401": {
                "message": "[401] Authentication failed. Please check your API key."
            },
            "500": {
                "message": "[500] Internal server error. Please try again later."
            },
            "message": "[{{statusCode}}] {{body.error || body.message || 'Unknown error'}}"
        }
    }
}

// ✅ DO: Dynamic error handling that uses actual API responses
{
    "response": {
        "error": {
            "message": "[{{statusCode}}] {{body.error || body.message || 'Unknown error'}}"
        }
    }
}
```

**Why Dynamic is Better:**
- Returns the actual error message from the API
- Provides more accurate and detailed error information
- Easier to maintain - no need to update hardcoded messages
- Adapts to API changes automatically

### 2. Sanitize Sensitive Data
```json
{
    "log": {
        "sanitize": [
            "request.headers.authorization",
            "response.body.access_token",
            "response.body.refresh_token"
        ]
    }
}
```

### 3. Use Fallback Values
```json
{
    "baseUrl": "https://api.example.com/{{connection.apiVersion || 'v1'}}",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}",
        "Accept": "{{connection.acceptType || 'application/json'}}"
    }
}
```

### 4. Support Multiple Environments
```json
{
    "baseUrl": "https://{{if(connection.environment === 'sandbox', 'sandbox-api', 'api')}}.example.com/v1"
}
```

### 5. Include Proper Content Types
```json
{
    "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
}
```

## Common Mistakes to Avoid

1. **Missing Error Handling**: Always include error handling
2. **Hardcoded Values**: Use connection parameters instead
3. **Insecure Logging**: Always sanitize sensitive data
4. **Wrong Content Types**: Match API requirements
5. **Missing Authentication**: Ensure proper auth headers
6. **Invalid JSON**: Validate JSON syntax
7. **Incorrect Variable Names**: Match connection parameter names
8. **Missing Fallbacks**: Provide default values where appropriate