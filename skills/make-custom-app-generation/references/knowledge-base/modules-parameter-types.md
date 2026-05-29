# Parameter Types and Input Definitions

## Overview

Parameters define the input fields that users see when configuring your Make app modules. The `expect.imljson` file contains an array of parameter definitions that create the user interface.

## Basic Parameter Types

### Text Input
```json
{
    \"name\": \"title\",
    \"type\": \"text\",
    \"label\": \"Title\",
    \"required\": true,
    \"help\": \"Enter a descriptive title\"
}
```

### Password Input
```json
{
    \"name\": \"password\",
    \"type\": \"password\",
    \"label\": \"Password\",
    \"required\": true,
    \"help\": \"Enter your password (will be hidden)\"
}
```

### Number Input
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

### Email Input
```json
{
    \"name\": \"email\",
    \"type\": \"email\",
    \"label\": \"Email Address\",
    \"required\": true,
    \"help\": \"Enter a valid email address\"
}
```

### URL Input
```json
{
    \"name\": \"website\",
    \"type\": \"url\",
    \"label\": \"Website URL\",
    \"required\": false,
    \"help\": \"Enter a complete URL including http:// or https://\"
}
```

### Date Input
```json
{
    \"name\": \"dueDate\",
    \"type\": \"date\",
    \"label\": \"Due Date\",
    \"required\": false,
    \"help\": \"Select the due date\"
}
```

### Boolean (Checkbox)
```json
{
    \"name\": \"isActive\",
    \"type\": \"boolean\",
    \"label\": \"Active\",
    \"default\": true,
    \"help\": \"Check to mark as active\"
}
```

### Textarea
```json
{
    \"name\": \"description\",
    \"type\": \"text\",
    \"label\": \"Description\",
    \"multiline\": true,
    \"rows\": 4,
    \"help\": \"Enter a detailed description\"
}
```

## Select and Options

### Static Select Options
```json
{
    \"name\": \"priority\",
    \"type\": \"select\",
    \"label\": \"Priority\",
    \"required\": true,
    \"options\": [
        {
            \"label\": \"Low\",
            \"value\": \"low\"
        },
        {
            \"label\": \"Medium\",
            \"value\": \"medium\"
        },
        {
            \"label\": \"High\",
            \"value\": \"high\"
        },
        {
            \"label\": \"Critical\",
            \"value\": \"critical\"
        }
    ],
    \"default\": \"medium\"
}
```

### Dynamic Select with RPC
```json
{
    \"name\": \"category\",
    \"type\": \"select\",
    \"label\": \"Category\",
    \"required\": true,
    \"options\": \"rpc://getCategories\",
    \"help\": \"Select a category from your account\"
}
```

### Multi-Select
```json
{
    \"name\": \"tags\",
    \"type\": \"select\",
    \"label\": \"Tags\",
    \"multiple\": true,
    \"options\": \"rpc://getTags\",
    \"help\": \"Select one or more tags\"
}
```

### Dependent Select
```json
{
    \"name\": \"country\",
    \"type\": \"select\",
    \"label\": \"Country\",
    \"options\": \"rpc://getCountries\"
},
{
    \"name\": \"state\",
    \"type\": \"select\",
    \"label\": \"State/Province\",
    \"options\": \"rpc://getStates?country={{parameters.country}}\",
    \"condition\": \"{{parameters.country}}\"
}
```

## Complex Types

### Array Input
```json
{
    \"name\": \"tags\",
    \"type\": \"array\",
    \"label\": \"Tags\",
    \"spec\": {
        \"type\": \"text\",
        \"label\": \"Tag\"
    },
    \"help\": \"Add multiple tags\"
}
```

### Array of Objects
```json
{
    \"name\": \"contacts\",
    \"type\": \"array\",
    \"label\": \"Contacts\",
    \"spec\": {
        \"type\": \"collection\",
        \"spec\": [
            {
                \"name\": \"name\",
                \"type\": \"text\",
                \"label\": \"Name\",
                \"required\": true
            },
            {
                \"name\": \"email\",
                \"type\": \"email\",
                \"label\": \"Email\",
                \"required\": true
            },
            {
                \"name\": \"phone\",
                \"type\": \"text\",
                \"label\": \"Phone\"
            }
        ]
    }
}
```

### Collection (Object)
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
            \"name\": \"state\",
            \"type\": \"text\",
            \"label\": \"State/Province\"
        },
        {
            \"name\": \"zipCode\",
            \"type\": \"text\",
            \"label\": \"ZIP/Postal Code\"
        },
        {
            \"name\": \"country\",
            \"type\": \"select\",
            \"label\": \"Country\",
            \"options\": \"rpc://getCountries\",
            \"default\": \"US\"
        }
    ]
}
```

## File and Buffer Types

### File Buffer
```json
{
    \"name\": \"file\",
    \"type\": \"buffer\",
    \"label\": \"File\",
    \"required\": true,
    \"help\": \"Select a file to upload\"
}
```

### File with Metadata
```json
{
    \"name\": \"document\",
    \"type\": \"collection\",
    \"label\": \"Document\",
    \"spec\": [
        {
            \"name\": \"data\",
            \"type\": \"buffer\",
            \"label\": \"File Data\",
            \"required\": true
        },
        {
            \"name\": \"filename\",
            \"type\": \"text\",
            \"label\": \"File Name\",
            \"required\": true
        },
        {
            \"name\": \"contentType\",
            \"type\": \"text\",
            \"label\": \"Content Type\",
            \"default\": \"application/octet-stream\"
        }
    ]
}
```

## Conditional Fields

### Conditional Display
```json
{
    \"name\": \"type\",
    \"type\": \"select\",
    \"label\": \"Type\",
    \"options\": [
        {
            \"label\": \"Text\",
            \"value\": \"text\"
        },
        {
            \"label\": \"Image\",
            \"value\": \"image\"
        },
        {
            \"label\": \"Video\",
            \"value\": \"video\"
        }
    ]
},
{
    \"name\": \"textContent\",
    \"type\": \"text\",
    \"label\": \"Text Content\",
    \"condition\": \"{{parameters.type === 'text'}}\",
    \"required\": true
},
{
    \"name\": \"imageUrl\",
    \"type\": \"url\",
    \"label\": \"Image URL\",
    \"condition\": \"{{parameters.type === 'image'}}\",
    \"required\": true
},
{
    \"name\": \"videoFile\",
    \"type\": \"buffer\",
    \"label\": \"Video File\",
    \"condition\": \"{{parameters.type === 'video'}}\",
    \"required\": true
}
```

### Nested Conditional Fields
```json
{
    \"name\": \"notificationType\",
    \"type\": \"select\",
    \"label\": \"Notification Type\",
    \"options\": [
        {
            \"label\": \"Email\",
            \"value\": \"email\",
            \"nested\": [
                {
                    \"name\": \"emailAddress\",
                    \"type\": \"email\",
                    \"label\": \"Email Address\",
                    \"required\": true
                },
                {
                    \"name\": \"emailSubject\",
                    \"type\": \"text\",
                    \"label\": \"Subject\",
                    \"required\": true
                }
            ]
        },
        {
            \"label\": \"SMS\",
            \"value\": \"sms\",
            \"nested\": [
                {
                    \"name\": \"phoneNumber\",
                    \"type\": \"text\",
                    \"label\": \"Phone Number\",
                    \"required\": true
                },
                {
                    \"name\": \"smsMessage\",
                    \"type\": \"text\",
                    \"label\": \"Message\",
                    \"required\": true,
                    \"multiline\": true
                }
            ]
        }
    ]
}
```

## Advanced Parameter Features

### Parameter Groups
```json
{
    \"name\": \"basicInfo\",
    \"type\": \"fieldset\",
    \"label\": \"Basic Information\",
    \"spec\": [
        {
            \"name\": \"firstName\",
            \"type\": \"text\",
            \"label\": \"First Name\",
            \"required\": true
        },
        {
            \"name\": \"lastName\",
            \"type\": \"text\",
            \"label\": \"Last Name\",
            \"required\": true
        },
        {
            \"name\": \"email\",
            \"type\": \"email\",
            \"label\": \"Email\",
            \"required\": true
        }
    ]
},
{
    \"name\": \"advancedSettings\",
    \"type\": \"fieldset\",
    \"label\": \"Advanced Settings\",
    \"collapsible\": true,
    \"collapsed\": true,
    \"spec\": [
        {
            \"name\": \"customField1\",
            \"type\": \"text\",
            \"label\": \"Custom Field 1\"
        },
        {
            \"name\": \"customField2\",
            \"type\": \"text\",
            \"label\": \"Custom Field 2\"
        }
    ]
}
```

### Default Values with Functions
```json
{
    \"name\": \"timestamp\",
    \"type\": \"date\",
    \"label\": \"Timestamp\",
    \"default\": \"{{now}}\",
    \"help\": \"Defaults to current date/time\"
},
{
    \"name\": \"id\",
    \"type\": \"text\",
    \"label\": \"Unique ID\",
    \"default\": \"{{uuid()}}\",
    \"help\": \"Auto-generated unique identifier\"
}
```

### Parameter Validation
```json
{
    \"name\": \"username\",
    \"type\": \"text\",
    \"label\": \"Username\",
    \"required\": true,
    \"pattern\": \"^[a-zA-Z0-9_]{3,20}$\",
    \"help\": \"3-20 characters, letters, numbers, and underscores only\"
},
{
    \"name\": \"age\",
    \"type\": \"number\",
    \"label\": \"Age\",
    \"minimum\": 18,
    \"maximum\": 120,
    \"help\": \"Must be between 18 and 120\"
}
```

## Real-World Examples

### Contact Form Parameters
```json
[
    {
        \"name\": \"personalInfo\",
        \"type\": \"fieldset\",
        \"label\": \"Personal Information\",
        \"spec\": [
            {
                \"name\": \"firstName\",
                \"type\": \"text\",
                \"label\": \"First Name\",
                \"required\": true
            },
            {
                \"name\": \"lastName\",
                \"type\": \"text\",
                \"label\": \"Last Name\",
                \"required\": true
            },
            {
                \"name\": \"email\",
                \"type\": \"email\",
                \"label\": \"Email\",
                \"required\": true
            },
            {
                \"name\": \"phone\",
                \"type\": \"text\",
                \"label\": \"Phone Number\"
            }
        ]
    },
    {
        \"name\": \"company\",
        \"type\": \"text\",
        \"label\": \"Company\"
    },
    {
        \"name\": \"source\",
        \"type\": \"select\",
        \"label\": \"Lead Source\",
        \"options\": [
            {\"label\": \"Website\", \"value\": \"website\"},
            {\"label\": \"Social Media\", \"value\": \"social\"},
            {\"label\": \"Referral\", \"value\": \"referral\"},
            {\"label\": \"Advertisement\", \"value\": \"ad\"}
        ]
    },
    {
        \"name\": \"notes\",
        \"type\": \"text\",
        \"label\": \"Notes\",
        \"multiline\": true,
        \"rows\": 3
    }
]
```

### E-commerce Product Parameters
```json
[
    {
        \"name\": \"productDetails\",
        \"type\": \"fieldset\",
        \"label\": \"Product Details\",
        \"spec\": [
            {
                \"name\": \"name\",
                \"type\": \"text\",
                \"label\": \"Product Name\",
                \"required\": true
            },
            {
                \"name\": \"description\",
                \"type\": \"text\",
                \"label\": \"Description\",
                \"multiline\": true,
                \"rows\": 4
            },
            {
                \"name\": \"category\",
                \"type\": \"select\",
                \"label\": \"Category\",
                \"options\": \"rpc://getCategories\",
                \"required\": true
            },
            {
                \"name\": \"tags\",
                \"type\": \"array\",
                \"label\": \"Tags\",
                \"spec\": {
                    \"type\": \"text\",
                    \"label\": \"Tag\"
                }
            }
        ]
    },
    {
        \"name\": \"pricing\",
        \"type\": \"fieldset\",
        \"label\": \"Pricing\",
        \"spec\": [
            {
                \"name\": \"price\",
                \"type\": \"number\",
                \"label\": \"Price\",
                \"required\": true,
                \"minimum\": 0,
                \"step\": 0.01
            },
            {
                \"name\": \"currency\",
                \"type\": \"select\",
                \"label\": \"Currency\",
                \"options\": [
                    {\"label\": \"USD\", \"value\": \"USD\"},
                    {\"label\": \"EUR\", \"value\": \"EUR\"},
                    {\"label\": \"GBP\", \"value\": \"GBP\"}
                ],
                \"default\": \"USD\"
            },
            {
                \"name\": \"salePrice\",
                \"type\": \"number\",
                \"label\": \"Sale Price\",
                \"minimum\": 0,
                \"step\": 0.01
            }
        ]
    },
    {
        \"name\": \"inventory\",
        \"type\": \"fieldset\",
        \"label\": \"Inventory\",
        \"spec\": [
            {
                \"name\": \"sku\",
                \"type\": \"text\",
                \"label\": \"SKU\",
                \"required\": true
            },
            {
                \"name\": \"quantity\",
                \"type\": \"number\",
                \"label\": \"Quantity\",
                \"minimum\": 0,
                \"default\": 0
            },
            {
                \"name\": \"trackInventory\",
                \"type\": \"boolean\",
                \"label\": \"Track Inventory\",
                \"default\": true
            }
        ]
    }
]
```

### Search/Filter Parameters
```json
[
    {
        \"name\": \"query\",
        \"type\": \"text\",
        \"label\": \"Search Query\",
        \"help\": \"Enter keywords to search for\"
    },
    {
        \"name\": \"filters\",
        \"type\": \"fieldset\",
        \"label\": \"Filters\",
        \"collapsible\": true,
        \"spec\": [
            {
                \"name\": \"dateRange\",
                \"type\": \"collection\",
                \"label\": \"Date Range\",
                \"spec\": [
                    {
                        \"name\": \"from\",
                        \"type\": \"date\",
                        \"label\": \"From Date\"
                    },
                    {
                        \"name\": \"to\",
                        \"type\": \"date\",
                        \"label\": \"To Date\"
                    }
                ]
            },
            {
                \"name\": \"status\",
                \"type\": \"select\",
                \"label\": \"Status\",
                \"multiple\": true,
                \"options\": [
                    {\"label\": \"Active\", \"value\": \"active\"},
                    {\"label\": \"Inactive\", \"value\": \"inactive\"},
                    {\"label\": \"Pending\", \"value\": \"pending\"},
                    {\"label\": \"Archived\", \"value\": \"archived\"}
                ]
            },
            {
                \"name\": \"categories\",
                \"type\": \"select\",
                \"label\": \"Categories\",
                \"multiple\": true,
                \"options\": \"rpc://getCategories\"
            }
        ]
    },
    {
        \"name\": \"sorting\",
        \"type\": \"fieldset\",
        \"label\": \"Sorting\",
        \"collapsible\": true,
        \"spec\": [
            {
                \"name\": \"sortBy\",
                \"type\": \"select\",
                \"label\": \"Sort By\",
                \"options\": [
                    {\"label\": \"Created Date\", \"value\": \"created_at\"},
                    {\"label\": \"Updated Date\", \"value\": \"updated_at\"},
                    {\"label\": \"Name\", \"value\": \"name\"},
                    {\"label\": \"Priority\", \"value\": \"priority\"}
                ],
                \"default\": \"created_at\"
            },
            {
                \"name\": \"sortOrder\",
                \"type\": \"select\",
                \"label\": \"Sort Order\",
                \"options\": [
                    {\"label\": \"Ascending\", \"value\": \"asc\"},
                    {\"label\": \"Descending\", \"value\": \"desc\"}
                ],
                \"default\": \"desc\"
            }
        ]
    },
    {
        \"name\": \"limit\",
        \"type\": \"number\",
        \"label\": \"Limit\",
        \"minimum\": 1,
        \"maximum\": 1000,
        \"default\": 100,
        \"help\": \"Maximum number of results to return\"
    }
]
```

## Best Practices

### 1. Clear Labels and Help Text
```json
{
    \"name\": \"webhookUrl\",
    \"type\": \"url\",
    \"label\": \"Webhook URL\",
    \"required\": true,
    \"help\": \"Enter the URL where webhooks should be sent (must be HTTPS)\"
}
```

### 2. Appropriate Default Values
```json
{
    \"name\": \"timeout\",
    \"type\": \"number\",
    \"label\": \"Timeout (seconds)\",
    \"default\": 30,
    \"minimum\": 1,
    \"maximum\": 300
}
```

### 3. Logical Parameter Grouping
```json
{
    \"name\": \"basicSettings\",
    \"type\": \"fieldset\",
    \"label\": \"Basic Settings\",
    \"spec\": [/* basic parameters */]
},
{
    \"name\": \"advancedSettings\",
    \"type\": \"fieldset\",
    \"label\": \"Advanced Settings\",
    \"collapsible\": true,
    \"collapsed\": true,
    \"spec\": [/* advanced parameters */]
}
```

### 4. Input Validation
```json
{
    \"name\": \"email\",
    \"type\": \"email\",
    \"required\": true,
    \"pattern\": \"^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$\"
}
```

### 5. Conditional Logic
```json
{
    \"name\": \"sendNotification\",
    \"type\": \"boolean\",
    \"label\": \"Send Notification\",
    \"default\": false
},
{
    \"name\": \"notificationEmail\",
    \"type\": \"email\",
    \"label\": \"Notification Email\",
    \"condition\": \"{{parameters.sendNotification}}\",
    \"required\": true
}
```

## Common Mistakes

1. **Wrong Type Usage**: Using \"text\" for numbers or dates
2. **Missing Required Fields**: Not marking essential fields as required
3. **Poor Labels**: Using technical names instead of user-friendly labels
4. **Missing Help Text**: Not providing guidance for complex fields
5. **No Validation**: Missing minimum/maximum values or patterns
6. **Inconsistent Naming**: Using different naming conventions
7. **Overly Complex**: Too many parameters in a single module
8. **Missing Defaults**: Not providing sensible default values
9. **Poor Grouping**: Not organizing related parameters together
10. **Conditional Issues**: Incorrect conditional logic for dependent fields