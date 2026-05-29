## API Communication-01

**Description**
Defines a base configuration for all API calls within the app. It centralizes the service's `baseUrl`, sets default authentication `headers` using the connection's access token, and establishes a global `response` handler to format API error messages consistently across all modules.

**⚠️ Critical Warnings**
- The error message format `[{{statusCode}}] {{body.error.message}}` must exactly match the API's error response structure. If the API returns errors in a different format, this will fail to produce readable error messages.

**Example**
```json
{
  "base": {
    "baseUrl": "https://graph.microsoft.com/v1.0",
    "headers": {
      "Authorization": "Bearer {{connection.accessToken}}"
    },
    "response": {
      "error": {
        "message": "[{{statusCode}}] {{body.error.message}}"
      }
    }
  }
}
```

**Implementation Steps**
1. In the app's root, create a `base` object.
2. Set `baseUrl` to the API's root URL (e.g., `https://api.example.com/v1`).
3. Add a `headers` object and define the `Authorization` header to pass the connection's access token: `"Authorization": "Bearer {{connection.accessToken}}"`.
4. Add a `response.error` object to catch and format errors. Define a `message` key with a template for the desired output, such as `"[{{statusCode}}] {{body.error.message}}"`.

**Real-World Examples**
- `Base URL for Microsoft Graph API: `https://graph.microsoft.com/v1.0``
- `Standard OAuth2 Bearer token header: `Authorization: Bearer {{connection.accessToken}}``
- `Microsoft Graph API error object structure: `{"error": {"code": "someCode", "message": "Error details..."}}``

**Platform Notes**
- The `base` object is a powerful feature in Make.com apps for setting defaults. Any module-level `api` definition can override these settings.
- The `response.error` handler is global. If a specific module needs to handle an error differently (e.g., a 404 Not Found is not a true error), it must define its own local `response` block.

**Source files**
$.base

---

## API Communication-02

**Description**
Implements a search module that handles paginated results from a Microsoft Graph API (OData) endpoint. It uses a `pagination` block to automatically follow the `@odata.nextLink` URL provided in the response until all results are fetched or the user-defined `limit` is reached.

**⚠️ Critical Warnings**
- The `pagination.condition` must accurately check for the existence of the next link key. If the key is absent, the loop must terminate to prevent errors or infinite loops.
- Ensure the `pagination.url` is correctly extracting the full URL for the next page. For OData, this is typically the value of the `@odata.nextLink` property.

**Example**
```json
{
  "api": {
    "url": "/users",
    "method": "GET",
    "qs": {
      "$top": 250,
      "$count": true
    },
    "headers": {
      "ConsistencyLevel": "eventual"
    },
    "pagination": {
      "url": "{{body['@odata.nextLink']}}",
      "condition": "{{body['@odata.nextLink']}}"
    },
    "response": {
      "limit": "{{parameters.limit}}",
      "iterate": "{{body.value}}"
    }
  }
}
```

**Implementation Steps**
1. In the module's `api` definition, add a `pagination` object.
2. Set `pagination.url` to the IML expression that extracts the next page URL from the response body, e.g., `"{{body['@odata.nextLink']}}"`.
3. Set `pagination.condition` to the same expression to ensure the pagination call only executes if the next link exists.
4. In the `api.response` object, set `iterate` to the IML expression for the array of results, e.g., `"{{body.value}}"`.

**Real-World Examples**
- `Microsoft Graph API pagination key: `@odata.nextLink``
- `Microsoft Graph API result array key: `value``

**Platform Notes**
- The `qs` parameter `$top` controls how many items are fetched per API call, while the `response.limit` parameter controls the total number of items processed by the module during one run.
- The `ConsistencyLevel: eventual` header is often required for OData endpoints that support advanced query parameters like `$search` and `$filter`.

**Source files**
$._modules.listUsers.api

---

## API Communication-03

**Description**
Defines a global `base` object for all API calls, which includes the service's `baseUrl`, common `headers` for authentication, and a global `response` handling block for standardizing error messages and validation logic across the entire app.

**⚠️ Critical Warnings**
- The `log.sanitize` array is critical for preventing sensitive data like API keys or authorization tokens from being exposed in execution logs.
- The global response `error` handler is a catch-all; modules may need to override it for APIs that return non-standard error structures.
- A custom IML function like `valid(body)` for the `valid.condition` is flexible but adds complexity; if it fails, all API calls might be incorrectly treated as failed.

**Example**
```json
{
  "base": {
    "baseUrl": "https://api.adalo.com",
    "headers": {
      "Authorization": "Bearer {{connection.apiKey}}"
    },
    "response": {
      "error": {
        "message": "[{{statusCode}}] {{ifempty(body.error, body)}}"
      },
      "valid": {
        "condition": "{{valid(body)}}"
      }
    },
    "log": {
      "sanitize": [
        "request.headers.authorization"
      ]
    }
  }
}
```

**Implementation Steps**
{
  "base": {
    "baseUrl": "https://api.example.com",
    "headers": {
      "Authorization": "Bearer {{connection.apiKey}}"
    },
    "response": {
      "error": {
        "message": "[{{statusCode}}] {{body.message}}"
      }
    },
    "log": {
      "sanitize": [
        "request.headers.authorization"
      ]
    }
  }
}

**Real-World Examples**
- `"Authorization": "Bearer {{connection.apiKey}}"`
- `"message": "[{{statusCode}}] {{ifempty(body.error, body)}}"`

**Platform Notes**
- The `{{connection.apiKey}}` syntax shows how Make.com injects connection parameters into the base configuration.
- The `log.sanitize` path must exactly match the key path in the request object to be effective.

**Source files**
base

---

## API Communication-04

**Description**
Implements a generic 'Make an API Call' action, providing users with maximum flexibility. It uses mappable parameters for the URL path, method, headers, and query string, and uses the `toCollection` function to dynamically construct key-value pairs for headers and query parameters.

**⚠️ Critical Warnings**
- The `toCollection` function is essential for converting a user-defined array of key-value objects into a format the HTTP client understands. Forgetting this will result in malformed requests.
- Always add the `Authorization` header separately to ensure it's included from the connection details and not overwritten by the user.

**Example**
```json
{
    "name": "ActionMakeAnApiCall",
    "label": "Make an API Call",
    "typeId": 12,
    "api": {
        "url": "https://api.example.com{{parameters.url}}",
        "method": "{{parameters.method}}",
        "headers": {
            "{{...}}": "{{toCollection(parameters.headers, 'key', 'value')}}",
            "Authorization": "{{connection.apiKey}}"
        },
        "qs": {
            "{{...}}": "{{toCollection(parameters.qs, 'key', 'value')}}"
        },
        "body": "{{parameters.body}}",
        "response": {
            "output": {
                "statusCode": "{{statusCode}}",
                "headers": "{{headers}}",
                "body": "{{body}}"
            }
        }
    }
}
```

**Implementation Steps**
Create a new action module. In its `api` definition, set the `url` to concatenate a base URL and a user parameter `{{parameters.url}}`. For `headers` and `qs`, use the `{{...}}: "{{toCollection(...)}}"` pattern to handle dynamic key-value pairs from user input. Manually add the static `Authorization` header to pull from the connection.

**Real-World Examples**
- `Dynamically setting headers: `"{{...}}": "{{toCollection(parameters.headers, 'key', 'value')}}"`.`
- `Dynamically setting query string parameters: `"{{...}}": "{{toCollection(parameters.qs, 'key', 'value')}}"`.`
- `Concatenating the base URL with a user-provided path: `https://api.example.com{{parameters.url}}`.`

**Platform Notes**
- This pattern is typically used for a module with `typeId: 12` (Action).
- The `parameters` object (e.g., `parameters.url`) refers to the values entered by the user in the module's interface, which is defined by the `expect` array.
- The special `{{...}}` key is a Make-specific syntax for merging a collection of key-value pairs into an object.

**Source files**
_modules.ActionMakeAnApiCall

---

## API Communication-05

**Description**
Establish a reusable `base` configuration for all API calls. This object centralizes common settings like the `baseUrl`, authentication `headers`, global `timeout`, and a default `response` handler for errors, promoting consistency and reducing redundancy across modules.

**⚠️ Critical Warnings**
- The `timeout` calculation `{{if(common.timeout, common.timeout - 10000, undefined)}}` depends on a `common.timeout` variable. If this is not set during connection setup, the timeout may be undefined, leading to platform defaults.
- Sanitizing sensitive headers in `base.log.sanitize` (e.g., `authorization`) is critical for security. Failure to do so will expose secret tokens and API keys in Make.com logs.
- The header `authorization": "Bearer {{ifempty(connection.accessToken, connection.apiToken)}}` attempts to handle multiple authentication types. This requires careful setup in the connection to ensure the correct token is available.

**Example**
```json
{
    "baseUrl": "{{getBaseUrl(connection, 'api.airtable.com/v0')}}",
    "response": {
        "error": "[{{statusCode}}] {{parseError(body.error, metadata.expect)}}"
    },
    "headers": {
        "authorization": "Bearer {{ifempty(connection.accessToken, connection.apiToken)}}"
    },
    "timeout": "{{if(common.timeout, common.timeout - 10000, undefined)}}",
    "log": {
        "sanitize": [
            "request.headers.X-Airtable-Client-Secret",
            "request.headers.authorization"
        ]
    }
}
```

**Implementation Steps**
1. In your app's main JSON file, create a top-level `base` object.
2. Define a `baseUrl` key. Use IML functions like `if` or custom functions to handle different environments (e.g., production, sandbox) or proxies.
3. Add a `headers` object for authentication tokens that are common to all requests.
4. Implement a `response.error` handler to format error messages, using custom functions to parse the API's error structure for better user feedback.
5. Include a `log.sanitize` array to specify paths to sensitive data in requests and responses (e.g., `request.headers.authorization`, `response.body.access_token`) that should be hidden from logs.

**Real-World Examples**
- `Dynamic Base URL for Proxies: `"baseUrl": "{{getBaseUrl(connection, 'api.airtable.com/v0')}}"` uses a custom function to switch the base URL, enabling features like API proxies.`
- `Custom Error Parsing: `"error": "[{{statusCode}}] {{parseError(body.error, metadata.expect)}}"` invokes a custom function `parseError` to provide more descriptive error messages to the user.`
- `Conditional Headers: `"X-Airtable-Client-Secret": "{{if(connection.apiToken, common.metadataClientSecret)}}"` demonstrates adding a header only when a specific connection parameter (legacy API key) is present.`

**Platform Notes**
- The `base` object is a top-level key in the app's main JSON file.
- Properties defined in a module's `api` definition will override the properties set in the `base` configuration.
- The `log.sanitize` paths prevent specified data from appearing in scenario execution history logs.

**Source files**
base

---

## API Communication-06

**Description**
Establishes a foundational API configuration using the `base` object. This pattern defines a shared `baseUrl`, common `headers` for authentication (injecting the API key via `{{connection.apiKey}}`), and a global `response` block to handle errors and validation. This centralizes common request parameters and simplifies module definitions.

**⚠️ Critical Warnings**
- The API returns errors with a 200 OK status code. The `valid.condition` is essential for catching these cases by inspecting the response body.
- The error structure (`body.Awis.Results.Result.Alexa.Request.Errors`) is deeply nested and must be mapped precisely.
- Sanitizing the `x-api-key` header in logs is crucial to prevent credential leakage.

**Example**
```json
{
  "base": {
    "baseUrl": "https://awis.api.alexa.com",
    "headers": {
      "Accept": "application/json",
      "x-api-key": "{{connection.apiKey}}"
    },
    "log": {
      "sanitize": [
        "request.headers.x-api-key"
      ]
    },
    "response": {
      "error": {
        "message": "[{{statusCode}}] {{body.Awis.Results.Result.Alexa.Request.Errors.Error.ErrorCode}}"
      },
      "valid": {
        "message": "{{body.Awis.Results.Result.Alexa.Request.Errors.Error.ErrorMessage}}",
        "condition": "{{if(body.Awis.Results.Result.Alexa.Request.Errors, false, true)}}"
      }
    }
  }
}
```

**Implementation Steps**
1. In the main app definition, create a `base` object.
2. Set the `baseUrl` to the API's root URL (e.g., `https://awis.api.alexa.com`).
3. Add a `headers` object to define common headers. Include the authentication header using a connection variable, like `"x-api-key": "{{connection.apiKey}}"`.
4. Implement a `response` object with `valid` and `error` blocks to handle API responses globally.
5. In the `valid` block, use a conditional expression like `"condition": "{{if(body.Awis.Results.Result.Alexa.Request.Errors, false, true)}}"` to treat successful status codes as errors if the body contains an error message.

**Real-World Examples**
- `baseUrl: "https://awis.api.alexa.com"`
- `Global validation condition: `"condition": "{{if(body.Awis.Results.Result.Alexa.Request.Errors, false, true)}}"``

**Platform Notes**
- The `base` configuration is automatically inherited by all modules, but can be overridden at the module level.
- The `{{connection.apiKey}}` syntax dynamically pulls the API key from the active user connection.

**Source files**
base

---

## API Communication-07

**Description**
This pattern addresses APIs (like CouchDB) that use optimistic locking, requiring a document's current revision (`_rev`) for updates or deletes to prevent race conditions. The module first performs a GET request to fetch the latest revision and then uses that revision in the subsequent DELETE request's `If-Match` header.

**⚠️ Critical Warnings**
- The initial GET request to fetch the revision (`_rev`) is crucial; without it, the DELETE request will fail with a 409 Conflict error.
- This pattern introduces an extra API call for each operation, which can impact rate limits and performance.
- The `|| null` fallback in `{{temp.rev || null}}` is important to prevent errors if the GET request fails or returns no revision.

**Example**
```json
[{"url":"{{connection.link}}/{{parameters.task}}","method":"GET","headers":{"Authorization":"Basic {{base64(connection.username + ':' + connection.password)}}"},"response":{"output":null,"temp":{"rev":"{{body._rev}}"}}},{"url":"{{connection.link}}/{{parameters.task}}","method":"DELETE","headers":{"Authorization":"Basic {{base64(connection.username + ':' + connection.password)}}","If-Match":"{{temp.rev || null}}"},"response":{"output":null}}]
```

**Implementation Steps**
1. **Initial GET Call**: Define the first API call in the module's communication array. Set its method to GET and the URL to the resource endpoint (e.g., `{{connection.link}}/{{parameters.task}}`).
2. **Store Revision**: In the `response` section of the first call, map the revision ID from the response body to a temporary variable (e.g., `"temp": {"rev": "{{body._rev}}"}`). Set the `output` to `null` as this call is only for data retrieval.
3. **Conditional DELETE Call**: Define the second API call. Set its method to DELETE and the URL to the same resource endpoint.
4. **Pass Revision**: In the `headers` of the second call, add an `If-Match` header and set its value to the stored temporary variable (e.g., `"If-Match": "{{temp.rev || null}}"`).

**Real-World Examples**
- `Deleting a document in a CouchDB-style database by providing its ID and latest revision.`
- `Using an `If-Match` header with an ETag for conditional HTTP DELETE requests.`

**Platform Notes**
- This pattern is mandatory for CouchDB-based APIs that use the `_rev` field for concurrency control.
- The revision ID is typically found in the response body of a GET request (e.g., `body._rev`).
- The second request must use the `If-Match` header for DELETE operations or include the `_rev` field in the request body for UPDATE operations.

**Source files**
_modules.deleteDocument

---

## API Communication-08

**Description**
This pattern provides a universal 'Make an API Call' module that allows users to interact with any of the service's API endpoints directly. It uses dynamic fields for the URL path, method, headers, and body, offering maximum flexibility when the app's specific modules do not cover a required endpoint.

**⚠️ Critical Warnings**
- This module exposes potentially complex API interactions to the user, who may not be familiar with the API's requirements.
- Improperly formatted JSON in the `body` parameter can cause API requests to fail.
- Authorization headers are typically added automatically; users adding their own can cause conflicts.

**Example**
```json
{"url":"{{connection.link}}/{{parameters.url}}","method":"{{parameters.method}}","headers":{"{{...}}":"{{toCollection(parameters.headers, 'key', 'value')}}","Authorization":"Basic {{base64(connection.username + ':' + connection.password)}}"},"qs":{"{{...}}":"{{toCollection(parameters.qs, 'key', 'value')}}"},"body":"{{parameters.body}}","response":{"output":{"body":"{{body}}","headers":"{{headers}}","statusCode":"{{statusCode}}"}}}
```

**Implementation Steps**
1. **Define Parameters**: In the module's `expect` block, define parameters for `url` (text), `method` (select), `headers` (array of key/value), `qs` (array of key/value), and `body` (any).
2. **Construct URL**: In the `api` configuration, build the full request URL using the connection and the `url` parameter: `"url": "{{connection.link}}/{{parameters.url}}"`.
3. **Map Dynamic Inputs**: Set the `method` to `{{parameters.method}}`. Use `toCollection(parameters.headers, 'key', 'value')` to populate headers and `toCollection(parameters.qs, 'key', 'value')` for the query string.
4. **Pass Body**: Map the `body` parameter directly: `"body": "{{parameters.body}}"`.
5. **Define Output**: In the `response`, return the `statusCode`, `headers`, and `body` of the API response to the user.

**Real-World Examples**
- `Executing a newly documented beta API endpoint not yet supported by a dedicated module.`
- `Sending a custom query to a search endpoint that accepts complex, user-defined filter objects.`

**Platform Notes**
- Use the `toCollection` function to convert an array of key-value pairs from the UI into a JSON object for `headers` and `qs` (query string).
- The `url` field should combine a base URL from the connection with a user-provided relative path: `{{connection.link}}/{{parameters.url}}`.
- The `body` parameter should be of `type: "any"` in the `expect` definition to allow for both raw text and JSON objects.

**Source files**
_modules.makeAnAPICall

---

## API Communication-09

**Description**
Implements a multi-step, asynchronous API process with polling. The module first initiates a long-running job (a simulation) via a POST request, then uses the ID from the response to poll a status endpoint with a GET request. The `repeat` directive controls the polling until the job is complete.

**⚠️ Critical Warnings**
- The `repeat.limit` is a crucial safeguard to prevent infinite loops if the job never completes or the status condition is misconfigured. The default is low, so set it appropriately for the expected job duration.
- The `repeat.delay` should be set carefully to avoid hitting API rate limits.
- Data passed between steps must be stored in the `temp` object, as it is scoped to the module's execution.

**Example**
```json
[
    {
        "url": "https://api.example.com/v2/skills/{{parameters.skill}}/stages/{{parameters.stage}}/simulations/",
        "method": "POST",
        "body": {
            "session": {
                "mode": "{{parameters.sessionMode}}"
            }
        },
        "response": {
            "temp": {
                "simulation": "{{body.id}}"
            }
        }
    },
    {
        "url": "https://api.example.com/v2/skills/{{parameters.skill}}/stages/{{parameters.stage}}/simulations/{{temp.simulation}}",
        "method": "GET",
        "repeat": {
            "condition": "{{body.status === 'IN_PROGRESS'}}",
            "delay": "2000",
            "limit": 30
        },
        "response": {
            "output": "{{body}}"
        }
    }
]
```

**Implementation Steps**
1. In a module's `api` definition, use an array of objects instead of a single object.
2. The first object in the array should be the POST request to initiate the job. In its `response`, store the job ID in a `temp` variable: `"temp": {"jobId": "{{body.id}}"}`.
3. The second object should be the GET request to the status endpoint, using the stored ID in the URL: `"url": ".../jobs/{{temp.jobId}}"`.
4. Add a `repeat` object to the GET call, defining the `condition` for polling (e.g., `"{{body.status === 'PENDING'}}"`), a `delay` in milliseconds, and a `limit` for the number of attempts.

**Real-World Examples**
- `Starting a job and getting an ID: `"temp": { "simulation": "{{body.id}}" }`.`
- `Polling a status endpoint: `.../simulations/{{temp.simulation}}`.`
- `The repeat condition: `"condition": "{{body.status === 'IN_PROGRESS'}}"`.`

**Platform Notes**
- When an array of API calls is defined for a module, they are executed sequentially.
- The `temp` object is a transient storage mechanism that persists only for the duration of a single module's execution, allowing data to be passed between API calls in a sequence.
- This pattern is ideal for APIs that follow an asynchronous 'initiate and check' workflow.

**Source files**
_modules.invokeASkill.api

---

## API Communication-10

**Description**
Implements marker-based pagination for APIs that return a token for the next page of results. The `pagination` block is configured to take the `NextMarker` from the response body and use it as a query string parameter (`Marker`) in the next request. The process repeats until the `NextMarker` is empty.

**⚠️ Critical Warnings**
- The `condition` is crucial. If it's not set correctly, you can create an infinite loop of API calls.
- Ensure the `qs` in the `pagination` block correctly maps the response property (e.g., `body.NextMarker`) to the query parameter expected by the API (e.g., `Marker`).

**Example**
```json
{
  "api": {
    "url": "/2015-03-31/functions/",
    "method": "GET",
    "qs": {
      "MaxItems": 1000,
      "FunctionVersion": "ALL"
    },
    "response": {
      "iterate": "{{body.Functions}}"
    },
    "pagination": {
      "qs": {
        "Marker": "{{body.NextMarker}}"
      },
      "condition": "{{ifempty(body.NextMarker, false)}}"
    }
  }
}
```

**Implementation Steps**
1. Within a module or RPC's `api` definition, add a `pagination` object.
2. Inside `pagination`, define a `qs` object.
3. Map the API's expected query parameter for the next page (e.g., `Marker`) to the corresponding property from the response body (e.g., `{{body.NextMarker}}`).
4. Add a `condition` property to the `pagination` object.
5. Set the condition using an `ifempty` function to check for the existence of the next page marker, returning `false` to stop pagination when it's missing.

**Real-World Examples**
- `Pagination condition: `"condition": "{{ifempty(body.NextMarker, false)}}"``
- `Pagination query string: `"qs": { "Marker": "{{body.NextMarker}}" }``

**Platform Notes**
- The `pagination` object is defined at the same level as `url` and `method` within an `api` block.
- The `ifempty` IML function is ideal for checking if a pagination token exists to control the loop.
- This pattern is suitable for any API that uses a next-page token/marker/cursor, not just offset/limit.

**Source files**
amazon-lambda/_rpcs/listFunctions/api

---

## API Communication-11

**Description**
Implements a search module that leverages OData query parameters (`$filter`, `$search`, `$select`, `$top`) for powerful, server-side filtering. This pattern demonstrates handling paginated results by detecting and using the `@odata.nextLink` property provided in the API response for subsequent requests.

**⚠️ Critical Warnings**
- Advanced query parameters like `$search` and `$filter` on certain fields require the `ConsistencyLevel: eventual` header. Failure to include this will result in a 'Request is malformed or invalid' error from the Graph API.
- OData query parameter values must be properly encoded. While Make handles some encoding, complex filter strings may require manual attention.

**Example**
```json
{
    "listUsers": {
        "api": {
            "url": "/users",
            "method": "GET",
            "qs": {
                "$count": true,
                "$top": 250,
                "$search": "{{parameters.search}}"
            },
            "headers": {
                "ConsistencyLevel": "eventual"
            },
            "pagination": {
                "url": "{{body.`@odata.nextLink`}}",
                "condition": "{{body.`@odata.nextLink`}}"
            },
            "response": {
                "limit": "{{parameters.limit}}",
                "iterate": "{{body.value}}",
                "output": "{{omit(item, '@odata.context')}}"
            }
        },
        "typeId": 9,
        "label": "Search Users"
    }
}
```

**Implementation Steps**
1. In a search module, set `typeId` to `9`.
2. In the `api.qs` object, map user parameters to OData query parameters (e.g., `"$search": "{{parameters.search}}"`).
3. Add `"$count": true` to `qs` and `"ConsistencyLevel": "eventual"` to `headers` for advanced queries.
4. Create a `pagination` object within `api`.
5. Set `pagination.condition` and `pagination.url` to `"{{body.`@odata.nextLink`}}"`.
6. In `api.response`, set `iterate` to `"{{body.value}}"` to process each result item.

**Real-World Examples**
- `GET /users?$filter=startsWith(displayName,'J')&$count=true`
- `GET /groups?$search=\"displayName:Sales\"`
- `Pagination URL in response: `"@odata.nextLink": "https://graph.microsoft.com/v1.0/users?$top=250&$skiptoken=..."``

**Platform Notes**
- Pagination is handled by defining a `pagination` object in the module's `api` configuration.
- The `condition` property checks for the existence of `body["@odata.nextLink"]`. If it exists, a subsequent request is made to the URL specified in the `url` property.
- Accessing the `@odata.nextLink` key requires backticks in IML: `{{body.`@odata.nextLink`}}`.
- The `omit` function is used in the `output` to clean the final result by removing the `@odata.context` property.

**Source files**
_modules.listUsers

---

## API Communication-12

**Description**
Define a `base` object to establish the `baseUrl`, common `headers` (like Authorization), and global `response` handling for all API calls. This centralizes common settings, standardizes error handling, and simplifies individual module definitions.

**⚠️ Critical Warnings**
- The `valid` condition `{{valid(body)}}` requires a custom IML function to determine if a response is valid. If this function is not robust, it might misinterpret valid empty or non-JSON responses as errors.
- The global error message `[{{statusCode}}] {{ifempty(body.error, body)}}` assumes a specific error structure. It may need to be adjusted if the API returns errors in different formats for different endpoints or status codes.

**Example**
```json
{
  "base": {
    "log": {
      "sanitize": [
        "request.headers.authorization"
      ]
    },
    "baseUrl": "https://api.example.com",
    "headers": {
      "Authorization": "Bearer {{connection.apiKey}}"
    },
    "response": {
      "error": {
        "message": "[{{statusCode}}] {{ifempty(body.error, body)}}"
      },
      "valid": {
        "condition": "{{valid(body)}}"
      }
    }
  }
}
```

**Implementation Steps**
1. At the root of your app's JSON manifest, create a `base` object.
2. Inside `base`, set the `baseUrl` key to your API's root URL (e.g., `"https://api.service.test"`).
3. Add a `headers` object with an `Authorization` key. Use a template like `"Bearer {{connection.credentialKey}}"` to reference the user's stored credential.
4. Add a `response` object to define global error handling. Inside, create an `error` object with a `message` key that formats a standard error output from the API's status code and body (e.g., `"[{{statusCode}}] {{body.message}}"`).
5. Add a `log.sanitize` array to prevent sensitive data like authorization headers from being logged.

**Real-World Examples**
- `baseUrl: "https://api.adalo.com"`
- `Authorization Header: "Authorization": "Bearer {{connection.apiKey}}"`
- `Sanitizing Logs: "sanitize": ["request.headers.authorization"]`
- `Error Formatting: "message": "[{{statusCode}}] {{ifempty(body.error, body)}}"`

**Platform Notes**
- The `base` object is a top-level key in the app's manifest. Its properties are inherited by all `api` calls in modules and RPCs unless overridden locally.
- Using `{{connection.apiKey}}` dynamically inserts the credential stored in the user's connection, linking the API call to the authenticated account.

**Source files**
adalo.json: /base

---

## API Communication-13

**Description**
Implements a universal 'Make an API Call' action module that provides users with a flexible interface to interact with any of the app's REST API endpoints. This module uses IML to dynamically construct the request URL, method, headers, query string, and body from user-configured parameters. This pattern avoids the need to create a separate module for every API endpoint.

**⚠️ Critical Warnings**
- The `Authorization` header is automatically added. Users must be instructed not to add it themselves in the 'Headers' parameter field to avoid conflicts.
- As this module can make any API call, it can perform destructive actions (like DELETE). The module's help text should warn users to be careful.

**Example**
```json
{
    "id": 27500,
    "api": {
        "qs": {
            "{{...}}": "{{toCollection(parameters.qs, 'key', 'value')}}"
        },
        "url": "https://api.aidaform.com{{parameters.url}}",
        "body": "{{parameters.body}}",
        "type": "text",
        "method": "{{parameters.method}}",
        "headers": {
            "{{...}}": "{{toCollection(parameters.headers, 'key', 'value')}}",
            "Authorization": "{{connection.apiKey}}"
        },
        "response": {
            "output": {
                "body": "{{body}}",
                "headers": "{{headers}}",
                "statusCode": "{{statusCode}}"
            }
        }
    },
    "name": "ActionMakeAnApiCall",
    "label": "Make an API Call",
    "typeId": 12,
    "expect": [
        {
            "name": "url",
            "type": "text",
            "label": "URL",
            "required": true
        },
        {
            "name": "method",
            "type": "select",
            "label": "Method",
            "default": "GET",
            "options": [
                {"label": "GET", "value": "GET"},
                {"label": "POST", "value": "POST"}
            ],
            "required": true
        },
        {
            "name": "headers",
            "type": "array",
            "spec": [{"name": "key", "type": "text"}, {"name": "value", "type": "text"}]
        },
        {
            "name": "qs",
            "type": "array",
            "spec": [{"name": "key", "type": "text"}, {"name": "value", "type": "text"}]
        },
        {
            "name": "body",
            "type": "any",
            "label": "Body"
        }
    ]
}
```

**Implementation Steps**
1. Create an action module (`typeId: 12`).
2. In the `expect` array, define parameters for `url` (text), `method` (select), `headers` (array), `qs` (array), and `body` (any).
3. In the `api` block, map these parameters: `"method": "{{parameters.method}}"`, `"url": "https://api.example.com{{parameters.url}}"`, `"body": "{{parameters.body}}"`.
4. Use `"{{...}}": "{{toCollection(parameters.headers, 'key', 'value')}}"` to populate the `headers` object, and do the same for `qs`.
5. Automatically inject the authentication header from the connection: `"Authorization": "{{connection.apiKey}}"`.
6. Define the `api.response.output` to return useful data like `body`, `headers`, and `statusCode`.

**Real-World Examples**
- `Dynamic URL: `https://api.aidaform.com{{parameters.url}}``
- `Dynamic Headers/QS construction using `{{toCollection(parameters.qs, 'key', 'value')}}``
- `Providing a selection of HTTP methods via a 'select' parameter type.`
- `Default header `Content-Type: application/json` pre-filled for user convenience.`

**Platform Notes**
- The `expect` array defines the user interface for the module's parameters.
- The `{{...}}` IML syntax combined with `toCollection` is used to map an array of key/value objects from a user parameter into a collection for the request headers or query string.
- The response output is structured to return the `statusCode`, `headers`, and `body` to the user for use in subsequent modules.

**Source files**
_modules.ActionMakeAnApiCall

---

## API Communication-14

**Description**
Establish a top-level `base` object to centralize common configurations for all API calls. This includes a dynamic `baseUrl`, standard authentication `headers`, a global `timeout`, and a custom `response` handler for errors, ensuring app-wide consistency and simplifying module definitions.

**⚠️ Critical Warnings**
- The timeout formula `{{if(common.timeout, common.timeout - 10000, undefined)}}` subtracts 10 seconds from the scenario's global timeout. If the global timeout is not set or is less than 10 seconds, API calls may fail.
- Sensitive headers like `authorization` and custom secrets like `X-Airtable-Client-Secret` must be explicitly added to `log.sanitize` to prevent them from being exposed in logs.

**Example**
```json
{
  "base": {
    "log": {
      "sanitize": [
        "request.headers.X-Airtable-Client-Secret",
        "request.headers.authorization"
      ]
    },
    "baseUrl": "{{getBaseUrl(connection, 'api.airtable.com/v0')}}",
    "headers": {
      "authorization": "Bearer {{ifempty(connection.accessToken, connection.apiToken)}}"
    },
    "timeout": "{{if(common.timeout, common.timeout - 10000, undefined)}}",
    "response": {
      "error": "[{{statusCode}}] {{parseError(body.error, metadata.expect)}}"
    }
  }
}
```

**Implementation Steps**
1. At the root of your app's JSON, create a `base` object.
2. Inside `base`, define a `baseUrl` using a static string or an IML function for dynamic endpoints.
3. Add a `headers` object to define authentication tokens and other common headers.
4. Implement a `log.sanitize` array to list all sensitive request and response keys that should be redacted from logs.
5. Define a `response.error` handler that formats error messages, optionally using a custom IML function (`{{parseError(...)}}`) for advanced logic.

**Real-World Examples**
- `Dynamic Base URL: `"baseUrl": "{{getBaseUrl(connection, 'api.airtable.com/v0')}}"` uses a custom function to switch between the standard API endpoint and a proxy URL.`
- `Flexible Authentication Header: `"authorization": "Bearer {{ifempty(connection.accessToken, connection.apiToken)}}"` handles both OAuth access tokens and basic API keys.`
- `Custom Error Parsing: `"error": "[{{statusCode}}] {{parseError(body.error, metadata.expect)}}"` delegates error message formatting to a custom IML function for more user-friendly feedback.`

**Platform Notes**
- The `ifempty()` function is crucial for supporting multiple authentication types within a single app structure, gracefully falling back from one token type to another.
- Using `metadata.expect` within the `parseError` function allows for context-aware error messages that can reference the labels of the fields the user was configuring, improving the user experience.

**Source files**
base

---

