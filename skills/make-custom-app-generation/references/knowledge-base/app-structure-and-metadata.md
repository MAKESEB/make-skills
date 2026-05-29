## App Structure and Metadata-01

**Description**
Defines the foundational configuration for all API calls within the app. It includes the `baseUrl`, common headers like `Content-Type`, and dynamically injects the OAuth 2.0 Access Token into the `Authorization` header for every request. It also specifies a global error handling pattern and log sanitization rules.

**⚠️ Critical Warnings**
- The `log.sanitize` configuration is crucial for security. Without it, sensitive data like Authorization tokens could be exposed in platform logs.
- If a `baseUrl` is defined, all relative paths in modules will be appended to it. Full URLs in modules will override the base URL.

**Example**
```json
{
    "log": {
      "sanitize": [
        "request.headers.authorization"
      ]
    },
    "baseUrl": "https://api.example.com/v1",
    "headers": {
      "Content-Type": "application/json+hal",
      "authorization": "Bearer {{connection.accessToken}}"
    },
    "response": {
      "error": {
        "message": "[{{statusCode}}] {{body.message}}"
      }
    }
}
```

**Implementation Steps**
1. At the root of your app's JSON definition, create a `base` object.
2. Inside `base`, define the `baseUrl` for your API (e.g., `"baseUrl": "https://api.example.com/v1"`).
3. Add a `headers` object with common headers, including the dynamic Authorization token (`"authorization": "Bearer {{connection.accessToken}}"`).
4. Implement a `log.sanitize` array to prevent sensitive data from being logged.
5. Define a `response.error` object to standardize how API errors are presented to the user.

**Real-World Examples**
- `Setting a global authorization header: `"authorization": "Bearer {{connection.accessToken}}"`.`
- `Creating a unified error message format: `"message": "[{{statusCode}}] {{body.message}}"`.`

**Platform Notes**
- The `{{connection.accessToken}}` variable is a standard Make.com placeholder for the current valid access token from the active connection. Make automatically handles the token refresh logic defined in the connection.
- The `base` object configuration is inherited by all modules and RPCs, reducing redundant configuration.

**Source files**
base

---

