# Troubleshooting Guide

## Common Issues and Solutions

### SDK Upload and Endpoint Issues

#### Issue: Connection Endpoint Versioning Bug ⚠️ **CRITICAL - CONFIRMED ROOT CAUSE**
```
Error: [404] Not found when uploading connection API configuration
```

**Root Cause:** SDK uses incorrect versioned endpoints for connections. **CONFIRMED BUG** verified against official VSCode Apps SDK.

**Problem Analysis:**
By examining the official VSCode Apps SDK (https://github.com/integromat/vscode-apps-sdk), we discovered that connection endpoints follow different versioning rules than module endpoints:

| Component | Endpoint Pattern | Reasoning |
|-----------|------------------|-----------|
| **Connections** | `/apps/{name}/connections` | Global to app, not version-specific |
| **Modules** | `/apps/{name}/{version}/modules` | Version-specific business logic |
| **Base Config** | `/apps/{name}/{version}/base` | Version-specific configuration |

**❌ Current SDK Behavior (INCORRECT)**:
```javascript
// SDK incorrectly uses versioned endpoints for connections
POST /sdk/apps/aixyte-4isy40/1/connections          → 404 "Not found"
PUT /sdk/apps/aixyte-4isy40/1/connections/api-key/parameters → 404 "Not found"
```

**✅ Correct API Behavior (VERIFIED WORKING)**:
```javascript
// Connections are app-global, not version-specific
POST /sdk/apps/aixyte-4isy40/connections            → 200 OK
PUT /sdk/apps/connections/api-key/parameters        → 200 OK
```

**Solutions:**
1. **Use Working SDK Methods** ⚠️ **IMMEDIATE FIX**
   ```javascript
   // ✅ WORKING - Use non-versioned methods
   await sdk.connections.createWithoutVersion(appName, connectionData);
   await sdk.connections.updateSectionWithoutVersion(appName, connectionName, 'parameters', params);
   await sdk.connections.updateSectionWithoutVersion(appName, connectionName, 'api', apiConfig);
   
   // ❌ BROKEN - Default methods use incorrect endpoints
   // await sdk.connections.create(appName, appVersion, connectionData);        // 404 error
   // await sdk.connections.updateSection(appName, appVersion, name, section);  // 404 error
   ```

2. **Direct API Workaround**
   ```javascript
   // Alternative: Direct API calls bypassing SDK
   const response = await fetch(`https://${zone}.make.com/api/v2/sdk/apps/${appName}/connections`, {
     method: 'POST',
     headers: { 
       'Authorization': `Token ${apiKey}`, 
       'Content-Type': 'application/json' 
     },
     body: JSON.stringify(connectionData)
   });
   ```

3. **SDK Method Mapping**
   | Use Case | ❌ Avoid (Broken) | ✅ Use Instead |
   |----------|-------------------|----------------|
   | Create Connection | `sdk.connections.create()` | `sdk.connections.createWithoutVersion()` |
   | Upload Parameters | `sdk.connections.updateSection()` | `sdk.connections.updateSectionWithoutVersion()` |
   | Upload API Config | `sdk.connections.updateSection()` | `sdk.connections.updateSectionWithoutVersion()` |
   | Upload Scopes | `sdk.connections.updateSection()` | `sdk.connections.updateSectionWithoutVersion()` |

**📚 Complete Analysis**: See [release-connection-upload-learnings.md](release-connection-upload-learnings.md) for comprehensive bug analysis, verification tests, and proposed SDK fixes.

#### Issue: Module Creation Fails with "Invalid Parameter"
```
Error: [400] Missing required parameter: moduleInitMode
```

**Solutions:**
1. **Include Required moduleInitMode Parameter**
   ```javascript
   const moduleData = {
       name: "module-name",
       label: "Module Label", 
       description: "Module description",
       typeId: 4, // Action type
       moduleInitMode: 'example'  // Critical undocumented parameter!
   };
   ```

2. **Verify Module Type IDs**
   ```javascript
   const typeMap = {
       'action': 4,
       'search': 9,
       'trigger': 1,
       'instant_trigger': 10,
       'responder': 11,
       'universal': 12
   };
   ```

### Authentication Issues

#### Issue: \"Invalid API Key\" Error
```
Error: [401] Authentication failed. Please check your credentials.
```

**Solutions:**
1. **Verify API Key Format**
   - Check if API key needs prefix (e.g., \"Bearer \", \"sk_\")
   - Ensure no extra spaces or characters
   - Verify key is active and not expired

2. **Check Connection Configuration**
   ```json
   // connections/api-key/parameters.imljson
   [{
       \"name\": \"apiKey\",
       \"type\": \"password\",  // Must be password type for security
       \"label\": \"API Key\",
       \"required\": true
   }]
   ```

3. **Verify Base Configuration**
   ```json
   // base.imljson
   {
       \"headers\": {
           \"Authorization\": \"Bearer {{connection.apiKey}}\",  // Check format
           \"Accept\": \"application/json\"
       }
   }
   ```

#### Issue: OAuth Token Expired
```
Error: [401] The access token expired
```

**Solutions:**
1. **Implement Token Refresh**
   ```json
   // connections/oauth/api.imljson
   {
       \"refresh\": {
           \"condition\": \"{{data.expires < addMinutes(now, 5)}}\",
           \"url\": \"https://api.service.com/oauth/token\",
           \"method\": \"POST\",
           \"body\": {
               \"grant_type\": \"refresh_token\",
               \"refresh_token\": \"{{data.refreshToken}}\",
               \"client_id\": \"{{parameters.clientId}}\",
               \"client_secret\": \"{{parameters.clientSecret}}\"
           }
       }
   }
   ```

2. **Check Token Storage**
   ```json
   {
       \"response\": {
           \"data\": {
               \"accessToken\": \"{{body.access_token}}\",
               \"refreshToken\": \"{{body.refresh_token}}\",
               \"expires\": \"{{addSeconds(now, body.expires_in)}}\"
           }
       }
   }
   ```

### API Call Issues

#### Issue: \"Bad Request\" Error
```
Error: [400] Bad Request: Invalid parameter format
```

**Solutions:**
1. **Validate Parameter Types**
   ```json
   // expect.imljson
   [{
       \"name\": \"quantity\",
       \"type\": \"number\",     // Ensure correct type
       \"required\": true,
       \"minimum\": 1,          // Add validation
       \"maximum\": 1000
   }]
   ```

2. **Check Required Parameters**
   ```json
   {
       \"response\": {
           \"valid\": {
               \"condition\": \"{{parameters.name && parameters.email}}\",
               \"message\": \"Name and email are required\"
           }
       }
   }
   ```

3. **Debug API Call**
   ```json
   // api.imljson
   {
       \"url\": \"/items\",
       \"method\": \"POST\",
       \"body\": \"{{removeEmpty(parameters)}}\",  // Remove empty values
       \"response\": {
           \"output\": \"{{body}}\"
       }
   }
   ```

#### Issue: Rate Limiting
```
Error: [429] Rate limit exceeded
```

**Solutions:**
1. **Implement Rate Limit Handling**
   ```json
   {
       \"response\": {
           \"error\": {
               \"429\": {
                   \"type\": \"RateLimitError\",
                   \"message\": \"Rate limit exceeded. Retry after {{body.retry_after}} seconds.\",
                   \"retry\": {
                       \"delay\": \"{{(body.retry_after || 60) * 1000}}\",
                       \"condition\": \"{{statusCode === 429}}\",
                       \"limit\": 3
                   }
               }
           }
       }
   }
   ```

2. **Add Request Throttling**
   ```json
   {
       \"headers\": {
           \"X-RateLimit-Limit\": \"1000\",
           \"X-Request-Delay\": \"100\"
       }
   }
   ```

### JSON Configuration Issues

#### Issue: Invalid JSON Syntax
```
Error: Unexpected token in JSON
```

**Solutions:**
1. **Common JSON Errors**
   ```json
   // ❌ Wrong
   {
       name: \"test\",           // Missing quotes
       \"value\": 123,          // Trailing comma
   }

   // ✅ Correct
   {
       \"name\": \"test\",
       \"value\": 123
   }
   ```

2. **Validate JSON Online**
   - Use JSONLint.com
   - VS Code JSON validation
   - Command line: `jq . file.json`

3. **Common Syntax Issues**
   ```json
   // ❌ Wrong quotes
   {
       'name': 'test'  // Use double quotes
   }

   // ❌ Trailing commas
   {
       \"name\": \"test\",
       \"value\": 123,  // Remove trailing comma
   }

   // ❌ Comments not allowed
   {
       \"name\": \"test\",  // Comments not allowed in JSON
       \"value\": 123
   }
   ```

### Module Configuration Issues

#### Issue: Module Not Working
```
Error: Module execution failed
```

**Solutions:**
1. **Check Module Metadata**
   ```json
   // modules/action/metadata.json
   {
       \"name\": \"create-item\",
       \"label\": \"Create Item\",
       \"description\": \"Creates a new item\",
       \"connection\": \"api-key\",  // Must match connection name
       \"type\": \"action\"           // Must be valid type
   }
   ```

2. **Verify Required Files**
   ```bash
   modules/create-item/
   ├── metadata.json    ✅ Required
   ├── api.imljson      ✅ Required
   ├── expect.imljson   ✅ Required
   ├── interface.imljson ✅ Required
   └── samples.imljson  ⚠️  Recommended
   ```

3. **Test API Configuration**
   ```json
   // api.imljson
   {
       \"url\": \"/items\",
       \"method\": \"POST\",
       \"body\": {
           \"name\": \"{{parameters.name}}\"
       },
       \"response\": {
           \"output\": \"{{body}}\"
       }
   }
   ```

#### Issue: Parameters Not Working
```
Error: Required parameter missing
```

**Solutions:**
1. **Check Parameter Configuration**
   ```json
   // expect.imljson
   [{
       \"name\": \"itemName\",      // Parameter name
       \"type\": \"text\",
       \"label\": \"Item Name\",
       \"required\": true
   }]
   ```

2. **Verify Parameter Usage**
   ```json
   // api.imljson
   {
       \"body\": {
           \"name\": \"{{parameters.itemName}}\"  // Must match parameter name
       }
   }
   ```

3. **Debug Parameter Values**
   ```json
   {
       \"response\": {
           \"output\": {
               \"debug_parameters\": \"{{parameters}}\",
               \"actual_data\": \"{{body}}\"
           }
       }
   }
   ```

### Webhook Issues

#### Issue: Webhooks Not Triggering
```
Error: Webhook not receiving events
```

**Solutions:**
1. **Verify Webhook Registration**
   ```json
   // webhooks/events/attach.imljson
   {
       \"url\": \"/webhooks\",
       \"method\": \"POST\",
       \"body\": {
           \"url\": \"{{webhook.url}}\",     // Must be correct
           \"events\": [\"item.created\"]     // Must match API events
       }
   }
   ```

2. **Check Webhook URL**
   - Verify webhook URL is accessible
   - Check for HTTPS requirement
   - Validate URL format

3. **Test Webhook Manually**
   ```bash
   curl -X POST \"YOUR_WEBHOOK_URL\" \\
     -H \"Content-Type: application/json\" \\
     -d '{\"test\": \"data\"}'
   ```

#### Issue: Webhook Signature Validation
```
Error: Invalid webhook signature
```

**Solutions:**
1. **Implement Signature Validation**
   ```javascript
   // functions/validateSignature/code.js
   function validateSignature(payload, signature, secret) {
       const crypto = require('crypto');
       const expectedSignature = crypto
           .createHmac('sha256', secret)
           .update(payload)
           .digest('hex');
       return signature === expectedSignature;
   }
   ```

2. **Check Signature Format**
   ```json
   {
       \"headers\": {
           \"X-Webhook-Signature\": \"{{webhook.signature}}\"
       }
   }
   ```

### File Upload Issues

#### Issue: File Upload Failing
```
Error: Unsupported file type
```

**Solutions:**
1. **Check Content Type**
   ```json
   // expect.imljson
   [{
       \"name\": \"file\",
       \"type\": \"buffer\",
       \"label\": \"File\",
       \"required\": true
   }, {
       \"name\": \"contentType\",
       \"type\": \"text\",
       \"label\": \"Content Type\",
       \"default\": \"application/octet-stream\"
   }]
   ```

2. **Verify Multipart Configuration**
   ```json
   // api.imljson
   {
       \"method\": \"POST\",
       \"type\": \"multipart/form-data\",
       \"body\": {
           \"file\": {
               \"value\": \"{{parameters.file}}\",
               \"options\": {
                   \"filename\": \"{{parameters.filename}}\",
                   \"contentType\": \"{{parameters.contentType}}\"
               }
           }
       }
   }
   ```

3. **Check File Size Limits**
   ```json
   {
       \"response\": {
           \"valid\": {
               \"condition\": \"{{length(parameters.file) <= 10485760}}\",
               \"message\": \"File size must be less than 10MB\"
           }
       }
   }
   ```

### Pagination Issues

#### Issue: Pagination Not Working
```
Error: No more data found
```

**Solutions:**
1. **Check Pagination Configuration**
   ```json
   {
       \"pagination\": {
           \"qs\": {
               \"offset\": \"{{body.next_offset}}\"  // Must match API response
           },
           \"condition\": \"{{body.has_more}}\"      // Must match API response
       }
   }
   ```

2. **Verify Response Structure**
   ```json
   {
       \"response\": {
           \"iterate\": \"{{body.data}}\",          // Must match API structure
           \"output\": \"{{item}}\"
       }
   }
   ```

3. **Debug Pagination Values**
   ```json
   {
       \"response\": {
           \"output\": \"{{item}}\",
           \"temp\": {
               \"debug_pagination\": {
                   \"next_offset\": \"{{body.next_offset}}\",
                   \"has_more\": \"{{body.has_more}}\",
                   \"total_items\": \"{{length(body.data)}}\"
               }
           }
       }
   }
   ```

### Performance Issues

#### Issue: Slow API Responses
```
Error: Request timeout
```

**Solutions:**
1. **Optimize API Calls**
   ```json
   {
       \"qs\": {
           \"fields\": \"id,name,status\",  // Request only needed fields
           \"limit\": \"100\"               // Limit response size
       }
   }
   ```

2. **Implement Timeouts**
   ```json
   {
       \"timeout\": 30000,  // 30 seconds
       \"headers\": {
           \"Connection\": \"keep-alive\"
       }
   }
   ```

3. **Use Async Operations**
   ```json
   [
       {
           \"url\": \"/async-operation\",
           \"method\": \"POST\",
           \"response\": {
               \"temp\": {\"jobId\": \"{{body.job_id}}\"}
           }
       },
       {
           \"url\": \"/jobs/{{temp.jobId}}/status\",
           \"repeat\": {
               \"delay\": 2000,
               \"limit\": 30,
               \"condition\": \"{{body.status === 'pending'}}\"
           }
       }
   ]
   ```

## Debugging Techniques

### 1. Add Debug Output
```json
{
    \"response\": {
        \"output\": {
            \"result\": \"{{body}}\",
            \"debug\": {
                \"parameters\": \"{{parameters}}\",
                \"url\": \"{{url}}\",
                \"method\": \"{{method}}\",
                \"headers\": \"{{headers}}\"
            }
        }
    }
}
```

### 2. Use Temporary Variables
```json
{
    \"temp\": {
        \"processed_data\": \"{{removeEmpty(parameters)}}\",
        \"api_url\": \"{{baseUrl}}/{{url}}\"
    },
    \"response\": {
        \"output\": {
            \"temp_debug\": \"{{temp}}\"
        }
    }
}
```

### 3. Validate Each Step
```json
[
    {
        \"response\": {
            \"temp\": {\"step1\": \"{{body}}\"}
        }
    },
    {
        \"response\": {
            \"temp\": {\"step2\": \"{{body}}\"}
        }
    },
    {
        \"response\": {
            \"output\": {
                \"debug_steps\": \"{{temp}}\"
            }
        }
    }
]
```

### 4. Test API Calls Externally
```bash
# Test with curl
curl -X POST \"https://api.service.com/items\" \\
  -H \"Authorization: Bearer YOUR_TOKEN\" \\
  -H \"Content-Type: application/json\" \\
  -d '{\"name\": \"test\"}'

# Test with Postman
# Import API collection and test endpoints
```

### 5. Check API Documentation
- Verify endpoint URLs
- Check required parameters
- Validate response format
- Review authentication requirements
- Check rate limits

## Error Prevention

### 1. Always Include Error Handling
```json
{
    \"response\": {
        \"error\": {
            \"message\": \"[{{statusCode}}] {{body.error.message || body.message || 'Unknown error'}}\"
        }
    }
}
```

### 2. Validate Input Parameters
```json
{
    \"response\": {
        \"valid\": {
            \"condition\": \"{{parameters.email && validateEmail(parameters.email)}}\",
            \"message\": \"Valid email address is required\"
        }
    }
}
```

### 3. Use Appropriate Data Types
```json
[
    {\"name\": \"email\", \"type\": \"email\"},
    {\"name\": \"url\", \"type\": \"url\"},
    {\"name\": \"number\", \"type\": \"number\"},
    {\"name\": \"date\", \"type\": \"date\"},
    {\"name\": \"boolean\", \"type\": \"boolean\"}
]
```

### 4. Implement Proper Logging
```json
{
    \"log\": {
        \"sanitize\": [
            \"request.headers.authorization\",
            \"response.body.access_token\"
        ]
    }
}
```

### 5. Test Edge Cases
- Empty parameters
- Invalid data types
- Network timeouts
- Rate limiting
- Authentication failures

## Getting Help

### 1. Make Platform Support
- Check Make.com documentation
- Visit Make community forums
- Contact Make support team

### 2. API Provider Support
- Review API documentation
- Check API status page
- Contact API provider support

### 3. Development Resources
- JSON validators
- API testing tools
- Regular expression testers
- Date/time formatters

### 4. Community Resources
- Stack Overflow
- GitHub discussions
- Discord/Slack communities
- Developer forums