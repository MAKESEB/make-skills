# AbuseIPDB Make Custom App

Production-ready local Make custom app for AbuseIPDB (folder kept as `apps/abuselpdb` to preserve the existing repository spelling).

API facts used: AbuseIPDB API v2 base URL `https://api.abuseipdb.com/api/v2`; authentication is the `Key` header; documented endpoints include `/check`, `/report`, `/reports`, `/blacklist`, `/check-block`, and `/clear-address`.

Modules: Make an API Call, Check an IP Address, Report an IP Address, Search IP Reports, Get Blacklist, Check a CIDR Block, Clear an IP Address.

No RPCs or webhooks are included because the public API documentation does not expose provider-backed list endpoints for dynamic selectors or webhook lifecycle registration.
