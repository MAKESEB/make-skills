## Modules (Actions, Triggers, Searches)-01

**Description**
A polling trigger (`typeId: 1`) periodically calls an API endpoint to check for new or updated items. It uses pagination to handle large result sets and a `trigger` object within the `response` to manage state, using a unique ID and a timestamp for deduplication and ordering.

**⚠️ Critical Warnings**
- The `trigger.id` must be a unique identifier for each item to prevent processing duplicates or skipping items.
- The `trigger.date` field must be reliably ordered, and the `order` property ('asc' or 'desc') must match the API's sorting behavior.
- The API's pagination mechanism must be correctly implemented in the `pagination` object to avoid missing records between cycles.

**Example**
```json
{
  "watchRecords": {
    "typeId": 1,
    "api": {
      "url": "/v0/apps/{{connection.app}}/collections/{{connection.collection}}",
      "method": "GET",
      "qs": {
        "limit": 100,
        "offset": 0
      },
      "response": {
        "iterate": "{{body.records}}",
        "trigger": {
          "id": "{{item.id}}",
          "date": "{{switch(parameters.select, 'create', item.created_at, 'update', item.updated_at)}}",
          "type": "date",
          "order": "asc"
        },
        "output": "{{item}}",
        "limit": "{{parameters.limit}}"
      },
      "pagination": {
        "qs": {
          "offset": "{{(pagination.page - 1) * 100}}"
        }
      }
    },
    "parameters": [
      {
        "name": "select",
        "type": "select",
        "label": "Watch Records",
        "options": [
          {
            "label": "By Created Time",
            "value": "create"
          },
          {
            "label": "By Updated Time",
            "value": "update"
          }
        ]
      }
    ]
  }
}
```

**Implementation Steps**
{
  "watchNewItems": {
    "label": "Watch New Items",
    "typeId": 1,
    "api": {
      "url": "/v1/items",
      "method": "GET",
      "response": {
        "iterate": "{{body.data}}",
        "trigger": {
          "id": "{{item.id}}",
          "date": "{{item.created_at}}",
          "type": "date",
          "order": "asc"
        },
        "output": "{{item}}",
        "limit": "{{parameters.limit}}"
      }
    },
    "parameters": [
      {
        "name": "limit",
        "type": "uinteger",
        "label": "Limit",
        "default": 10,
        "required": true
      }
    ]
  }
}

**Real-World Examples**
- `"iterate": "{{body.records}}"`
- `"id": "{{item.id}}"`
- `"date": "{{switch(parameters.select, 'create', item.created_at, 'update', item.updated_at)}}"`

**Platform Notes**
- Polling triggers are identified by `typeId: 1`.
- The `epoch` object defines how the trigger behaves when being initialized, allowing it to fetch historical data to establish a starting point.
- The platform automatically handles storing the last known `id` and `date` based on the `trigger` object's configuration.

**Source files**
_modules.watchRecords

---

## Modules (Actions, Triggers, Searches)-02

**Description**
Create a polling trigger that watches for new or updated records. This pattern uses a designated timestamp field to fetch records incrementally, stores the state between runs, and dynamically generates the output interface based on the table's schema.

**⚠️ Critical Warnings**
- The trigger relies on a 'Trigger field' (e.g., 'Last Modified Time'). If this field is not available or correctly configured in the source table, the trigger will not function correctly.
- The `filterByFormula` can become complex. Incorrect syntax can cause the trigger to fail or miss records silently.
- The `trigger.id` must be unique for each record to prevent processing duplicates. The `trigger.date` must be the value from the designated trigger field.

**Example**
```json
{
    "name": "TriggerWatchRecords",
    "typeId": 1,
    "api": [
        {
            "url": "/{{parameters.base}}/{{encodeURL(parameters.table)}}",
            "qs": {
                "sort[0][field]": "{{parameters.config.triggerField}}",
                "sort[0][direction]": "desc",
                "filterByFormula": "AND(NOT({{'{' + parameters.config.triggerField + '}'}} = BLANK()),{{if(parameters.formula, ',' + parameters.formula)}})"
            },
            "response": {
                "limit": "{{parameters.maxRecords}}",
                "iterate": "{{body.records}}",
                "output": "{{processRecord(item, temp.schema)}}",
                "trigger": {
                    "id": "{{item.id}}",
                    "date": "{{safeGet(item.fields, parameters.config.triggerField)}}",
                    "type": "date",
                    "order": "desc"
                }
            }
        }
    ],
    "interface": [
        "rpc://app%23airtable-test@1/RpcGetSchema?for=interface"
    ]
}
```

**Implementation Steps**
1. Create a new module with `typeId: 1`.
2. In the `api.qs`, define sorting based on a timestamp field (e.g., `sort[0][field]`). Use `filterByFormula` to only poll for records created/updated after the last execution (Make handles this implicitly when `response.trigger` is configured).
3. In `api.response`, set `iterate` to the records array in the response.
4. Define the `response.trigger` object, mapping the record's unique ID to `id` and its timestamp to `date`. Set `type: "date"` and `order: "desc"`.
5. To create a dynamic output interface, set the `interface` property to an RPC call that returns a valid interface specification (e.g., `rpc://RpcGetSchema?for=interface`).

**Real-World Examples**
- `Incremental Fetching: Uses a formula `filterByFormula` combined with sorting by a 'Last Modified Time' field to only fetch records updated since the last run.`
- `Dynamic Interface: The module's output fields are not hardcoded. Instead, `"interface": ["rpc://RpcGetSchema?for=interface"]` calls an RPC to build the output specification based on the user's selected table.`
- `State Management: The `response.trigger` object tells the Make.com engine which field to use for dating (`date`), what the unique ID is (`id`), and how to order records (`order`) to manage the state of what has been processed.`

**Platform Notes**
- For polling triggers, set `typeId: 1`.
- The `response.trigger` object is essential for the Make.com engine to handle incremental fetching. It needs `id`, `date`, `type: 'date'`, and `order`.
- Using a custom IML function like `processRecord` in `response.output` allows for standardizing the output format, especially when column names need to be mapped to column IDs for stability.
- The `epoch` definition in the module is used to fetch sample data for mapping in the scenario editor.

**Source files**
_modules.TriggerWatchRecords

---

## Modules (Actions, Triggers, Searches)-03

**Description**
Implement a polling trigger that watches for new records by querying for items based on a timestamp. This pattern requires a field in the target object that reliably indicates creation or update time (e.g., 'Created Time'). The trigger sorts records by this field in descending order and processes them, with the platform automatically storing the unique ID and timestamp of the last processed item to use as a baseline for the next poll.

**⚠️ Critical Warnings**
- This pattern is entirely dependent on the user having a suitable, sortable date/time field (like a 'Created Time' field) in their data structure. If not present, the trigger will not function correctly and may miss or duplicate data.
- Polling triggers are less efficient and consume more operations than webhook-based triggers. This can be costly at high volumes.
- If multiple records share the exact same timestamp, some may be missed if the result limit is reached before all are processed in one poll.

**Example**
```json
{
    "name": "TriggerWatchRecords",
    "typeId": 1,
    "label": "Watch records",
    "api": {
        "url": "/{{encodeTable(parameters.table)}}",
        "qs": {
            "pageSize": 100,
            "sort[0][field]": "{{parameters.config.triggerField}}",
            "sort[0][direction]": "desc"
        },
        "response": {
            "limit": "{{parameters.maxRecords}}",
            "output": "{{processRecord(item)}}",
            "iterate": "{{body.records}}",
            "trigger": {
                "id": "{{item.id}}",
                "date": "{{get(item.fields, parameters.config.triggerField)}}",
                "type": "date",
                "order": "desc"
            }
        },
        "pagination": {
            "qs": {
                "offset": "{{body.offset}}"
            },
            "condition": "{{body.offset}}"
        }
    }
}
```

**Implementation Steps**
1. In the module definition, set `typeId: 1` to define it as a trigger.
2. In the `api` configuration, use the `qs` property to sort results by a date field in `desc` order, e.g., `{"sort[0][field]": "{{parameters.triggerField}}", "sort[0][direction]": "desc"}`.
3. In the `response` object, define a `trigger` object. Map the unique ID of the record to `id` and the timestamp field to `date`.
4. Set the `trigger.type` to `"date"` and `trigger.order` to `"desc"` to match the query sort order.
5. In the module's `parameters`, add a required `select` field so the user can specify which date field in their data should be used for polling.

**Real-World Examples**
- `Querying an endpoint with sort parameters: `?sort[0][field]=CreatedDate&sort[0][direction]=desc`.`
- `Using a record's `id` and `createdTime` fields for the `trigger` object to ensure unique processing and correct ordering.`
- `Asking the user to select a `triggerField` and `labelField` during module setup to configure the polling and display results intelligibly.`

**Platform Notes**
- The `response.trigger` object is critical. It tells the Make.com platform how to deduplicate and order incoming bundles. It must contain a unique `id` and a `date`.
- The `type: "date"` and `order: "desc"` properties in the trigger object inform the platform's polling engine how to handle the timestamp comparison for subsequent runs.
- The module's `parameters` should include a `select` input for the user to choose the field to be used as the trigger field.

**Source files**
_modules.TriggerWatchRecords

---

## Modules (Actions, Triggers, Searches)-04

**Description**
Implements a paginated search module to retrieve a list of items. This pattern uses the `pagination` object to automatically handle subsequent requests for more data. The `iterate` directive in the response processes the array of results, and the `limit` parameter allows the user to control the total number of items returned.

**⚠️ Critical Warnings**
- The `pagination.qs.Start` formula `{{pagination.page * 20}}` is tightly coupled with the API's page size (`Count: 20`). If the API's page size changes, this formula must be updated.
- The `iterate` path (`body.Awis.Results.Result.Alexa.SitesLinkingIn.Site`) must exactly match the location of the results array in the API response.

**Example**
```json
{
  "listSiteLinkings": {
    "crud": "read",
    "typeId": 9,
    "api": {
      "url": "/api",
      "method": "GET",
      "qs": {
        "Action": "SitesLinkingIn",
        "Count": 20,
        "ResponseGroup": "SitesLinkingIn",
        "Url": "{{parameters.url}}",
        "Output": "json"
      },
      "response": {
        "output": "{{item}}",
        "iterate": "{{body.Awis.Results.Result.Alexa.SitesLinkingIn.Site}}",
        "limit": "{{parameters.limit}}"
      },
      "pagination": {
        "qs": {
          "Start": "{{pagination.page * 20}}"
        }
      }
    },
    "expect": [
      {
        "name": "url",
        "label": "Website Address",
        "type": "text",
        "required": true
      },
      {
        "name": "limit",
        "label": "Limit",
        "type": "uinteger",
        "default": 10
      }
    ]
  }
}
```

**Implementation Steps**
1. Define a module with `typeId: 9` (Search).
2. In the module's `api` block, configure the initial request with a static page size (e.g., `"Count": 20`).
3. Add a `response` block. Set `iterate` to the IML path of the results array (e.g., `"{{body.Awis.Results.Result.Alexa.SitesLinkingIn.Site}}"`).
4. Set `output` to `"{{item}}"` to output each item from the iteration.
5. Add a `pagination` object within `api`. Inside, define a `qs` object that modifies the request for subsequent pages, e.g., `"Start": "{{pagination.page * 20}}"`.

**Real-World Examples**
- `API Endpoint: `GET /api?Action=SitesLinkingIn&Url=...``
- `Iteration Path: `body.Awis.Results.Result.Alexa.SitesLinkingIn.Site``
- `Pagination QS: `"Start": "{{pagination.page * 20}}"``

**Platform Notes**
- A module with `typeId: 9` (Search) and a `pagination` block will automatically show a 'Max number of results' field to the user.
- Make.com's engine uses the `pagination` object to make repeated calls until the user-defined `limit` is reached or no more data is returned.
- The `item` variable in `response.output` refers to a single element from the array specified in `iterate`.

**Source files**
_modules.listSiteLinkings

---

## Modules (Actions, Triggers, Searches)-05

**Description**
Defines a standard 'Action' module. The `expect` array defines the user interface for the module's settings. The `api` object specifies the API endpoint, method, and how to map user inputs into the request body. The `interface` array defines the data structure of the module's output bundle for use in subsequent modules.

**⚠️ Critical Warnings**
- The `name` fields in the `expect` array must match the keys used in the `parameters` object (e.g., `recipient` becomes `parameters.recipient`).
- The keys in the `api.response.output` mapping must exactly match the `name` fields in the `interface` array to ensure data is passed correctly.
- A mismatch between the `output` mapping and the `interface` definition will result in an empty or incomplete output bundle from the module.

**Example**
```json
{
  "_modules": {
    "sendMessage": {
      "crud": "create",
      "label": "Send Message",
      "description": "Sends a single message.",
      "typeId": 4,
      "expect": [
        {
          "name": "recipient",
          "type": "text",
          "label": "Recipient",
          "required": true
        },
        {
          "name": "messageText",
          "type": "text",
          "label": "Message Text",
          "required": true
        }
      ],
      "api": {
        "url": "/messages/send/",
        "method": "POST",
        "body": {
          "to": "{{parameters.recipient}}",
          "text": "{{parameters.messageText}}"
        },
        "response": {
          "output": {
            "messageId": "{{body.smsId}}",
            "remainingBalance": "{{body.balance}}"
          }
        }
      },
      "interface": [
        {
          "name": "messageId",
          "type": "text",
          "label": "Message ID"
        },
        {
          "name": "remainingBalance",
          "type": "float",
          "label": "Remaining Balance"
        }
      ]
    }
  }
}
```

**Implementation Steps**
1. In the `_modules` object, create a new key for your action (e.g., `sendMessage`).
2. Set `crud: "create"` and `typeId: 4`.
3. Define the user-facing fields in the `expect` array.
4. Define the API call details in the `api` object, using `{{parameters.fieldName}}` to insert user data.
5. In `api.response.output`, map fields from the API response body to friendly names.
6. In the `interface` array, define the output fields using the same friendly names from the previous step, along with their data types.

**Real-World Examples**
- ``"body": {"to": "{{parameters.to}}", "text": "{{parameters.text}}"}``
- ``"interface": [{"name": "smsId", "type": "text", "label": "SmsId"}]``

**Platform Notes**
- The `typeId` for an Action module is `4`.
- The `parameters` object is a special Make.com variable that holds the values entered by the user in the module's settings form, which is generated from the `expect` array.
- The `api.response.output` mapping is only processed for successful (2xx) HTTP responses.

**Source files**
_modules.sendSms

---

## Modules (Actions, Triggers, Searches)-06

**Description**
Defines a polling trigger that monitors for updated resources. The module's `api.response.trigger` object is configured to use a unique identifier (`FunctionArn`) and a timestamp (`LastModified`) from each item. Make.com uses this configuration to track which items are new or have been updated since the last execution.

**⚠️ Critical Warnings**
- The `trigger.id` must be a unique identifier for each item to prevent processing duplicates.
- The `trigger.date` field must be a valid, parseable date. Using `parseDate` is highly recommended to ensure consistency.
- If the API doesn't return items in a consistent order, the trigger might miss updates. Setting `order` to `desc` is best practice if possible.

**Example**
```json
{
  "watchFunctions": {
    "label": "Watch Functions",
    "typeId": 1,
    "api": {
      "url": "/2015-03-31/functions/",
      "method": "GET",
      "qs": {
        "FunctionVersion": "ALL",
        "MaxItems": 1000
      },
      "response": {
        "iterate": "{{body.Functions}}",
        "trigger": {
          "id": "{{item.FunctionArn}}",
          "date": "{{parseDate(item.LastModified)}}",
          "type": "date",
          "order": "desc"
        },
        "output": "{{functionResponse(item)}}"
      }
    }
  }
}
```

**Implementation Steps**
1. Create a module with `typeId: 1`.
2. In the module's `api.response` block, add a `trigger` object.
3. Inside `trigger`, set the `id` property to a unique field from the iterated item (e.g., `{{item.id}}`).
4. Set the `date` property to a timestamp field, preferably parsed with `{{parseDate(...)}}`.
5. Set `type` to `"date"` and `order` to `"desc"` for chronological processing.

**Real-World Examples**
- `Trigger configuration: `"trigger": { "id": "{{item.FunctionArn}}", "date": "{{parseDate(item.LastModified)}}" }``

**Platform Notes**
- Modules with `typeId: 1` are polling triggers.
- The `trigger` object inside `response` is what enables the trigger functionality.
- The `id` field is used for deduplication, while the `date` field is used to find new/updated records.

**Source files**
amazon-lambda/_modules/watchFunctions

---

## Modules (Actions, Triggers, Searches)-07

**Description**
Polling triggers (`typeId: 1`) periodically fetch data from an API to check for new or updated items. They rely on a `trigger` object in the response definition and an `epoch` configuration to manage state between executions.

**⚠️ Critical Warnings**
- The trigger's `id` field (`{{item.id}}`) must be unique for each item to prevent processing duplicates.
- The `date` field (`{{item.created_at}}` or `{{item.updated_at}}`) must be reliably ordered; incorrect or null timestamps can cause the trigger to miss bundles or re-process old ones.
- The `limit` parameter in the module UI should be respected by the API call logic to avoid fetching excessive data.

**Example**
```json
{
  "watchRecords": {
    "typeId": 1,
    "api": {
      "url": "/v0/apps/{{connection.app}}/collections/{{connection.collection}}",
      "method": "GET",
      "response": {
        "iterate": "{{body.records}}",
        "trigger": {
          "id": "{{item.id}}",
          "date": "{{switch(parameters.select, 'create', item.created_at, 'update', item.updated_at)}}",
          "type": "date",
          "order": "asc"
        },
        "output": "{{item}}",
        "limit": "{{parameters.limit}}"
      }
    },
    "epoch": {
      "response": {
        "output": {
          "date": "{{switch(parameters.select, 'create', item.created_at, 'update', item.updated_at)}}"
        }
      }
    }
  }
}
```

**Implementation Steps**
1. Create a new module with `"typeId": 1`.
2. Define the `api` call to fetch recent items. The API should support sorting by a creation or update timestamp.
3. In the `api.response` object, set `iterate` to the path of the array in the API response (e.g., `"{{body.results}}"`).
4. Add a `trigger` object with an `id` key mapped to a unique identifier and a `date` key mapped to a timestamp from the item.
5. Set `order` to `"asc"` or `"desc"` to match the API's sort order.
6. Add an `epoch` object to define the first-run behavior.

**Real-World Examples**
- `Watching for new records by `created_at` timestamp.`
- `Watching for updated records by `updated_at` timestamp.`
- `Using `switch()` function to dynamically select the timestamp field based on user input.`

**Platform Notes**
- The `typeId` for a polling trigger is `1`.
- The `response.trigger` object is mandatory and tells Make how to identify and order bundles.
- The `epoch` object defines how to fetch items on the very first run of the scenario to establish an initial state.
- The `iterate` key (`{{body.records}}`) is used to split a response array into individual output bundles.

**Source files**
adalo.json: /_modules/watchRecords

---

## Modules (Actions, Triggers, Searches)-08

**Description**
Defines a polling trigger that watches for new records. It requires a timestamp or auto-incrementing field (`triggerField`) in the target data source. The module API call sorts records by this field in descending order to fetch the newest items first. The `response.trigger` object identifies the unique ID and timestamp of each item, allowing the platform to track which records have already been processed.

**⚠️ Critical Warnings**
- The trigger's functionality is entirely dependent on the existence and proper configuration of a 'Created Time' or similar timestamp field in the user's data source. If this field is missing or not updated, the trigger will not function correctly.
- The reliability of this trigger can be affected by the API's pagination and sorting behavior. Ensure the sorting field is consistently ordered.

**Example**
```json
{
  "TriggerWatchRecords": {
    "api": {
      "qs": {
        "pageSize": 100,
        "sort[0][field]": "{{parameters.config.triggerField}}",
        "sort[0][direction]": "desc"
      },
      "url": "/{{encodeTable(parameters.table)}}",
      "response": {
        "limit": "{{parameters.maxRecords}}",
        "output": "{{processRecord(item)}}",
        "iterate": "{{body.records)}}",
        "trigger": {
          "id": "{{item.id}}",
          "date": "{{get(item.fields, parameters.config.triggerField)}}",
          "type": "date",
          "order": "desc"
        }
      },
      "pagination": {
        "qs": {
          "offset": "{{body.offset}}"
        },
        "condition": "{{body.offset}}"
      }
    },
    "parameters": [
      {
        "name": "table",
        "type": "select",
        "required": true,
        "options": {
          "store": "rpc://app%23airtable@1/RpcGetTables",
          "nested": {
            "store": [
              {
                "name": "config",
                "type": "collection",
                "spec": [
                  {
                    "name": "triggerField",
                    "type": "select",
                    "label": "Trigger field",
                    "options": "rpc://app%23airtable@1/RpcGetSchema?for=rpc&filter=formula",
                    "required": true
                  }
                ]
              }
            ]
          }
        }
      }
    ]
  }
}
```

**Implementation Steps**
1. In the module's `api` definition, add a `qs` object.
2. Configure sorting parameters to fetch newest items first, e.g., `"sort[0][field]": "{{parameters.triggerField}}"` and `"sort[0][direction]": "desc"`.
3. In the `response` object, set `iterate` to the JSON array containing the records (e.g., `"{{body.records}}"`).
4. Define the `trigger` object within the `response`. Map `id` to a unique identifier and `date` to the timestamp field from the iterated `item`.
5. In `parameters`, prompt the user to select the timestamp field that will be used for sorting.

**Real-World Examples**
- `Query parameter for sorting: `sort[0][field]=Created&sort[0][direction]=desc``
- `Trigger state management: `"trigger": { "id": "{{item.id}}", "date": "{{item.createdTime}}" }``
- `Dynamic field selection using RPCs: `"options": "rpc://app%23airtable@1/RpcGetSchema?for=rpc&filter=formula"``

**Platform Notes**
- The `response.trigger` object is a core Make.com construct for stateful polling triggers. The `id` prevents duplicate processing of the same record, and `date` with `order` tells the scheduler where to look in the next run.
- The `qs` object uses a specific bracket notation `sort[0][field]` which is a common pattern for passing array-like structures in query strings.
- UI fields (`parameters`) are dynamically populated using `rpc://` calls in the `options.store` property.

**Source files**
_modules.TriggerWatchRecords

---

