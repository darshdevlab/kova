/* eslint-disable @typescript-eslint/no-require-imports -- Isolated CommonJS TS test loader uses Node require without changing repo tooling. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createRequire } = require('node:module');
const { EventEmitter } = require('node:events');
const fixtures = require('./fixtures/catalogs.json');
const root = path.resolve(__dirname, '../../src/lib/providers');
function load(name, mocks = {}, cache = new Map()) {
  const filename = path.resolve(root, name.endsWith('.ts') ? name : `${name}.ts`);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = { exports: {} }; cache.set(filename, mod);
  const native = createRequire(filename);
  const requireLocal = id => {
    if (id === 'server-only') return {};
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id), mocks, cache);
    return native(id);
  };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'module', 'exports', 'setTimeout', 'clearTimeout', code)(requireLocal, mod, mod.exports, mocks.__setTimeout || setTimeout, clearTimeout);
  return mod.exports;
}
test('AES-GCM randomized encryption binds workspace, connection and provider; tamper rejected', () => {
  process.env.KOVA_PROVIDER_MASTER_KEY = 'a'.repeat(64);
  const c = load('crypto'); const context = 'workspace:connection:openai';
  const first = c.encryptCredential('fixture-secret', context);
  assert.notEqual(first, c.encryptCredential('fixture-secret', context));
  assert.equal(first.includes('fixture-secret'), false);
  assert.equal(c.decryptCredential(first, context), 'fixture-secret');
  assert.throws(() => c.decryptCredential(first, 'another-workspace:connection:openai'), /cannot be decrypted/);
  const parts = first.split('.'); parts[3] = Buffer.from('tampered').toString('base64');
  assert.throws(() => c.decryptCredential(parts.join('.'), context));
  process.env.KOVA_PROVIDER_MASTER_KEY = 'b'.repeat(64);
  assert.throws(() => c.decryptCredential(first, context));
});
test('missing or malformed master key fails closed', () => {
  const c = load('crypto');
  for (const value of ['', 'secret', 'z'.repeat(64)]) { process.env.KOVA_PROVIDER_MASTER_KEY = value; assert.throws(() => c.assertEncryptionAvailable(), /unavailable/); }
});
test('SSRF rejects private, reserved, mapped and transition IPs plus unsafe URLs', () => {
  const n = load('network');
  for (const ip of ['0.0.0.0', '10.0.0.1', '127.0.0.1', '169.254.169.254', '172.31.0.1', '192.168.1.1', '100.100.100.200', '198.18.0.1', '224.1.1.1', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', '2001:db8::1', '2002:7f00:1::', '2001:4::1', '64:ff9b::a00:1']) assert.equal(n.isPublicAddress(ip), false, ip);
  for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111', '2001:4860:4860::8888']) assert.equal(n.isPublicAddress(ip), true, ip);
  for (const url of ['http://example.com', 'https://127.1', 'https://2130706433', 'https://0x7f000001', 'https://[::1]', 'https://example.com:8443', 'https://user:secret@example.com', 'https://example.com?key=secret', 'https://example.com#secret', 'https://localhost', 'https://host.internal', 'https://example.com/%2fprivate']) assert.throws(() => n.endpointUrl(url), undefined, url);
});
test('DNS mixed public/private answers rejected before any request', async () => {
  let requested = false;
  const n = load('network', { 'node:dns/promises': { lookup: async () => [{address:'8.8.8.8',family:4}, {address:'10.0.0.1',family:4}] }, 'node:https': { request: () => { requested = true; } } });
  await assert.rejects(n.safeJsonRequest(new URL('https://example.com/models'), {}), /restricted network/);
  assert.equal(requested, false);
});
test('transport pins validated DNS, rejects redirects and sanitizes upstream errors', async () => {
  let selected; let requests = 0;
  const n = load('network', { 'node:dns/promises': { lookup: async () => [{address:'8.8.8.8',family:4}] }, 'node:https': { request: (_url, options, callback) => {
    requests++; options.lookup('example.com', {}, (_, address) => { selected = address; });
    const req = new EventEmitter(); req.destroy = () => {}; req.end = () => { const res = new EventEmitter(); res.statusCode = 302; res.resume = () => {}; callback(res); }; return req;
  } } });
  await assert.rejects(n.safeJsonRequest(new URL('https://example.com/models'), {}), /unsuccessful response/);
  assert.equal(selected, '8.8.8.8'); assert.equal(requests, 1);
});
test('catalog preserves broad models and uses correct provider authentication', async () => {
  const c = load('catalog');
  const openai = await c.discoverModels('openai', c.officialBases.openai, 'fixture', async (_url, headers) => { assert.equal(headers.Authorization, 'Bearer fixture'); return fixtures.openai; });
  assert.equal(openai.length, 2); assert(openai.some(m => m.id.startsWith('text-embedding')));
  const ollama = await c.discoverModels('ollama', 'https://example.com', '', async (url, headers) => { assert.equal(url.pathname, '/api/tags'); assert.deepEqual(headers, {}); return fixtures.ollama; });
  assert.equal(ollama[0].id, 'local-fixture:latest');
  const custom = await c.discoverModels('custom', 'https://example.com/v1', 'fixture', async url => { assert.equal(url.pathname, '/v1/models'); return fixtures.openai; });
  assert.equal(custom.length, 2);
});
test('Anthropic pagination is complete and rejects stuck cursors', async () => {
  const c = load('catalog'); let calls = 0;
  const models = await c.discoverModels('anthropic', c.officialBases.anthropic, 'fixture', async (url, headers) => {
    assert.equal(headers['x-api-key'], 'fixture'); assert.equal(headers['anthropic-version'], '2023-06-01');
    if (calls) assert.equal(url.searchParams.get('after_id'), 'claude-fixture-a');
    return fixtures.anthropic[calls++];
  });
  assert.equal(models.length, 2); assert.equal(calls, 2);
  await assert.rejects(c.discoverModels('anthropic', c.officialBases.anthropic, 'fixture', async () => fixtures.anthropic[0]), /pagination/);
});
test('OpenRouter validates credentials independently of public catalog', async () => {
  const c = load('catalog'); const paths = [];
  const models = await c.discoverModels('openrouter', c.officialBases.openrouter, 'fixture', async url => { paths.push(url.pathname); return url.pathname.endsWith('/key') ? { data: {} } : fixtures.openrouter; });
  assert.deepEqual(paths, ['/api/v1/key', '/api/v1/models']); assert.equal(models[0].contextLength, 128000);
  await assert.rejects(c.discoverModels('openrouter', c.officialBases.openrouter, 'fixture', async () => { throw Error('fixture failure'); }));
});
test('catalog schema fails closed and official base URLs cannot be overridden', async () => {
  const c = load('catalog');
  await assert.rejects(c.discoverModels('openai', c.officialBases.openai, 'fixture', async () => ({ error: 'fixture-secret' })), /invalid model catalog/);
  assert.throws(() => c.baseFor('openai', 'https://attacker.example/v1'), /official/);
});

const sid = 'e55a25aa-0a16-4bfc-b455-043a97067217';
const cid = '72963b63-93f2-436d-aac1-83328a84e81f';
function serverFixture({ role = 'Owner', user = { id: 'fixture-user' }, row = null } = {}) {
  const cache = new Map();
  const filters = []; let serviceCalls = 0;
  const memberQuery = { select() { return this; }, eq(k,v) { filters.push([k,v]); return this; }, async maybeSingle() { return { data: role ? {role} : null }; } };
  const rowQuery = { select() { return this; }, eq(k,v) { filters.push([k,v]); return this; }, async maybeSingle() { return {data:row}; }, async order() { return {data:row ? [row] : []}; } };
  const server = load('server', { '../supabase/server': { serverDatabase: async () => ({ auth:{getUser:async()=>({data:{user}})}, from:()=>memberQuery }) }, '@supabase/supabase-js': { createClient: () => { serviceCalls++; return {from:()=>rowQuery}; } } }, cache);
  return { server, cache, filters, get serviceCalls() { return serviceCalls; } };
}
test('database membership controls roles; anonymous, cross-workspace and Viewer inference denied', async () => {
  process.env.KOVA_PROVIDER_MASTER_KEY = 'a'.repeat(64); process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture';
  for (const config of [{role:null}, {user:null}, {role:'Viewer'}]) {
    const fixture = serverFixture(config);
    await assert.rejects(fixture.server.resolveProviderForInference({spaceId:sid,connectionId:cid,modelId:'fixture'}));
    assert.equal(fixture.serviceCalls, 0);
  }
  const f = serverFixture({role:'Developer'});
  await assert.rejects(f.server.authorizeProvider(sid, true), /permission/);
  assert(f.filters.some(([key,value]) => key === 'space_id' && value === sid));
  for (const role of ['Owner','Admin']) await serverFixture({role}).server.authorizeProvider(sid, true);
});
test('summaries exclude ciphertext and unavailable configuration is explicit', async () => {
  const row = { id:cid,space_id:sid,provider:'openai',label:'Fixture',base_url:'https://api.openai.com/v1',has_credential:true,updated_at:'2026-01-01',encrypted_credential:'SECRET-CIPHERTEXT' };
  const f = serverFixture({row});
  const result = await f.server.listConnections(sid);
  assert.equal(result.available, true); assert(!JSON.stringify(result).includes('SECRET-CIPHERTEXT'));
  process.env.KOVA_PROVIDER_MASTER_KEY = '';
  const missing = await f.server.listConnections(sid); assert.equal(missing.available, false); assert.match(missing.reason, /MASTER_KEY/);
});
test('foreign workspace connections cannot resolve and never decrypt', async () => {
  process.env.KOVA_PROVIDER_MASTER_KEY = 'a'.repeat(64);
  const f = serverFixture();
  await assert.rejects(f.server.resolveProviderForInference({spaceId:sid,connectionId:cid,modelId:'fixture'}), /not found/);
  assert(f.filters.some(([key,value]) => key === 'space_id' && value === sid));
  assert(f.filters.some(([key,value]) => key === 'id' && value === cid));
});
test('HTTP boundary refuses cross-origin, oversize and malformed requests, redacts unknown errors', async () => {
  const h = load('http');
  assert.throws(() => h.checkMutation(new Request('https://app.example/api/providers', {headers:{origin:'https://evil.example'}})), /Same-origin/);
  h.checkMutation(new Request('https://app.example/api/providers', {headers:{origin:'https://app.example'}}));
  h.checkMutation(new Request('http://localhost:3100/api/providers', {headers:{host:'127.0.0.1:3100',origin:'http://127.0.0.1:3100'}}));
  assert.throws(() => h.checkMutation(new Request('http://localhost:3100/api/providers', {headers:{host:'127.0.0.1:3100',origin:'https://evil.example'}})), /Same-origin/);
  assert.throws(() => h.checkMutation(new Request('http://localhost:3100/api/providers', {headers:{host:'127.0.0.1:3100',origin:'http://127.0.0.1:3100','sec-fetch-site':'cross-site'}})), /Same-origin/);
  await assert.rejects(h.readBody(new Request('https://app.example', {method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(17000)})), /too large/);
  await assert.rejects(h.readBody(new Request('https://app.example', {method:'POST',headers:{'content-type':'application/json'},body:'invalid'})), /Invalid JSON/);
  const response = await h.providerResponse(async () => { throw Error('secret upstream key'); });
  assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'no-store'); assert(!(await response.text()).includes('secret'));
});
test('DNS timeout never starts a late request', async () => {
  let resolveDns; let requests = 0;
  const n = load('network', { __setTimeout: fn => setTimeout(fn, 5), 'node:dns/promises': {lookup: () => new Promise(resolve => {resolveDns = resolve;})}, 'node:https': {request: () => { requests++; }} });
  await assert.rejects(n.safeJsonRequest(new URL('https://example.com/models'), {}), /timed out/);
  resolveDns([{address:'8.8.8.8',family:4}]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests, 0);
});
test('transport bounds response size, sanitizes auth/rate failures and times out stalled bodies', async () => {
  for (const scenario of ['size', 'auth', 'rate', 'stall', 'invalid']) {
    let destroyed = false;
    const n = load('network', { __setTimeout: fn => setTimeout(fn, 10), 'node:dns/promises': {lookup:async()=>[{address:'8.8.8.8',family:4}]}, 'node:https': {request: (_url, _options, callback) => {
      const req = new EventEmitter(); req.destroy = () => {destroyed = true;}; req.end = () => {
        const res = new EventEmitter(); res.statusCode = scenario === 'auth' ? 401 : scenario === 'rate' ? 429 : 200; res.resume = () => {}; callback(res);
        if (scenario === 'size') res.emit('data', Buffer.alloc(8 * 1024 * 1024 + 1));
        if (scenario === 'invalid') {res.emit('data',Buffer.from('fixture-secret'));res.emit('end');}
      }; return req;
    } } });
    await assert.rejects(n.safeJsonRequest(new URL('https://example.com/models'), {Authorization:'Bearer fixture-secret'}), error => !error.message.includes('fixture-secret'));
    assert.equal(destroyed, true);
  }
});
test('inference capability hides keys, fixes route/model/stream and rechecks revocation/rotation', async () => {
  let role = 'Developer'; let secret = 'first-secret'; let rowExists = true; const sent = [];
  const row = {id:cid,space_id:sid,provider:'anthropic',label:'Fixture',base_url:'https://api.anthropic.com/v1',encrypted_credential:'ciphertext'};
  const query = () => ({select(){return this;},eq(){return this;},async maybeSingle(){return {data:rowExists?row:null};}});
  const s = load('server', {
    '../supabase/server': {serverDatabase:async()=>({auth:{getUser:async()=>({data:{user:{id:'fixture-user'}}})},from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:role?{role}:null})})})},
    '@supabase/supabase-js': {createClient:()=>({from:query})},
    './crypto': {assertEncryptionAvailable(){},decryptCredential:()=>secret},
    './catalog': {baseFor:(_provider,base)=>base,discoverModels:async()=>[{id:'claude-fixture'}],authHeaders:(_provider,key)=>({'x-api-key':key})},
    './network': {safeJsonRequest:async(url,headers,body)=>{sent.push({url:String(url),headers,body});return {content:[{text:'Fixture response'}]};}},
  });
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture';
  const capability = await s.resolveProviderForInference({spaceId:sid,connectionId:cid,modelId:'claude-fixture'});
  assert.deepEqual(Object.keys(capability).sort(), ['connectionId','modelId','provider','request']);
  assert(!JSON.stringify(capability).includes('secret'));
  secret = 'rotated-secret';
  await capability.request({messages:[],model:'injected-model',stream:true});
  assert.equal(sent[0].headers['x-api-key'], 'rotated-secret');
  assert.equal(sent[0].url, 'https://api.anthropic.com/v1/messages');
  assert.deepEqual(sent[0].body, {messages:[],model:'claude-fixture',stream:false});
  role = 'Viewer'; await assert.rejects(capability.request({messages:[]}), /permission/);
  role = null; await assert.rejects(capability.request({messages:[]}), /permission/);
  role = 'Developer'; rowExists = false; await assert.rejects(capability.request({messages:[]}), /not found/);
  assert.equal(sent.length, 1);
});
test('actual provider routes enforce authentication, management permissions and origin before privileged storage', async () => {
  for (const role of ['Viewer','Developer',null]) {
    const f = serverFixture({role});
    const mocks = {'@/lib/providers/server':f.server,'@/lib/providers/http':load('http',{},f.cache)};
    const routes = path.resolve(root,'../../app/api/providers');
    const main = load(path.join(routes,'route.ts'),mocks,f.cache);
    const item = load(path.join(routes,'[id]/route.ts'),mocks,f.cache);
    const probe = load(path.join(routes,'[id]/test/route.ts'),mocks,f.cache);
    const context = {params:Promise.resolve({id:cid})};
    const init = {method:'POST',headers:{origin:'https://app.example','content-type':'application/json'},body:JSON.stringify({spaceId:sid,provider:'openai',label:'Fixture',apiKey:'fixture-secret'})};
    const create = await main.POST(new Request('https://app.example/api/providers',init)); assert.equal(create.status,403);
    const remove = await item.DELETE(new Request(`https://app.example/api/providers/${cid}?spaceId=${sid}`,{method:'DELETE',headers:{origin:'https://app.example'}}),context); assert.equal(remove.status,403);
    const check = await probe.POST(new Request(`https://app.example/api/providers/${cid}/test?spaceId=${sid}`,{method:'POST',headers:{origin:'https://app.example'}}),context); assert.equal(check.status,403);
    assert.equal(f.serviceCalls,0);
  }
  const f=serverFixture({user:null});const mocks={'@/lib/providers/server':f.server,'@/lib/providers/http':load('http',{},f.cache)};
  const main=load(path.resolve(root,'../../app/api/providers/route.ts'),mocks,f.cache);
  assert.equal((await main.GET(new Request(`https://app.example/api/providers?spaceId=${sid}`))).status,401);
  assert.equal((await main.POST(new Request('https://app.example/api/providers',{method:'POST',headers:{origin:'https://evil.example'}}))).status,403);
  assert.equal(f.serviceCalls,0);
});
test('saved credentials are encrypted, blank edits retain key, replacement rotates and endpoint changes fail', async () => {
  process.env.KOVA_PROVIDER_MASTER_KEY='c'.repeat(64); process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.com'; process.env.SUPABASE_SERVICE_ROLE_KEY='fixture';
  let saved;
  const dbQuery = () => ({
    select(){return this;},eq(){return this;},maybeSingle:async()=>({data:saved}),
    insert(value){saved=value;return this;},update(value){saved=value;return this;},single:async()=>({data:saved}),
  });
  const s=load('server',{
    '../supabase/server':{serverDatabase:async()=>({auth:{getUser:async()=>({data:{user:{id:'fixture-user'}}})},from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{role:'Owner'}})})})},
    '@supabase/supabase-js':{createClient:()=>({from:dbQuery})},
  });
  const created=await s.saveConnection({spaceId:sid,provider:'openai',label:'Fixture',apiKey:'first-fixture-secret'});
  assert.equal(saved.encrypted_credential.includes('first-fixture-secret'),false);
  assert.equal(JSON.stringify(created).includes('encrypted_credential'),false);
  const c=load('crypto'); const context=`${sid}:${created.id}:openai`;
  assert.equal(c.decryptCredential(saved.encrypted_credential,context),'first-fixture-secret');
  const original=saved.encrypted_credential;
  await s.saveConnection({spaceId:sid,id:created.id,provider:'openai',label:'Renamed',apiKey:''});
  assert.equal(saved.encrypted_credential,original);
  await s.saveConnection({spaceId:sid,id:created.id,provider:'openai',label:'Renamed',apiKey:'replacement-fixture-secret'});
  assert.equal(c.decryptCredential(saved.encrypted_credential,context),'replacement-fixture-secret');
  await assert.rejects(s.saveConnection({spaceId:sid,id:created.id,provider:'custom',label:'Renamed',baseUrl:'https://evil.example/v1',apiKey:'fixture'}),/new connection/);
  await assert.rejects(s.saveConnection({spaceId:sid,provider:'openai',label:'Fixture',apiKey:'fixture',role:'Owner'}),/Check the provider/);
});
