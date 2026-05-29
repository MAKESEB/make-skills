# Module Patterns and Types

## Overview

Modules are the core functionality units of Make apps. They define what actions users can perform, what data they can search for, and what events they can listen to.

## Module Types

1. **Action** - Perform operations (create, update, delete)
2. **Search** - Find and retrieve data
3. **Instant Trigger** - Real-time event notifications via webhooks
4. **Polling Trigger** - Periodic data checking
5. **Responder** - Handle webhook responses

## Required Universal Module and Production Completeness

Generated apps should include a universal **Make an API Call** module (`typeId: 12`) as a mandatory fallback. It lets users call newly added or low-priority endpoints that were not mapped into first-class modules yet.

That fallback is not enough for a production-ready app. A production-ready app must also include specific modules generated from real API endpoints: searches for list endpoints, actions for read/create/update/delete/status endpoints, and triggers/webhooks where supported. Universal-only apps must be explicitly labeled as minimal shell/scaffold apps in their README or generation report.

Generator rule: never treat `modules/make-api-call` as the endpoint matrix. Build or extract the real endpoint matrix first, then emit specific module folders for the mapped endpoints.

## Action Modules

Actions perform operations on the target service.

### Basic Create Action
```json
// modules/create-contact/metadata.json
{
    "name": "create-contact",
    "label": "Create Contact",
    "description": "Creates a new contact in your CRM",
    "connection": "api-key",
    "type": "action"
}

// modules/create-contact/api.imljson
{
    "url": "/contacts",
    "method": "POST",
    "body": {
        "first_name": "{{parameters.firstName}}",
        "last_name": "{{parameters.lastName}}",
        "email": "{{parameters.email}}",
        "phone": "{{parameters.phone}}",
        "company": "{{parameters.company}}",
        "tags": "{{parameters.tags}}"
    },
    "response": {
        "output": "{{body.data}}"
    }
}

// modules/create-contact/expect.imljson
[
    {
        "name": "firstName",
        "type": "text",
        "label": "First Name",
        "required": true
    },
    {
        "name": "lastName",
        "type": "text",
        "label": "Last Name",
        "required": true
    },
    {
        "name": "email",
        "type": "email",
        "label": "Email",
        "required": true
    },
    {
        "name": "phone",
        "type": "text",
        "label": "Phone"
    },
    {
        "name": "company",
        "type": "text",
        "label": "Company"
    },
    {
        "name": "tags",
        "type": "array",
        "label": "Tags",
        "spec": {
            "type": "text",
            "label": "Tag"
        }
    }
]

// modules/create-contact/interface.imljson
[
    {
        "name": "id",
        "type": "text",
        "label": "ID"
    },
    {
        "name": "firstName",
        "type": "text",
        "label": "First Name"
    },
    {
        "name": "lastName",
        "type": "text",
        "label": "Last Name"
    },
    {
        "name": "email",
        "type": "email",
        "label": "Email"
    },
    {
        "name": "createdAt",
        "type": "date",
        "label": "Created At"
    }
]
```

### Update Action with Conditional Fields
```json
// modules/update-contact/expect.imljson
[
    {
        "name": "contactId",
        "type": "text",
        "label": "Contact ID",
        "required": true
    },
    {
        "name": "updateFields",
        "type": "collection",
        "label": "Fields to Update",
        "spec": [
            {
                "name": "firstName",
                "type": "text",
                "label": "First Name"
            },
            {
                "name": "lastName",
                "type": "text",
                "label": "Last Name"
            },
            {
                "name": "email",
                "type": "email",
                "label": "Email"
            },
            {
                "name": "status",
                "type": "select",
                "label": "Status",
                "options": "rpc://getContactStatuses"
            }
        ]
    }
]

// modules/update-contact/api.imljson
{
    "url": "/contacts/{{parameters.contactId}}",
    "method": "PUT",
    "body": "{{removeEmpty(parameters.updateFields)}}",
    "response": {
        "output": "{{body.data}}"
    }
}
```

### File Upload Action
```json
// modules/upload-file/api.imljson
{
    "url": "/files",
    "method": "POST",
    "type": "multipart/form-data",
    "body": {
        "file": {
            "value": "{{parameters.data}}",
            "options": {
                "filename": "{{parameters.fileName}}",
                "contentType": "{{parameters.contentType}}"
            }
        },
        "folder_id": "{{parameters.folderId}}",
        "description": "{{parameters.description}}"
    },
    "response": {
        "output": "{{body.data}}"
    }
}

// modules/upload-file/expect.imljson
[
    {
        "name": "data",
        "type": "buffer",
        "label": "File Data",
        "required": true
    },
    {
        "name": "fileName",
        "type": "text",
        "label": "File Name",
        "required": true
    },
    {
        "name": "contentType",
        "type": "text",
        "label": "Content Type",
        "default": "application/octet-stream"
    },
    {
        "name": "folderId",
        "type": "select",
        "label": "Folder",
        "options": "rpc://getFolders"
    },
    {
        "name": "description",
        "type": "text",
        "label": "Description"
    }
]
```

## Search Modules

Search modules find and retrieve data from the target service.

### Basic Search
```json
// modules/search-contacts/metadata.json
{
    "name": "search-contacts",
    "label": "Search Contacts",
    "description": "Search for contacts by various criteria",
    "connection": "api-key",
    "type": "search"
}

// modules/search-contacts/api.imljson
{
    "url": "/contacts",
    "method": "GET",
    "qs": {
        "q": "{{parameters.query}}",
        "email": "{{parameters.email}}",
        "company": "{{parameters.company}}",
        "limit": "{{parameters.limit || 100}}"
    },
    "response": {
        "iterate": "{{body.data}}",
        "output": "{{item}}"
    }
}

// modules/search-contacts/expect.imljson
[
    {
        "name": "query",
        "type": "text",
        "label": "Search Query",
        "help": "Search by name, email, or company"
    },
    {
        "name": "email",
        "type": "email",
        "label": "Email",
        "help": "Search by specific email address"
    },
    {
        "name": "company",
        "type": "text",
        "label": "Company",
        "help": "Search by company name"
    },
    {
        "name": "limit",
        "type": "number",
        "label": "Limit",
        "default": 100,
        "minimum": 1,
        "maximum": 1000
    }
]
```

### Paginated Search
```json
// modules/search-all-contacts/api.imljson
{
    "url": "/contacts",
    "method": "GET",
    "qs": {
        "limit": "100",
        "offset": "{{parameters.offset || 0}}",
        "sort": "{{parameters.sortBy || 'created_at'}}",
        "order": "{{parameters.sortOrder || 'desc'}}"
    },
    "response": {
        "iterate": "{{body.data}}",
        "output": "{{item}}"
    },
    "pagination": {
        "qs": {
            "offset": "{{body.pagination.next_offset}}"
        },
        "condition": "{{body.pagination.has_more}}"
    }
}
```

### Advanced Search with Filters
```json
// modules/advanced-search/expect.imljson
[
    {
        "name": "filters",
        "type": "collection",
        "label": "Search Filters",
        "spec": [
            {
                "name": "dateRange",
                "type": "collection",
                "label": "Date Range",
                "spec": [
                    {
                        "name": "from",
                        "type": "date",
                        "label": "From Date"
                    },
                    {
                        "name": "to",
                        "type": "date",
                        "label": "To Date"
                    }
                ]
            },
            {
                "name": "status",
                "type": "select",
                "label": "Status",
                "options": [
                    {
                        "label": "Active",
                        "value": "active"
                    },
                    {
                        "label": "Inactive",
                        "value": "inactive"
                    },
                    {
                        "label": "Pending",
                        "value": "pending"
                    }
                ]
            },
            {
                "name": "tags",
                "type": "array",
                "label": "Tags",
                "spec": {
                    "type": "text",
                    "label": "Tag"
                }
            }
        ]
    }
]
```

## Instant Trigger Modules

Instant triggers use webhooks to provide real-time notifications.

### Basic Webhook Trigger
```json
// modules/new-contact/metadata.json
{
    "name": "new-contact",
    "label": "New Contact",
    "description": "Triggers when a new contact is created",
    "webhook": "contact-webhook",
    "type": "instant_trigger"
}

// modules/new-contact/interface.imljson
[
    {
        "name": "event",
        "type": "text",
        "label": "Event Type"
    },
    {
        "name": "contact",
        "type": "collection",
        "label": "Contact Data",
        "spec": [
            {
                "name": "id",
                "type": "text",
                "label": "ID"
            },
            {
                "name": "firstName",
                "type": "text",
                "label": "First Name"
            },
            {
                "name": "lastName",
                "type": "text",
                "label": "Last Name"
            },
            {
                "name": "email",
                "type": "email",
                "label": "Email"
            },
            {
                "name": "createdAt",
                "type": "date",
                "label": "Created At"
            }
        ]
    }
]
```

### Webhook with Event Filtering
```json
// modules/contact-events/expect.imljson
[
    {
        "name": "events",
        "type": "array",
        "label": "Events to Watch",
        "required": true,
        "spec": {
            "type": "select",
            "label": "Event",
            "options": [
                {
                    "label": "Contact Created",
                    "value": "contact.created"
                },
                {
                    "label": "Contact Updated",
                    "value": "contact.updated"
                },
                {
                    "label": "Contact Deleted",
                    "value": "contact.deleted"
                }
            ]
        }
    }
]
```

## Polling Trigger Modules

Polling triggers check for new data periodically.

### Basic Polling Trigger
```json
// modules/watch-new-contacts/metadata.json
{
    "name": "watch-new-contacts",
    "label": "Watch New Contacts",
    "description": "Triggers when new contacts are added",
    "connection": "api-key",
    "type": "trigger"
}

// modules/watch-new-contacts/api.imljson
{
    "url": "/contacts",
    "method": "GET",
    "qs": {
        "created_after": "{{state.lastCheck || subtractDays(now, 1)}}",
        "limit": "100",
        "sort": "created_at",
        "order": "asc"
    },
    "response": {
        "iterate": "{{body.data}}",
        "output": "{{item}}",
        "state": {
            "lastCheck": "{{max(map(body.data, 'created_at'))}}"
        }
    }
}
```

### Polling with Deduplication
```json
// modules/watch-updated-contacts/api.imljson
{
    "url": "/contacts",
    "method": "GET",
    "qs": {
        "updated_after": "{{state.lastCheck || subtractDays(now, 1)}}",
        "limit": "100"
    },
    "response": {
        "iterate": "{{body.data}}",
        "output": "{{item}}",
        "state": {
            "lastCheck": "{{max(map(body.data, 'updated_at'))}}",
            "processedIds": "{{union(state.processedIds, map(body.data, 'id'))}}"
        }
    },
    "filter": {
        "condition": "{{!contains(state.processedIds, item.id)}}"
    }
}
```

## Parameter Processing

Use `parameters.imljson` for complex parameter transformations.

### Basic Parameter Processing
```json
// modules/create-contact/parameters.imljson
[
    {
        "name": "fullName",
        "type": "text",
        "label": "Full Name",
        "required": true
    },
    {
        "name": "firstName",
        "type": "hidden",
        "value": "{{trim(split(parameters.fullName, ' ')[0])}}"
    },
    {
        "name": "lastName",
        "type": "hidden",
        "value": "{{trim(join(slice(split(parameters.fullName, ' '), 1), ' '))}}"
    },
    {
        "name": "cleanEmail",
        "type": "hidden",
        "value": "{{lower(trim(parameters.email))}}"
    }
]
```

### Complex Data Transformation
```json
// modules/process-data/parameters.imljson
[
    {
        "name": "customFields",
        "type": "collection",
        "label": "Custom Fields",
        "spec": [
            {
                "name": "key",
                "type": "text",
                "label": "Field Name"
            },
            {
                "name": "value",
                "type": "text",
                "label": "Field Value"
            }
        ]
    },
    {
        "name": "processedCustomFields",
        "type": "hidden",
        "value": "{{arrayToObject(parameters.customFields, 'key', 'value')}}"
    }
]
```

## Real-World Module Examples

### Slack Send Message
```json
// modules/send-message/api.imljson
{
    "url": "/chat.postMessage",
    "method": "POST",
    "body": {
        "channel": "{{parameters.channel}}",
        "text": "{{parameters.text}}",
        "username": "{{parameters.username}}",
        "icon_emoji": "{{parameters.iconEmoji}}",
        "attachments": "{{parameters.attachments}}",
        "thread_ts": "{{parameters.threadTs}}"
    },
    "response": {
        "output": "{{body}}"
    }
}
```

### Gmail Send Email
```json
// modules/send-email/api.imljson
{
    "url": "/gmail/v1/users/me/messages/send",
    "method": "POST",
    "body": {
        "raw": "{{base64(compileEmail(parameters))}}"
    },
    "response": {
        "output": "{{body}}"
    }
}
```

### Stripe Create Payment Intent
```json
// modules/create-payment-intent/api.imljson
{
    "url": "/payment_intents",
    "method": "POST",
    "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    "body": {
        "amount": "{{parameters.amount}}",
        "currency": "{{parameters.currency}}",
        "customer": "{{parameters.customer}}",
        "description": "{{parameters.description}}",
        "metadata": "{{parameters.metadata}}"
    },
    "response": {
        "output": "{{body}}"
    }
}
```

## Best Practices

1. **Clear Module Names**: Use descriptive, action-oriented names
2. **Proper Types**: Use appropriate module types (action, search, trigger)
3. **Input Validation**: Validate required parameters
4. **Error Handling**: Include proper error handling in API calls
5. **Response Mapping**: Map API responses to useful output structures
6. **Pagination Support**: Implement pagination for large datasets
7. **State Management**: Use state for triggers and polling
8. **Parameter Processing**: Transform parameters when needed
9. **Sample Data**: Include realistic sample data for testing
10. **Documentation**: Provide clear descriptions and help text

## Common Module Patterns

### CRUD Operations
- **Create**: POST requests with form data
- **Read**: GET requests with ID parameter
- **Update**: PUT/PATCH requests with update data
- **Delete**: DELETE requests with ID parameter

### List Operations
- **List All**: GET requests with pagination
- **Search**: GET requests with query parameters
- **Filter**: GET requests with filter parameters

### File Operations
- **Upload**: POST with multipart/form-data
- **Download**: GET with file response
- **Delete**: DELETE with file ID

### Webhook Operations
- **Register**: POST to create webhook
- **Receive**: Process incoming webhook data
- **Unregister**: DELETE to remove webhook