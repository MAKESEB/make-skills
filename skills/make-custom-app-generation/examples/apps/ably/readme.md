# Ably Make Custom App

This local Make custom app integrates with the documented Ably REST API at `https://rest.ably.io` using HTTP Basic authentication from an Ably API key name and secret.

## API facts

- Docs: https://ably.com/docs/api/rest-api
- Base URL: `https://rest.ably.io`
- Authentication: HTTP Basic auth using the Ably API key name and secret.
- Connection validation: `GET /stats?limit=1`.

## Included modules

- **Publish a Message**: `POST /channels/{channel}/messages`.
- **List Channels**: `GET /channels`.
- **Get a Channel**: `GET /channels/{channel}`.
- **Get Message History**: `GET /channels/{channel}/messages`.
- **Get Presence**: `GET /channels/{channel}/presence`.
- **Publish Presence**: `POST /channels/{channel}/presence`.
- **Get Stats**: `GET /stats`.
- **Get Server Time**: `GET /time`.
- **Request a Token**: `POST /keys/{keyName}/requestToken`.
- **Make an API Call** (`makeAnApiCall`): custom requests under `https://rest.ably.io`.

No Ably webhook lifecycle was added because these REST API docs do not provide a Make-compatible callback registration/detach lifecycle for the selected resources.
