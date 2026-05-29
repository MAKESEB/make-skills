# 🤖 LLM Development Rules for Make.com Apps

## ⚠️ CRITICAL: Never Use Example Data

**THE #1 RULE FOR LLM DEVELOPERS**: Always replace ALL example data with real API-specific data.

## 🔧 Connection Upload & Deployment Issues

**BEFORE STARTING**: Review [release-connection-upload-learnings.md](release-connection-upload-learnings.md) which documents critical SDK limitations including:
- Connection creation 404 errors (requires manual setup)
- Parameter upload failures
- Module-connection linking issues
- Required `moduleInitMode` parameter for modules
- Security issues with API key exposure

These issues affect ALL Make.com app development and have established workarounds.

## 🔄 Required Replacements

### 1. Domain and URL Replacements
```
❌ DON'T USE: example.com, api.example.com, www.example.com
✅ DO USE: api.openai.com, api.stripe.com, api.github.com, etc.

❌ DON'T USE: https://www.example.com/api/v2
✅ DO USE: https://api.openai.com/v1, https://api.stripe.com/v1, etc.

❌ DON'T USE: https://we.make.com or https://eu1.make.com 
✅ DO USE: we or eu1 as Zone
```

### 2. Service Name Replacements
```
❌ DON'T USE: YOUR_SERVICE, YOUR_SERVICE_NAME, Example Service
✅ DO USE: OpenAI, Stripe, GitHub, Slack, etc.

❌ DON'T USE: "Make.com YOUR_SERVICE Integration/1.0"
✅ DO USE: "Make.com OpenAI Integration/1.0"
```

### 3. API Endpoint Replacements
```
❌ DON'T USE: /example-endpoint, /test, /whoami
✅ DO USE: /chat/completions, /customers, /user, etc.

❌ DON'T USE: /api/whoami
✅ DO USE: /v1/user (for GitHub), /v1/account (for Stripe), etc.
```

### 4. Response Path Replacements
```
❌ DON'T USE: {{body.email}}, {{body.example}}, {{body.user.email}}
✅ DO USE: {{body.email}} (if API returns email directly)
           {{body.account.email}} (if nested under account)
           {{body.user.login}} (for GitHub username)
           {{body.name}} (for display name)
```

### 5. Error Format Replacements
```
❌ DON'T USE: {{body.error}}, {{body.error.message}}
✅ DO USE: {{body.error.message}} (for OpenAI)
           {{body.error.description}} (for some APIs)
           {{body.message}} (for simple error APIs)
           {{body.error_description}} (for OAuth APIs)
```

### 6. Parameter Name Replacements
```
❌ DON'T USE: testParam, exampleField, sampleInput
✅ DO USE: model, messages, temperature (for OpenAI)
           amount, currency, customer (for Stripe)
           owner, repo, path (for GitHub)
```


### 7. Audience and Language
```
❌ DON'T USE: unset, public or organization
✅ DO USE:       "language": "en", "audience": "global"
```
## 🔧 Connection Configuration Rules

### Connection Types (CRITICAL)
```javascript
// ✅ CORRECT connection types (use exactly these):
"apikey"           // NOT "api-key"
"oauth"            // NOT "oauth2"  
"oauth-refresh"    // For OAuth with refresh tokens
"basic"            // For basic auth
"other"            // For custom auth
```

### Connection Validation URLs
```json
{
    // ❌ DON'T USE:
    "url": "https://www.example.com/api/whoami",
    
    // ✅ DO USE (examples):
    "url": "https://api.openai.com/v1/models",           // OpenAI
    "url": "https://api.stripe.com/v1/account",          // Stripe  
    "url": "https://api.github.com/user",                // GitHub
    "url": "https://slack.com/api/auth.test"             // Slack
}
```

## 📦 Module Configuration Rules

### Universal API Call Is Required but Not Enough

Every generated Make custom app should include a universal **Make an API Call** module with `typeId: 12` unless a task explicitly forbids it. This module is required as an escape hatch and coverage fallback.

However, a universal-only app is not production-ready by itself. A generator may stop at universal-only only when it explicitly marks the result as a `minimal-shell-scaffold` in the app README or batch report.

For a production-ready app, the generator must also emit service-specific modules from a real endpoint matrix:

- list/search endpoints -> search modules, usually `typeId: 9`
- read-one endpoints -> action modules, usually `typeId: 4`
- create/update/delete/status endpoints -> action modules, usually `typeId: 4`
- webhook/polling endpoints -> triggers where the API supports them

Do not describe a generated app as production-ready if `modules/make-api-call` is the only functional module.

### Universal "Make an API Call" Module (CRITICAL)

**Best Practice:** The universal "Make an API Call" module must repeat the root URL in its configuration.

**❌ DON'T: Use only the parameter URL**
```json
{
    "url": "{{parameters.url}}",
    "method": "{{parameters.method}}"
}
```

**✅ DO: Concatenate base URL with parameter URL**
```json
{
    "url": "https://api.example.com/v1{{parameters.url}}",
    "method": "{{parameters.method}}"
}
```

**For dynamic base URLs:**
```json
{
    "url": "https://{{if(connection.environment = 'production', 'api', 'sandbox')}}.example.com/v1{{parameters.url}}",
    "method": "{{parameters.method}}"
}
```

**Why this matters:**
- Users only need to provide endpoint paths like `/users` or `/accounts`
- Prevents users from accidentally using wrong base URLs
- Ensures environment consistency (sandbox vs production)
- Matches the pattern used in base.imljson
- Better user experience - simpler input required

**Example user input:**
- User enters: `/accounts`
- Actual API call: `https://api.example.com/v1/accounts`

## 📝 Naming Conventions

### Module and Folder Names
```
❌ DON'T USE: Dashes in names
   "name": "create-user"
   "name": "make-an-api-call"
   folders: create-user/, verify-user/

✅ DO USE: camelCase for all names
   "name": "createUser"
   "name": "makeAPICall"
   folders: createUser/, verifyUser/

Exception: Universal modules must be named "makeAPICall" (not "makeAnApiCall")
```

### App Icons
```
❌ DON'T USE: Small icons (64x64)
✅ DO USE: Minimum 512x512 PNG for icon.png in assets folder
```

### API Endpoints
```json
{
    // ❌ DON'T USE:
    "url": "/items",
    "url": "/test-endpoint",
    
    // ✅ DO USE (examples):
    "url": "/chat/completions",                          // OpenAI
    "url": "/customers",                                 // Stripe
    "url": "/repos/{{parameters.owner}}/{{parameters.repo}}/issues"  // GitHub
}
```

### Response Mapping
```json
{
    // ❌ DON'T USE:
    "output": "{{body.data}}",
    "iterate": "{{body.items}}",
    
    // ✅ DO USE (examples):
    "output": "{{body}}",                                // OpenAI (direct response)
    "iterate": "{{body.data}}",                          // Stripe (data array)
    "output": "{{body.choices[0].message.content}}"     // OpenAI (extract message content)
}
```

## 🎯 Critical Best Practices

### 1. Dynamic Error Handling (CRITICAL)

**❌ DON'T: Hardcode error messages for each status code**
```json
{
    "response": {
        "error": {
            "400": { "message": "[400] Bad Request: Invalid input data" },
            "401": { "message": "[401] Authentication failed. Please check your API key." },
            "403": { "message": "[403] Access forbidden. Check your permissions." },
            "404": { "message": "[404] Endpoint not found" },
            "500": { "message": "[500] Internal server error. Please try again later." },
            "message": "[{{statusCode}}] {{body.error || body.message || 'Unknown error'}}"
        }
    }
}
```

**✅ DO: Use dynamic error handling that returns actual API errors**
```json
{
    "response": {
        "error": {
            "message": "[{{statusCode}}] {{body.error || body.message || 'Unknown error'}}"
        }
    }
}
```

**Why this matters:**
- Returns actual error messages from the API
- More accurate and helpful error information for users
- Easier to maintain - no hardcoded messages to update
- Adapts automatically to API changes

### 2. Direct Module Output (CRITICAL)

**❌ DON'T: Wrap output in unnecessary objects**
```json
{
    "response": {
        "output": {
            "response": "{{body}}"
        }
    }
}
```

**✅ DO: Output the body directly without wrappers**
```json
{
    "response": {
        "output": "{{body}}"
    }
}
```

**Why this matters:**
- Cleaner data structure in Make.com workflows
- Easier for users to access data
- Less nesting means simpler field mappings
- Preserves the original API response structure

**Exception:** Only add wrapper objects when you need to:
- Transform or rename specific fields
- Combine data from multiple sources
- Add computed values
- Restructure inconsistent API responses

## 🎯 Service-Specific Examples

### OpenAI API
```json
// Base URL
"baseUrl": "https://api.openai.com/v1"

// Auth header  
"Authorization": "Bearer {{connection.apiKey}}"

// Validation endpoint
"url": "https://api.openai.com/v1/models"

// Main endpoint
"url": "/chat/completions"

// Error format
"message": "[{{statusCode}}] {{body.error.message}}"
```

### Stripe API
```json
// Base URL
"baseUrl": "https://api.stripe.com/v1"

// Auth header
"Authorization": "Bearer {{connection.apiKey}}"

// Validation endpoint  
"url": "https://api.stripe.com/v1/account"

// Error format
"message": "[{{statusCode}}] {{body.error.message}}"
```

### GitHub API
```json
// Base URL
"baseUrl": "https://api.github.com"

// Auth header
"Authorization": "Bearer {{connection.token}}"

// Validation endpoint
"url": "https://api.github.com/user"

// Error format
"message": "[{{statusCode}}] {{body.message}}"
```

## 🚫 Common Mistakes to Avoid

1. **Using "api-key" instead of "apikey"** for connection type
2. **Leaving example.com in any configuration**
3. **Using generic parameter names like "testParam"**
4. **Not customizing error message formats**
5. **Using "/whoami" for all API validation endpoints**
6. **Not adjusting response paths to match actual API structure**
7. **Forgetting to update User-Agent strings**
8. **Using generic connection labels like "API Key" instead of "OpenAI API Key"**
9. **Hardcoding error messages for each status code** - Use dynamic error handling instead
10. **Wrapping module output in unnecessary objects** - Use direct output `"output": "{{body}}"` unless transformation is needed
11. **Not repeating root URL in "Make an API Call" modules** - Always concatenate base URL with parameter URL

## ✅ Validation Checklist

Before finalizing any Make.com app configuration:

- [ ] No "example.com" anywhere in the code
- [ ] All service names are real (not "YOUR_SERVICE")
- [ ] All API endpoints are real and documented
- [ ] All response paths match actual API documentation
- [ ] All error formats match actual API error responses
- [ ] Connection type is exactly one of the valid types
- [ ] User-Agent includes actual service name
- [ ] Parameter names match actual API documentation
- [ ] Help text refers to actual service documentation URLs

## 📚 Research Before Building

For every API integration:

1. **Read the API documentation thoroughly**
2. **Test API endpoints manually first**
3. **Check actual error response formats**
4. **Verify authentication requirements**
5. **Confirm response data structure**
6. **Check rate limiting and error codes**

Remember: Make.com apps that use example data will not work in production!