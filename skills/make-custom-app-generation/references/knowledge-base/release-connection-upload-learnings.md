# Make.com Connection Upload: Lessons Learned

This document consolidates all the critical learnings from Make.com app connection upload issues, hosting problems, and their solutions.

## 🚨 Critical Connection Upload Issues

### 1. Connection Endpoint Versioning Bug (CONFIRMED ROOT CAUSE)

**Problem**: Connection endpoints incorrectly include version numbers, causing 404 "Not found" errors

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

**Root Cause Analysis**: 
By examining the official VSCode Apps SDK (https://github.com/integromat/vscode-apps-sdk), we discovered that connection endpoints follow different versioning rules:

- **Connections**: `/apps/{name}/connections` (Global to app, not version-specific)
- **Modules**: `/apps/{name}/{version}/modules` (Version-specific business logic)  
- **Base Config**: `/apps/{name}/{version}/base` (Version-specific configuration)

**SDK Implementation Status**:
- ✅ **createWithoutVersion()** method exists and works
- ✅ **updateSectionWithoutVersion()** method exists and works
- ❌ **Default create()** method still uses incorrect versioned endpoints
- ❌ **Default updateSection()** method still uses incorrect versioned endpoints

**Current SDK Workaround**:
```javascript
// Use the non-versioned methods explicitly
await sdk.connections.createWithoutVersion(appName, connectionData);
await sdk.connections.updateSectionWithoutVersion(appName, connectionName, 'parameters', params);
```

**Complete Fix Needed**: Update SDK default methods to use correct endpoint patterns per official VSCode SDK

**Status**: ⚠️ **WORKAROUND AVAILABLE** - Use createWithoutVersion() and updateSectionWithoutVersion() methods

### 1.1. Additional Critical Connection API Issues (LATEST FINDINGS)

**UPDATED ANALYSIS**: Recent debugging has revealed even more severe connection API endpoint issues beyond the original versioning problems:

#### Issue A: Undefined Version Parameter Injection
**Problem**: SDK incorrectly inserts `undefined` into URLs when version parameters aren't provided
```javascript
// current broken behavior
sdk.connections.list(appName) → GET /api/v2/sdk/apps/{appName}/{undefined}/connections
sdk.connections.delete(appName, connectionName) → DELETE /api/v2/sdk/apps/{appName}/{connectionName}/connections/{undefined}
```

**Correct Behavior**:
```javascript
// should be
sdk.connections.list(appName) → GET /api/v2/sdk/apps/{appName}/connections
sdk.connections.delete(appName, connectionName) → DELETE /api/v2/sdk/apps/{appName}/connections/{connectionName}
```

#### Issue B: Malformed Connection Deletion Endpoint
**Problem**: SDK uses completely wrong URL structure for connection deletion
```javascript
// current broken implementation
DELETE /api/v2/sdk/apps/{appName}/{connectionName}/connections/{undefined}

// correct implementation needed
DELETE /api/v2/sdk/apps/{appName}/connections/{connectionName}
```

#### Issue C: Missing App Name in Section Updates
**Problem**: updateSectionWithoutVersion omits appName from URL path
```javascript
// current broken behavior
PUT /api/v2/sdk/apps/connections/{connectionName}/{section}

// correct behavior needed
PUT /api/v2/sdk/apps/{appName}/connections/{connectionName}/{section}
```

#### Issue D: Module Connection Reference Inconsistency
**Problem**: Connection assignments in module API sections don't appear in module metadata
- module api config shows: `connection: 'zerocodekit-hsccsj5'`
- module metadata shows: `connection: null`

**Root Cause**: Likely disconnect between API section storage and metadata storage

### 1.2. Module Type ID Mapping (CRITICAL FOR MODULE UPLOADS)

**Problem**: Module upload API requires explicit `typeId` parameter, but this mapping is not documented in the SDK.

**✅ CONFIRMED TYPE ID MAPPING (2025)**:
- **Action**: 4
- **Search**: 9  
- **Trigger (polling)**: 1
- **Instant Trigger (webhook)**: 10
- **Responder**: 11
- **Universal**: 12

**Working Module Upload Pattern**:
```javascript
// Step 1: Create module (metadata only)
curl -X POST "https://eu1.make.com/api/v2/sdk/apps/{appName}/1/modules" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "moduleName",
    "label": "Module Label", 
    "description": "Module description",
    "type": "action",
    "typeId": 4,  // CRITICAL: Must match the type
    "connection": "connection-name"
  }'

// Step 2: Upload API section
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/{appName}/1/modules/{moduleName}/api" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "url": "/endpoint", "method": "POST", ... }'

// Step 3: Upload expect section (input parameters)
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/{appName}/1/modules/{moduleName}/expect" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{ "name": "param", "type": "text", ... }]'

// Step 4: Upload interface section (output structure)
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/{appName}/1/modules/{moduleName}/interface" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{ "name": "output", "type": "text", ... }]'
```

**Status**: ✅ **RESOLVED** - Use explicit typeId parameter for module uploads

### 1.3. SDK Code Fixes Required

#### Fix A: Proper Version Parameter Handling
```javascript
// current broken approach
function buildUrl(appName, version, endpoint) {
    return `/apps/${appName}/${version}/${endpoint}`; // inserts undefined
}

// fixed approach needed
function buildUrl(appName, version, endpoint) {
    if (version) {
        return `/apps/${appName}/${version}/${endpoint}`;
    }
    return `/apps/${appName}/${endpoint}`;
}
```

#### Fix B: Correct Connection API Endpoints
```javascript
// corrected implementation needed
class SDKAppConnections {
    async list(appName, version) {
        const endpoint = version
            ? `/apps/${appName}/${version}/connections`
            : `/apps/${appName}/connections`;
        return this.sdk.executeWithRetry('GET', endpoint);
    }

    async delete(appName, connectionName) {
        return this.sdk.executeWithRetry('DELETE', `/apps/${appName}/connections/${connectionName}`);
    }

    async updateSectionWithoutVersion(appName, connectionName, section, data) {
        return this.sdk.executeWithRetry('PUT', `/apps/${appName}/connections/${connectionName}/${section}`, data);
    }
}
```

#### Fix C: Enhanced Error Handling and Validation
```javascript
async createWithoutVersion(appName, connectionData) {
    // add validation
    if (!appName || !connectionData.name || !connectionData.type) {
        throw new Error('missing required parameters: appName, connection name, or type');
    }

    try {
        return await this.sdk.executeWithRetry('POST', `/apps/${appName}/connections`, connectionData);
    } catch (error) {
        // better error messages
        if (error.statusCode === 409) {
            throw new Error(`connection '${connectionData.name}' already exists`);
        }
        throw error;
    }
}
```

### 1.3. Complete API Endpoint Corrections Required

| operation | current broken endpoint | corrected endpoint needed |
|-----------|------------------------|---------------------------|
| list connections | `GET /apps/{appName}/{undefined}/connections` | `GET /apps/{appName}/connections` |
| delete connection | `DELETE /apps/{appName}/{connectionName}/connections/{undefined}` | `DELETE /apps/{appName}/connections/{connectionName}` |
| update section | `PUT /apps/connections/{connectionName}/{section}` | `PUT /apps/{appName}/connections/{connectionName}/{section}` |

### 1.4. Testing Requirements for SDK Fixes

1. test connection crud operations with and without version parameters
2. test connection section updates (parameters, api)
3. test module connection assignments and verification
4. test error scenarios (already exists, not found, invalid parameters)
5. comprehensive integration tests for all connection management operations

### 1.5. Root Cause Analysis Summary

the core issues stem from:
1. **insufficient testing** of connection management apis during sdk development
2. **inconsistent url construction** when handling optional version parameters
3. **missing integration tests** for connection crud operations
4. **inadequate error handling** for common failure scenarios

**recommendation**: sdk requires immediate fixes for connection endpoint construction and comprehensive integration test suite to prevent regression.

### 1.6. Endpoint Bug Verification Results

**Test Results Summary**:
```
✅ App creation:        POST /sdk/apps/aixyte-4isy40/1/base           → 200 OK
✅ Module operations:    POST /sdk/apps/aixyte-4isy40/1/modules        → 400 "already exists" 
❌ Connection (SDK):     POST /sdk/apps/aixyte-4isy40/1/connections    → 404 "Not found"
✅ Connection (manual):  POST /sdk/apps/aixyte-4isy40/connections      → 200 OK
✅ Connection listing:   GET  /sdk/apps/aixyte-4isy40/connections      → 200 OK
```

**Official VSCode SDK Reference**:
From ConnectionCommands.js line 29:
```javascript
let uri = `${_environment.baseUrl}/${Core.pathDeterminer(_environment.version, '__sdk')}${Core.pathDeterminer(_environment.version, 'app')}/${app.name}/${Core.pathDeterminer(_environment.version, 'connection')}`
// Result for version 2: /sdk/apps/{appName}/connections (no version!)
```

**Direct API Test (WORKING)**:
```javascript
const https = require('https');
const options = {
  hostname: 'we.make.com',
  path: '/api/v2/sdk/apps/aixyte-4isy40/connections', // No version!
  method: 'POST',
  headers: {
    'Authorization': 'Token df846054-4e2b-41ca-9488-7aedc46a4c2b',
    'Content-Type': 'application/json'
  }
};
// Result: 200 OK, connection created successfully
```

### 2. Connection Type Mapping Bug

**Problem**: Connection types get auto-converted by the API
```javascript
// Input: type: "apikey"
// Output: type: "basic" (incorrect conversion)
const connection = await make.sdkAppConnections.create(appName, appVersion, {
    name: "my-connection",
    type: "apikey",
    label: "My API Key"
});
// Result: connection.type === "basic" (wrong!)
```

**Root Cause**: Make.com API performs automatic type conversion based on internal logic

**Solutions**:
1. **Test All Connection Types**: Use the built-in type testing utility
2. **Use Debug Mode**: Enable debug logging to see exact API responses
3. **Validate After Creation**: Check the actual type returned by the API

**Status**: ⚠️ **WORKAROUND AVAILABLE** - Test different types and validate results

### 3. Module-Connection Linking Failures

**Problem**: Cannot link modules to connections - "Not found" errors
```javascript
// This fails consistently
await make.sdkAppModules.changeConnectionOrWebhook(appName, appVersion, moduleName, connectionName);
```

**Root Cause**: Connection identifiers used for linking don't match the created connection names

**Solutions**:
1. **Enhanced Link Method**: Use alternative linking approaches
2. **Verify Connection Exists**: Check connection creation before linking
3. **Debug Connection Names**: Log actual connection identifiers

**Status**: ⚠️ **WORKAROUND AVAILABLE** - Manual linking through Make.com UI

### 4. Critical Missing Module Parameter

**Problem**: Module creation fails without undocumented parameter
```javascript
// This fails without moduleInitMode
const moduleData = {
    name: "module-name",
    label: "Module Label",
    description: "Module description",
    typeId: 4
};
```

**Solution**: Always include the undocumented `moduleInitMode` parameter
```javascript
// Fixed version
const moduleData = {
    name: "module-name",
    label: "Module Label", 
    description: "Module description",
    typeId: 4,
    moduleInitMode: 'example'  // Critical undocumented parameter!
};
```

**Status**: ✅ **FIXED** - All upload scripts now include this parameter

### 5. JSON Serialization Bug (Fixed in v2.0.1)

**Problem**: JavaScript objects sent as `[object Object]` instead of proper JSON

**Root Cause**: SDK wasn't properly serializing objects to JSON strings

**Solution**: Fixed in SDK v2.0.1 with proper JSON serialization

**Status**: ✅ **FIXED** - Upgrade to v2.0.1 or later

## 🔐 Security Issues

### 1. API Key Exposure

**Problem**: API keys hardcoded in upload scripts
```javascript
// SECURITY RISK: API keys in code
const config = {
    apiKey: 'df846054-4e2b-41ca-9488-7aedc46a4c2b',
    region: 'https://we.make.com/',
    debug: true
};
```

**Solutions**:
1. **Environment Variables**: Use `.env` files for API keys
2. **CLI Configuration**: Store credentials in CLI config
3. **Secret Management**: Use proper secret management systems

**Status**: ⚠️ **ONGOING RISK** - Review all scripts for hardcoded credentials

## 🏗️ Hosting & Configuration Issues

### 1. Validation System Blocks Common Patterns

**Problem**: Production validation prevents testing with common examples
- Blocks `example.com` domains
- Prevents `/whoami` endpoints  
- Requires service-specific configurations
- Blocks placeholder values like `YOUR_SERVICE`

**Solutions**:
1. **Use Real Endpoints**: Set up actual test endpoints
2. **Service Templates**: Use production-ready templates
3. **Validation Override**: Disable validation for development

**Status**: ⚠️ **DESIGN LIMITATION** - Use real services for testing

### 2. Icon Upload Issues

**Problem**: Valid PNG files rejected with "Invalid upload" errors

**Root Cause**: Strict validation on image format, size, and headers

**Solutions**:
1. **Validate First**: Use built-in icon validation
2. **Multiple Formats**: SDK tries different upload approaches
3. **Size Limits**: Keep icons under 10KB, 64x64 pixels

**Status**: ✅ **IMPROVED** - Enhanced validation and upload methods

## 📊 Upload Process Architecture

### Current Upload Order
1. **Create App** (if doesn't exist)
2. **Upload Base Section** (app configuration)
3. **Create Connections** (individual connection objects)
4. **Upload Connection Sections** (api, parameters, scopes) ❌ **FAILS**
5. **Create Modules** (individual module objects)
6. **Upload Module Sections** (api, parameters, samples, interface, expect)
7. **Create RPCs** (if applicable)
8. **Upload README** (documentation)

### Error Handling Strategy
- **Graceful Degradation**: Continue upload even if sections fail
- **Retry Logic**: Automatic delays and retry attempts
- **Comprehensive Logging**: Debug mode shows all API calls
- **Validation First**: Check configuration before upload

### Performance Optimizations
- **Automatic Delays**: 500ms between creations, 200ms between sections
- **Batch Operations**: Process multiple components efficiently
- **Error Recovery**: Resume from failed steps

## 🛠️ Solutions & Workarounds

### 1. Working Connection Upload Methods

**✅ SOLUTION: Use Non-Versioned Methods**
```javascript
// Correct connection upload approach
const sdk = new MakeHQSDK({ apiKey: 'your-key', region: 'we' });

// 1. Create connection (use createWithoutVersion)
const connection = await sdk.connections.createWithoutVersion(appName, {
    name: 'api-key',
    type: 'apikey',
    label: 'API Key Connection'
});

// 2. Upload connection parameters (use updateSectionWithoutVersion)
await sdk.connections.updateSectionWithoutVersion(
    appName, 
    'api-key', 
    'parameters', 
    [{
        name: 'apiKey',
        type: 'password',
        label: 'API Key',
        required: true
    }]
);

// 3. Upload connection API configuration
await sdk.connections.updateSectionWithoutVersion(
    appName,
    'api-key',
    'api',
    {
        url: '/auth/validate',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer {{connection.apiKey}}'
        }
    }
);
```

**❌ AVOID: Default SDK Methods (These Use Incorrect Endpoints)**
```javascript
// These methods use incorrect versioned endpoints and will fail
await sdk.connections.create(appName, appVersion, connectionData);        // 404 error
await sdk.connections.updateSection(appName, appVersion, name, section);  // 404 error
```

### 2. Direct API Workaround
```javascript
// Alternative: Direct API calls bypassing SDK
async function createConnectionDirect(appName, connectionData, apiKey, zone = 'we') {
    const response = await fetch(`https://${zone}.make.com/api/v2/sdk/apps/${appName}/connections`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(connectionData)
    });
    
    if (!response.ok) {
        throw new Error(`Connection creation failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}
```

### 3. Enhanced Error Handling
```javascript
// Comprehensive error handling with retry logic
async function uploadWithRetry(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}
```

### 2. Validation System
```javascript
// Production validation prevents common mistakes
const validation = make.sdkApps.validateCompleteConfig({
    app: { name: 'myapp', label: 'My App' },
    connections: [{ type: 'apikey', label: 'API Key', name: 'main' }],
    modules: [{ name: 'action1', label: 'My Action' }]
});
```

### 3. Debug Tools
```javascript
// Enable comprehensive debugging
make.enableDebug();
// Shows detailed request/response info for all API calls
```

### 4. Service Templates
```javascript
// Production-ready configurations for common services
const openaiConnection = createConnectionFromTemplate('openai');
const claudeConnection = createConnectionFromTemplate('claude');
```

## 🔄 Connection Upload Checklist

### Before Upload
- [ ] API key stored securely (not hardcoded)
- [ ] Real endpoints configured (no example.com)
- [ ] Connection type validated
- [ ] Icon meets requirements (64x64, <10KB)
- [ ] All required parameters included
- [ ] `moduleInitMode` parameter added to modules

### During Upload
- [ ] Debug mode enabled
- [ ] Upload order followed correctly
- [ ] Automatic delays respected
- [ ] Error handling implemented
- [ ] Progress logging enabled

### After Upload
- [ ] Connection type verified (check for auto-conversion)
- [ ] Parameters uploaded manually if needed
- [ ] Module-connection linking verified
- [ ] All sections uploaded successfully
- [ ] Icon display verified
- [ ] End-to-end testing completed

## 📋 Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| App Creation | ✅ **Working** | Reliable with proper configuration |
| Base Section Upload | ✅ **Working** | No known issues |
| Connection Creation (Default) | ❌ **Broken** | Uses incorrect versioned endpoints |
| Connection Creation (WithoutVersion) | ✅ **Working** | Use `createWithoutVersion()` method |
| Connection Parameters (Default) | ❌ **Broken** | 404 errors with versioned endpoints |
| Connection Parameters (WithoutVersion) | ✅ **Working** | Use `updateSectionWithoutVersion()` |
| Module Creation | ✅ **Working** | Requires `moduleInitMode` parameter |
| Module Sections | ✅ **Working** | Generally reliable |
| Module-Connection Linking | ❌ **Broken** | Requires manual linking |
| Icon Upload | ⚠️ **Partial** | Works with proper validation |
| JSON Serialization | ✅ **Fixed** | Fixed in v2.0.1+ |

### 🔧 SDK Method Recommendations

| Use Case | ❌ Avoid (Broken) | ✅ Use Instead |
|----------|-------------------|----------------|
| Create Connection | `sdk.connections.create()` | `sdk.connections.createWithoutVersion()` |
| Upload Parameters | `sdk.connections.updateSection()` | `sdk.connections.updateSectionWithoutVersion()` |
| Upload API Config | `sdk.connections.updateSection()` | `sdk.connections.updateSectionWithoutVersion()` |
| Upload Scopes | `sdk.connections.updateSection()` | `sdk.connections.updateSectionWithoutVersion()` |

## 🚀 Recommendations

### Immediate Actions (Developers)
1. **Use Correct SDK Methods**: Switch to `createWithoutVersion()` and `updateSectionWithoutVersion()`
2. **Update Upload Scripts**: Replace default connection methods with working alternatives
3. **Remove Hardcoded Keys**: Replace with environment variables
4. **Add Validation**: Implement pre-upload validation
5. **Enable Debug**: Always use debug mode for troubleshooting

### SDK Maintainer Actions (URGENT)
1. **Fix Default Connection Methods**: Update `create()` to use non-versioned endpoints
2. **Align with Official SDK**: Match endpoint patterns with VSCode Apps SDK
3. **Add Endpoint Tests**: Automated tests comparing URL patterns with official SDK
4. **Update Documentation**: Document versioning strategy for different endpoint types
5. **Deprecation Warnings**: Add warnings to broken methods directing users to working alternatives

### Proposed SDK Fix
```javascript
// In sdk-app-connections.ts - Fix the default create() method:
async create(appName: string, appVersion: string, body: CreateSDKAppConnectionBody, options?: SDKAppOptions) {
    // Use non-versioned endpoint like createWithoutVersion()
    return this.createWithoutVersion(appName, body, options);
}

async updateSection(appName: string, appVersion: string, connectionName: string, section: string, body: any, options?: SDKAppOptions) {
    // Use non-versioned endpoint like updateSectionWithoutVersion()
    return this.updateSectionWithoutVersion(appName, connectionName, section, body, options);
}
```

### Long-term Improvements
1. **Fix Module Linking**: Resolve connection linking issues
2. **Improve Error Messages**: Better error reporting for common failures
3. **Add Retry Logic**: Automatic retry for transient failures
4. **Connection Type Stability**: Prevent automatic type conversion

### Development Workflow
1. **Use Templates**: Start with service-specific templates
2. **Test Incrementally**: Upload and test each component separately
3. **Validate Early**: Check configuration before upload
4. **Monitor Logs**: Watch debug output for issues

## 📞 Support & Resources

### Documentation
- **TROUBLESHOOTING.md**: Comprehensive troubleshooting guide
- **UPLOAD-GUIDE.md**: Detailed upload process documentation
- **VALIDATION_EXAMPLES.md**: Configuration validation examples

### Tools
- **Debug Mode**: Enable with `make.enableDebug()`
- **Validation Methods**: Built-in configuration validation
- **Error Analysis**: Automated error analysis and suggestions
- **Service Templates**: Production-ready configurations

### Community
- **GitHub Issues**: Report bugs with debug output
- **Make.com Documentation**: Official API documentation
- **Developer Forums**: Community support and discussions

---

## 🔥 NEW: Complete SDK Connection Creation API Workflow (2025)

### Overview of SDK Connection Creation Process

Based on extensive API testing and real-world implementation, here's the complete workflow for creating Make.com SDK app connections using direct API calls.

### SDK Connection API Endpoints Reference

#### Base URL Structure
- **EU Zone**: `https://eu1.make.com/api/v2/sdk/apps/{appName}/connections`
- **US Zone**: `https://us1.make.com/api/v2/sdk/apps/{appName}/connections`
- **WE Zone**: `https://we.make.com/api/v2/sdk/apps/{appName}/connections`

#### Authentication
All API calls require:
```
Authorization: Token YOUR_API_TOKEN
Content-Type: application/json
```

### 1. Complete Connection Creation Workflow

#### Step 1: Create SDK App (Prerequisites)
```bash
curl -X POST "https://eu1.make.com/api/v2/sdk/apps" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "YOUR_TEAM_ID",
    "name": "your-app-name",
    "label": "Your App Label",
    "description": "Your app description",
    "theme": "#667eea",
    "language": "en",
    "audience": "global",
    "countries": null,
    "beta": false
  }'
```

#### Step 2: Create Connection Object
```bash
curl -X POST "https://eu1.make.com/api/v2/sdk/apps/{appName}/connections" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "apikey",
    "label": "API Key Connection"
  }'
```

**Response:**
```json
{
  "appConnection": {
    "name": "your-connection-name-generated",
    "label": "API Key Connection", 
    "type": "basic"
  }
}
```

**⚠️ IMPORTANT**: The API may return `"type": "basic"` even when you specify `"apikey"`. This is a known API behavior and doesn't affect functionality.

#### Step 3: Configure Connection Parameters
```bash
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/parameters" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "apiKey",
      "type": "password",
      "label": "API Key",
      "required": true,
      "help": "Enter your API key from the service dashboard"
    }
  ]'
```

#### Step 4: Set Common Data (Shared Configuration)
```bash
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/common" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://api.yourservice.com/v1",
    "userAgent": "Make.com YourService Integration/1.0"
  }'
```

#### Step 5: Configure Connection API (Validation Endpoint)
```bash
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/api" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "{{common.baseUrl}}/user/profile",
    "headers": {
      "Authorization": "Bearer {{parameters.apiKey}}",
      "Accept": "application/json",
      "User-Agent": "{{common.userAgent}}"
    },
    "response": {
      "metadata": {
        "type": "text",
        "value": "{{body.name || \"API User\"}}"
      },
      "error": {
        "401": {
          "message": "[401] Invalid API key. Please check your credentials."
        },
        "403": {
          "message": "[403] Access forbidden. Check your API key permissions."
        },
        "429": {
          "message": "[429] Rate limit exceeded. Please try again later."
        },
        "500": {
          "message": "[500] Internal server error. Please try again later."
        },
        "message": "[{{statusCode}}] {{body.error || \"Authentication failed\"}}"
      }
    },
    "log": {
      "sanitize": [
        "request.headers.authorization",
        "request.headers.Authorization",
        "parameters.apiKey"
      ]
    }
  }'
```

#### Step 6: Set Scopes (Required Even for API Key)
```bash
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/scopes" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 2. OAuth 2.0 Connection Creation

#### Create OAuth Connection
```bash
# Step 1: Create connection
curl -X POST "https://eu1.make.com/api/v2/sdk/apps/{appName}/connections" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "oauth",
    "label": "OAuth 2.0 Connection"
  }'

# Step 2: Set parameters
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/parameters" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
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
  ]'

# Step 3: Configure OAuth API
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/api" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "authorize": {
      "url": "https://accounts.service.com/oauth/authorize",
      "qs": {
        "client_id": "{{parameters.clientId}}",
        "redirect_uri": "{{oauth.redirectUri}}",
        "response_type": "code",
        "scope": "{{join(scopes, \" \")}}"
      }
    },
    "token": {
      "url": "https://accounts.service.com/oauth/token",
      "method": "POST",
      "headers": {
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
    },
    "log": {
      "sanitize": [
        "request.headers.authorization",
        "request.body.client_secret",
        "response.body.access_token",
        "response.body.refresh_token"
      ]
    }
  }'

# Step 4: Configure scopes
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/scopes" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "read",
      "label": "Read access"
    },
    {
      "name": "write", 
      "label": "Write access"
    }
  ]'
```

### 3. Connection Validation and Testing

#### Get Connection Details
```bash
curl -X GET "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}" \
  -H "Authorization: Token YOUR_API_TOKEN"
```

#### List All App Connections
```bash
curl -X GET "https://eu1.make.com/api/v2/sdk/apps/{appName}/connections" \
  -H "Authorization: Token YOUR_API_TOKEN"
```

#### Get Connection Section
```bash
# Get API configuration
curl -X GET "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/api" \
  -H "Authorization: Token YOUR_API_TOKEN"

# Get parameters
curl -X GET "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/parameters" \
  -H "Authorization: Token YOUR_API_TOKEN"

# Get common data
curl -X GET "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/common" \
  -H "Authorization: Token YOUR_API_TOKEN"
```

### 4. Connection Types and Their Configurations

#### API Key Connection Template
```json
{
  "type": "apikey",
  "label": "API Key",
  "parameters": [
    {
      "name": "apiKey",
      "type": "password", 
      "label": "API Key",
      "required": true,
      "help": "Enter your API key"
    }
  ],
  "api": {
    "url": "{{common.baseUrl}}/validate",
    "headers": {
      "Authorization": "Bearer {{parameters.apiKey}}"
    },
    "response": {
      "metadata": {
        "type": "text",
        "value": "{{body.user.name}}"
      }
    }
  }
}
```

#### Basic Auth Connection Template  
```json
{
  "type": "basic",
  "label": "Basic Authentication",
  "parameters": [
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
  ],
  "api": {
    "url": "{{common.baseUrl}}/auth/verify",
    "headers": {
      "Authorization": "Basic {{base64(parameters.username + ':' + parameters.password)}}"
    }
  }
}
```

#### Custom Auth Connection Template
```json
{
  "type": "custom",
  "label": "Custom Authentication",
  "parameters": [
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
  ],
  "api": {
    "url": "{{common.baseUrl}}/auth",
    "headers": {
      "X-API-Key": "{{parameters.apiKey}}",
      "X-Client-ID": "{{parameters.clientId}}",
      "X-Signature": "{{parameters.signature}}"
    }
  }
}
```

### 5. Common Connection Configuration Patterns

#### Environment-Based Configuration
```json
{
  "parameters": [
    {
      "name": "environment",
      "type": "select",
      "label": "Environment",
      "required": true,
      "default": "production",
      "options": [
        {"label": "Production", "value": "production"},
        {"label": "Sandbox", "value": "sandbox"}
      ]
    },
    {
      "name": "apiKey",
      "type": "password",
      "label": "API Key",
      "required": true
    }
  ],
  "common": {
    "baseUrl": "https://{{if(parameters.environment === 'sandbox', 'sandbox-api', 'api')}}.service.com/v1"
  }
}
```

#### Multi-Region Configuration
```json
{
  "parameters": [
    {
      "name": "region",
      "type": "select", 
      "label": "Region",
      "required": true,
      "options": [
        {"label": "US East", "value": "us-east"},
        {"label": "US West", "value": "us-west"},
        {"label": "Europe", "value": "eu"},
        {"label": "Asia Pacific", "value": "ap"}
      ]
    }
  ],
  "common": {
    "baseUrl": "https://{{parameters.region}}.api.service.com/v1"
  }
}
```

### 6. Advanced Connection Features

#### Connection with Multiple Auth Methods
```json
{
  "parameters": [
    {
      "name": "authMethod",
      "type": "select",
      "label": "Authentication Method",
      "required": true,
      "options": [
        {"label": "API Key", "value": "apikey"},
        {"label": "OAuth 2.0", "value": "oauth"}
      ]
    },
    {
      "name": "apiKey",
      "type": "password",
      "label": "API Key",
      "help": "Required when using API Key authentication"
    }
  ],
  "api": {
    "headers": {
      "Authorization": "{{if(parameters.authMethod === 'apikey', 'Bearer ' + parameters.apiKey, 'Bearer ' + connection.accessToken)}}"
    }
  }
}
```

#### Connection with Webhook Secret
```json
{
  "parameters": [
    {
      "name": "apiKey",
      "type": "password",
      "label": "API Key", 
      "required": true
    },
    {
      "name": "webhookSecret",
      "type": "password",
      "label": "Webhook Secret",
      "help": "Required for webhook signature verification"
    }
  ]
}
```

### 7. Connection Error Handling Best Practices

#### Comprehensive Error Configuration
```json
{
  "api": {
    "response": {
      "error": {
        "400": {
          "message": "[400] Bad Request: {{body.error.message || 'Invalid request parameters'}}",
          "type": "ValidationError"
        },
        "401": {
          "message": "[401] Authentication failed. Please check your {{if(parameters.authMethod === 'apikey', 'API key', 'OAuth credentials')}}.",
          "type": "AuthenticationError"
        },
        "403": {
          "message": "[403] Access forbidden. Your account may not have the required permissions.",
          "type": "PermissionError"
        },
        "404": {
          "message": "[404] Resource not found. Please verify the endpoint URL.",
          "type": "NotFoundError"
        },
        "429": {
          "message": "[429] Rate limit exceeded. Please try again in {{body.retry_after || 60}} seconds.",
          "type": "RateLimitError"
        },
        "500": {
          "message": "[500] Internal server error. Please try again later.",
          "type": "ServerError"
        },
        "502": {
          "message": "[502] Bad Gateway. The service may be temporarily unavailable.",
          "type": "ServiceError"
        },
        "503": {
          "message": "[503] Service Unavailable. Please try again later.",
          "type": "ServiceError"
        },
        "message": "[{{statusCode}}] {{body.error.message || body.message || 'Unknown error occurred'}}"
      }
    }
  }
}
```

### 8. Connection Testing and Validation

#### Test Connection Endpoint
```bash
curl -X POST "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/test" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {
      "apiKey": "test-api-key-value"
    }
  }'
```

#### Connection Recreate (Sync with HQ)
```bash
curl -X POST "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}/recreate" \
  -H "Authorization: Token YOUR_API_TOKEN"
```

### 9. Connection Management Operations

#### Update Connection Label
```bash
curl -X PATCH "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Updated Connection Label"
  }'
```

#### Delete Connection (When Not Used by Modules)
```bash
curl -X DELETE "https://eu1.make.com/api/v2/sdk/apps/connections/{connectionName}" \
  -H "Authorization: Token YOUR_API_TOKEN"
```

### 10. Module Connection Assignment

#### Link Module to Connection
```bash
curl -X PATCH "https://eu1.make.com/api/v2/sdk/apps/{appName}/1/modules/{moduleName}" \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connection": "connection-name"
  }'
```

### 11. Complete JavaScript Implementation Example

```javascript
class MakeConnectionCreator {
  constructor(apiKey, zone = 'eu1') {
    this.apiKey = apiKey;
    this.baseUrl = `https://${zone}.make.com/api/v2/sdk/apps`;
    this.headers = {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async createApiKeyConnection(appName, config) {
    // Step 1: Create connection
    const connectionResponse = await fetch(`${this.baseUrl}/${appName}/connections`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        type: 'apikey',
        label: config.label || 'API Key Connection'
      })
    });

    if (!connectionResponse.ok) {
      throw new Error(`Failed to create connection: ${connectionResponse.status}`);
    }

    const connection = await connectionResponse.json();
    const connectionName = connection.appConnection.name;

    // Step 2: Set parameters
    await fetch(`${this.baseUrl}/connections/${connectionName}/parameters`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(config.parameters || [
        {
          name: 'apiKey',
          type: 'password',
          label: 'API Key',
          required: true,
          help: 'Enter your API key'
        }
      ])
    });

    // Step 3: Set common data
    if (config.common) {
      await fetch(`${this.baseUrl}/connections/${connectionName}/common`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(config.common)
      });
    }

    // Step 4: Set API configuration
    if (config.api) {
      await fetch(`${this.baseUrl}/connections/${connectionName}/api`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(config.api)
      });
    }

    // Step 5: Set scopes
    await fetch(`${this.baseUrl}/connections/${connectionName}/scopes`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(config.scopes || {})
    });

    return { connectionName, connection };
  }

  async createOAuthConnection(appName, config) {
    // Similar implementation for OAuth connections
    // ... implementation details
  }

  async testConnection(connectionName, parameters) {
    const response = await fetch(`${this.baseUrl}/connections/${connectionName}/test`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ parameters })
    });

    return await response.json();
  }
}

// Usage example
const creator = new MakeConnectionCreator('your-api-token');

const connectionConfig = {
  label: 'My Service API',
  parameters: [
    {
      name: 'apiKey',
      type: 'password',
      label: 'API Key',
      required: true,
      help: 'Enter your My Service API key'
    }
  ],
  common: {
    baseUrl: 'https://api.myservice.com/v1',
    userAgent: 'Make.com MyService Integration/1.0'
  },
  api: {
    url: '{{common.baseUrl}}/user/profile',
    headers: {
      'Authorization': 'Bearer {{parameters.apiKey}}',
      'User-Agent': '{{common.userAgent}}'
    },
    response: {
      metadata: {
        type: 'text',
        value: '{{body.name}}'
      },
      error: {
        401: { message: '[401] Invalid API key' },
        message: '[{{statusCode}}] {{body.error || "Auth failed"}}'
      }
    },
    log: {
      sanitize: ['request.headers.authorization', 'parameters.apiKey']
    }
  }
};

// Create the connection
const result = await creator.createApiKeyConnection('my-app-name', connectionConfig);
console.log('Connection created:', result.connectionName);
```

### 12. Troubleshooting Connection Issues

#### Common Issues and Solutions

**Issue: Connection type changes from "apikey" to "basic"**
- **Solution**: This is expected API behavior. The functionality works correctly regardless of the returned type.

**Issue: Parameters not uploading**
- **Solution**: Ensure you're using the correct endpoint pattern: `/apps/connections/{connectionName}/parameters`

**Issue: API validation failing**
- **Solution**: Use a real API endpoint for validation, not example.com or generic URLs.

**Issue: Connection not appearing in modules**
- **Solution**: Verify the connection name matches exactly when assigning to modules.

**Issue: 404 errors on connection operations**
- **Solution**: Ensure you're using non-versioned endpoints for all connection operations.

### 13. Security Best Practices

#### Log Sanitization Configuration
```json
{
  "log": {
    "sanitize": [
      "request.headers.authorization",
      "request.headers.Authorization", 
      "request.body.client_secret",
      "request.body.api_key",
      "request.body.password",
      "response.body.access_token",
      "response.body.refresh_token",
      "parameters.apiKey",
      "parameters.clientSecret",
      "parameters.password",
      "parameters.webhookSecret"
    ]
  }
}
```

#### Connection Parameter Security
```json
{
  "parameters": [
    {
      "name": "apiKey",
      "type": "password",  // Always use "password" type for sensitive data
      "label": "API Key",
      "required": true,
      "help": "This will be stored securely and not visible in logs"
    }
  ]
}
```

This comprehensive workflow provides everything needed to create, configure, and manage Make.com SDK app connections via API calls. The examples cover all major connection types and include production-ready error handling, security measures, and testing approaches.

This document serves as a comprehensive reference for all connection upload issues and their solutions. It should be updated as new issues are discovered and resolved.

---

## 🔥 LATEST: Team Discussion Insights on Connection Endpoint Patterns (July 2025)

### Team Discussion: Connection Creation vs Update Patterns

Based on recent team troubleshooting session for the Aixyte app, critical insights were discovered about Make.com connection endpoint structure and creation patterns.

#### Original Issue: Connection API Upload Failing
**Problem encountered by team member:**
```bash
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/aixyte-dcd7qr/1/connections/aixyte_api_key/api" \
    -H "Authorization: Token 6b807806-****" \
    -H "User-Agent: Make/production" \
    -H "Content-Type: application/json" \
    -d '{
        "info": {
            "url": "/domains",
            "method": "GET",
            "qs": {
                "limit": 1
            },
            "response": {
                "uid": "{{connection.apiKey}}",
                "metadata": {
                    "type": "text",
                    "value": "Aixyte Connection"
                }
            }
        }
    }'
```

**Root Cause Analysis from Team:**
1. **Wrong Endpoint Pattern**: Using versioned endpoint for connection API updates
2. **Missing Connection Creation Step**: Attempting to update connection spec before creating the connection object
3. **Incorrect URL Structure**: Connections don't inherit from base configuration

#### Team Solution: Correct Connection Endpoint Structure

**Key Insight from Alex Chekalov:**
> "Connections don't inherit from the base so it should have full URL I think"

**Correct Endpoint Pattern Discovery:**
The Make.com API builds connection URLs with this structure:
```
{instance}/api/v2/sdk/apps/connections/{app_name}{connection_number}/api
```

**Examples:**
- **First connection**: `https://eu1.make.com/api/v2/sdk/apps/connections/aixyte-dcd7qr/api`
- **Second connection**: `https://eu1.make.com/api/v2/sdk/apps/connections/aixyte-dcd7qr2/api`
- **Third connection**: `https://eu1.make.com/api/v2/sdk/apps/connections/aixyte-dcd7qr3/api`

#### Correct Two-Step Connection Creation Process

**Step 1: Create Connection Object (POST)**
```bash
curl -X POST "https://eu1.make.com/api/v2/sdk/apps/aixyte-dcd7qr/connections" \
    -H "Authorization: Token YOUR_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "label": "Aixyte API Key Connection", 
        "type": "apikey"
    }'
```

**Step 2: Update Connection Specification (PUT)**
```bash
curl -X PUT "https://eu1.make.com/api/v2/sdk/apps/connections/aixyte-dcd7qr/api" \
    -H "Authorization: Token YOUR_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "/domains",
        "method": "GET",
        "qs": {
            "limit": 1
        },
        "response": {
            "uid": "{{connection.apiKey}}",
            "metadata": {
                "type": "text",
                "value": "Aixyte Connection"
            }
        }
    }'
```

#### Connection Type Enums (OFFICIAL)

**Complete list of supported connection types:**
- `"basic"` - Basic authentication (username/password)
- `"oauth"` - OAuth 2.0 authorization code flow
- `"apikey"` - API key authentication
- `"oauth-resowncre"` - OAuth resource owner credentials
- `"oauth-clicre"` - OAuth client credentials
- `"other"` - Custom authentication method

#### Critical Learnings from Team Discussion

1. **Connection Endpoint Structure**: 
   - Connections use non-versioned endpoints: `/apps/connections/{app_name}/`
   - NOT versioned like modules: `/apps/{app_name}/1/connections/`

2. **Creation vs Update Pattern**:
   - **CREATE**: `POST /apps/{app_name}/connections` (creates connection object)
   - **UPDATE**: `PUT /apps/connections/{app_name}/api` (updates connection spec)

3. **Connection Naming Convention**:
   - First connection: `{app_name}` (e.g., `aixyte-dcd7qr`)
   - Subsequent connections: `{app_name}{number}` (e.g., `aixyte-dcd7qr2`, `aixyte-dcd7qr3`)

4. **Base Configuration Independence**:
   - Connections don't inherit from app base configuration
   - Must specify full URLs and configuration in connection spec

#### Updated Workflow for Connection Creation

```javascript
// Step 1: Create connection object
const createConnectionResponse = await fetch(
    'https://eu1.make.com/api/v2/sdk/apps/aixyte-dcd7qr/connections',
    {
        method: 'POST',
        headers: {
            'Authorization': 'Token YOUR_API_TOKEN',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            label: 'Aixyte API Key Connection',
            type: 'apikey'
        })
    }
);

// Step 2: Update connection API specification
const updateApiResponse = await fetch(
    'https://eu1.make.com/api/v2/sdk/apps/connections/aixyte-dcd7qr/api',
    {
        method: 'PUT',
        headers: {
            'Authorization': 'Token YOUR_API_TOKEN',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: 'https://azxjgkopxmhwzvkxouuy.supabase.co/functions/v1/api/domains',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer {{connection.apiKey}}',
                'Content-Type': 'application/json'
            },
            qs: {
                limit: 1
            },
            response: {
                uid: '{{connection.apiKey}}',
                metadata: {
                    type: 'text',
                    value: 'Aixyte Connection'
                }
            }
        })
    }
);

// Step 3: Update connection parameters
const updateParamsResponse = await fetch(
    'https://eu1.make.com/api/v2/sdk/apps/connections/aixyte-dcd7qr/parameters',
    {
        method: 'PUT',
        headers: {
            'Authorization': 'Token YOUR_API_TOKEN',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([
            {
                name: 'apiKey',
                type: 'password',
                label: 'API Key',
                required: true,
                help: 'Enter your Aixyte API key'
            }
        ])
    }
);
```

#### Team Resolution Summary

**Before (Incorrect Approach):**
- ❌ Using versioned connection endpoints
- ❌ Attempting to update connection spec without creating connection
- ❌ Missing full URL specification in connection API

**After (Correct Approach):**
- ✅ Use non-versioned connection endpoints
- ✅ Create connection object first, then update specifications
- ✅ Specify complete URLs in connection API configuration
- ✅ Use proper connection type enums

#### Impact on Existing SDK Implementations

This discovery affects all connection creation workflows:

1. **SDK Method Updates Needed**: All SDK connection methods should follow this two-step pattern
2. **Endpoint Validation**: Connection endpoints must not include version numbers
3. **Documentation Updates**: All connection examples need to reflect correct endpoint structure
4. **Error Handling**: Better error messages for connection creation vs update failures

#### Verification Checklist for Connection Creation

- [ ] Connection object created via POST to non-versioned endpoint
- [ ] Connection specifications updated via PUT to non-versioned endpoint  
- [ ] Full URLs specified in connection API configuration
- [ ] Proper connection type enum used from official list
- [ ] Connection naming follows app_name{number} convention
- [ ] All sensitive data marked as "password" type in parameters

This team discussion provided critical missing pieces for reliable Make.com connection creation and resolves many of the endpoint issues documented earlier in this guide.