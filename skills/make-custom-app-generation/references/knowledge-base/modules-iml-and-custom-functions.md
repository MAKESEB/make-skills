## IML and Custom Functions-01

**Description**
Implements a custom IML function using JavaScript to perform a data transformation not possible with standard functions. This is used to format an array of user IDs into the specific URL-based `@odata.bind` format required by the Microsoft Graph API for adding members to a group.

**⚠️ Critical Warnings**
- Custom functions execute server-side JavaScript. Ensure the code is secure and does not introduce vulnerabilities.
- Errors within the JavaScript code will cause the entire module execution to fail with a potentially cryptic error message. Test functions thoroughly.

**Example**
```json
{
  "_functions": {
    "addUsersArray": {
      "code": "function addUsersArray(obj) {\n\tlet newArray = [];\n\tobj.forEach((x)=>{\n\t   newArray.push(\"https://graph.microsoft.com/v1.0/directoryObjects/\"+x);\n\t});\n\treturn newArray;\n}",
      "arguments": "(obj)"
    }
  },
  "_modules": {
    "addMembers": {
      "api": {
        "body": {
          "members@odata.bind": "{{addUsersArray(map(parameters.members, 'id'))}}"
        }
      }
    }
  }
}
```

**Implementation Steps**
1. In the app's root, create a `_functions` object.
2. Define a named function (e.g., `"addUsersArray"`) with `code` and `arguments` properties.
3. Write the JavaScript transformation logic inside the `code` string.
4. In the module's `api.body`, call the function. Use the `map` function to preprocess the input array if needed: `"{{addUsersArray(map(parameters.members, 'id'))}}"`.

**Real-World Examples**
- `Input to `map` function: `[{"id": "user-id-1"}, {"id": "user-id-2"}]``
- `Output of `map` function: `["user-id-1", "user-id-2"]``
- `Final output of `addUsersArray` function: `["https://graph.microsoft.com/v1.0/directoryObjects/user-id-1", "https://graph.microsoft.com/v1.0/directoryObjects/user-id-2"]``

**Platform Notes**
- Custom functions are defined in the app's root `_functions` object.
- They are called within IML expressions by their name, e.g., `{{addUsersArray(...)}}`.
- They are often combined with built-in IML functions like `map` to first extract the necessary data before transforming it.

**Source files**
$._functions.addUsersArray, $._modules.addMembers.api.body

---

## IML and Custom Functions-02

**Description**
Custom IML functions are defined in the `_functions` object to encapsulate complex data transformations or logic. They can be used to dynamically generate UI specifications for module parameters, providing a highly adaptive user interface based on the user's connection or other settings.

**⚠️ Critical Warnings**
- Errors in IML function code can break the module UI completely, making it impossible for users to configure.
- Complex IML functions can be difficult to debug as their execution context is within the Make.com platform.
- IML functions have limitations and cannot perform asynchronous operations or access external libraries.

**Example**
```json
{
  "_functions": {
    "fields": {
      "code": "function fields(obj, interface) { if(!obj) return; let arr = []; for (let [key, value] of Object.entries(obj)) { if (key === 'id' || key === 'created_at' || key === 'updated_at') continue; let o = { name: key, label: key, type: 'any' }; arr.push(o); } if(!interface) { return { name: 'fields', label: 'Fields', type: 'collection', spec: arr } } return arr; }",
      "arguments": "(obj, interface)"
    }
  },
  "_rpcs": {
    "listCollectionFields": {
      "api": {
        "url": "/v0/apps/{{connection.app}}/collections/{{connection.collection}}",
        "method": "GET",
        "response": {
          "output": "{{fields(body.records[], parameters.interface)}}"
        }
      }
    }
  },
  "_modules": {
    "addARecord": {
      "expect": [
        "rpc://listCollectionFields"
      ]
    }
  }
}
```

**Implementation Steps**
{
  "_functions": {
    "generateUrlParameter": {
      "code": "function generateUrlParameter(baseUrl) { return { name: 'path', type: 'text', label: 'Path', help: `Enter a path relative to ${baseUrl}` }; }",
      "arguments": "(baseUrl)"
    }
  },
  "_modules": {
    "makeApiCall": {
      "label": "Make an API Call",
      "expect": [
        "{{generateUrlParameter(base.baseUrl)}}"
      ]
    }
  }
}

**Real-World Examples**
- `A function that fetches a sample record and generates a `spec` array for a mappable `collection` parameter based on the record's keys.`
- `A function that transforms an array of records into a label/value pair array suitable for a `select` input's `options`.`
- `"code": "function omit(collection, ...parameters) { ... }" (A utility function to remove specific keys from an object before sending it in an API call body).`

**Platform Notes**
- Custom functions are defined under the `_functions` key.
- The function's `code` is a string containing JavaScript that adheres to the IML (Integromat Markup Language) function specification.
- These functions can be called from anywhere IML is supported, such as `api.response.output` or `api.body`.

**Source files**
_functions.fields, _rpcs.listCollectionFields

---

## IML and Custom Functions-03

**Description**
Defines a reusable custom function to process or transform data within a module. This example shows a function that parses a Unix timestamp from the input and converts it into a standard Date object, which Make can then format.

**⚠️ Critical Warnings**
- Custom functions run in a sandboxed JavaScript environment and have limitations on what they can access.
- An error within a custom function can cause the entire module execution to fail. Ensure robust error handling or data validation within the function itself.

**Example**
```json
{
    "parseDates": {
        "code": "function parseDates(response) { if (response.created_at) { response.created_at = new Date(Number.parseInt(\"\" + response.created_at + \"000\")); } return response; }",
        "arguments": "(response)",
        "name": "parseDates"
    }
}
```

**Implementation Steps**
In the `_functions` section of your app definition, add an object for your new function. The key should be the function's name. Inside the object, provide the JavaScript logic in the `code` property and define the expected arguments in the `arguments` string. You can then call this function from any IML-enabled field using `{{functionName(variable)}}`.

**Real-World Examples**
- `A function `parseDates(payload)` is called in a trigger's `response.output` to convert a `created_at` timestamp before the data is passed to the scenario.`
- `The expression in the module would be `{{parseDates(payload)}}`.`

**Platform Notes**
- Custom functions are defined globally for the app within the `_functions` object.
- The function's signature is defined by the `arguments` property (e.g., `(response)`).
- The `name` property should match the key of the function object for clarity.

**Source files**
_functions.parseDates

---

## IML and Custom Functions-04

**Description**
Utilizes a custom IML function to parse and reformat the API response before it is returned as the module's output. This pattern is ideal for complex data transformations, such as converting string dates to Make.com date objects, which cannot be handled by simple IML mappings.

**⚠️ Critical Warnings**
- Custom function code runs in a sandboxed environment and has performance limitations. Complex logic can slow down scenarios.
- Errors inside a custom function can be difficult to debug. Ensure robust error handling and null checks within the JavaScript code.

**Example**
```json
{
  "getATrafficHistory": {
    "api": {
      "qs": {
        "Url": "{{parameters.url}}",
        "Range": 31,
        "Start": "{{formatDate(parameters.start, 'YYYYMMDD')}}",
        "Action": "TrafficHistory",
        "Output": "json",
        "ResponseGroup": "History"
      },
      "response": {
        "output": "{{trafficHistoryResponse(body.Awis.Results.Result.Alexa.TrafficHistory)}}"
      }
    }
  },
  "_functions": {
    "trafficHistoryResponse": {
      "code": "function trafficHistoryResponse(body) {\n    if (body) {\n        body.Start = iml.parseDate(body.Start, 'YYYY-MM-DD');\n        if (body.HistoricalData) {\n            body.HistoricalData.Data.forEach(item => {\n                item.Date = iml.parseDate(item.Date, 'YYYY-MM-DD');\n            });\n        }\n        return body;\n    }\n    else {\n        return;\n    }\n}",
      "arguments": "(body)"
    }
  }
}
```

**Implementation Steps**
1. At the app's root level, create a `_functions` object.
2. Inside `_functions`, define a new object for your function, e.g., `trafficHistoryResponse`.
3. Add a `code` property containing the JavaScript logic. Use the `iml` object for Make-specific functions.
4. Add an `arguments` property defining the function signature, e.g., `"(body)"`.
5. In a module's `api.response.output`, call the function with the desired data as an argument: `"{{trafficHistoryResponse(body)}}"`.

**Real-World Examples**
- `Function call in response: `"output": "{{trafficHistoryResponse(body.Awis.Results.Result.Alexa.TrafficHistory)}}"``
- `Date parsing logic: `item.Date = iml.parseDate(item.Date, 'YYYY-MM-DD');``

**Platform Notes**
- Custom functions are defined in the `_functions` block at the root of the app.
- The function name becomes a callable IML function throughout the app's modules.
- The `iml` object provides access to Make.com's built-in IML functions (like `parseDate`) from within the custom JavaScript code.

**Source files**
_modules.getATrafficHistory, _functions.trafficHistoryResponse

---

## IML and Custom Functions-05

**Description**
This pattern uses a custom IML function to transform user input before it is sent in an API request. It's used to set default values, format data types (like dates or numbers), and structure the final JSON payload correctly, abstracting complex logic away from the `api` communication block.

**⚠️ Critical Warnings**
- Bugs in the custom function can be difficult to debug as the failure occurs during runtime execution.
- The function's logic must be robust enough to handle empty or null values for optional parameters.
- Changes to the API's required payload structure will necessitate updates to the custom function's code.

**Example**
```json
{"url":"/addTask","method":"POST","headers":{"X-API-Token":"{{connection.apiKey}}"},"body":"{{formatTaskCreateInput(parameters)}}","response":{"output":"{{parseTimestamps(parseDates(body))}}"}}
```

**Implementation Steps**
1. **Create Custom Function**: In the `_functions` section, define a new function (e.g., `formatTaskCreateInput`) that accepts `parameters` as its argument.
2. **Implement Logic**: Inside the function, write JavaScript code to manipulate the `parameters` object. Add, remove, or modify properties as needed. For example, `if (!parameters.db) parameters.db = "Tasks";` or `parameters.createdAt = (new Date()).getTime();`.
3. **Return Formatted Object**: Ensure the function returns the fully constructed and formatted payload object.
4. **Call Function in Module**: In the module's `api` definition, set the `body` property to a string that calls your function: `"body": "{{formatTaskCreateInput(parameters)}}"`.

**Real-World Examples**
- `Converting a user-provided duration in minutes into seconds as required by the API: `parameters.timeEstimate * 60000`.`
- `Setting a default `parentId` if the user leaves the field empty: `if (!parameters.parentId) parameters.parentId = "unassigned";`.`
- `Creating a complex nested JSON object from a flat list of user parameters.`

**Platform Notes**
- The custom function is defined in the app's `_functions` section.
- The function is called from the `body` of an `api` request definition, passing the `parameters` object: `"body": "{{nameOfFunction(parameters)}}"`.
- The function must return a valid JSON object or string that the API endpoint expects as the request body.

**Source files**
_modules.createTask and _functions.formatTaskCreateInput

---

## IML and Custom Functions-06

**Description**
Demonstrates using a custom IML Function (`addUsersArray`) to transform an array of user IDs from module parameters into the specific `@odata.bind` format required by the Microsoft Graph API for adding members to a group. This pattern is essential for handling relationship links in OData.

**⚠️ Critical Warnings**
- The `@odata.bind` key must be used to link existing resources; sending a simple array of IDs will fail.
- The value for `@odata.bind` must be an array of full resource URLs, not just IDs. The custom function is necessary to construct these URLs.

**Example**
```json
{
    "addMembers": {
        "api": {
            "url": "/groups/{{parameters.groupId}}",
            "method": "PATCH",
            "body": {
                "members@odata.bind": "{{addUsersArray(map(parameters.members, 'id'))}}"
            }
        },
        "expect": [
            {
                "name": "members",
                "type": "array",
                "spec": [
                    {
                        "name": "id",
                        "type": "select"
                    }
                ]
            }
        ]
    },
    "_functions": {
        "addUsersArray": {
            "code": "function addUsersArray(obj) {\n\tlet newArray = [];\n\tobj.forEach((x)=>{\n\t   newArray.push(\"https://graph.microsoft.com/v1.0/directoryObjects/\"+x);\n\t});\n\treturn newArray;\n}"
        }
    }
}
```

**Implementation Steps**
1. Define a custom function in `_functions` that takes an array of IDs and returns an array of full resource URLs.
2. In the module's `api.body`, use the key `"members@odata.bind"` (or other appropriate relationship name).
3. For its value, use `map` to extract the IDs from the parameter array, then pass the result to your custom function: `"{{addUsersArray(map(parameters.members, 'id'))}}"`.

**Real-World Examples**
- `PATCH /groups/{id} with body `{"members@odata.bind": ["https://graph.microsoft.com/v1.0/directoryObjects/{id1}", "https://graph.microsoft.com/v1.0/directoryObjects/{id2}"]}``

**Platform Notes**
- Custom functions are defined in the app's `_functions` object and can be called from anywhere within the app's IML expressions.
- The `map` function is used first to extract an array of `id` values from the user input before passing it to the custom function.

**Source files**
_modules.addMembers, _functions.addUsersArray

---

## IML and Custom Functions-07

**Description**
Define custom IML functions in the `_functions` object to encapsulate reusable business logic, such as transforming data for UI elements or formatting API request bodies. These functions can be called from anywhere within the app using `{{functionName(...)}}` syntax.

**⚠️ Critical Warnings**
- IML function code executes in a sandboxed JavaScript environment. It has no access to external libraries or network requests.
- Poorly written or inefficient functions can significantly slow down scenario execution, especially if called inside an iterator.

**Example**
```json
{
  "_functions": {
    "omit": {
      "code": "function omit(collection, ...parameters) {\n\tconst result = {};\n\t\n\tfor (let key in collection) {\n\t\tif (!parameters.includes(key)) {\n\t\t\tresult[key] = collection[key];\n\t\t}\n\t}\n\t\n\treturn result;\n}",
      "name": "omit",
      "arguments": "(collection, ...parameters)"
    }
  }
}
```

**Implementation Steps**
1. In the `_functions` object at the root of your manifest, add a new object with a key matching your desired function name (e.g., `formatPayload`).
2. Inside this object, add a `name` key with the same function name, an `arguments` string (e.g., `"(data, format_type)"`), and a `code` key containing the JavaScript function body.
3. Call the function from a module's `api` definition or parameter using `{{formatPayload(parameters.input, 'json')}}`.

**Real-World Examples**
- `Usage in a module: `"body": "{{omit(parameters.fields, 'record')}}"` is used in the `updateARecord` module to remove the `record` ID from the collection of fields being sent in the PUT request body.`
- `A function `record(body)` transforms a list of records into a `{label, value}` array for a dropdown menu.`
- `A function `fields(obj, interface)` introspects a record object and generates an array of parameter specifications for dynamic UIs.`

**Platform Notes**
- Custom functions are defined in the top-level `_functions` object.
- The function name, arguments, and JavaScript code must be specified.
- These functions augment the built-in Make IML functions like `formatDate` or `ifempty`.

**Source files**
adalo.json: /_functions/omit

---

## IML and Custom Functions-08

**Description**
Implement custom IML functions in the `_functions` block to encapsulate complex logic, such as transforming API schemas for UI display. This promotes code reuse and separates data manipulation logic from the module's core API communication definitions.

**⚠️ Critical Warnings**
- Custom functions are executed in a sandboxed environment and have limitations. Complex computations or external calls are not permitted.
- Incorrectly defined arguments or logic within a custom function can cause silent failures or prevent modules from rendering correctly.

**Example**
```json
{
  "_functions": {
    "getSchema": {
      "name": "getSchema",
      "arguments": "(body, name, _for, _filterIn, useColumnId)",
      "code": "const columns = body.tables.find(table => table.name === name || table.id === name).fields; if (!columns) return; const result = columns.map(col => { let field = { name: useColumnId ? col.id : col.name, label: col.name, type: \"text\" }; field = iml.getSchemaFieldSpecs(col, field, _for); return field; }).filter(f => !!f); return result;"
    }
  },
  "_modules": {
    "ActionCreateRecord": {
      "interface": [
        "rpc://app%23airtable-test@1/RpcGetSchema?for=interface"
      ],
      "expect": [
        {
          "options": {
            "nested": "rpc://app%23airtable-test@1/RpcGetSchema?useColumnId=true"
          }
        }
      ]
    }
  }
}
```

**Implementation Steps**
1. In the `_functions` object, add a new entry for your function (e.g., `transformData`).
2. Define its `name`, `arguments`, and the JavaScript logic in the `code` property.
3. In a module's `response.output` or other IML field, call your function with the appropriate variables, e.g., `"{{transformData(body)}}"`.

**Real-World Examples**
- ``getSchema`: Parses a table metadata response to generate a dynamic interface (`interface`) or a list of fields for a dropdown (`rpc`).`
- ``prepareRecord`: Cleans and formats user input data before sending it to the API, such as formatting dates or filtering out empty objects from arrays.`
- ``processRecord`: Transforms an API response by mapping field IDs to user-friendly labels before presenting it as the module's output.`
- ``getUpsertEndpointUrl`: Dynamically determines the correct API endpoint URL and HTTP method (POST or PATCH) based on whether a Record ID is present.`

**Platform Notes**
- Custom functions are defined globally in the `_functions` object and can be called from any `api`, `expect`, or other IML-enabled property.
- The `iml` object provides access to built-in helper functions (e.g., `iml.replace`, `iml.formatDate`) that can be used within custom function code.

**Source files**
_functions.getSchema

---

