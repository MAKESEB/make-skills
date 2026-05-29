## Connections and Authentication-01

**Description**
Defines a standard OAuth2 connection that is customized for a multi-tenant API like Microsoft's. It uses a user-configurable parameter (`directoryId`) to dynamically construct the `token` and `refresh` URLs, allowing users to connect to their specific tenant (`common`, `organizations`, or a specific tenant ID).

**⚠️ Critical Warnings**
- Sensitive data like `client_secret`, `code`, and tokens MUST be sanitized from logs using the `log.sanitize` array to prevent credential leakage. Failing to do so is a major security risk.
- The `ifempty` logic is crucial. Without a fallback to a common or default value, the connection will fail if the user doesn't provide the advanced parameter.

**Example**
```json
{
  "type": "oauth",
  "api": {
    "token": {
      "url": "https://login.microsoftonline.com/{{ifempty(parameters.directoryId, common.directoryId)}}/oauth2/v2.0/token",
      "method": "POST",
      "body": {
        "client_id": "{{ifempty(data.clientId, common.clientId)}}",
        "client_secret": "{{ifempty(data.clientSecret, common.clientSecret)}}",
        "grant_type": "authorization_code",
        "code": "{{temp.code}}",
        "redirect_uri": "{{oauth.redirectUri}}"
      }
    },
    "refresh": {
      "url": "https://login.microsoftonline.com/{{ifempty(parameters.directoryId, common.directoryId)}}/oauth2/v2.0/token",
      "grant_type": "refresh_token"
    },
    "log": {
      "sanitize": [
        "request.body.client_secret",
        "response.body.access_token",
        "response.body.refresh_token"
      ]
    }
  }
}
```

**Implementation Steps**
1. Define the connection `type` as `oauth`.
2. In the `api.token.url` and `api.refresh.url`, use an `ifempty` function to allow a user-provided tenant ID: `"{{ifempty(parameters.directoryId, common.directoryId)}}"`.
3. In the `parameters` array for the connection, define `directoryId` as an advanced text field.
4. Implement a `log.sanitize` array in the `token` and `refresh` blocks to list the full JSON paths of all sensitive request and response properties.

**Real-World Examples**
- `Microsoft Identity Platform token endpoint: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token``

**Platform Notes**
- The connection `parameters` array defines advanced fields like `directoryId`, `clientId`, and `clientSecret` that users can override.
- The `common.directoryId` refers to a variable stored at the app level, providing a default value if the user does not specify one.
- The special `temp.code` variable holds the authorization code returned from the `/authorize` redirect.

**Source files**
$._accounts.active-directory

---

## Connections and Authentication-02

**Description**
Defines a connection using a basic API key. The user provides a key, which is validated by making a test API call. The key is then used in the 'Authorization' header for all subsequent requests. This pattern includes sanitizing logs to prevent key exposure.

**⚠️ Critical Warnings**
- The `log.sanitize` property must be used to prevent sensitive data like API keys from being stored in execution logs.
- The validation API call (`/v1/forms` in this case) must be a stable endpoint that returns a predictable success response to verify the connection is working.
- If the validation API call fails, the `error.message` is displayed to the user, so it should be clear and helpful.

**Example**
```json
{
    "aidaform": {
      "type": "basic",
      "label": "AidaForm",
      "parameters": [
        {
          "name": "apiKey",
          "type": "text",
          "label": "API Key",
          "required": true,
          "help": "API key can be found at [https://my.example.com/account/settings]"
        }
      ],
      "api": {
        "url": "https://api.example.com/v1/forms",
        "headers": {
          "Authorization": "{{parameters.apiKey}}"
        },
        "response": {
          "valid": {
            "condition": "{{body.items}}"
          },
          "error": {
            "message": "An error occurs while authorization. Make sure the API key is valid and try again or contact `support@example.com` if an error persists."
          }
        },
        "log": {
          "sanitize": [
            "request.headers.Authorization"
          ]
        }
      }
    }
}
```

**Implementation Steps**
In your app's `_accounts` object, define a new connection. Set its `type` to `basic`. In the `parameters` array, add a `text` field for the `apiKey`. In the `api` object, set the validation `url`, add the `Authorization` header with the `{{parameters.apiKey}}` variable, and define a `response.valid.condition` to check for a successful API call. Crucially, add a `log.sanitize` array to protect the API key.

**Real-World Examples**
- `Validating an API key by making a GET request to a resource endpoint like `/v1/forms` and checking for the existence of the `items` key in the response body.`
- `Using `{{parameters.apiKey}}` to dynamically insert the user-provided key into the `Authorization` header.`

**Platform Notes**
- The `parameters` array defines the input fields presented to the user when creating a new connection.
- The `api.response.valid.condition` is an IML expression that must evaluate to true for the connection to be considered successful.
- This pattern is defined in the app's `_accounts` section.

**Source files**
_accounts.aidaform

---

## Connections and Authentication-03

**Description**
Define an OAuth 2.0 connection with PKCE. This pattern includes separate definitions for the `authorize`, `token`, and `refresh` flows, using IML to handle dynamic parameters like `code_challenge` and store/retrieve tokens from the connection's data store.

**⚠️ Critical Warnings**
- The `code_verifier` is generated and stored in a temporary variable in the `authorize` step. It must be correctly passed to the `token` step to complete the PKCE flow.
- Sensitive information like `client_id` and `client_secret` should be sanitized from logs. Ensure the `log.sanitize` array in each flow (`token`, `refresh`) is correctly configured.
- The token refresh logic (`refresh.condition`) is crucial for long-lived connections. If the condition is incorrect, the connection may expire and fail scenarios.

**Example**
```json
{
  "authorize": {
    "url": "https://airtable.com/oauth2/v1/authorize",
    "qs": {
      "response_type": "code",
      "client_id": "{{ifempty(parameters.clientId, common.clientId)}}",
      "redirect_uri": "{{oauth.redirectUri}}",
      "scope": "{{join(oauth.scope, ' ')}}",
      "code_challenge": "{{base64url(sha256(temp.code_verifier, 'base64'))}}",
      "code_challenge_method": "S256"
    },
    "temp": {
      "code_verifier": "{{uuid}}.{{uuid}}"
    }
  },
  "token": {
    "url": "https://airtable.com/oauth2/v1/token",
    "method": "POST",
    "type": "urlencoded",
    "body": {
      "grant_type": "authorization_code",
      "code": "{{temp.code}}",
      "redirect_uri": "{{oauth.redirectUri}}",
      "code_verifier": "{{temp.code_verifier}}"
    },
    "response": {
      "data": {
        "accessToken": "{{body.access_token}}",
        "refreshToken": "{{body.refresh_token}}"
      }
    }
  }
}
```

**Implementation Steps**
1. In `_accounts`, define a connection with `type: "oauth"`.
2. Create an `api.authorize` object. Set the `url` and define the `qs` with OAuth parameters like `response_type`, `client_id`, `scope`, and PKCE parameters (`code_challenge`, `code_challenge_method`).
3. In `authorize.temp`, generate and store a `code_verifier`.
4. Create an `api.token` object. Set the `method` to `POST` and `type` to `urlencoded`. Define the `body` with `grant_type: "authorization_code"`, the `code` from the previous step, and the `code_verifier`.
5. In `token.response.data`, map the API's token response (`access_token`, `refresh_token`, `expires_in`) to the connection's data store.
6. Optionally, implement an `api.refresh` flow with a `condition` to check for token expiry.

**Real-World Examples**
- `PKCE Challenge: The `code_challenge` is dynamically generated using `{{base64url(sha256(temp.code_verifier, 'base64'))}}`.`
- `Token Storage: The `token` flow's response maps `body.access_token` and `body.refresh_token` to the connection's `data` store for later use.`
- `Refresh Condition: `"condition": "{{data.expires < addMinutes(now, 1)}}"` triggers the refresh flow only when the access token is close to expiring.`

**Platform Notes**
- This configuration is placed within an account definition in the `_accounts` object of the app's main JSON.
- Set the account `type` to `"oauth"`.
- The `{{oauth.redirectUri}}` variable is provided by the Make.com platform and does not need to be defined manually.
- The `info` endpoint is called after a successful connection to validate the credentials and display user-friendly information (e.g., User ID).

**Source files**
_accounts.airtable-test.api

---

## Connections and Authentication-04

**Description**
Defines a connection using Basic Authentication. It takes a username and an API key (as password), combines them using the `base64` function, and automatically applies the resulting `Authorization` header to all API calls defined in the `base` object.

**⚠️ Critical Warnings**
- The `log.sanitize` property in the `base` or `_accounts` object is critical to prevent leaking sensitive credentials (like the Authorization header) into execution logs.
- The `name` attributes in the `parameters` array (`username`, `password`) must correspond to the keys used in the `connection` object (`connection.username`, `connection.password`).

**Example**
```json
{
  "base": {
    "baseUrl": "https://api.example.com",
    "headers": {
      "authorization": "Basic {{base64(connection.username + ':' + connection.password)}}"
    },
    "log": {
      "sanitize": [
        "request.headers.authorization"
      ]
    }
  },
  "_accounts": {
    "myServiceAccount": {
      "type": "basic",
      "label": "My Service Connection",
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
          "label": "API Key",
          "required": true,
          "help": "Find your API Key in your service dashboard under API settings."
        }
      ],
      "api": {
        "url": "/account",
        "response": {
          "error": {
            "message": "[{{statusCode}}] {{body.description}}"
          }
        }
      }
    }
  }
}
```

**Implementation Steps**
1. In the top-level `_accounts` object, define a new account with `type: "basic"`.
2. In its `parameters` array, define fields for the required credentials, for example, `name: "username"` and `name: "password"`.
3. In the top-level `base` object, define a `headers` object.
4. Add an `authorization` header with the value `"Basic {{base64(connection.username + ':' + connection.password)}}"` to construct the header from the user's connection details.
5. Include a `log.sanitize` array to prevent the `authorization` header from being logged.

**Real-World Examples**
- `"authorization": "Basic {{base64(connection.username + ':' + connection.password)}}"`
- `"log": {"sanitize": ["request.headers.authorization"]}`

**Platform Notes**
- The `connection` object is a special variable in Make.com that holds the credential values provided by the user when they create a connection for the app.
- The `api` block within the account definition is used to validate credentials when a user first creates the connection. It makes a test call to the specified endpoint.

**Source files**
_accounts.allmysms, base

---

## Connections and Authentication-05

**Description**
Implements the complete OAuth 2.0 authorization code grant flow, including token acquisition, automatic refresh, and user info retrieval. It defines the `authorize`, `token`, `refresh`, and `info` endpoints and logic necessary for a secure and persistent connection.

**⚠️ Critical Warnings**
- The `refresh.condition` `{{data.expires < addMinutes(now, 1)}}` is vital to prevent token expiration errors by refreshing the token just before it expires.
- Incorrectly configured `log.sanitize` in the token/refresh calls can leak client secrets and tokens into logs.
- Ensure `redirect_uri` in the `token` call body exactly matches the one sent in the `authorize` call.

**Example**
```json
{
    "amazon-alexa": {
      "type": "oauth",
      "label": "Amazon Alexa",
      "scope": [
        "profile"
      ],
      "api": {
        "authorize": {
            "url": "https://www.amazon.com/ap/oa",
            "qs": {
                "scope": "{{join(oauth.scope, ' ')}}",
                "client_id": "{{ifempty(parameters.clientId, common.clientId)}}",
                "redirect_uri": "{{oauth.redirectUri}}",
                "response_type": "code"
            }
        },
        "token": {
            "url": "https://api.amazon.com/auth/o2/token",
            "method": "POST",
            "type": "urlencoded",
            "body": {
                "grant_type": "authorization_code",
                "code": "{{temp.code}}",
                "redirect_uri": "{{oauth.redirectUri}}",
                "client_id": "{{ifempty(parameters.clientId, common.clientId)}}",
                "client_secret": "{{ifempty(parameters.clientSecret, common.clientSecret)}}"
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
            "url": "https://api.amazon.com/auth/o2/token",
            "method": "POST",
            "type": "urlencoded",
            "condition": "{{data.expires < addMinutes(now, 1)}}",
            "body": {
                "grant_type": "refresh_token",
                "refresh_token": "{{data.refreshToken}}",
                "client_id": "{{ifempty(parameters.clientId, common.clientId)}}",
                "client_secret": "{{ifempty(parameters.clientSecret, common.clientSecret)}}"
            },
            "response": {
                "data": {
                    "accessToken": "{{body.access_token}}",
                    "refreshToken": "{{body.refresh_token}}",
                    "expires": "{{addSeconds(now, body.expires_in)}}"
                }
            }
        },
        "info": {
            "url": "https://api.amazon.com/user/profile",
            "headers": {
                "authorization": "Bearer {{connection.accessToken}}"
            },
            "response": {
                "uid": "{{body.user_id}}"
            }
        }
      }
    }
}
```

**Implementation Steps**
1. Under the `_accounts` key, define a new object for your connection.
2. Set the `type` to `"oauth"`.
3. Create an `api` object within it, containing four sub-objects: `authorize`, `token`, `refresh`, and `info`.
4. Configure the `url`, `qs`, `method`, `body`, and `response` for each of the four OAuth steps.
5. In the `refresh` object, add a `condition` to trigger the refresh before the token expires, e.g., `"condition": "{{data.expires < addMinutes(now, 1)}}"`.

**Real-World Examples**
- `Defining `token` and `refresh` endpoints at `https://api.amazon.com/auth/o2/token`.`
- `Using `grant_type: "refresh_token"` in the refresh call.`
- `Fetching user identity from `/user/profile` to validate a successful connection.`

**Platform Notes**
- The `common` object, populated via the `install` spec, is used to store shared credentials like `clientId` and `clientSecret` across all connections of this app type.
- The platform uses the `info` call to verify a connection's validity and display identifying information (like an email) to the user.
- The `data` object within `token` and `refresh` responses is where Make stores the connection's state, including `accessToken` and `refreshToken`.

**Source files**
_accounts

---

## Connections and Authentication-06

**Description**
Establishes a common authentication and request foundation for an AWS-based app using Signature Version 4. The `base` object centralizes the `baseUrl`, which dynamically includes the connection's region, and an `aws` configuration block that references the connection's key and secret for signing all subsequent API requests.

**⚠️ Critical Warnings**
- Ensure the `sign_version` is set to '4' for modern AWS services.
- The connection `region` must be correctly passed to the `baseUrl` for requests to resolve to the right AWS endpoint.
- Missing or incorrect AWS credentials in the connection will lead to authentication failures, typically a 403 Forbidden status.

**Example**
```json
{
  "base": {
    "aws": {
      "key": "{{connection.key}}",
      "secret": "{{connection.secret}}",
      "sign_version": "4"
    },
    "baseUrl": "https://lambda.{{connection.region}}.amazonaws.com",
    "response": {
      "error": {
        "403": {
          "message": "[403] Unable to determine service/operation name to be authorized."
        },
        "message": "[{{statusCode}}] {{body.message}}"
      }
    }
  },
  "_accounts": {
    "amazon-lambda": {
      "type": "basic",
      "label": "Amazon Lambda",
      "parameters": [
        {
          "name": "key",
          "type": "text",
          "label": "AWS Key",
          "required": true
        },
        {
          "name": "secret",
          "type": "password",
          "label": "AWS Secret Key",
          "required": true
        },
        {
          "name": "region",
          "type": "select",
          "label": "Region",
          "required": true,
          "options": [
            {
              "label": "US East (N. Virginia)",
              "value": "us-east-1"
            },
            {
              "label": "US West (Oregon)",
              "value": "us-west-2"
            }
          ]
        }
      ]
    }
  }
}
```

**Implementation Steps**
1. In the app's root, define a `base` object.
2. Inside `base`, create an `aws` object containing `key`, `secret`, and `sign_version` mapped to connection parameters.
3. Also in `base`, define the `baseUrl`, incorporating `{{connection.region}}` to make it dynamic.
4. Define the connection in `_accounts` with `type: "basic"` and add `parameters` for `key`, `secret`, and `region` to create the UI for the user.

**Real-World Examples**
- `Base URL format: `https://lambda.{{connection.region}}.amazonaws.com``
- `AWS authentication config: `"aws": { "key": "{{connection.key}}", "secret": "{{connection.secret}}", "sign_version": "4" }``

**Platform Notes**
- This pattern is specific to AWS services and leverages Make.com's built-in support for AWS Signature Version 4.
- The `_accounts` definition provides the user interface for entering the `key`, `secret`, and `region` which are then referenced in the `base` object via `{{connection.*}}` variables.

**Source files**
amazon-lambda/base, amazon-lambda/_accounts/amazon-lambda

---

## Connections and Authentication-07

**Description**
Defines a complete OAuth 2.0 connection flow for Microsoft services, aliased to a common 'azure' connection. It specifies the `authorize`, `token`, and `refresh` endpoints, handles custom scopes, and uses an `info` call to `/me` to validate the token and retrieve the user's display name for the connection label.

**⚠️ Critical Warnings**
- The `aliasTo: "azure"` key means this connection's implementation is ignored, and it instead uses the shared 'azure' connection. Any changes to the `api` object here will have no effect.
- The `directoryId` (Tenant) parameter is crucial. Using 'common' allows multi-tenant access, while a specific tenant ID restricts it. Incorrect configuration leads to authentication failures.

**Example**
```json
{
    "_accounts": {
        "active-directory": {
            "type": "oauth",
            "aliasTo": "azure",
            "scope": [
                "User.Read.All",
                "offline_access"
            ],
            "api": {
                "authorize": {
                    "url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                    "qs": {
                        "client_id": "{{ifempty(parameters.clientId, common.clientId)}}",
                        "scope": "{{join(distinct(merge(oauth.scope, ifempty(parameters.scopes, emptyarray))), ' ')}}"
                    }
                },
                "token": {
                    "url": "https://login.microsoftonline.com/{{ifempty(parameters.directoryId, common.directoryId)}}/oauth2/v2.0/token",
                    "method": "POST"
                },
                "refresh": {
                    "url": "https://login.microsoftonline.com/{{ifempty(parameters.directoryId, common.directoryId)}}/oauth2/v2.0/token"
                },
                "info": {
                    "url": "https://graph.microsoft.com/v1.0/me/",
                    "response": {
                        "uid": "{{body.id}}",
                        "metadata": {
                            "type": "text",
                            "value": "{{body.displayName}}"
                        }
                    }
                }
            }
        }
    }
}
```

**Implementation Steps**
1. In `_accounts`, define a new connection with `type: "oauth"`.
2. In `api.authorize`, set the URL and `qs` parameters like `client_id`, `scope`, and `response_type`.
3. In `api.token` and `api.refresh`, configure the token endpoint URL and the request body for exchanging a code/refresh token for an access token.
4. Implement an `api.info` call to a simple endpoint (like `/me`) to verify the access token and retrieve a `uid` and `metadata.value` for the connection.

**Real-World Examples**
- `Authorize URL: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize``
- `Token URL: `https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token``

**Platform Notes**
- `ifempty(parameters.directoryId, common.directoryId)` allows users to override the default tenant ID in advanced connection settings.
- The `distinct(merge(...))` pattern is used to combine base scopes with optional user-provided scopes without duplication.
- The `info` call is best practice for validating a new connection and providing a user-friendly name (like the user's email or display name) in the Make UI.

**Source files**
_accounts.active-directory

---

## Connections and Authentication-08

**Description**
Implements a basic authentication scheme using a static API key. The connection configuration defines a parameter to capture the user's API key and an API call to a validation endpoint. The key is passed in the 'Authorization' header. The connection is considered successful if the validation endpoint returns a specific data structure.

**⚠️ Critical Warnings**
- The 'Authorization' header must be added to the 'log.sanitize' array to prevent sensitive API keys from being exposed in logs.
- The validation check ('valid.condition') is tied to a specific API response structure ('{{body.items}}'). If the validation endpoint changes its response, connections will fail.

**Example**
```json
{
    "aidaform": {
      "api": {
        "log": {
          "sanitize": [
            "request.headers.Authorization"
          ]
        },
        "url": "https://api.aidaform.com/v1/forms",
        "headers": {
          "Authorization": "{{parameters.apiKey}}"
        },
        "response": {
          "error": {
            "message": "An error occurs while authorization. Make sure the API key is valid and try again or contact `support@aidaform.com` if an error persists."
          },
          "valid": {
            "condition": "{{body.items}}"
          }
        }
      },
      "type": "basic",
      "label": "AidaForm",
      "parameters": [
        {
          "help": "API key can be found at [https://my.aidaform.com/account/settings](https://my.aidaform.com/account/settings).",
          "name": "apiKey",
          "type": "text",
          "label": "API Key",
          "required": true
        }
      ]
    }
}
```

**Implementation Steps**
1. In the `_accounts` section, define a new connection.
2. Set the `type` to `basic`.
3. In the `parameters` array, add a 'text' field with `"name": "apiKey"` and `"required": true` to collect the user's key.
4. In the `api` block, set the `url` to a simple, stable endpoint for validation (e.g., a list endpoint).
5. In `api.headers`, add an `"Authorization": "{{parameters.apiKey}}"` key-value pair.
6. In `api.response.valid`, specify a `condition` that verifies a successful response, such as `"{{body.items}}"`.
7. In `api.log.sanitize`, add `"request.headers.Authorization"` to protect the key.

**Real-World Examples**
- `Validation Endpoint: `https://api.aidaform.com/v1/forms``
- `Authorization Header: `"Authorization": "{{parameters.apiKey}}"``
- `Successful validation condition: `"valid": { "condition": "{{body.items}}" }` (checks for the existence of the `items` key in the response body).`

**Platform Notes**
- The 'type' is set to 'basic', which is suitable for simple key-based or user/password authentication schemes.
- The 'parameters' array defines the UI fields presented to the user when creating a new connection.

**Source files**
_accounts.aidaform

---

## Connections and Authentication-09

**Description**
Implement a flexible OAuth 2.0 connection with Proof Key for Code Exchange (PKCE). This pattern defines the complete authorization flow including `authorize`, `token`, `refresh`, and `info` endpoints, using IML functions to dynamically generate the `code_verifier` and `code_challenge`.

**⚠️ Critical Warnings**
- The `log.sanitize` property must be used within the `token` and `refresh` flows to prevent sensitive `access_token` and `refresh_token` values from being recorded in execution logs.
- The `code_verifier` generated in the `authorize` step must be correctly passed to the `token` step. Failure to maintain this state will break the OAuth flow.

**Example**
```json
{
  "airtable-test": {
    "type": "oauth",
    "api": {
      "authorize": {
        "url": "https://service.test/oauth2/v1/authorize",
        "qs": {
          "response_type": "code",
          "client_id": "{{ifempty(parameters.clientId, common.clientId)}}",
          "redirect_uri": "{{oauth.redirectUri}}",
          "scope": "{{join(oauth.scope, ' ')}}",
          "code_challenge": "{{base64url(sha256(temp.code_verifier, 'base64'))}}",
          "code_challenge_method": "S256"
        },
        "temp": {
          "code_verifier": "{{uuid}}.{{uuid}}"
        }
      },
      "token": {
        "url": "https://service.test/oauth2/v1/token",
        "method": "POST",
        "body": {
          "grant_type": "authorization_code",
          "code": "{{temp.code}}",
          "redirect_uri": "{{oauth.redirectUri}}",
          "code_verifier": "{{temp.code_verifier}}"
        }
      },
      "refresh": {
        "url": "https://service.test/oauth2/v1/token",
        "method": "POST",
        "body": {
          "grant_type": "refresh_token",
          "refresh_token": "{{data.refreshToken}}"
        }
      },
      "info": {
        "url": "https://api.example.com/v0/meta/whoami"
      }
    }
  }
}
```

**Implementation Steps**
1. In `_accounts`, define a new connection of `type: "oauth"`.
2. In the `api.authorize` block, set the `url` and define the `qs` parameters, including `response_type`, `client_id`, `redirect_uri`, `scope`, and `code_challenge_method`.
3. Generate a `code_verifier` in `authorize.temp` and use it to compute the `code_challenge`.
4. In the `api.token` block, configure the `POST` request to exchange the `code` for an access token, passing the `code_verifier` in the body.
5. Configure the `api.refresh` block to use the `refreshToken` to obtain a new `accessToken`.
6. Optionally, configure an `api.info` endpoint to validate the token and retrieve user information.

**Real-World Examples**
- `Generating a `code_verifier` on the fly: `"temp": { "code_verifier": "{{uuid}}.{{uuid}}" }`.`
- `Creating the `code_challenge`: `"code_challenge": "{{base64url(sha256(temp.code_verifier, 'base64'))}}"`.`
- `Passing the verifier to the token endpoint: `"code_verifier": "{{temp.code_verifier}}"` in the `token` request body.`

**Platform Notes**
- The `oauth.redirectUri` variable is provided by the Make platform and must be used as the `redirect_uri`.
- The `temp` object is used to store temporary state, like the `code_verifier`, between the `authorize` and `token` steps.
- Custom IML functions like `base64url` and `sha256` may need to be defined in `_functions` to support the PKCE hashing and encoding requirements.

**Source files**
_accounts.airtable-test

---

## Connections and Authentication-10

**Description**
Defines the base configuration for all API calls. This includes the `baseUrl`, a global `response.error` handler to standardize error messages from the API body, and default `headers` which inject the connection's API token for authentication. Crucially, it includes log sanitization to prevent sensitive data like authorization headers from being logged.

**⚠️ Critical Warnings**
- Ensure `log.sanitize` is correctly configured to cover all sensitive headers and body parameters (e.g., `authorization`, `X-Api-Key`, `password`) to prevent credential leakage in platform logs.

**Example**
```json
{
  "base": {
    "log": {
      "sanitize": [
        "request.headers.authorization"
      ]
    },
    "baseUrl": "https://api.airtable.com/v0",
    "headers": {
      "authorization": "Bearer {{connection.apiToken}}"
    },
    "response": {
      "error": "{{body.error.message || body.error.type || body.error}}"
    }
  }
}
```

**Implementation Steps**
1. In your app's `base.jsonc`, define the `baseUrl` for the API.
2. Add a `headers` object to set common headers for all requests, such as `Content-Type` or `Authorization`.
3. Use a mapping expression like `Bearer {{connection.apiToken}}` to dynamically insert the user's credential.
4. Implement a `response.error` handler to extract a user-friendly error message from the API's response body.
5. Add a `log.sanitize` array to list JSON paths of sensitive request/response fields that should be redacted from execution logs.

**Real-World Examples**
- `baseUrl: "https://api.airtable.com/v0"`
- `headers: { "authorization": "Bearer {{connection.apiToken}}" }`
- `response.error: "{{body.error.message || body.error.type || body.error}}"`
- `log.sanitize: ["request.headers.authorization"]`

**Platform Notes**
- The `{{connection.apiToken}}` syntax is a Make.com IML expression to map a value from the user's established connection.
- The `response.error` path uses an OR (`||`) expression to gracefully handle different error object structures from the API.

**Source files**
base

---

