## Remote Procedure Calls (RPCs)-01

**Description**
Defines reusable Remote Procedure Calls (RPCs) to fetch dynamic data for populating UI elements like dropdowns. These RPCs are independent API calls that provide lists of resources (e.g., users, groups) for selection in module parameters, enhancing user experience by avoiding manual ID entry.

**⚠️ Critical Warnings**
- For API services using OData standards, advanced queries (`$filter`, `$search`) in RPCs often require the `ConsistencyLevel: eventual` header. Forgetting this header will result in API errors.
- RPCs that return a large number of items should be paginated or use a `$top` query parameter to avoid timeouts and excessive data transfer.

**Example**
```json
{
  "_rpcs": {
    "users": {
      "api": {
        "url": "/users",
        "method": "GET",
        "headers": {
          "ConsistencyLevel": "eventual"
        },
        "response": {
          "limit": 100,
          "output": {
            "label": "{{item.displayName}}",
            "value": "{{item.id}}"
          },
          "iterate": "{{body.value}}"
        }
      },
      "label": "Users"
    }
  }
}
```

**Implementation Steps**
1. Inside the app's root, create a `_rpcs` object.
2. Define a named RPC (e.g., `"users": {}`).
3. Inside the RPC, create an `api` object defining the `url`, `method`, and any required `headers`.
4. Add a `response` object. Set `iterate` to the path of the result array in the API response (e.g., `"{{body.value}}"`).
5. Inside `response`, add an `output` object with `label` and `value` keys mapped to properties of an individual item (e.g., `"label": "{{item.displayName}}"`, `"value": "{{item.id}}"`).

**Real-World Examples**
- `Fetching a list of system users: `GET /users``
- `Fetching a list of system groups: `GET /groups``

**Platform Notes**
- The `response.iterate` key must point to the array within the API response body (e.g., `{{body.value}}` for OData).
- The `response.output` object maps properties from each iterated item to a `label` (what the user sees) and a `value` (what is used by the module).
- Modules reference RPCs in their `expect` definition using the format `"options": "rpc://users"`.

**Source files**
$._rpcs.users

---

## Remote Procedure Calls (RPCs)-02

**Description**
An RPC is a reusable, named API call that is not directly exposed to the user but can be invoked by modules to dynamically populate UI elements like dropdowns or parameter fields. This pattern decouples UI data fetching from module logic.

**⚠️ Critical Warnings**
- Slow RPCs will make the scenario editor UI slow and unresponsive, as the UI waits for the RPC to return data.
- If an RPC fails, the UI element it's supposed to populate (e.g., a dropdown) will fail to load, potentially blocking the user from configuring the module.
- RPCs that return a large amount of data can cause performance issues in the browser.

**Example**
```json
{
  "_rpcs": {
    "listRecords": {
      "api": {
        "url": "/v0/apps/{{connection.app}}/collections/{{connection.collection}}",
        "method": "GET",
        "response": {
          "output": "{{record(body.records)}}"
        }
      }
    }
  },
  "_modules": {
    "getARecords": {
      "label": "Get a Record",
      "expect": [
        {
          "name": "record",
          "type": "select",
          "label": "Record ID",
          "options": "rpc://listRecords",
          "required": true
        }
      ]
    }
  }
}
```

**Implementation Steps**
```json
{
  "_rpcs": {
    "listUsers": {
      "api": {
        "url": "/api/users",
        "method": "GET",
        "response": {
          "output": "{{map(body.users, 'name', 'id')}}"
        }
      }
    }
  },
  "_modules": {
    "assignTask": {
      "label": "Assign a Task",
      "expect": [
        {
          "name": "userId",
          "type": "select",
          "label": "User",
          "options": "rpc://listUsers",
          "required": true
        }
      ]
    }
  }
}
```

**Real-World Examples**
- `"options": "rpc://listRecords"`
- `"output": "{{record(body.records)}}" (An IML function to format the RPC response for a select input)`

**Platform Notes**
- RPCs are defined in the top-level `_rpcs` object.
- They are invoked from within a module's `expect` or `interface` array using the `rpc://<rpcName>` syntax.
- RPCs can have their own parameters, which can be passed from the calling module, for example: `rpc://listItems?folderId={{parameters.folder}}`.

**Source files**
_rpcs.listRecords, _modules.getARecords.expect

---

## Remote Procedure Calls (RPCs)-03

**Description**
Implement Remote Procedure Calls (`_rpcs`) to create dynamic user interface elements, such as dropdown menus populated with live data from an API endpoint. RPCs are defined as standalone, parameter-driven API calls whose output generates selectable options for module parameters.

**⚠️ Critical Warnings**
- RPCs that depend on user input (e.g., `{{parameters.base}}`) must be correctly nested within the `expect` definition of a module to receive the required value.
- If an RPC fails, the UI element it populates will fail to load, often without a clear error message to the end-user. Ensure robust error handling or fallbacks.
- RPCs are called frequently during scenario editing. Design them to be fast and efficient to avoid a sluggish user experience.

**Example**
```json
{
    "RpcGetTables": {
      "api": {
        "url": "https://api.example.com/v0/meta/bases/{{parameters.base}}/tables",
        "headers": {
          "X-API-Client-Secret": "{{common.metadataClientSecret}}"
        },
        "response": {
          "output": {
            "label": "{{item.name}}",
            "value": "{{item.id}}"
          },
          "iterate": "{{body.tables}}"
        }
      },
      "label": "Get Tables (metadata API)",
      "parameters": []
    }
}
```

**Implementation Steps**
1. In the `_rpcs` object of your app's JSON, define a new RPC with a unique name (e.g., `listItems`).
2. Inside the RPC, create an `api` object defining the `url`, `method`, `headers`, and other request details.
3. Use `{{parameters.xyz}}` in the `url` or `qs` to make the RPC dependent on other user inputs.
4. In the `api.response` object, use `iterate` to specify the array in the API response to loop over (e.g., `"{{body.items}}"`).
5. Define `response.output` with `label` and `value` keys, mapping them to properties of the iterated items (e.g., `"label": "{{item.name}}"`).

**Real-World Examples**
- `Fetching Tables for a selected Base: An RPC is called with a `base` ID to fetch a list of tables, which then populates a 'Table' dropdown.`
- `Dynamic Search for Record IDs: An RPC (`searchRecords`) takes a formula and field name to let users search for records and returns the `recordId` as the value, populating a 'Record ID' field.`
- `Displaying a Deprecation Warning: An RPC can have a static response containing HTML to display a warning or informational message directly in the module's UI, as seen with the `warning` RPC for API key deprecation.`

**Platform Notes**
- RPCs are defined in the top-level `_rpcs` object in the app's main JSON file.
- To use an RPC in a module, reference it in the `options` key of a parameter: `"options": "rpc://RpcGetTables"`.
- For chained dropdowns (e.g., selecting a country to populate a cities dropdown), use the `nested` property within a parameter's `options` to define the dependent parameter and its RPC.
- The `response.output` object maps fields from the iterated API response to `label` (what the user sees) and `value` (what is used by the module).

**Source files**
_rpcs.RpcGetTables

---

## Remote Procedure Calls (RPCs)-04

**Description**
When an API lacks endpoints for essential metadata (like schemas or table lists), use a multi-step RPC that simulates a user login by screen-scraping the web interface. This RPC chain first logs in, extracts a session/CSRF token, and then calls undocumented internal API endpoints used by the web application to fetch the required metadata. This is a workaround for APIs that are not fully featured.

**⚠️ Critical Warnings**
- This method is fragile and will break if the target website's HTML structure, login flow, or internal API endpoints change.
- This pattern requires storing user credentials (email/password), which is a security risk and must be clearly communicated to the user in the documentation.
- The service may implement rate-limiting on login attempts, which can block configuration. The `429` error for 'Too many requests' must be handled.
- Scraping may be against the terms of service of the target application.

**Example**
```json
{
    "RpcGetSchema": {
        "api": [
            {
                "url": "https://service.test/login",
                "response": {
                    "temp": {
                        "csrf": "{{getCsrfFromBody(body)}}"
                    },
                    "type": "text",
                    "output": {}
                },
                "shareCookies": true
            },
            {
                "url": "https://service.test/auth/login/",
                "body": {
                    "_csrf": "{{temp.csrf}}",
                    "email": "{{connection.email}}",
                    "password": "{{connection.password}}"
                },
                "log": {
                    "sanitize": [
                        "request.body.password"
                    ]
                },
                "type": "urlencoded",
                "method": "POST",
                "response": {
                    "temp": {
                        "secretSocketId": "{{match(body, '\"secretSocketId\":\"(.*?)\"', 'i')}}"
                    },
                    "type": "text",
                    "error": {
                        "429": {
                            "message": "Too many requests. Please try again in 5 minutes."
                        }
                    },
                    "valid": "{{isLoginValid(body)}}",
                    "output": {}
                },
                "shareCookies": true
            },
            {
                "url": "https://service.test/v0.3/application/{{substring(parameters.table, 0, indexOf(parameters.table, '/'))}}/read",
                "method": "GET",
                "headers": {
                    "X-Requested-With": "XMLHttpRequest"
                },
                "response": {
                    "output": "{{getSchema(body, substring(parameters.table, indexOf(parameters.table, '/') + 1))}}"
                },
                "shareCookies": true
            }
        ],
        "name": "RpcGetSchema",
        "label": "Get Schema",
        "parameters": [
            {
                "name": "table",
                "type": "text"
            }
        ]
    }
}
```

**Implementation Steps**
1. Create an RPC with a multi-step `api` array.
2. Step 1 (GET CSRF): Make a `GET` request to the login page. In the `response`, use a custom function (`getCsrfFromBody`) to parse the CSRF token and store it in a `temp` variable. Set `shareCookies: true`.
3. Step 2 (Login): Make a `POST` request to the login action URL. Pass the CSRF token from `temp` and user credentials from the `connection` object. In the `response`, extract the session ID into `temp`. Handle `429` errors. Set `shareCookies: true` and sanitize the password from logs.
4. Step 3 (Fetch Data): Make a `GET` request to the internal API endpoint, passing the session ID from `temp` and any required headers like `X-Requested-With: XMLHttpRequest`.
5. In the final `response`, use another custom function (`getSchema`) to parse the response body and transform it into the required format for the module UI.

**Real-World Examples**
- `Authentication flow: `GET /login` to get a CSRF token, then `POST /auth/login/` with credentials, then use the established session for subsequent requests.`
- `Calling an internal endpoint like `/v0.3/application/{{appId}}/read` which is used by the frontend but not officially documented.`
- `Using custom IML functions like `getCsrfFromBody(body)` and `match(body, '"secretSocketId":"(.*?)"')` to parse tokens from an HTML response body.`

**Platform Notes**
- The `shareCookies: true` property is essential to maintain the session across the multiple HTTP requests within the RPC.
- Custom IML functions are required for parsing non-standard responses like HTML. Functions for RegEx matching and string manipulation are common.
- The `log.sanitize` property should be used to prevent sensitive data like passwords from being stored in execution logs.

**Source files**
_rpcs.RpcGetSchema

---

## Remote Procedure Calls (RPCs)-05

**Description**
Implements a generic 'Make an API Call' module that allows users to construct arbitrary API requests. This pattern uses the `toCollection` IML function to dynamically build the headers and query string objects from user-provided key-value pairs, offering maximum flexibility for interacting with undocumented or new API endpoints.

**⚠️ Critical Warnings**
- This module bypasses the app's specific error handling and validation logic, returning the raw API response. Users must handle errors themselves.
- Providing this level of flexibility can make it easier for users to construct invalid requests.

**Example**
```json
{
  "makeApiCall": {
    "label": "Make an API Call",
    "api": {
      "url": "/api",
      "method": "{{parameters.method}}",
      "qs": {
        "{{...}}": "{{toCollection(parameters.qs, 'key', 'value')}}"
      },
      "headers": {
        "{{...}}": "{{toCollection(parameters.headers, 'key', 'value')}}"
      },
      "body": "{{parameters.body}}",
      "response": {
        "output": {
          "body": "{{body}}",
          "headers": "{{headers}}",
          "statusCode": "{{statusCode}}"
        }
      }
    },
    "expect": [
      {
        "name": "qs",
        "type": "array",
        "spec": [
          {"name": "key", "type": "text"},
          {"name": "value", "type": "text"}
        ]
      }
    ]
  }
}
```

**Implementation Steps**
1. Create a new module (e.g., `makeApiCall`).
2. In the `expect` block, define `array` parameters for headers and query strings, with a `spec` for `key` and `value` text inputs.
3. In the module's `api` block, use the `{{...}}` syntax combined with `toCollection` to map the user input arrays to the `qs` and `headers` objects. Example: `"qs": {"{{...}}": "{{toCollection(parameters.qs, 'key', 'value')}}"}`.
4. Map the user's method selection and body input directly, e.g., `"method": "{{parameters.method}}"`.
5. In the `response.output`, return the raw `statusCode`, `headers`, and `body` to the user.

**Real-World Examples**
- `Dynamic QS generation: `"qs": {"{{...}}": "{{toCollection(parameters.qs, 'key', 'value')}}"}``
- `Dynamic Headers generation: `"headers": {"{{...}}": "{{toCollection(parameters.headers, 'key', 'value')}}"}``

**Platform Notes**
- The `{{...}}` syntax is a special directive that allows an IML function to return multiple key-value pairs to populate an object.
- The `toCollection` function is essential for converting a user-facing array of key-value objects into a format the API call can use.
- This type of module is often labeled as an RPC or 'Make an API Call' and is a best practice for app completeness.

**Source files**
_modules.makeApiCall

---

## Remote Procedure Calls (RPCs)-06

**Description**
This pattern populates a module's user-facing dropdown menu with dynamic data from an API endpoint. An RPC is defined to call a list endpoint, and its output is formatted into `value` and `label` pairs, which are then referenced by a `select` parameter in a module's `expect` definition.

**⚠️ Critical Warnings**
- The RPC response must not exceed the platform's payload size limit for RPCs.
- If the RPC call fails or returns no data, the dropdown in the UI will be empty, potentially confusing the user.
- Ensure the `value` in the RPC output is the exact identifier the API expects in the subsequent module execution.

**Example**
```json
{"api":{"url":"{{connection.link}}/_find","body":{"selector":{"db":"Tasks"}},"method":"POST","response":{"limit":100,"output":{"label":"{{item.title || 'untitled'}}","value":"{{item._id}}"},"iterate":"{{body.docs}}"}},"name":"getAllTasksIDs","label":"Get All Tasks IDs"}
```

**Implementation Steps**
1. **Define the RPC**: In the app's `_rpcs` section, create a new RPC definition (e.g., `getAllTasksIDs`).
2. **Configure API Call**: Inside the RPC's `api` block, specify the `url`, `method`, and any `headers` or `body` required to fetch the list of items.
3. **Format Output**: In the RPC's `response` block, use `iterate` to specify the array to loop through (e.g., `{{body.docs}}`). Define the `output` object with `value` (e.g., `{{item._id}}`) and `label` (e.g., `{{item.title}}`) keys.
4. **Reference RPC in Module**: In a module's `expect` array, define a parameter of `type: "select"`. Set its `options` key to the RPC identifier string, like `"rpc://getAllTasksIDs"`.

**Real-World Examples**
- `Populating a 'Select a Customer' dropdown by fetching a list of customers from a CRM API.`
- `Fetching a list of task IDs from a project management tool to allow a user to select a specific task to update.`

**Platform Notes**
- The RPC response `output` must be an object containing `value` and `label` keys. `value` is sent to the API, and `label` is displayed to the user.
- The `iterate` key is used to map over an array in the RPC response, creating a `value`/`label` pair for each item.
- A parameter in a module's `expect` block references the RPC using the format: `"options": "rpc://appName@version/rpcName"` (e.g., `rpc://app#myapp@1/getAllTasksIDs`).

**Source files**
_rpcs.getAllTasksIDs and _modules.getTask.expect

---

## Remote Procedure Calls (RPCs)-07

**Description**
Defines a reusable Remote Procedure Call (RPC) to fetch a list of items from a paginated API endpoint. This RPC transforms the API response into a label/value format suitable for populating dynamic dropdown menus in a module's user interface, providing users with a selectable list of live data.

**⚠️ Critical Warnings**
- The `pagination.condition` must correctly identify if more pages are available (e.g., by checking for a `nextToken`). A faulty condition can lead to incomplete lists or infinite loops.
- The `response.output` transformation with `label` and `value` keys is mandatory for the UI to correctly render the dropdown options.
- RPCs can use custom IML functions (like `parseJsonNextToken` or `objectToArray`) for complex data transformation, which must be defined in the `_functions` block.

**Example**
```json
{
    "listSkills": {
      "api": {
        "url": "/skills",
        "method": "GET",
        "qs": {
          "vendorId": "{{parameters.vendor}}",
          "maxResults": 50
        },
        "pagination": {
          "condition": "{{parseJsonNextToken(body)}}",
          "qs": {
            "nextToken": "{{parseJsonNextToken(body)}}"
          }
        },
        "response": {
          "iterate": "{{parseJson(body)}}",
          "output": {
            "value": "{{item.skillId}}",
            "label": "{{objectToArray(item.nameByLocale)}}"
          }
        }
      }
    }
}
```

**Implementation Steps**
1. In the `_rpcs` object, create a new object for your RPC (e.g., `listItems`).
2. Inside, define the `api` object with `url`, `method`, `qs`, `pagination`, and `response`.
3. Configure the `pagination` object with a `condition` that evaluates to true if more pages exist.
4. In the `response` object, use `iterate` to specify the array to loop through.
5. In `response.output`, map the API data to `value` (the item's ID) and `label` (the human-readable name).

**Real-World Examples**
- `Pagination using a `nextToken` in the query string: `qs: { "nextToken": "{{...}}" }`.`
- `Using an RPC to populate a 'Skill ID' dropdown by fetching data from the `/skills` endpoint.`
- `Dynamically filtering an RPC based on a previous user selection: `"vendorId": "{{parameters.vendor}}"`.`

**Platform Notes**
- RPCs are defined in the top-level `_rpcs` object and are not directly visible to end-users as standalone modules.
- They are invoked from within a module's `expect` definition using the `rpc://` protocol, for example: `"options": "rpc://listSkills"`.
- Parameters from the module's UI are passed to the RPC via the `{{parameters.*}}` mapping, as seen with `{{parameters.vendor}}`.

**Source files**
_rpcs.listSkills

---

## Remote Procedure Calls (RPCs)-08

**Description**
Implements a Remote Procedure Call (RPC) to dynamically populate a UI dropdown menu. The RPC defines an API call that retrieves a list of items, which are then used as options in a module's `expect` block. This allows for user-friendly selection of remote resources.

**⚠️ Critical Warnings**
- RPCs that fetch large datasets should use pagination to avoid timeouts and excessive memory usage.
- The `output` of an RPC response must contain `label` (for display) and `value` (for submission) properties to correctly populate a `select` input.

**Example**
```json
{
  "_rpcs": {
    "listFunctions": {
      "api": {
        "url": "/2015-03-31/functions/",
        "method": "GET",
        "qs": {
          "FunctionVersion": "ALL",
          "MaxItems": 1000
        },
        "response": {
          "iterate": "{{body.Functions}}",
          "output": {
            "label": "{{item.FunctionName + ' (' + item.Version + ')'}}",
            "value": "{{item.FunctionName}}"
          }
        }
      },
      "label": "List Functions"
    }
  },
  "_modules": {
    "getAFunction": {
      "label": "Get a Function",
      "typeId": 4,
      "expect": [
        {
          "name": "function",
          "label": "Function Name",
          "type": "select",
          "options": "rpc://listFunctions",
          "required": true
        }
      ]
    }
  }
}
```

**Implementation Steps**
1. Define the API call in the `_rpcs` object, giving it a unique name (e.g., `listFunctions`).
2. Configure the RPC's `api.response` to `iterate` over the array in the API's response body.
3. In the `api.response.output`, map the iterated `item` to `label` and `value` fields.
4. In your module's `expect` block, create a parameter with `type: "select"`.
5. Set the `options` property of this parameter to `"rpc://"` followed by the name of your RPC.

**Real-World Examples**
- `RPC API endpoint: `/2015-03-31/functions/``
- `RPC response mapping: `"output": { "label": "{{item.FunctionName}}", "value": "{{item.FunctionName}}" }``
- `Module parameter using RPC: `"options": "rpc://listFunctions"``

**Platform Notes**
- RPCs are defined in the `_rpcs` top-level object.
- To link a `select` parameter to an RPC, set its `options` property to `"rpc://<rpc_name>"`.
- The `iterate` property in the RPC's response is essential for processing lists of items returned by the API.

**Source files**
cloud-functions/_rpcs/listFunctions, cloud-functions/_modules/getAFunction

---

## Remote Procedure Calls (RPCs)-09

**Description**
Defines an RPC to dynamically populate UI dropdowns (select fields) with a list of users. It queries the `/users` endpoint, iterates through the `body.value` array, and formats each user into a label/value pair suitable for the UI, respecting the API's pagination limit.

**⚠️ Critical Warnings**
- Advanced queries against API services, even in RPCs, may require specific headers to function correctly with features like `$search` or `$filter`. Without proper headers, the API may return an error.
- The `limit` in the RPC response is a suggestion to the platform on how many items to fetch; the API itself might have a different page size (`$top`).

**Example**
```json
{
    "_rpcs": {
        "users": {
            "api": {
                "url": "/users",
                "method": "GET",
                "qs": {},
                "body": {},
                "headers": {
                    "ConsistencyLevel": "eventual"
                },
                "response": {
                    "limit": 100,
                    "output": {
                        "label": "{{item.displayName}}",
                        "value": "{{item.id}}"
                    },
                    "iterate": "{{body.value}}"
                }
            },
            "label": "Users",
            "parameters": []
        }
    }
}
```

**Implementation Steps**
1. In your app's main definition, create a `_rpcs` object.
2. Define a new RPC (e.g., `users`) within `_rpcs`.
3. Configure the `api` object to make a `GET` request to the appropriate collection endpoint (e.g., `/users`).
4. Add required headers if you plan to use advanced query parameters.
5. In the `response` object, set `iterate` to `"{{body.value}}"` to loop through the results array from the API.
6. Define the `output` object with `label` and `value` mapped to the desired fields from the iterated `item` (e.g., `"label": "{{item.displayName}}"`).

**Real-World Examples**
- `RPC call to `GET /v1.0/users` to list users.`
- `RPC call to `GET /v1.0/groups` to list groups.`

**Platform Notes**
- Many APIs use `body.value` to contain the array of results and `body['@odata.nextLink']` for the pagination URL.
- The output must be structured with `label` and `value` keys for the dropdown to render correctly.

**Source files**
_rpcs.users

---

## Remote Procedure Calls (RPCs)-10

**Description**
Use Remote Procedure Calls (`_rpcs`) to fetch dynamic data from an API, which is then used to populate UI elements like dropdowns in a module's settings. This is essential for creating user-friendly selectors for resources like collections or records.

**⚠️ Critical Warnings**
- RPCs are called frequently during scenario design. They must be fast and consume minimal API quota to avoid rate limiting and a slow UI experience.
- The custom IML function `{{record(body.records)}}` is responsible for transforming the API response into the `label`/`value` format required by select inputs. An error in this function will break the UI.

**Example**
```json
{
  "_rpcs": {
    "listRecords": {
      "api": {
        "qs": {
          "limit": 100,
          "offset": 0
        },
        "url": "/v0/apps/{{connection.app}}/collections/{{connection.collection}}",
        "method": "GET",
        "response": {
          "output": "{{record(body.records)}}"
        }
      },
      "name": "listRecords",
      "label": "List Records"
    }
  }
}
```

**Implementation Steps**
1. In the `_rpcs` object, define a new RPC with a unique name (e.g., `listItems`).
2. Configure its `api` object to call the appropriate API endpoint to fetch the list of resources.
3. In the `api.response.output`, use an IML function to map the response array to a new array of `{label: "...", value: "..."}` objects.
4. In a module's `expect` block, define a `select` type parameter.
5. Set the `options` property of that parameter to `"rpc://listItems"` to populate the dropdown.

**Real-World Examples**
- `rpc://listRecords is used in the `expect` array of `getARecord`, `deleteARecord`, and `updateARecord` modules to populate the 'Record ID' dropdown.`
- `The endpoint `/v0/apps/{{connection.app}}/collections/{{connection.collection}}` is called to get a list of records.`

**Platform Notes**
- RPCs are defined in the top-level `_rpcs` object.
- The output of an RPC must be an array of objects, where each object contains a `label` (for the UI) and a `value` (for the API call).
- To use an RPC in a module, reference it in a parameter's `options` field with the syntax `"rpc://<rpcName>"`.

**Source files**
app.json: /_rpcs/listRecords

---

## Remote Procedure Calls (RPCs)-11

**Description**
Utilize the `_rpcs` object to define remote procedures that fetch metadata from an API. These RPCs are then referenced in module UI definitions using the `rpc://` protocol to dynamically populate dropdowns, providing a responsive and context-aware user experience.

**⚠️ Critical Warnings**
- RPCs for fetching metadata may require special authentication, such as a separate API key or secret passed in a custom header (e.g., `X-API-Client-Secret`). Ensure this is included in the RPC's `headers` if required.
- The `output` of an RPC intended for a dropdown must be structured with `label` and `value` keys to be rendered correctly in the UI.

**Example**
```json
{
  "_rpcs": {
    "RpcGetBases": {
      "api": {
        "url": "https://api.example.com/v0/meta/bases",
        "headers": {
          "X-API-Client-Secret": "{{common.metadataClientSecret}}"
        },
        "response": {
          "output": {
            "label": "{{item.name}}",
            "value": "{{item.id}}"
          },
          "iterate": "{{body.bases}}"
        }
      },
      "name": "RpcGetBases",
      "label": "Get Bases (metadata API)"
    }
  },
  "_modules": {
    "ActionGetRecord": {
      "expect": [
        {
          "name": "base",
          "type": "select",
          "label": "Base",
          "options": "rpc://app%23myapp@1/RpcGetBases"
        }
      ]
    }
  }
}
```

**Implementation Steps**
1. In the `_rpcs` object, define a new RPC (e.g., `listItems`).
2. Configure its `api` block with the `url`, `method`, and `headers` to fetch the dynamic data.
3. In the `response` object, use `iterate` to loop over the API result array (e.g., `"{{body.items}}"`).
4. Define the `response.output` to map the iterated item to `{ "label": "{{item.name}}", "value": "{{item.id}}" }`.
5. In your module's `expect` definition, create a `select` parameter and set its `options` property to `"rpc://listItems"`.

**Real-World Examples**
- `Fetching a list of databases: `RpcGetBases` calls `https://api.example.com/v0/meta/bases` and formats the response for a select input.`
- `Cascading dropdowns: A `base` dropdown triggers an RPC call (`RpcGetTables`) that is parameterized with the selected base ID to fetch only the tables within that base.`
- `Displaying a UI warning: An RPC can be used to return a static HTML block to display messages, such as deprecation warnings, directly in the connection or module configuration pane (`rpc://warning`).`

**Platform Notes**
- RPCs are defined in the `_rpcs` object and are referenced in `parameters` or `expect` arrays using the `rpc://` URI scheme.
- The `iterate` property in the RPC's `response` is essential for processing a list of items returned by the API.

**Source files**
_rpcs.RpcGetBases

---

## Remote Procedure Calls (RPCs)-12

**Description**
When an official API does not provide endpoints for metadata (e.g., dynamic lists of tables, fields), this pattern uses an RPC to scrape the web interface. It simulates a user login by first fetching a login page for a CSRF token, submitting credentials, and then calling an undocumented internal endpoint to retrieve the data. This is a fragile but powerful method for creating a dynamic user experience.

**⚠️ Critical Warnings**
- This pattern is extremely brittle. Any change to the website's login form, HTML structure, or internal endpoints will break the RPC and modules that depend on it.
- Storing and using user passwords for scraping is a significant security risk and should only be used as a last resort when no API-key or OAuth alternative exists.
- Web scraping endpoints are often subject to stricter rate-limiting than official APIs, which can lead to `429 Too Many Requests` errors during module configuration.

**Example**
```json
{
  "_rpcs": {
    "RpcGetTables": {
      "api": [
        {
          "url": "https://service.test/login",
          "response": {
            "temp": {
              "csrf": "{{getCsrfFromBody(body)}}"
            },
            "type": "text",
            "output": {}
          },
          "shareCookies": true
        },
        {
          "url": "https://service.test/auth/login/",
          "body": {
            "_csrf": "{{temp.csrf}}",
            "email": "{{connection.email}}",
            "password": "{{connection.password}}"
          },
          "type": "urlencoded",
          "method": "POST",
          "response": {
            "type": "text",
            "error": {
              "429": {
                "message": "Too many requests. Please try again in 5 minutes."
              },
              "message": "Invalid log in credentials."
            },
            "valid": "{{isLoginValid(body)}}",
            "output": "{{item}}",
            "iterate": "{{getTables(body)}}"
          },
          "shareCookies": true
        }
      ]
    }
  }
}
```

**Implementation Steps**
1. Define an RPC in `_rpcs`.
2. Create a multi-step `api` array. The first step should `GET` the login page.
3. In the first step's `response`, use a custom function to extract a CSRF token from the `body` and store it in a `temp` variable.
4. The second step should `POST` to the login endpoint, sending the user's credentials (from `connection`) and the extracted CSRF token (from `temp`).
5. Set `shareCookies: true` on all steps to persist the session.
6. The final step accesses the target data endpoint.
7. Use IML functions in the final `response` to parse the HTML/JSON and format it as needed for the UI.

**Real-World Examples**
- `Multi-step auth: `GET /login` -> `POST /auth/login/` -> `GET /v0.3/application/.../read``
- `CSRF Token Extraction: Uses a custom function `{{getCsrfFromBody(body)}}` to parse the token from HTML.`
- `HTML Parsing for Data: Uses a custom function `{{getTables(body)}}` to extract table data from a JavaScript object embedded in the HTML body.`
- `Specific error handling for rate limits: `"error": { "429": { "message": "..." } }``

**Platform Notes**
- The `shareCookies: true` property is essential for maintaining the session across the multiple HTTP requests in the RPC chain.
- RPCs are used to populate UI elements like `select` dropdowns in modules (e.g., `options: "rpc://..."`).
- The use of custom IML functions (`getCsrfFromBody`, `getTables`) is necessary to handle the non-standard HTML responses.

**Source files**
_rpcs.RpcGetTables

---