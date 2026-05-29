# Common Patterns and Reusable Snippets

## Overview

This document contains frequently used patterns, code snippets, and configurations that can be reused across different Make apps.

## Authentication Patterns

### API Key in Header
```json
// base.imljson
{
    \"baseUrl\": \"https://api.service.com/v1\",
    \"headers\": {
        \"Authorization\": \"Bearer {{connection.apiKey}}\",
        \"Accept\": \"application/json\"
    }
}

// connections/api-key/parameters.imljson
[{
    \"name\": \"apiKey\",
    \"type\": \"password\",
    \"label\": \"API Key\",
    \"required\": true
}]
```

### Basic Authentication
```json
// base.imljson
{
    \"headers\": {
        \"Authorization\": \"Basic {{base64(connection.username + ':' + connection.password)}}\"
    }
}
```

### Custom Header Authentication
```json
// base.imljson
{
    \"headers\": {
        \"X-API-Key\": \"{{connection.apiKey}}\",
        \"X-Client-ID\": \"{{connection.clientId}}\"
    }
}
```

## Error Handling Patterns

### ⚠️ CRITICAL: Prefer Dynamic Error Handling

**Best Practice:** Use dynamic error handling that extracts actual error messages from the API response instead of hardcoding messages for each status code.

### Dynamic Error Handling (Recommended)
```json
{
    \"response\": {
        \"error\": {
            \"message\": \"[{{statusCode}}] {{body.error || body.message || 'Unknown error'}}\"
        }
    }
}
```

**Why Dynamic is Better:**
- Returns the actual error message from the API
- More accurate and detailed error information
- Easier to maintain
- Adapts to API changes automatically

### Comprehensive Error Handling (Only use when API requires specific handling per status)
```json
{
    \"response\": {
        \"error\": {
            \"400\": {
                \"message\": \"[400] Bad Request: {{body.error.message || body.message}}\",
                \"type\": \"ValidationError\"
            },
            \"401\": {
                \"message\": \"[401] Authentication failed. Please check your credentials.\",
                \"type\": \"AuthenticationError\"
            },
            \"403\": {
                \"message\": \"[403] Access forbidden. Check your permissions.\",
                \"type\": \"PermissionError\"
            },
            \"404\": {
                \"message\": \"[404] Resource not found.\",
                \"type\": \"NotFoundError\"
            },
            \"429\": {
                \"message\": \"[429] Rate limit exceeded. Please try again in {{body.retry_after || 60}} seconds.\",
                \"type\": \"RateLimitError\"
            },
            \"500\": {
                \"message\": \"[500] Internal server error. Please try again later.\",
                \"type\": \"ServerError\"
            },
            \"message\": \"[{{statusCode}}] {{body.error.message || body.message || 'Unknown error'}}\",
            \"type\": \"RuntimeError\"
        }
    }
}
```
**Note:** Only use comprehensive error handling when you need to handle specific status codes differently or add custom types.

### Rate Limit Handling
```json
{
    \"response\": {
        \"error\": {
            \"429\": {
                \"type\": \"RateLimitError\",
                \"message\": \"Rate limit exceeded. {{if(body.retry_after, 'Retry after ' + body.retry_after + ' seconds.', 'Please try again later.')}}\",
                \"retry\": {\
                    \"delay\": \"{{(body.retry_after || 60) * 1000}}\",
                    \"condition\": \"{{statusCode === 429}}\",
                    \"limit\": 3
                }
            }
        }
    }
}
```

## Parameter Patterns

### Required Text Input
```json
{
    \"name\": \"title\",
    \"type\": \"text\",
    \"label\": \"Title\",
    \"required\": true,
    \"help\": \"Enter a descriptive title\"
}
```

### Optional Text with Default
```json
{
    \"name\": \"description\",
    \"type\": \"text\",
    \"label\": \"Description\",
    \"default\": \"No description provided\"
}
```

### Email Validation
```json
{
    \"name\": \"email\",
    \"type\": \"email\",
    \"label\": \"Email Address\",
    \"required\": true,
    \"help\": \"Enter a valid email address\"
}
```

### Number with Limits
```json
{
    \"name\": \"quantity\",
    \"type\": \"number\",
    \"label\": \"Quantity\",
    \"required\": true,
    \"minimum\": 1,
    \"maximum\": 1000,
    \"default\": 1
}
```

### Select with Options
```json
{
    \"name\": \"status\",
    \"type\": \"select\",
    \"label\": \"Status\",
    \"required\": true,
    \"options\": [
        {\"label\": \"Active\", \"value\": \"active\"},
        {\"label\": \"Inactive\", \"value\": \"inactive\"},
        {\"label\": \"Pending\", \"value\": \"pending\"}
    ]
}
```

### Dynamic Select with RPC
```json
{
    \"name\": \"category\",
    \"type\": \"select\",
    \"label\": \"Category\",
    \"options\": \"rpc://getCategories\"
}
```

### Array Input
```json
{
    \"name\": \"tags\",
    \"type\": \"array\",
    \"label\": \"Tags\",
    \"spec\": {
        \"type\": \"text\",
        \"label\": \"Tag\"
    }
}
```

### Collection (Object) Input
```json
{
    \"name\": \"address\",
    \"type\": \"collection\",
    \"label\": \"Address\",
    \"spec\": [
        {
            \"name\": \"street\",
            \"type\": \"text\",
            \"label\": \"Street Address\",
            \"required\": true
        },
        {
            \"name\": \"city\",
            \"type\": \"text\",
            \"label\": \"City\",
            \"required\": true
        },
        {
            \"name\": \"zipCode\",
            \"type\": \"text\",
            \"label\": \"ZIP Code\"
        }
    ]
}
```

### Conditional Fields
```json
{
    \"name\": \"type\",
    \"type\": \"select\",
    \"label\": \"Type\",
    \"options\": [
        {
            \"label\": \"Text\",
            \"value\": \"text\",
            \"nested\": [
                {
                    \"name\": \"textContent\",
                    \"type\": \"text\",
                    \"label\": \"Text Content\",
                    \"required\": true
                }
            ]
        },
        {
            \"label\": \"File\",
            \"value\": \"file\",
            \"nested\": [
                {
                    \"name\": \"fileUrl\",
                    \"type\": \"url\",
                    \"label\": \"File URL\",
                    \"required\": true
                }
            ]
        }
    ]
}
```

## API Call Patterns

### Basic GET Request
```json
{
    \"url\": \"/items/{{parameters.itemId}}\",
    \"method\": \"GET\",
    \"response\": {
        \"output\": \"{{body.data}}\"
    }
}
```

### POST with JSON Body
```json
{
    \"url\": \"/items\",
    \"method\": \"POST\",
    \"headers\": {
        \"Content-Type\": \"application/json\"
    },
    \"body\": {
        \"name\": \"{{parameters.name}}\",
        \"description\": \"{{parameters.description}}\",
        \"active\": \"{{parameters.active || true}}\"
    },
    \"response\": {
        \"output\": \"{{body.data}}\"
    }
}
```

### PUT Request for Updates
```json
{
    \"url\": \"/items/{{parameters.itemId}}\",
    \"method\": \"PUT\",
    \"body\": \"{{removeEmpty(parameters.updates)}}\",
    \"response\": {
        \"output\": \"{{body.data}}\"
    }
}
```

### DELETE Request
```json
{
    \"url\": \"/items/{{parameters.itemId}}\",
    \"method\": \"DELETE\",
    \"response\": {
        \"output\": {
            \"id\": \"{{parameters.itemId}}\",
            \"deleted\": true,
            \"deletedAt\": \"{{now}}\"
        }
    }
}
```

### File Upload
```json
{
    \"url\": \"/files\",
    \"method\": \"POST\",
    \"type\": \"multipart/form-data\",
    \"body\": {
        \"file\": {
            \"value\": \"{{parameters.data}}\",
            \"options\": {
                \"filename\": \"{{parameters.fileName}}\",
                \"contentType\": \"{{parameters.contentType}}\"
            }
        },
        \"metadata\": \"{{stringify(parameters.metadata)}}\"
    }
}
```

## Pagination Patterns

### Offset-Based Pagination
```json
{
    \"url\": \"/items\",
    \"method\": \"GET\",
    \"qs\": {
        \"limit\": \"100\",
        \"offset\": \"{{parameters.offset || 0}}\"
    },
    \"response\": {
        \"iterate\": \"{{body.data}}\",
        \"output\": \"{{item}}\"
    },
    \"pagination\": {
        \"qs\": {
            \"offset\": \"{{body.pagination.next_offset}}\"
        },
        \"condition\": \"{{body.pagination.has_more}}\"
    }
}
```

### Cursor-Based Pagination
```json
{
    \"response\": {
        \"iterate\": \"{{body.data}}\",
        \"output\": \"{{item}}\",
        \"temp\": {
            \"nextCursor\": \"{{last(body.data).id}}\"
        }
    },
    \"pagination\": {
        \"qs\": {
            \"cursor\": \"{{temp.nextCursor}}\"
        },
        \"condition\": \"{{body.has_more}}\"
    }
}
```

### Page-Based Pagination
```json
{
    \"qs\": {
        \"page\": \"{{parameters.page || 1}}\",
        \"per_page\": \"100\"
    },
    \"pagination\": {
        \"qs\": {
            \"page\": \"{{body.pagination.current_page + 1}}\"
        },
        \"condition\": \"{{body.pagination.current_page < body.pagination.total_pages}}\"
    }
}
```

## Search Patterns

### Basic Search
```json
{
    \"url\": \"/search\",
    \"method\": \"GET\",
    \"qs\": {
        \"q\": \"{{parameters.query}}\",
        \"limit\": \"{{parameters.limit || 100}}\"
    },
    \"response\": {
        \"iterate\": \"{{body.results}}\",
        \"output\": \"{{item}}\"
    }
}
```

### Advanced Search with Filters
```json
{
    \"qs\": {
        \"q\": \"{{parameters.query}}\",
        \"category\": \"{{parameters.category}}\",
        \"status\": \"{{parameters.status}}\",
        \"created_after\": \"{{parameters.dateRange.from}}\",
        \"created_before\": \"{{parameters.dateRange.to}}\",
        \"sort\": \"{{parameters.sortBy || 'created_at'}}\",
        \"order\": \"{{parameters.sortOrder || 'desc'}}\"
    }
}
```

### Search with Custom Fields
```json
{
    \"qs\": {
        \"fields\": \"{{join(parameters.fields, ',')}}\",
        \"include\": \"{{join(parameters.include, ',')}}\",
        \"exclude\": \"{{join(parameters.exclude, ',')}}\"
    }
}
```

## Response Processing Patterns

### ⚠️ CRITICAL: Avoid Unnecessary Output Wrappers

**Best Practice:** Output the API response body directly without wrapping it in an unnecessary object unless you need to transform the data.

### Direct Output (Recommended)
```json
{
    \"response\": {
        \"output\": \"{{body}}\"
    }
}
```

**Why Direct Output is Better:**
- Cleaner data structure in Make.com workflows
- Easier for users to work with the data
- Less nesting means simpler mappings
- Preserves the original API response structure

### Simple Output Mapping (When transformation is needed)
```json
{
    \"response\": {
        \"output\": {
            \"id\": \"{{body.id}}\",
            \"name\": \"{{body.name}}\",
            \"status\": \"{{body.status}}\",
            \"createdAt\": \"{{body.created_at}}\"
        }
    }
}
```

**Only use mapping when:**
- You need to rename fields for clarity
- You need to transform or compute values
- You need to extract specific nested fields
- The API returns inconsistent structures

### Nested Data Extraction
```json
{
    \"response\": {
        \"output\": {
            \"id\": \"{{body.data.id}}\",
            \"user\": {
                \"name\": \"{{body.data.user.name}}\",
                \"email\": \"{{body.data.user.email}}\"
            },
            \"metadata\": \"{{body.data.attributes}}\"
        }
    }
}
```

### Array Processing
```json
{
    \"response\": {
        \"iterate\": \"{{body.items}}\",
        \"output\": {
            \"id\": \"{{item.id}}\",
            \"title\": \"{{item.title}}\",
            \"tags\": \"{{map(item.tags, 'name')}}\"
        }
    }
}
```

### Conditional Output
```json
{
    \"response\": {
        \"output\": {
            \"id\": \"{{body.id}}\",
            \"name\": \"{{body.name}}\",
            \"email\": \"{{if(body.email_public, body.email, 'Private')}}\",
            \"avatar\": \"{{if(body.avatar, body.avatar.url, null)}}\"
        }
    }
}
```

## Webhook Patterns

### Basic Webhook Registration
```json
// webhooks/events/attach.imljson
{
    \"url\": \"/webhooks\",
    \"method\": \"POST\",
    \"body\": {
        \"url\": \"{{webhook.url}}\",
        \"events\": [\"item.created\", \"item.updated\", \"item.deleted\"]
    },
    \"response\": {
        \"data\": {
            \"hookId\": \"{{body.id}}\",
            \"secret\": \"{{body.secret}}\"
        }
    }
}

// webhooks/events/detach.imljson
{
    \"url\": \"/webhooks/{{webhook.hookId}}\",
    \"method\": \"DELETE\"
}
```

### Webhook with Event Filtering
```json
// webhooks/events/attach.imljson
{
    \"body\": {
        \"url\": \"{{webhook.url}}\",
        \"events\": \"{{parameters.events}}\",
        \"filters\": {
            \"status\": \"{{parameters.statusFilter}}\",
            \"category\": \"{{parameters.categoryFilter}}\"
        }
    }
}
```

### Webhook Response Processing
```json
// modules/webhook-trigger/interface.imljson
[
    {
        \"name\": \"event\",
        \"type\": \"text\",
        \"label\": \"Event Type\"
    },
    {
        \"name\": \"data\",
        \"type\": \"collection\",
        \"label\": \"Event Data\",
        \"spec\": [
            {\"name\": \"id\", \"type\": \"text\", \"label\": \"ID\"},
            {\"name\": \"name\", \"type\": \"text\", \"label\": \"Name\"},
            {\"name\": \"status\", \"type\": \"text\", \"label\": \"Status\"}
        ]
    },
    {
        \"name\": \"timestamp\",
        \"type\": \"date\",
        \"label\": \"Event Timestamp\"
    }
]
```

## Function Patterns

### Remove Empty Values
```javascript
// functions/removeEmpty/code.js
function removeEmpty(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.filter(item => item !== null && item !== undefined && item !== '');
    }
    
    const result = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && 
            obj[key] !== null && 
            obj[key] !== undefined && 
            obj[key] !== '') {
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                const cleaned = removeEmpty(obj[key]);
                if (Object.keys(cleaned).length > 0) {
                    result[key] = cleaned;
                }
            } else {
                result[key] = obj[key];
            }
        }
    }
    return result;
}
```

### Format Date
```javascript
// functions/formatDate/code.js
function formatDate(dateString, format = 'YYYY-MM-DD') {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}
```

### Validate Email
```javascript
// functions/validateEmail/code.js
function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
}
```

## RPC Patterns

### Simple Options List
```json
// rpcs/getStatuses/api.imljson
{
    \"url\": \"/statuses\",
    \"method\": \"GET\",
    \"response\": {
        \"iterate\": \"{{body.data}}\",
        \"output\": {
            \"label\": \"{{item.name}}\",
            \"value\": \"{{item.id}}\"
        }
    }
}
```

### Dependent Dropdown
```json
// rpcs/getCategoriesByType/api.imljson
{
    \"url\": \"/categories\",
    \"method\": \"GET\",
    \"qs\": {
        \"type\": \"{{parameters.type}}\"
    },
    \"response\": {
        \"iterate\": \"{{body.data}}\",
        \"output\": {
            \"label\": \"{{item.name}}\",
            \"value\": \"{{item.id}}\",
            \"description\": \"{{item.description}}\"
        }
    }
}
```

### Hierarchical Options
```json
{
    \"response\": {
        \"iterate\": \"{{body.categories}}\",
        \"output\": {
            \"label\": \"{{item.name}}\",
            \"value\": \"{{item.id}}\",
            \"group\": \"{{item.parent.name}}\",
            \"nested\": \"{{map(item.subcategories, 'id')}}\"
        }
    }
}
```

## Validation Patterns

### Required Field Validation
```json
{
    \"response\": {
        \"valid\": {
            \"condition\": \"{{parameters.email && parameters.name}}\",
            \"message\": \"Email and name are required fields\"
        }
    }
}
```

### Format Validation
```json
{
    \"response\": {
        \"valid\": {
            \"condition\": \"{{validateEmail(parameters.email)}}\",
            \"message\": \"Please enter a valid email address\",
            \"type\": \"ValidationError\"
        }
    }
}
```

### Range Validation
```json
{
    \"response\": {
        \"valid\": {
            \"condition\": \"{{parameters.quantity >= 1 && parameters.quantity <= 1000}}\",
            \"message\": \"Quantity must be between 1 and 1000\"
        }
    }
}
```

## State Management Patterns

### Simple State Tracking
```json
{
    \"response\": {
        \"state\": {
            \"lastProcessed\": \"{{max(map(body.items, 'updated_at'))}}\",
            \"totalProcessed\": \"{{(state.totalProcessed || 0) + length(body.items)}}\"
        }
    }
}
```

### Deduplication State
```json
{
    \"response\": {
        \"state\": {
            \"processedIds\": \"{{union(state.processedIds || [], map(body.items, 'id'))}}\",
            \"lastRun\": \"{{now}}\"
        }
    },
    \"filter\": {
        \"condition\": \"{{!contains(state.processedIds || [], item.id)}}\"
    }
}
```

## Common Interface Patterns

### Basic Output Interface
```json
[
    {\"name\": \"id\", \"type\": \"text\", \"label\": \"ID\"},
    {\"name\": \"name\", \"type\": \"text\", \"label\": \"Name\"},
    {\"name\": \"status\", \"type\": \"text\", \"label\": \"Status\"},
    {\"name\": \"createdAt\", \"type\": \"date\", \"label\": \"Created At\"},
    {\"name\": \"updatedAt\", \"type\": \"date\", \"label\": \"Updated At\"}
]
```

### Rich Output Interface
```json
[
    {\"name\": \"id\", \"type\": \"text\", \"label\": \"ID\"},
    {\"name\": \"title\", \"type\": \"text\", \"label\": \"Title\"},
    {\"name\": \"description\", \"type\": \"text\", \"label\": \"Description\"},
    {\"name\": \"author\", \"type\": \"collection\", \"label\": \"Author\", \"spec\": [
        {\"name\": \"name\", \"type\": \"text\", \"label\": \"Name\"},
        {\"name\": \"email\", \"type\": \"email\", \"label\": \"Email\"}
    ]},
    {\"name\": \"tags\", \"type\": \"array\", \"label\": \"Tags\", \"spec\": {\"type\": \"text\"}},
    {\"name\": \"metadata\", \"type\": \"collection\", \"label\": \"Metadata\"}
]
```

## Universal Module Patterns

### ⚠️ CRITICAL: "Make an API Call" Module Must Repeat Root URL

**Best Practice:** Universal "Make an API Call" modules should concatenate the base URL with the user-provided endpoint path.

### Incorrect Pattern (Don't Use)
```json
{
    \"url\": \"{{parameters.url}}\",
    \"method\": \"{{parameters.method}}\"
}
```

**Problem:** Users must enter full URLs, risking errors and wrong environments.

### Correct Pattern (Recommended)
```json
{
    \"url\": \"https://api.example.com/v1{{parameters.url}}\",
    \"method\": \"{{parameters.method}}\",
    \"headers\": {
        \"{{...}}\": \"{{toCollection(parameters.headers, 'key', 'value')}}\"
    },
    \"qs\": {
        \"{{...}}\": \"{{toCollection(parameters.qs, 'key', 'value')}}\"
    },
    \"body\": \"{{parameters.body}}\",
    \"type\": \"{{parameters.type}}\",
    \"response\": {
        \"output\": {
            \"body\": \"{{body}}\",
            \"headers\": \"{{headers}}\",
            \"statusCode\": \"{{statusCode}}\"
        }
    }
}
```

### Dynamic Base URL Pattern
```json
{
    \"url\": \"https://{{if(connection.environment = 'production', 'api', 'sandbox')}}.example.com/v1{{parameters.url}}\",
    \"method\": \"{{parameters.method}}\"
}
```

**Benefits:**
- ✅ Users only enter endpoint paths: `/users`, `/accounts`, etc.
- ✅ Automatic environment switching (sandbox/production)
- ✅ Prevents wrong base URL errors
- ✅ Consistent with base.imljson configuration
- ✅ Better user experience

**Example:**
- User input: `/accounts`
- Actual call: `https://api.example.com/v1/accounts`

## Logging and Security Patterns

### Comprehensive Logging Sanitization
```json
{
    \"log\": {
        \"sanitize\": [
            \"request.headers.authorization\",
            \"request.body.password\",
            \"request.body.client_secret\",
            \"request.body.api_key\",
            \"response.body.access_token\",
            \"response.body.refresh_token\",
            \"request.headers.x-api-key\",
            \"request.body.webhook_secret\"
        ]
    }
}
```

### Request ID Tracking
```json
{
    \"headers\": {
        \"X-Request-ID\": \"{{uuid()}}\",
        \"X-Client-Version\": \"1.0.0\"
    }
}
```

## Quick Reference Templates

### New Action Module Template
```bash
mkdir modules/new-action
# Create: metadata.json, api.imljson, expect.imljson, interface.imljson
```

### New Search Module Template
```bash
mkdir modules/search-items
# Create: metadata.json, api.imljson, expect.imljson, interface.imljson
```

### New Webhook Module Template
```bash
mkdir modules/webhook-trigger
mkdir webhooks/service-webhook
# Create webhook attach/detach and module interface
```

These patterns provide a solid foundation for building Make apps efficiently and consistently.