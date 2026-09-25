/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS harness loads the installed webpack runtime without repository config changes. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('@playwright/test');
const { webpack } = require('next/dist/compiled/webpack/webpack');

test('provider panel desktop/mobile CRUD, catalog, failure and read-only states', {timeout:90000}, async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'kova-provider-ui-'));
  const screenshots = path.join(__dirname, 'artifacts'); fs.mkdirSync(screenshots, {recursive:true});
  const compiler = webpack({mode:'development',devtool:false,entry:path.join(__dirname,'browser-entry.tsx'),output:{path:output,filename:'panel.js'},resolve:{extensions:['.tsx','.ts','.js'],alias:{'@':path.resolve(__dirname,'../../src')}},module:{rules:[{test:/\.(tsx?|css)$/,use:path.join(__dirname,'browser-loader.cjs')}]}});
  await new Promise((resolve,reject)=>compiler.run((err,stats)=>err?reject(err):stats.hasErrors()?reject(Error(stats.toString({all:false,errors:true}))):resolve()));
  await new Promise(resolve=>compiler.close(resolve));
  const server = http.createServer((req,res)=>{if(req.url==='/panel.js'){res.setHeader('content-type','text/javascript');res.end(fs.readFileSync(path.join(output,'panel.js')));}else{res.setHeader('content-type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f5f6f8}main{max-width:1080px;margin:24px auto}</style><main id="root"></main><script src="/panel.js"></script>');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true});
  try {
    for (const [name,width,height] of [['desktop',1280,900],['mobile',390,844]]) {
      const page = await browser.newPage({viewport:{width,height}}); const errors=[]; page.on('pageerror',error=>errors.push(error.message));
      let connections=[]; let unavailable=false; let failTest=false; let lastSave;
      await page.route('**/api/providers**',async route=>{
        const req=route.request(); const p=new URL(req.url()).pathname;
        if(req.method()==='DELETE'){connections=[];return route.fulfill({json:{deleted:true}});}
        if(p.endsWith('/test'))return route.fulfill({status:failTest?502:200,json:failTest?{error:'Provider rejected the credential or its permissions.'}:{ok:true,modelCount:2}});
        if(p.endsWith('/catalog'))return route.fulfill({json:{models:[{id:'vendor/fixture',name:'Fixture model',contextLength:128000},{id:'embedding-fixture',name:'Embedding fixture'}]}});
        if(req.method()==='POST'){lastSave=req.postDataJSON();const connection={id:'72963b63-93f2-436d-aac1-83328a84e81f',spaceId:lastSave.spaceId,provider:lastSave.provider,label:lastSave.label,baseUrl:'https://api.openai.com/v1',hasCredential:true,updatedAt:'2026-01-01'};connections=[connection];return route.fulfill({json:{connection}});}
        return route.fulfill({json:{available:!unavailable,reason:unavailable?'AI Providers unavailable: server credential storage is not configured.':undefined,canManage:!req.headers().referer?.includes('Viewer'),connections}});
      });
      await page.goto(url); await page.getByRole('heading',{name:'No providers connected'}).waitFor();
      await page.getByRole('button',{name:'Add provider'}).click();
      await page.getByLabel('Connection name').fill('Research OpenAI'); await page.getByLabel('API key',{exact:true}).fill('fixture-secret-never-store');
      await page.getByRole('button',{name:'Save connection'}).click(); await page.getByRole('heading',{name:'Research OpenAI',exact:true}).waitFor();
      assert.equal(lastSave.apiKey,'fixture-secret-never-store');
      assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}).includes('fixture-secret-never-store')),false);
      assert.equal(await page.locator('input[type=password]').count(),0);
      await page.getByRole('button',{name:'Test',exact:true}).click(); await page.getByRole('status').filter({hasText:'2 models discovered'}).waitFor();
      await page.getByRole('button',{name:'Models',exact:true}).click(); await page.getByText('Fixture model',{exact:true}).waitFor();
      await page.screenshot({path:path.join(screenshots,`${name}.png`),fullPage:true});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.getByLabel('Search models').fill('embedding'); assert.equal(await page.getByText('Fixture model',{exact:true}).count(),0);
      await page.getByRole('button',{name:'Edit Research OpenAI'}).click(); assert.equal(await page.getByLabel('Replace API key (optional)').inputValue(),'');
      await page.screenshot({path:path.join(screenshots,`${name}-dialog.png`),fullPage:true}); await page.getByRole('button',{name:'Cancel',exact:true}).click();
      failTest=true; await page.getByRole('button',{name:'Test',exact:true}).click(); await page.getByRole('alert').filter({hasText:'rejected'}).waitFor();
      await page.goto(`${url}?role=Viewer`); await page.getByRole('heading',{name:'Research OpenAI',exact:true}).waitFor(); assert.equal(await page.getByRole('button',{name:'Add provider'}).isDisabled(),true); assert.equal(await page.getByRole('button',{name:'Test',exact:true}).count(),0);
      unavailable=true; await page.goto(url); await page.getByRole('heading',{name:'Provider management unavailable'}).waitFor(); assert.equal(await page.getByRole('button',{name:'Add provider'}).isDisabled(),true);
      unavailable=false;
      await page.route('**/api/models',route=>route.fulfill({json:{live:true,models:[{id:'fixture-model',name:'Fixture model',provider:'Fixture'}]}}));
      await page.goto(`${url}?home`);
      await page.waitForFunction(()=>!document.querySelector('button:last-child')?.disabled);
      const provider=await page.getByRole('combobox',{name:'Provider connection'}).boundingBox();
      const model=await page.getByRole('button',{name:'Choose model'}).boundingBox();
      assert(provider.width<=180);assert(Math.abs(provider.y+provider.height/2-model.y-model.height/2)<2);
      await page.getByRole('combobox',{name:'Provider connection'}).selectOption('72963b63-93f2-436d-aac1-83328a84e81f');
      await page.getByRole('combobox',{name:'Provider model'}).selectOption('vendor/fixture');
      await page.addStyleTag({content:':root{--font-sans:Georgia,serif;--surface-raised:#232628;--text:#eff1ed;--border:#50585a;--accent:#acd4be}'});
      assert.equal(await page.getByRole('combobox',{name:'Provider connection'}).evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(35, 38, 40)');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.screenshot({path:path.join(screenshots,`${name}-home-toolbar.png`),fullPage:true});
      assert.deepEqual(errors,[]); await page.close();
    }
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(output,{recursive:true,force:true});}
});
