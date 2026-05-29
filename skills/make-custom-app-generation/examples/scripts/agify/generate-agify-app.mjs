import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '../..');
const appDir = path.join(repo, 'apps/agify');
const modulesDir = path.join(appDir, 'modules');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
async function writeJson(file, value) { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, json(value)); }
async function writeText(file, value) { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, value); }
async function addModule(dir, metadata, api, expect = [], iface = [], samples = {}) {
  const moduleDir = path.join(modulesDir, dir);
  await mkdir(moduleDir, { recursive: true });
  await writeJson(path.join(moduleDir, 'metadata.json'), metadata);
  await writeJson(path.join(moduleDir, 'api.imljson'), api);
  await writeJson(path.join(moduleDir, 'expect.imljson'), expect);
  await writeJson(path.join(moduleDir, 'interface.imljson'), iface);
  await writeJson(path.join(moduleDir, 'samples.imljson'), samples);
}
const connection = 'api-key';
const action = (name, label, description, typeId = 4) => ({ name, label, description, connection, type: 'action', typeId });
const universalInterface = [
  { name: 'statusCode', type: 'number', label: 'Status Code' },
  { name: 'headers', type: 'any', label: 'Headers' },
  { name: 'body', type: 'any', label: 'Body' }
];
const universalSamples = {
  statusCode: 200,
  headers: { 'content-type': 'application/json' },
  body: { count: 298219, name: 'michael', age: 64 }
};
const predictionInterface = [
  { name: 'count', type: 'number', label: 'Count' },
  { name: 'name', type: 'text', label: 'Name' },
  { name: 'age', type: 'number', label: 'Age' },
  { name: 'country_id', type: 'text', label: 'Country ID' }
];
const countryHelp = 'Optional ISO 3166-1 alpha-2 country code to localize the prediction, for example US, GB, DE, FR, BR, or JP.';

await writeJson(path.join(appDir, 'base.imljson'), {
  baseUrl: 'https://api.agify.io',
  headers: { Accept: 'application/json' },
  qs: { apikey: '{{connection.apiKey}}' },
  response: { error: { message: "[{{statusCode}}] {{body.error || body.message || 'Agify request failed'}}" } },
  log: { sanitize: ['request.qs.apikey'] }
});
await writeJson(path.join(appDir, 'metadata.json'), {
  name: 'agify', label: 'Agify', description: "Predict a person's age from a first name using the Agify API.", version: 1,
  author: 'OpenAI Codex', url: 'https://agify.io/', theme: '#5468ff', language: 'en', audience: 'global'
});
await rm(modulesDir, { recursive: true, force: true });

await addModule('make-api-call', { ...action('makeAnApiCall', 'Make an API Call', 'Send a custom request to the Agify API.', 12), typeId: 12 }, {
  url: 'https://api.agify.io{{parameters.url}}', method: '{{parameters.method}}',
  headers: { '{{...}}': "{{toCollection(parameters.headers, 'key', 'value')}}" },
  qs: { apikey: '{{connection.apiKey}}', '{{...}}': "{{toCollection(parameters.qs, 'key', 'value')}}" },
  body: '{{parameters.body}}',
  response: { output: { statusCode: '{{statusCode}}', headers: '{{headers}}', body: '{{body}}' } }
}, [
  { name: 'url', type: 'text', label: 'Path', required: true, default: '/', help: 'Relative Agify API path. Use / for the documented age prediction endpoint.' },
  { name: 'method', type: 'select', label: 'Method', required: true, default: 'GET', options: ['GET','POST','PUT','PATCH','DELETE'].map((m) => ({ label: m, value: m })) },
  { name: 'headers', type: 'array', label: 'Headers', spec: [{ name: 'key', type: 'text', label: 'Key' }, { name: 'value', type: 'text', label: 'Value' }], help: 'Additional headers only. Authentication is added automatically as the apikey query parameter.' },
  { name: 'qs', type: 'array', label: 'Query String', spec: [{ name: 'key', type: 'text', label: 'Key' }, { name: 'value', type: 'text', label: 'Value' }], help: 'Add Agify query parameters such as name, name[], or country_id. Do not add apikey here.' },
  { name: 'body', type: 'any', label: 'Body', help: 'Optional request body for non-GET requests. The documented prediction endpoint uses query string parameters.' }
], universalInterface, universalSamples);

await addModule('predict-age', action('predictAge', 'Predict Age', 'Predict an age for one first name using the documented Agify endpoint.'), {
  url: '/', method: 'GET', qs: { name: '{{parameters.name}}', country_id: '{{ifempty(parameters.countryId, undefined)}}' },
  response: { output: '{{body}}' }
}, [
  { name: 'name', type: 'text', label: 'Name', required: true, help: 'First name to analyze.' },
  { name: 'countryId', type: 'text', label: 'Country ID', help: countryHelp }
], predictionInterface);

await addModule('predict-ages-batch', { name: 'predictAgesBatch', label: 'Predict Ages in Batch', description: 'Predict ages for multiple first names in one Agify request using repeated name[] query parameters.', connection, type: 'search', typeId: 9 }, {
  url: '/', method: 'GET', qs: { 'name[]': '{{parameters.names}}', country_id: '{{ifempty(parameters.countryId, undefined)}}' },
  response: { iterate: '{{body}}', output: '{{item}}' }
}, [
  { name: 'names', type: 'array', label: 'Names', required: true, spec: { type: 'text', label: 'Name', required: true }, help: 'First names to submit as repeated name[] query parameters.' },
  { name: 'countryId', type: 'text', label: 'Country ID', help: countryHelp }
], predictionInterface);

await writeText(path.join(appDir, 'readme.md'), `# Agify Make app\n\nProduction-ready local Make custom app for the Agify API at \`https://api.agify.io\`. Authentication uses the documented \`apikey\` query parameter.\n\nIncluded modules (3 total including the universal fallback):\n\n- Make an API Call\n- Predict Age\n- Predict Ages in Batch\n\nNo webhooks are included because Agify exposes a prediction API and no webhook registration lifecycle endpoints.\n\nDocs: https://agify.io\n`);
console.log('Generated Agify app with 3 modules.');
