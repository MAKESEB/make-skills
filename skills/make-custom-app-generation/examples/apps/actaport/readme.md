# Actaport

This Make custom app was generated from the exact npm package `@actaport/n8n-nodes-actaport@0.3.0` extracted at `/Users/s.mertens/Documents/GitHub/App-vibe-coding-make.com/tmp/n8n-source/actaport`.

Classification: **production-ready**. The app includes the mandatory universal **Make an API Call** module plus endpoint-specific modules generated from the Actaport n8n node source.

## Authentication

Actaport uses OAuth2 authorization code with PKCE. Enter the Actaport realm supplied with the subscription. The app uses client ID `automation`, scope `openid offline_access`, and validates the connection with `GET https://app.actaport.de/v1/info/me`.

## Generated coverage

The app maps Actaport resources from the n8n package: additional information categories, case files, collision checks, contacts, deadlines, departments, documents, document templates, expenses, folders, invoices, notes, resubmissions, RVG fees, tasks, third party costs, users, and webhooks. List/search modules iterate `body.content` and follow Actaport page metadata where `last === false`.

Document binary upload is not emitted as a first-class module because the n8n package implements it with a runtime multipart/binary helper. Use **Make an API Call** or add a dedicated binary module if needed.

## Dynamic RPCs and webhooks

The app includes Make RPCs translated from n8n `methods.listSearch` and `methods.loadOptions`: `getUsers`, `getContacts`, `getDocumentTemplates`, `getDepartments`, `getClerks`, `getAssistants`, `getOfficeLocations`, `getClients`, `getFolders`, `getDocuments`, and `getAllocatableDocuments`. Supported ID fields now use `rpc://` options where the source exposes a safe dynamic selector. The `watchEvents` instant trigger is backed by `webhooks/actaport-event-webhook` with attach/detach/api sections mapped from `ActaportTrigger.node.js`.
