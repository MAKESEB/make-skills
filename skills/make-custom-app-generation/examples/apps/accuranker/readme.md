# AccuRanker Make Custom App

Production-ready local Make custom app for AccuRanker.

API facts used: Read API docs at `https://app.accuranker.com/api/read-docs`; Write API docs at `https://app.accuranker.com/api/write-docs`; base URL `https://app.accuranker.com/api/v4`; authentication is `Authorization: Token <api key>`. The Read API requires a `fields` query parameter and supports `limit`/`offset` list parameters.

Modules include account/domain/keyword/landing-page/tag read workflows plus write modules for groups and keywords, while preserving Make an API Call. RPC selectors are backed by documented list endpoints for accounts, domains, and domain keywords. No webhooks or polling triggers are included because the docs do not expose webhook lifecycle or reliable cursor semantics for trigger creation.
