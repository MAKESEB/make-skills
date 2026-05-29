# Add To Wallet

This Make custom app was generated from the exact npm package `n8n-nodes-addtowallet@1.1.8` extracted at `/Users/s.mertens/Documents/GitHub/App-vibe-coding-make.com/tmp/n8n-source/add-to-wallet`.

Classification: **production-ready** for the API surface present in the inspected package source. The package exposes one pass creation operation plus a credential validation endpoint for credits, so this app includes those first-class modules and the mandatory universal **Make an API Call** fallback.

## Source evidence

- `package.json`
- `README.md` (template only; not used as endpoint evidence)
- `dist/credentials/AddToWalletApi.credentials.js`
- `dist/nodes/AddToWallet/GenericFunctions.js`
- `dist/nodes/AddToWallet/AddToWallet.node.js`

## Authentication

The n8n credential defines a configurable Base URL with default `https://app.addtowallet.co` and an API key sent as the `apikey` header. Connection validation calls `GET /api/getCredits`.

## Included modules

- **Get Credits** (`getCredits`) — `GET /api/getCredits`
- **Create a Pass** (`createPass`) — `POST /api/card/create`
- **Make an API Call** (`makeAnApiCall`) — custom authorized request fallback

## RPCs and webhooks

The inspected n8n package does not expose `methods.listSearch`, `methods.loadOptions`, resource locators, trigger nodes, or webhook lifecycle methods. No RPCs or webhooks were generated.
