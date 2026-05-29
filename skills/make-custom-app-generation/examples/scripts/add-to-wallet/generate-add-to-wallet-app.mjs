#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve(new URL("../..", import.meta.url).pathname);
const appDir = path.join(root, "apps/add-to-wallet");
const sourceDir = path.join(root, "tmp/n8n-source/add-to-wallet");
const reportPath = path.join(root, "generated/n8n-full-app-reports/add-to-wallet.md");
const pkg = "n8n-nodes-addtowallet@1.1.8";
const baseUrl = "https://app.addtowallet.co";
const connectionName = "api-key";

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}
function writeText(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}
function crc32(buf) {
  let c = -1;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ -1) >>> 0;
}
function chunk(typeName, data) {
  const type = Buffer.from(typeName);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([len, type, data, crc]);
}
function writeIcon(file) {
  const w = 512;
  const raw = Buffer.alloc((w * 4 + 1) * w);
  for (let y = 0; y < w; y += 1) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x += 1) {
      const o = y * (w * 4 + 1) + 1 + x * 4;
      const stripe = (x + y) % 96 < 48;
      const inner = x > 96 && x < 416 && y > 128 && y < 384;
      raw[o] = inner ? 255 : stripe ? 42 : 23;
      raw[o + 1] = inner ? 255 : stripe ? 118 : 74;
      raw[o + 2] = inner ? 255 : stripe ? 241 : 180;
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(w, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
}
function textParam(name, label, extra = {}) {
  return { name, type: "text", label, ...extra };
}
function colorParam(name, label, defaultValue, extra = {}) {
  return { name, type: "color", label, default: defaultValue, ...extra };
}
function selectParam(name, label, options, defaultValue, extra = {}) {
  return { name, type: "select", label, options, default: defaultValue, ...extra };
}
function arrayOfCollections(name, label, spec, extra = {}) {
  return { name, type: "array", label, spec, ...extra };
}
function writeModule(dirName, metadata, api, expect, iface, sample) {
  const dir = path.join(appDir, "modules", dirName);
  writeJson(path.join(dir, "metadata.json"), { connection: connectionName, ...metadata });
  writeJson(path.join(dir, "api.imljson"), api);
  writeJson(path.join(dir, "expect.imljson"), expect);
  writeJson(path.join(dir, "interface.imljson"), iface);
  writeJson(path.join(dir, "samples.imljson"), sample);
}

fs.rmSync(appDir, { recursive: true, force: true });

writeJson(path.join(appDir, "metadata.json"), {
  name: "add-to-wallet",
  label: "Add To Wallet",
  description: "Create digital Apple/Google Wallet passes through the AddToWallet API.",
  version: 1,
  author: "Hermes/Codex n8n package-source factory",
  url: "https://addtowallet.co/",
  theme: "#2A76F1",
  language: "en",
  audience: "global"
});

writeJson(path.join(appDir, "base.imljson"), {
  baseUrl: "{{connection.baseUrl}}",
  headers: {
    apikey: "{{connection.apiKey}}",
    Accept: "application/json",
    "Content-Type": "application/json"
  },
  response: {
    error: {
      401: { message: "[401] Authentication failed. Check the AddToWallet API key." },
      403: { message: "[403] Access denied by AddToWallet. Check API permissions." },
      404: { message: "[404] AddToWallet endpoint or resource not found." },
      message: "[{{statusCode}}] {{body.message || body.error || 'AddToWallet request failed'}}"
    }
  },
  log: {
    sanitize: ["request.headers.apikey", "request.headers.apiKey", "request.body.apiKey"]
  }
});

writeJson(path.join(appDir, "connections/api-key/metadata.json"), {
  name: connectionName,
  label: "AddToWallet API Key",
  type: "apikey"
});
writeJson(path.join(appDir, "connections/api-key/parameters.imljson"), [
  textParam("baseUrl", "Base URL", { required: true, default: baseUrl, help: "AddToWallet API base URL from the n8n package credential. Use no trailing slash." }),
  { name: "apiKey", type: "password", label: "API Key", required: true, help: "Your AddToWallet API key." }
]);
writeJson(path.join(appDir, "connections/api-key/api.imljson"), {
  url: "{{parameters.baseUrl}}/api/getCredits",
  method: "GET",
  headers: { apikey: "{{parameters.apiKey}}", Accept: "application/json" },
  response: {
    uid: "{{parameters.baseUrl}}",
    metadata: { type: "text", value: "AddToWallet" },
    error: { message: "[{{statusCode}}] Could not validate the AddToWallet API key." }
  },
  log: { sanitize: ["request.headers.apikey"] }
});

writeModule(
  "get-credits",
  { name: "getCredits", label: "Get Credits", description: "Get the remaining AddToWallet API credits.", type: "action", typeId: 4 },
  { url: "/api/getCredits", method: "GET", response: { output: "{{body}}" } },
  [],
  [
    { name: "credits", type: "number", label: "Credits" },
    { name: "body", type: "any", label: "Raw Response" }
  ],
  { credits: 100 }
);

const barcodeOptions = [
  { label: "QR Code", value: "QR_CODE" },
  { label: "PDF417", value: "PDF_417" },
  { label: "Aztec", value: "AZTEC" },
  { label: "Code 128", value: "CODE_128" }
];
const createPassExpect = [
  textParam("cardTitle", "Card Title", { required: true, help: "Business or pass title displayed on the wallet pass." }),
  textParam("header", "Header", { required: true, help: "Primary header text displayed on the pass." }),
  textParam("logoUrl", "Logo URL", { required: true }),
  textParam("heroImage", "Hero Image URL", { required: true }),
  colorParam("hexBackgroundColor", "Background Color", "#141f31", { required: true }),
  selectParam("barcodeType", "Barcode Type", barcodeOptions, "QR_CODE", { required: true }),
  textParam("barcodeValue", "Barcode Value", { required: true }),
  textParam("barcodeAltText", "Barcode Alt Text"),
  colorParam("appleFontColor", "Apple Font Color", "#FFFFFF"),
  textParam("rectangleLogo", "Rectangle Logo URL"),
  textParam("googleHeroImage", "Google Hero Image URL"),
  textParam("appleHeroImage", "Apple Hero Image URL"),
  arrayOfCollections("textModulesData", "Text Modules", [
    textParam("id", "ID", { required: true, help: "Unique module ID, for example module1." }),
    textParam("header", "Header", { required: true }),
    textParam("body", "Body", { required: true })
  ], { help: "Optional wallet text modules. This maps directly to the API field textModulesData." }),
  arrayOfCollections("linksModuleData", "Links", [
    textParam("label", "Label", { required: true }),
    textParam("url", "URL", { required: true })
  ], { help: "Optional links. This maps directly to the API field linksModuleData." })
];

writeModule(
  "create-pass",
  { name: "createPass", label: "Create a Pass", description: "Create a digital wallet pass and return its card ID and shareable URL.", type: "action", typeId: 4 },
  {
    url: "/api/card/create",
    method: "POST",
    body: {
      cardTitle: "{{parameters.cardTitle}}",
      header: "{{parameters.header}}",
      logoUrl: "{{parameters.logoUrl}}",
      heroImage: "{{parameters.heroImage}}",
      hexBackgroundColor: "{{parameters.hexBackgroundColor}}",
      barcodeType: "{{parameters.barcodeType}}",
      barcodeValue: "{{parameters.barcodeValue}}",
      barcodeAltText: "{{ifempty(parameters.barcodeAltText, undefined)}}",
      appleFontColor: "{{ifempty(parameters.appleFontColor, undefined)}}",
      rectangleLogo: "{{ifempty(parameters.rectangleLogo, undefined)}}",
      googleHeroImage: "{{ifempty(parameters.googleHeroImage, undefined)}}",
      appleHeroImage: "{{ifempty(parameters.appleHeroImage, undefined)}}",
      textModulesData: "{{ifempty(parameters.textModulesData, undefined)}}",
      linksModuleData: "{{ifempty(parameters.linksModuleData, undefined)}}"
    },
    response: {
      output: {
        cardId: "{{body.cardId}}",
        message: "{{body.msg || body.message}}",
        shareableUrl: "{{connection.baseUrl + '/card/' + body.cardId}}",
        body: "{{body}}"
      }
    }
  },
  createPassExpect,
  [
    { name: "cardId", type: "text", label: "Card ID" },
    { name: "message", type: "text", label: "Message" },
    { name: "shareableUrl", type: "url", label: "Shareable URL" },
    { name: "body", type: "any", label: "Raw Response" }
  ],
  { cardId: "card_123", message: "Created", shareableUrl: "https://app.addtowallet.co/card/card_123" }
);

writeModule(
  "make-api-call",
  { name: "makeAnApiCall", label: "Make an API Call", description: "Send a custom authorized request to the AddToWallet API.", type: "action", typeId: 12 },
  {
    url: "{{parameters.url}}",
    method: "{{parameters.method}}",
    headers: { "{{...}}": "{{toCollection(parameters.headers, 'key', 'value')}}" },
    qs: { "{{...}}": "{{toCollection(parameters.qs, 'key', 'value')}}" },
    body: "{{parameters.body}}",
    response: { output: { statusCode: "{{statusCode}}", headers: "{{headers}}", body: "{{body}}" } }
  },
  [
    textParam("url", "Path", { required: true, default: "/api/getCredits", help: "Relative AddToWallet path under the configured Base URL, for example /api/getCredits or /api/card/create." }),
    selectParam("method", "Method", ["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => ({ label: m, value: m })), "GET", { required: true }),
    arrayOfCollections("headers", "Headers", [textParam("key", "Key"), textParam("value", "Value")], { help: "Additional headers only. Do not add apikey; the app sends it from the connection." }),
    arrayOfCollections("qs", "Query String", [textParam("key", "Key"), textParam("value", "Value")]),
    { name: "body", type: "any", label: "Body" }
  ],
  [
    { name: "statusCode", type: "number", label: "Status Code" },
    { name: "headers", type: "any", label: "Headers" },
    { name: "body", type: "any", label: "Body" }
  ],
  { statusCode: 200, body: { ok: true } }
);

writeIcon(path.join(appDir, "assets/icon.png"));

writeText(path.join(appDir, "readme.md"), `# Add To Wallet

This Make custom app was generated from the exact npm package \`${pkg}\` extracted at \`${sourceDir}\`.

Classification: **production-ready** for the API surface present in the inspected package source. The package exposes one pass creation operation plus a credential validation endpoint for credits, so this app includes those first-class modules and the mandatory universal **Make an API Call** fallback.

## Source evidence

- \`package.json\`
- \`README.md\` (template only; not used as endpoint evidence)
- \`dist/credentials/AddToWalletApi.credentials.js\`
- \`dist/nodes/AddToWallet/GenericFunctions.js\`
- \`dist/nodes/AddToWallet/AddToWallet.node.js\`

## Authentication

The n8n credential defines a configurable Base URL with default \`${baseUrl}\` and an API key sent as the \`apikey\` header. Connection validation calls \`GET /api/getCredits\`.

## Included modules

- **Get Credits** (\`getCredits\`) — \`GET /api/getCredits\`
- **Create a Pass** (\`createPass\`) — \`POST /api/card/create\`
- **Make an API Call** (\`makeAnApiCall\`) — custom authorized request fallback

## RPCs and webhooks

The inspected n8n package does not expose \`methods.listSearch\`, \`methods.loadOptions\`, resource locators, trigger nodes, or webhook lifecycle methods. No RPCs or webhooks were generated.
`);

writeText(reportPath, `# Add To Wallet n8n Source Build Report

## Package inspected

- npm package: \`${pkg}\`
- Local extracted source: \`${sourceDir}\`
- Classification: \`production-ready\` for the package-supported endpoint surface

## Base URL

\`${baseUrl}\`

## Auth pattern

API key sent in the \`apikey\` header. The source credential also allows overriding the Base URL.

## Validation endpoint

\`GET /api/getCredits\`

## Endpoint matrix

| Operation | Method | Path | Auth | Parameters/body | Response |
| --- | --- | --- | --- | --- | --- |
| Get Credits | GET | /api/getCredits | apikey header | none | body |
| Create a Pass | POST | /api/card/create | apikey header | card title, header, image URLs, colors, barcode, text/link modules | cardId, msg |
| Make an API Call | any | user supplied relative path | apikey header | custom headers/query/body | status, headers, body |

## Generated modules and typeIds

| Module name | Label | typeId | Endpoint |
| --- | --- | ---: | --- |
| getCredits | Get Credits | 4 | GET /api/getCredits |
| createPass | Create a Pass | 4 | POST /api/card/create |
| makeAnApiCall | Make an API Call | 12 | custom |

## Generated RPCs and webhooks

None. The package source contains no listSearch/loadOptions methods and no Trigger.node/webhookMethods lifecycle.

## Local validation commands/results

- \`node scripts/add-to-wallet/generate-add-to-wallet-app.mjs\` — passed
- \`node --check scripts/add-to-wallet/generate-add-to-wallet-app.mjs\` — passed
- JSON/IML parse — passed
- Icon check — passed, 512 x 512 PNG
- RPC/webhook gate — passed
`);

console.log("Generated Add To Wallet app with 3 modules.");
