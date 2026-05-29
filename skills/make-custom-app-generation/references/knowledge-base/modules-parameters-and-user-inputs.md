## Parameters and User Inputs-01

**Description**
Defines a comprehensive set of user input fields for a module using the 'expect' array. This includes a required text input with help text, a select dropdown with predefined options and a default value, and an array of key-value pairs for custom headers.

**⚠️ Critical Warnings**
- The `name` of each parameter in the `expect` array must match the name used in the `api` definition (e.g., `parameters.url`).
- For `array` types, the `spec` must be correctly defined to structure the input fields for each item in the array.

**Example**
```json
[
    {
        "name": "url",
        "type": "text",
        "label": "URL",
        "required": true,
        "help": "Enter a path relative to `https://api.example.com`. For example: `/v1/forms`."
    },
    {
        "name": "method",
        "type": "select",
        "label": "Method",
        "required": true,
        "default": "GET",
        "options": [
            {"label": "GET", "value": "GET"},
            {"label": "POST", "value": "POST"},
            {"label": "PUT", "value": "PUT"}
        ]
    },
    {
        "name": "headers",
        "label": "Headers",
        "type": "array",
        "spec": [
            {
                "name": "key",
                "type": "text",
                "label": "Key"
            },
            {
                "name": "value",
                "type": "text",
                "label": "Value"
            }
        ]
    }
]
```

**Implementation Steps**
In a module definition, add an `expect` array. For each user input field, add an object defining its `name`, `type`, and `label`. Use `required: true` for mandatory fields. For dropdowns, use `type: 'select'` and provide an `options` array. For repeatable key-value inputs, use `type: 'array'` and define the structure of each item in the `spec` property.

**Real-World Examples**
- `An array input for custom headers with `key` and `value` text fields.`
- `A select dropdown for an HTTP `method` with a `default` value of 'GET'.`
- `A required `text` input for a URL path with `help` text to guide the user on the correct format.`

**Platform Notes**
- The `expect` array defines the UI for a module's user-configurable parameters.
- Supported `type` values include `text`, `select`, `array`, `boolean`, `number`, etc.
- The `help` property provides instructional text below the input field in the UI.

**Source files**
_modules.ActionMakeAnApiCall.expect

---

## Parameters and User Inputs-02

**Description**
Implement a dependent, searchable dropdown parameter. This pattern allows a user to first select a value from a parent dropdown (e.g., a Base), which then enables a child parameter (e.g., a Record ID) that can be populated by searching the API via a dedicated RPC.

**⚠️ Critical Warnings**
- The RPCs used in `store` and `rpc.url` must be configured to accept parameters from their parent selections (e.g., `{{parameters.base}}`) for the dependency chain to work.
- If any RPC in the chain fails, the entire nested parameter structure will fail to render in the UI.
- The `rpc.parameters` define the search form. If they are not configured correctly, the user will not be able to search effectively.

**Example**
```json
{
    "name": "base",
    "type": "select",
    "label": "Base",
    "required": true,
    "options": {
        "store": "rpc://app%23airtable-test@1/RpcGetBases",
        "nested": [
            {
                "name": "table",
                "type": "select",
                "label": "Table",
                "required": true,
                "options": {
                    "store": "rpc://app%23airtable-test@1/RpcGetTables",
                    "nested": [
                        {
                            "name": "id",
                            "type": "text",
                            "label": "Record ID",
                            "required": true,
                            "rpc": {
                                "url": "rpc://app%23airtable-test@1/searchRecords",
                                "label": "Search",
                                "parameters": [
                                    {
                                        "name": "field",
                                        "label": "Display Field",
                                        "type": "select",
                                        "required": true,
                                        "options": "rpc://app%23airtable-test@1/RpcGetSchema?for=rpc"
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    }
}
```

**Implementation Steps**
1. In a module's `expect` array, create a parent parameter of `type: "select"`.
2. In its `options`, use `store` to define an RPC that will populate it.
3. Add a `nested` array to the `options` object.
4. Inside `nested`, define the child parameter. This parameter can also be a `select` with its own `store` and `nested` items, creating a chain.
5. To make a child text parameter searchable (like 'Record ID'), add an `rpc` object to it. Define the `rpc.url` to point to a search RPC and configure `rpc.parameters` to define the fields for the search form.

**Real-World Examples**
- `Select Base -> Select Table -> Search Record ID: A user selects a Base, then a Table from a dependent dropdown, which finally enables a searchable Record ID field.`
- `The 'Record ID' field's RPC (`searchRecords`) is configured with its own parameters, like 'Display Field', creating a small search form within the main module's settings.`

**Platform Notes**
- This structure is defined within the `expect` array of a module.
- The `options.store` key points to an RPC that populates the dropdown's initial options.
- The `options.nested` array contains the definition of the dependent parameter(s).
- A parameter can be made searchable by adding an `rpc` object to its definition. This `rpc` object specifies the RPC to call (`url`) and the parameters (`parameters`) needed for the search.

**Source files**
_modules.ActionGetRecord.expect

---

## Parameters and User Inputs-03

**Description**
Populate UI dropdowns with dynamic data fetched from the service by referencing an RPC. The `expect` parameter specification in a module uses the `rpc://` protocol in the `options.store` property to call the RPC and populate the control. This allows for dynamic, context-aware user inputs, such as selecting a table and then seeing a list of views for that specific table.

**⚠️ Critical Warnings**
- RPCs used for populating UI elements can be slow, leading to a poor user experience during scenario configuration.
- If the RPC fails for any reason (e.g., rate limiting, API changes), the module cannot be configured, as the dropdowns will not populate.

**Example**
```json
{
    "name": "table",
    "type": "select",
    "label": "Table",
    "required": true,
    "grouped": true,
    "options": {
        "store": "rpc://app%23airtable@1/RpcGetTables",
        "nested": {
            "domain": "expect",
            "store": [
                {
                    "name": "view",
                    "type": "select",
                    "label": "View",
                    "options": "rpc://app%23airtable@1/RpcGetTableViews"
                },
                {
                    "name": "maxRecords",
                    "type": "integer",
                    "label": "Max Records"
                }
            ]
        }
    }
}
```

**Implementation Steps**
1. Define an RPC (e.g., `RpcGetTables`) that returns an array of `{label, value}` objects.
2. In the module's `expect` definition, create a parameter of `type: "select"`.
3. Set the `options.store` property to the RPC's unique identifier: `"rpc://app%23airtable@1/RpcGetTables"`.
4. For a dependent dropdown, define a second `select` parameter inside the `nested.store` array of the first parameter.
5. Point the second parameter's `options` property to its own RPC (e.g., `"rpc://app%23airtable@1/RpcGetTableViews"`). Make will automatically pass the selected value from the parent as a parameter to this RPC.

**Real-World Examples**
- `A 'Table' dropdown populated by `"store": "rpc://app%23airtable@1/RpcGetTables"`.`
- `A dependent 'View' dropdown populated by `"options": "rpc://app%23airtable@1/RpcGetTableViews"`, which automatically receives the selected Table ID as a parameter.`
- `A module's entire interface being generated dynamically by an RPC: `"interface": ["rpc://app%23airtable@1/RpcGetSchema?for=interface"]`.`

**Platform Notes**
- The RPC must return an array of objects, where each object has `label` (for display) and `value` (for the actual value) keys.
- For nested or dependent parameters, the `nested` object is used. The value of the parent parameter is automatically passed to the RPC of the nested parameter.
- The `grouped: true` property is used when the RPC returns a nested structure for creating option groups in the dropdown.

**Source files**
_modules.ActionSearchRecords.expect

---

