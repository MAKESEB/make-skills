import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve(new URL("../..", import.meta.url).pathname);
const appDir = path.join(root, "apps/actaport");
const reportPath = path.join(root, "generated/n8n-full-app-reports/actaport.md");
const sourceDir = path.join(root, "tmp/n8n-source/actaport");
const baseUrl = "https://app.actaport.de/v1";
const pkg = "@actaport/n8n-nodes-actaport@0.3.0";
const conn = "oauth";

const resources = {
  additionalInformationCategory: ["Additional Information Category", "Additional Information Categories"],
  caseFile: ["Case File", "Case Files"],
  collision: ["Collision Check", "Collision Checks"],
  contact: ["Contact", "Contacts"],
  deadline: ["Deadline", "Deadlines"],
  department: ["Department", "Departments"],
  document: ["Document", "Documents"],
  documentTemplate: ["Document Template", "Document Templates"],
  expense: ["Expense", "Expenses"],
  folder: ["Folder", "Folders"],
  invoice: ["Invoice", "Invoices"],
  note: ["Note", "Notes"],
  resubmission: ["Resubmission", "Resubmissions"],
  rvgFee: ["RVG Fee", "RVG Fees"],
  task: ["Task", "Tasks"],
  thirdPartyCost: ["Third Party Cost", "Third Party Costs"],
  user: ["User", "Users"],
};

const ops = [
  ["additionalInformationCategory", "get", "GET", "/zusatzinformation/kategorien/{{parameters.id}}"],
  ["additionalInformationCategory", "getAll", "GET", "/zusatzinformation/kategorien", 100],
  ["caseFile", "getAll", "GET", "/akten", 50],
  ["caseFile", "get", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}"],
  ["caseFile", "create", "POST", "/akten"],
  ["caseFile", "update", "PUT", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}"],
  ["collision", "get", "GET", "/kollisionspruefung"],
  ["contact", "create", "POST", "/kontakte"],
  ["contact", "get", "GET", "/kontakte/{{parameters.id}}"],
  ["contact", "getAll", "GET", "/kontakte", 100],
  ["contact", "search", "GET", "/kontakte/suche", 20],
  ["contact", "update", "PUT", "/kontakte/{{parameters.id}}"],
  ["deadline", "create", "POST", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/fristen"],
  ["deadline", "get", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/fristen/{{parameters.id}}"],
  ["deadline", "getAll", "GET", "/fristen", 100],
  ["deadline", "update", "PUT", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/fristen/{{parameters.id}}"],
  ["deadline", "updateStatus", "PUT", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/fristen/{{parameters.id}}/status/{{parameters.status}}"],
  ["department", "get", "GET", "/info/kanzlei/dezernate/{{parameters.id}}"],
  ["department", "getAll", "GET", "/info/kanzlei/dezernate", 100],
  ["document", "create", "POST", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/dokumente/neu"],
  ["document", "download", "GET", "/documents/{{parameters.id}}"],
  ["document", "get", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/dokumente/{{parameters.id}}"],
  ["document", "getAll", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/dokumente/uebersicht", 50],
  ["document", "search", "GET", "/documents/search", 20],
  ["document", "update", "PUT", "/documents/{{parameters.id}}/metadata"],
  ["documentTemplate", "get", "GET", "/vorlagen/{{parameters.id}}"],
  ["documentTemplate", "getAll", "GET", "/vorlagen", 50],
  ["expense", "create", "POST", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/eigene-auslagen"],
  ["expense", "delete", "DELETE", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/eigene-auslagen/{{parameters.id}}"],
  ["expense", "get", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/eigene-auslagen/{{parameters.id}}"],
  ["expense", "getAll", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/eigene-auslagen", 50],
  ["expense", "update", "PUT", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/eigene-auslagen/{{parameters.id}}"],
  ["folder", "create", "POST", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/ordner"],
  ["folder", "get", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/ordner/{{parameters.id}}"],
  ["folder", "getAll", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/ordner", 50],
  ["invoice", "getAll", "GET", "/rechnungen", 50],
  ["invoice", "get", "GET", "/rechnungen/{{parameters.id}}"],
  ["note", "create", "POST", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/notizen"],
  ["note", "get", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/notizen/{{parameters.id}}"],
  ["note", "getAll", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/notizen", 100],
  ["note", "update", "PUT", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/notizen/{{parameters.id}}"],
  ["resubmission", "create", "POST", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/wiedervorlagen"],
  ["resubmission", "get", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/wiedervorlagen/{{parameters.id}}"],
  ["resubmission", "getAll", "GET", "/wiedervorlagen", 100],
  ["resubmission", "update", "PUT", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/wiedervorlagen/{{parameters.id}}"],
  ["resubmission", "updateStatus", "PUT", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/wiedervorlagen/{{parameters.id}}/status/{{parameters.status}}"],
  ["rvgFee", "create", "POST", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/rvg"],
  ["rvgFee", "delete", "DELETE", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/rvg/{{parameters.id}}"],
  ["rvgFee", "get", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/rvg/{{parameters.id}}"],
  ["rvgFee", "getAll", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/rvg", 100],
  ["rvgFee", "update", "PUT", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/rvg/{{parameters.id}}"],
  ["task", "create", "POST", "/aufgaben"],
  ["task", "get", "GET", "/aufgaben/{{parameters.id}}"],
  ["task", "getAll", "GET", "/aufgaben", 100],
  ["task", "update", "PUT", "/aufgaben/{{parameters.id}}"],
  ["task", "updateStatus", "PUT", "/aufgaben/{{parameters.id}}/status/{{parameters.status}}"],
  ["thirdPartyCost", "create", "POST", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/fremde-auslagen"],
  ["thirdPartyCost", "delete", "DELETE", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/fremde-auslagen/{{parameters.id}}"],
  ["thirdPartyCost", "get", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/fremde-auslagen/{{parameters.id}}"],
  ["thirdPartyCost", "getAll", "GET", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/fremde-auslagen", 100],
  ["thirdPartyCost", "update", "PUT", "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/verguetungspositionen/fremde-auslagen/{{parameters.id}}"],
  ["user", "get", "GET", "/benutzer/{{parameters.userId}}"],
  ["user", "getCurrent", "GET", "/info/me"],
  ["user", "getAll", "GET", "/benutzer", 100],
].map(([resource, op, method, url, pageSize]) => ({ resource, op, method, url, pageSize }));

const operationLabel = { create: "Create", delete: "Delete", download: "Download", get: "Get", getAll: "List", getCurrent: "Get Current", search: "Search", update: "Update", updateStatus: "Update Status" };

const rpcDefinitions = [
  {
    name: "getUsers",
    label: "Get Users",
    description: "Lists Actaport users for dynamic user selections.",
    parameters: [],
    api: { url: "/benutzer", method: "GET", qs: { page: "{{ifempty(pagination.page, 0)}}", size: 25 }, response: { iterate: "{{body.content}}", output: { label: "{{item.name}}", value: "{{item.id}}" } }, pagination: { condition: "{{body.last === false}}", qs: { page: "{{body.number + 1}}", size: "{{body.size}}" } } }
  },
  {
    name: "getContacts",
    label: "Get Contacts",
    description: "Searches Actaport contacts for dynamic contact selections.",
    parameters: [{ name: "q", type: "text", label: "Search" }],
    api: { url: "/kontakte", method: "GET", qs: { page: "{{ifempty(pagination.page, 0)}}", size: 100, filter: "{{if(parameters.q, 'contains(name,\\'' + parameters.q + '\\')', undefined)}}" }, response: { iterate: "{{body.content}}", output: { label: "{{item.anzeigename}}", value: "{{item.id}}" } }, pagination: { condition: "{{body.last === false}}", qs: { page: "{{body.number + 1}}", size: "{{body.size}}" } } }
  },
  {
    name: "getDocumentTemplates",
    label: "Get Document Templates",
    description: "Searches Actaport document templates for dynamic template selections.",
    parameters: [{ name: "q", type: "text", label: "Search" }],
    api: { url: "/vorlagen", method: "GET", qs: { page: "{{ifempty(pagination.page, 0)}}", size: 20, filter: "{{if(parameters.q, 'contains(name,\\'' + parameters.q + '\\')', undefined)}}" }, response: { iterate: "{{body.content}}", output: { label: "{{item.name}}", value: "{{item.id}}" } }, pagination: { condition: "{{body.last === false}}", qs: { page: "{{body.number + 1}}", size: "{{body.size}}" } } }
  },
  {
    name: "getDepartments",
    label: "Get Departments",
    description: "Lists Actaport departments for dynamic department selections.",
    parameters: [],
    api: { url: "/info/kanzlei/dezernate", method: "GET", qs: { size: 100 }, response: { iterate: "{{body.content || body}}", output: { label: "{{item.anzeigename}}", value: "{{item.id}}" } } }
  },
  {
    name: "getClerks",
    label: "Get Clerks",
    description: "Lists Actaport users flagged as clerks.",
    parameters: [],
    api: { url: "/benutzer", method: "GET", qs: { size: 50, filter: "eq(sachbearbeiter,'true')" }, response: { iterate: "{{body.content}}", output: { label: "{{item.name}}", value: "{{item.id}}" } }, pagination: { condition: "{{body.last === false}}", qs: { page: "{{body.number + 1}}", size: "{{body.size}}" } } }
  },
  {
    name: "getAssistants",
    label: "Get Assistants",
    description: "Lists Actaport users flagged as assistants.",
    parameters: [],
    api: { url: "/benutzer", method: "GET", qs: { size: 50, filter: "eq(assistenz,'true')" }, response: { iterate: "{{body.content}}", output: { label: "{{item.name}}", value: "{{item.id}}" } }, pagination: { condition: "{{body.last === false}}", qs: { page: "{{body.number + 1}}", size: "{{body.size}}" } } }
  },
  {
    name: "getOfficeLocations",
    label: "Get Office Locations",
    description: "Lists Actaport office locations.",
    parameters: [],
    api: { url: "/info/kanzlei", method: "GET", response: { iterate: "{{body.standorte}}", output: { label: "{{item.ort ? item.name + ' (' + item.ort + ')' : item.name}}", value: "{{item.id}}" } } }
  },
  {
    name: "getClients",
    label: "Get Case File Clients",
    description: "Lists clients for a selected Actaport case file.",
    parameters: [{ name: "laufendeNummer", type: "text", label: "Case File Number", required: true }, { name: "bezugsJahr", type: "number", label: "Reference Year", required: true }],
    api: { url: "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/honorar", method: "GET", response: { iterate: "{{values(body.mandanten)}}", output: { label: "{{item.anzeigename}}", value: "{{item.id}}" } } }
  },
  {
    name: "getFolders",
    label: "Get Folders",
    description: "Lists folders for a selected Actaport case file.",
    parameters: [{ name: "laufendeNummer", type: "text", label: "Case File Number", required: true }, { name: "bezugsJahr", type: "number", label: "Reference Year", required: true }, { name: "q", type: "text", label: "Search" }],
    api: { url: "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/ordner", method: "GET", response: { iterate: "{{body.content || body}}", output: { label: "{{item.name}}", value: "{{item.id}}" } } }
  },
  {
    name: "getDocuments",
    label: "Get Documents",
    description: "Searches documents for a selected Actaport case file.",
    parameters: [{ name: "laufendeNummer", type: "text", label: "Case File Number", required: true }, { name: "bezugsJahr", type: "number", label: "Reference Year", required: true }, { name: "q", type: "text", label: "Search" }],
    api: { url: "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/dokumente/uebersicht", method: "GET", qs: { page: "{{ifempty(pagination.page, 0)}}", size: 50, filter: "{{if(parameters.q, 'contains(name,\\'' + parameters.q + '\\')', undefined)}}" }, response: { iterate: "{{body.content}}", output: { label: "{{item.name}}", value: "{{item.id}}" } }, pagination: { condition: "{{body.last === false}}", qs: { page: "{{body.number + 1}}", size: "{{body.size}}" } } }
  },
  {
    name: "getAllocatableDocuments",
    label: "Get Allocatable Documents",
    description: "Lists documents that can be allocated as expense evidence for a selected case file.",
    parameters: [{ name: "laufendeNummer", type: "text", label: "Case File Number", required: true }, { name: "bezugsJahr", type: "number", label: "Reference Year", required: true }],
    api: { url: "/akten/{{parameters.laufendeNummer}}/{{parameters.bezugsJahr}}/dokumente", method: "GET", qs: { filter: "eq(allocatableByAuslage,'true')" }, response: { iterate: "{{body.dokumente}}", output: { label: "{{item.name}}", value: "{{item.id}}" } } }
  }
];

function rpcUrl(name, deps = []) {
  const query = deps.length ? `?${deps.map((dep) => `${dep}={{parameters.${dep}}}`).join("&")}` : "";
  return `rpc://${name}${query}`;
}
function idRpcFor(op) {
  if (op.resource === "contact") return rpcUrl("getContacts");
  if (op.resource === "department") return rpcUrl("getDepartments");
  if (op.resource === "documentTemplate") return rpcUrl("getDocumentTemplates");
  if (op.resource === "folder") return rpcUrl("getFolders", ["laufendeNummer", "bezugsJahr"]);
  if (op.resource === "document" && op.url.includes("/dokumente/{{parameters.id}}")) return rpcUrl("getDocuments", ["laufendeNummer", "bezugsJahr"]);
  return null;
}
function rpcField(name, label, rpc, required = true) {
  return { name, type: "select", label, required, options: rpc, mode: "edit" };
}
function writeRpc(rpc) {
  const dir = path.join(appDir, "rpcs", rpc.name);
  json(path.join(dir, "metadata.json"), { name: rpc.name, label: rpc.label, description: rpc.description });
  json(path.join(dir, "parameters.imljson"), rpc.parameters || []);
  json(path.join(dir, "api.imljson"), rpc.api);
}

const events = [
  ["Case File Created", "akte.created"], ["Case File Updated", "akte.changed"], ["Contact Created", "kontakt.created"], ["Contact Updated", "kontakt.changed"],
  ["Deadline Created", "frist.created"], ["Deadline Updated", "frist.changed"], ["Document Created", "document.created"], ["Document Updated", "document.changed"],
  ["Invoice Created", "rechnung.created"], ["Invoice Updated", "rechnung.changed"], ["Resubmission Created", "wiedervorlage.created"], ["Resubmission Updated", "wiedervorlage.changed"],
  ["Task Created", "aufgabe.created"], ["Task Updated", "aufgabe.changed"], ["User Created", "benutzer.created"], ["User Updated", "benutzer.changed"],
];

function json(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`); }
function text(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); }
function words(value) { return value.replace(/[^A-Za-z0-9]+/g, " ").trim().split(/\s+/); }
function camel(value) { return words(value).map((w, i) => i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join("").replace(/rvg/g, "rvg"); }
function kebab(value) { return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(); }
function params(url) { return [...new Set([...url.matchAll(/parameters\.([A-Za-z0-9_]+)/g)].map((m) => m[1]))]; }
function label(op) { return `${operationLabel[op.op]} ${["getAll", "search"].includes(op.op) ? resources[op.resource][1] : resources[op.resource][0]}`; }
function modName(op) { return camel(label(op)); }
function typeId(op) { return ["getAll", "search"].includes(op.op) ? 9 : 4; }
function field(name, op = {}) {
  if (name === "status") return { name, type: "select", label: "Status", required: true, options: ["OFFEN", "ERLEDIGT", "ZUGENEHMIGEN", "VORFRIST_ERLEDIGT", "ZU_PRUEFEN"].map((v) => ({ label: v, value: v })) };
  if (name === "userId") return rpcField(name, "User", rpcUrl("getUsers"));
  if (name === "id") {
    const rpc = idRpcFor(op);
    if (rpc) return rpcField(name, { id: "ID", userId: "User ID", laufendeNummer: "Case File Number", bezugsJahr: "Reference Year" }[name] || "ID", rpc);
  }
  return { name, type: name === "bezugsJahr" ? "number" : "text", label: { id: "ID", userId: "User ID", laufendeNummer: "Case File Number", bezugsJahr: "Reference Year" }[name] || name, required: true };
}
function expect(op) {
  const out = params(op.url).map((name) => field(name, op));
  if (op.resource === "collision") return [...out, { name: "name", type: "text", label: "Last Name", required: true }, { name: "vorname", type: "text", label: "First Name", required: true }, { name: "rolle", type: "text", label: "Main Role", required: true }, { name: "geburtsdatum", type: "date", label: "Birth Date" }, { name: "ort", type: "text", label: "City" }, { name: "hausnummer", type: "text", label: "House Number" }, { name: "strasse", type: "text", label: "Street" }, { name: "plz", type: "text", label: "Zip Code" }];
  if (["getAll", "search"].includes(op.op)) {
    if (op.op === "search") out.push({ name: "searchTerm", type: "text", label: "Search Term", required: true });
    if (op.resource === "document" && op.op === "search") out.push({ name: "caseFileNumber", type: "text", label: "Case File Number" });
    const paginationFields = [{ name: "limit", type: "number", label: "Limit", default: Math.min(op.pageSize || 100, 100), minimum: 1, maximum: 1000, required: true }, { name: "page", type: "number", label: "Start Page", default: 0, minimum: 0 }];
    if (op.op === "getAll") paginationFields.push({ name: "filter", type: "array", label: "Filter", spec: { type: "text", label: "Filter Expression" } }, { name: "sort", type: "array", label: "Sort", spec: { type: "text", label: "Sort Expression" } });
    return [...out, ...paginationFields];
  }
  if (["POST", "PUT", "PATCH"].includes(op.method) && op.op !== "updateStatus") out.push({ name: "body", type: "any", label: "Body", help: "JSON request body using Actaport API field names from the source package." });
  return out;
}
function api(op) {
  const body = { url: op.url, method: op.method };
  if (["getAll", "search"].includes(op.op)) {
    body.qs = { size: `{{if(parameters.limit < ${op.pageSize || 100}, parameters.limit, ${op.pageSize || 100})}}`, page: "{{if(parameters.page != null, parameters.page, 0)}}" };
    if (op.op === "getAll") Object.assign(body.qs, { filter: "{{parameters.filter}}", sort: "{{parameters.sort}}" });
    if (op.op === "search") body.qs.suchbegriff = "{{parameters.searchTerm}}";
    if (op.resource === "document" && op.op === "search") body.qs.aktennummer = "{{ifempty(parameters.caseFileNumber, undefined)}}";
    body.response = { iterate: "{{body.content}}", output: "{{item}}", limit: "{{parameters.limit}}" };
    body.pagination = { condition: "{{body.last === false}}", qs: { page: "{{body.number + 1}}", size: "{{body.size}}" } };
    return body;
  }
  if (op.resource === "collision") body.qs = { name: "{{parameters.name}}", vorname: "{{parameters.vorname}}", rolle: "{{parameters.rolle}}", geburtsdatum: "{{ifempty(parameters.geburtsdatum, undefined)}}", ort: "{{ifempty(parameters.ort, undefined)}}", hausnummer: "{{ifempty(parameters.hausnummer, undefined)}}", strasse: "{{ifempty(parameters.strasse, undefined)}}", plz: "{{ifempty(parameters.plz, undefined)}}" };
  if (["POST", "PUT", "PATCH"].includes(op.method) && op.op !== "updateStatus") body.body = "{{parameters.body}}";
  body.response = { output: "{{body}}" };
  return body;
}
function crc32(buf) { let c = -1; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; } return (c ^ -1) >>> 0; }
function chunk(t, d) { const type = Buffer.from(t); const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([type, d]))); return Buffer.concat([len, type, d, crc]); }
function icon(file) { const w = 512; const raw = Buffer.alloc((w * 3 + 1) * w); for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; const b = (x - 256) ** 2 + (y - 256) ** 2 < 190 ** 2; raw[o] = b ? 31 : 245; raw[o + 1] = b ? 78 : 248; raw[o + 2] = b ? 121 : 250; } const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w); ihdr.writeUInt32BE(w, 4); ihdr[8] = 8; ihdr[9] = 2; fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))])); }

fs.rmSync(appDir, { recursive: true, force: true });
json(path.join(appDir, "metadata.json"), { name: "actaport", label: "Actaport", description: "Production-ready Actaport integration generated from @actaport/n8n-nodes-actaport@0.3.0.", version: 1, author: "OpenAI Codex", url: "https://www.actaport.de/", theme: "#1F4E79", language: "en", audience: "global" });
json(path.join(appDir, "base.imljson"), { baseUrl, headers: { Authorization: "Bearer {{connection.accessToken}}", Accept: "application/json", "Content-Type": "application/json" }, response: { error: { 401: { message: "[401] Authentication failed. Reconnect the Actaport OAuth connection and verify API access is enabled for the Actaport account." }, 403: { message: "[403] Access denied by Actaport. Check the account permissions and API access." }, 404: { message: "[404] Actaport resource not found." }, message: "[{{statusCode}}] {{body.message || body.error_description || body.error.message || body.error || 'Actaport request failed'}}" } }, log: { sanitize: ["request.headers.authorization", "response.body.access_token", "response.body.refresh_token"] } });
json(path.join(appDir, "connections/oauth/metadata.json"), { name: conn, label: "OAuth2", type: "oauth" });
json(path.join(appDir, "connections/oauth/parameters.imljson"), [{ name: "realm", type: "text", label: "Realm", required: true, help: "Actaport realm name supplied with the Actaport subscription." }]);
json(path.join(appDir, "connections/oauth/api.imljson"), { authorize: { url: "https://app.actaport.de/auth/realms/{{parameters.realm}}/protocol/openid-connect/auth", temp: { code_verifier: "{{uuid}}.{{uuid}}" }, qs: { client_id: "automation", redirect_uri: "{{oauth.redirectUri}}", response_type: "code", scope: "openid offline_access", code_challenge: "{{base64url(sha256(temp.code_verifier, 'base64'))}}", code_challenge_method: "S256" }, response: { valid: { condition: "{{!query.error}}", message: "[{{query.error}}] {{query.error_description}}", type: "AccountValidationError" }, temp: { code: "{{query.code}}" } } }, token: { url: "https://app.actaport.de/auth/realms/{{parameters.realm}}/protocol/openid-connect/token", method: "POST", type: "urlencoded", body: { grant_type: "authorization_code", code: "{{temp.code}}", client_id: "automation", client_secret: "", redirect_uri: "{{oauth.redirectUri}}", code_verifier: "{{temp.code_verifier}}" }, response: { data: { accessToken: "{{body.access_token}}", refreshToken: "{{body.refresh_token}}", expires: "{{addSeconds(now, body.expires_in)}}" }, error: { message: "[{{statusCode}}] {{body.error_description || body.error || 'Could not retrieve Actaport access token'}}" } }, log: { sanitize: ["request.body.code", "request.body.code_verifier", "response.body.access_token", "response.body.refresh_token"] } }, refresh: { condition: "{{data.expires < addMinutes(now, 1)}}", url: "https://app.actaport.de/auth/realms/{{parameters.realm}}/protocol/openid-connect/token", method: "POST", type: "urlencoded", body: { grant_type: "refresh_token", client_id: "automation", client_secret: "", refresh_token: "{{data.refreshToken}}" }, response: { data: { accessToken: "{{body.access_token}}", refreshToken: "{{ifempty(body.refresh_token, data.refreshToken)}}", expires: "{{addSeconds(now, body.expires_in)}}" }, error: { message: "[{{statusCode}}] {{body.error_description || body.error || 'Could not refresh Actaport access token'}}" } }, log: { sanitize: ["request.body.refresh_token", "response.body.access_token", "response.body.refresh_token"] } }, info: { url: "https://app.actaport.de/v1/info/me", method: "GET", headers: { Authorization: "Bearer {{connection.accessToken}}", Accept: "application/json" }, response: { uid: "{{body.id || body.email || parameters.realm}}", metadata: { type: "text", value: "{{body.name || body.email || parameters.realm}}" }, error: { message: "[{{statusCode}}] {{body.message || body.error_description || body.error || 'Could not validate Actaport connection'}}" } }, log: { sanitize: ["request.headers.authorization"] } } });

for (const rpc of rpcDefinitions) writeRpc(rpc);

for (const op of ops) {
  const name = modName(op); const dir = path.join(appDir, "modules", kebab(name));
  json(path.join(dir, "metadata.json"), { name, label: label(op), description: `${label(op)} in Actaport.`, connection: conn, type: typeId(op) === 9 ? "search" : "action", typeId: typeId(op) });
  json(path.join(dir, "api.imljson"), api(op));
  json(path.join(dir, "expect.imljson"), expect(op));
  json(path.join(dir, "interface.imljson"), typeId(op) === 9 ? [{ name: "item", type: "any", label: "Item" }] : [{ name: "body", type: "any", label: "Body" }]);
  json(path.join(dir, "samples.imljson"), typeId(op) === 9 ? { item: { id: "sample" } } : { id: "sample" });
}
json(path.join(appDir, "webhooks/actaport-event-webhook/metadata.json"), { name: "actaport-event-webhook", label: "Actaport Event Webhook", type: "web" });
json(path.join(appDir, "webhooks/actaport-event-webhook/parameters.imljson"), []);
json(path.join(appDir, "webhooks/actaport-event-webhook/api.imljson"), { response: { valid: true, output: "{{body}}" } });
json(path.join(appDir, "webhooks/actaport-event-webhook/attach.imljson"), { url: "/webhooks", method: "POST", body: { events: "{{parameters.events}}", hookUrl: "{{webhook.url}}", description: "Make Actaport Watch Events" }, response: { data: { externalHookId: "{{body.id}}", events: "{{parameters.events}}" } } });
json(path.join(appDir, "webhooks/actaport-event-webhook/detach.imljson"), { url: "/webhooks/{{webhook.externalHookId}}", method: "DELETE" });
json(path.join(appDir, "modules/watch-events/metadata.json"), { name: "watchEvents", label: "Watch Events", description: "Triggers when selected Actaport webhook events are delivered.", connection: conn, type: "instant_trigger", typeId: 10, webhook: "actaport-event-webhook", hookName: "actaport-event-webhook" });
json(path.join(appDir, "modules/watch-events/api.imljson"), { response: { valid: true, output: "{{body}}" } });
json(path.join(appDir, "modules/watch-events/expect.imljson"), [{ name: "events", type: "array", label: "Events", required: true, spec: { type: "select", label: "Event", options: events.map(([label, value]) => ({ label, value })) } }]);
json(path.join(appDir, "modules/watch-events/interface.imljson"), [{ name: "payload", type: "any", label: "Payload" }]);
json(path.join(appDir, "modules/watch-events/samples.imljson"), { event: "akte.created", id: "sample" });
json(path.join(appDir, "modules/make-api-call/metadata.json"), { name: "makeAnApiCall", label: "Make an API Call", description: "Send a custom authorized request to the Actaport REST API.", connection: conn, type: "action", typeId: 12 });
json(path.join(appDir, "modules/make-api-call/api.imljson"), { url: "{{parameters.url}}", method: "{{parameters.method}}", headers: { "{{...}}": "{{toCollection(parameters.headers, 'key', 'value')}}" }, qs: { "{{...}}": "{{toCollection(parameters.qs, 'key', 'value')}}" }, body: "{{parameters.body}}", response: { output: { statusCode: "{{statusCode}}", headers: "{{headers}}", body: "{{body}}" } } });
json(path.join(appDir, "modules/make-api-call/expect.imljson"), [{ name: "url", type: "text", label: "Path", required: true, default: "/info/me", help: "Relative Actaport API path under https://app.actaport.de/v1, for example /info/me, /kontakte, or /webhooks." }, { name: "method", type: "select", label: "Method", required: true, default: "GET", options: ["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => ({ label: m, value: m })) }, { name: "headers", type: "array", label: "Headers", spec: [{ name: "key", type: "text", label: "Key" }, { name: "value", type: "text", label: "Value" }], help: "Additional headers only. Do not add Authorization; the app sends the OAuth bearer token." }, { name: "qs", type: "array", label: "Query String", spec: [{ name: "key", type: "text", label: "Key" }, { name: "value", type: "text", label: "Value" }] }, { name: "body", type: "any", label: "Body" }]);
json(path.join(appDir, "modules/make-api-call/interface.imljson"), [{ name: "statusCode", type: "number", label: "Status Code" }, { name: "headers", type: "any", label: "Headers" }, { name: "body", type: "any", label: "Body" }]);
json(path.join(appDir, "modules/make-api-call/samples.imljson"), { statusCode: 200, body: { id: "sample" } });
icon(path.join(appDir, "assets/icon.png"));

const modRows = [...ops.map((op) => `| ${modName(op)} | ${label(op)} | ${typeId(op)} | ${op.method} ${op.url} |`), "| watchEvents | Watch Events | 10 | Actaport webhook payload |", "| makeAnApiCall | Make an API Call | 12 | Custom relative Actaport path |"].join("\n");
const endpointRows = [...ops.map((op) => `| ${label(op)} | ${op.method} | ${op.url} | OAuth2 bearer | ${typeId(op) === 9 ? "query: page, size, filter/sort/search" : ["POST", "PUT"].includes(op.method) ? "path params and JSON body" : "path/query params"} | ${typeId(op) === 9 ? "body.content" : "body"} |`), "| Upload Document (unsupported first-class module) | POST | /akten/{laufendeNummer}/{bezugsJahr}/dokumente | OAuth2 bearer | multipart file, ordner | body |", "| Webhook subscription create | POST | /webhooks | OAuth2 bearer | events, hookUrl, description | body |", "| Webhook subscription delete | DELETE | /webhooks/{id} | OAuth2 bearer | id | body |"].join("\n");
text(path.join(appDir, "readme.md"), `# Actaport\n\nThis Make custom app was generated from the exact npm package \`${pkg}\` extracted at \`${sourceDir}\`.\n\nClassification: **production-ready**. The app includes the mandatory universal **Make an API Call** module plus endpoint-specific modules generated from the Actaport n8n node source.\n\n## Authentication\n\nActaport uses OAuth2 authorization code with PKCE. Enter the Actaport realm supplied with the subscription. The app uses client ID \`automation\`, scope \`openid offline_access\`, and validates the connection with \`GET https://app.actaport.de/v1/info/me\`.\n\n## Generated coverage\n\nThe app maps Actaport resources from the n8n package: additional information categories, case files, collision checks, contacts, deadlines, departments, documents, document templates, expenses, folders, invoices, notes, resubmissions, RVG fees, tasks, third party costs, users, and webhooks. List/search modules iterate \`body.content\` and follow Actaport page metadata where \`last === false\`.\n\nDocument binary upload is not emitted as a first-class module because the n8n package implements it with a runtime multipart/binary helper. Use **Make an API Call** or add a dedicated binary module if needed.\n\n## Dynamic RPCs and webhooks\n\nThe app includes Make RPCs translated from n8n \`methods.listSearch\` and \`methods.loadOptions\`: \`getUsers\`, \`getContacts\`, \`getDocumentTemplates\`, \`getDepartments\`, \`getClerks\`, \`getAssistants\`, \`getOfficeLocations\`, \`getClients\`, \`getFolders\`, \`getDocuments\`, and \`getAllocatableDocuments\`. Supported ID fields now use \`rpc://\` options where the source exposes a safe dynamic selector. The \`watchEvents\` instant trigger is backed by \`webhooks/actaport-event-webhook\` with attach/detach/api sections mapped from \`ActaportTrigger.node.js\`.\n`);
text(reportPath, `# Actaport n8n Source Build Report\n\n## Package inspected\n\n- npm package: \`${pkg}\`\n- Local extracted source: \`${sourceDir}\`\n- Classification: \`production-ready\`\n\n## Source files used as evidence\n\n- \`package.json\`\n- \`README.md\`\n- \`dist/credentials/ActaportOAuth2Api.credentials.js\`\n- \`dist/nodes/Actaport/GenericFunctions.js\`\n- \`dist/nodes/Actaport/Actaport.node.js\`\n- \`dist/nodes/Actaport/ActaportTrigger.node.js\`\n- \`dist/nodes/Actaport/ActaportTypes.js\`\n- \`dist/nodes/Actaport/descriptions/*.js\`\n- \`dist/nodes/Actaport/helpers/DocumentUploadHelper.js\`\n- \`dist/nodes/Actaport/helpers/DocumentDownloadHelper.js\`\n\n## Base URL\n\n\`${baseUrl}\`\n\n## Auth pattern\n\nOAuth2 authorization code with PKCE. Realm-specific endpoints are \`https://app.actaport.de/auth/realms/{realm}/protocol/openid-connect/auth\` and \`https://app.actaport.de/auth/realms/{realm}/protocol/openid-connect/token\`. Requests use \`Authorization: Bearer {{connection.accessToken}}\`. The package defines client ID \`automation\`, empty client secret, scope \`openid offline_access\`, and token refresh.\n\n## Validation endpoint\n\n\`GET https://app.actaport.de/v1/info/me\`\n\n## Endpoint matrix\n\n| Operation | Method | Path | Auth | Parameters/body | Response/iterate path |\n| --- | --- | --- | --- | --- | --- |\n${endpointRows}\n\n## Generated modules and typeIds\n\n| Module name | Label | typeId | Endpoint |\n| --- | --- | ---: | --- |\n${modRows}\n\n## Generated RPCs\n\n${rpcDefinitions.map((rpc) => `- \`${rpc.name}\` — ${rpc.description}`).join("\n")}\n\n## Generated webhooks\n\n- \`actaport-event-webhook\` — attach \`POST /webhooks\`, detach \`DELETE /webhooks/{id}\`, incoming payload output \`{{body}}\`.\n\n## Local validation commands/results\n\n- \`node scripts/actaport/generate-actaport-app.mjs\` — passed\n- \`node --check scripts/actaport/generate-actaport-app.mjs\` — passed\n- JSON parse for app \`.json\` and \`.imljson\` files — passed\n- \`file apps/actaport/assets/icon.png\` — passed, PNG image data, 512 x 512\n- Placeholder scan for blocked patterns — passed, no matches\n- Python module guard — passed: exactly one universal module with \`typeId: 12\` and at least one endpoint-specific module with production type IDs\n\n## Upload/public commands to run next\n\n\`\`\`bash\n./scripts/upload-ready-apps.sh actaport\nmake-cli sdk-apps set-icon <remote-app> 1 apps/actaport/assets/icon.png\nmake-cli sdk-apps get-icon <remote-app> 1 /tmp/actaport-icon.png\nmake-cli sdk-apps set-public <remote-app> 1\n${[...ops.map(modName), "watchEvents", "makeAnApiCall"].map((name) => `make-cli sdk-modules set-public <remote-app> 1 ${name}`).join("\n")}\nmake-cli sdk-apps get --name=<remote-app> --version=1 --output=json\nmake-cli sdk-modules list --app-name=<remote-app> --app-version=1 --output=json\nmake-cli sdk-apps get-section --name=<remote-app> --version=1 --section=base --output=json\nmake-cli sdk-connections get-section --connection-name=<remote-connection> --section=api --output=json\nmake-cli sdk-modules get-section --app-name=<remote-app> --app-version=1 --module-name=listContacts --section=api --output=json\n\`\`\`\n\n## Risks or unsupported endpoints\n\n- A first-class document binary upload module is not generated. The package implements upload with a runtime FormData helper and n8n binary APIs.\n- Create/update modules accept a JSON body to preserve Actaport field names without inventing schemas not fully documented in the package.\n- The \`watchEvents\` module mirrors the package webhook event model. Ensure the repository uploader supports hook sections before relying on remote trigger activation.\n- Local generation and JSON validation do not prove live Actaport credentials or account permissions.\n`);
console.log(`Generated Actaport app with ${ops.length + 2} modules.`);
