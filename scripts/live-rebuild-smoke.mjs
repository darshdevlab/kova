import fs from "node:fs";
import { parseEnv } from "node:util";
import { randomUUID, randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

// Opt-in integration check. Temporary accounts and workspaces are removed in finally.
// Never print sessions, credentials or provider response bodies.
const env = {...parseEnv(fs.readFileSync(".env.local", "utf8")),...process.env};
if (env.KOVA_RUN_LIVE_SMOKE !== "1") throw Error("Set KOVA_RUN_LIVE_SMOKE=1 explicitly.");
const origin = env.KOVA_SMOKE_ORIGIN || "http://127.0.0.1:3100";
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const users=[];
const checks=[];
let browser;
async function account(label) {
  const email=`kova-smoke-${label}-${randomUUID()}@example.invalid`, password=randomBytes(24).toString("base64url");
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:`Kova smoke ${label}`}});
  if(created.error)throw Error("Temporary account creation failed");
  users.push(created.data.user.id);
  const db=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const signed=await db.auth.signInWithPassword({email,password});
  if(signed.error)throw Error("Temporary login failed");
  const ref=new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const cookie=`sb-${ref}-auth-token=base64-${Buffer.from(JSON.stringify(signed.data.session)).toString("base64url")}`;
  const call=async(path,method="GET",body)=>{
    const r=await fetch(`${origin}${path}`,{method,headers:{Cookie:cookie,Origin:origin,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
    const data=await r.json().catch(()=>({}));
    return {status:r.status,data};
  };
  return {db,call,cookie,id:created.data.user.id};
}
function pass(label){checks.push(label);console.log(`PASS ${label}`);}
try {
  const owner=await account("owner"), outsider=await account("outsider");
  const personalSpaces=await Promise.all([
    owner.db.rpc("kova_create_space",{space_kind:"personal",space_name:"Temporary personal"}),
    owner.db.rpc("kova_create_space",{space_kind:"personal",space_name:"Temporary personal"}),
  ]);
  for(const result of personalSpaces) assert.ifError(result.error);
  assert.ok(personalSpaces[0].data,"Concurrent personal workspace creation returned no ID");
  assert.equal(personalSpaces[0].data,personalSpaces[1].data,"Concurrent personal workspace creation returned different IDs");
  pass("concurrent personal workspace initialization returns the same workspace");
  const requestId=randomUUID();
  const first=await owner.db.rpc("kova_create_company_once",{request_id:requestId,company_name:"Temporary Kova verification"});
  assert.ifError(first.error);
  const repeat=await owner.db.rpc("kova_create_company_once",{request_id:requestId,company_name:"Temporary Kova verification"});
  assert.equal(first.data,repeat.data); const spaceId=first.data;
  pass("verified organisation creation is idempotent");
  // Bot demo commands persist records but never invoke a model or external tool.
  const botCreated=await owner.call("/api/bot-teams","POST",{spaceId,title:"Temporary Bot team verification",template:"product"});
  assert.equal(botCreated.status,201,"Bot team creation failed");
  let botTeam=botCreated.data.record;
  assert.ok(botTeam?.id,"Bot team ID missing");
  assert.equal(botTeam.space_id,spaceId);
  assert.equal(botTeam.data.schema,"bot-team-v2");
  assert.equal(botTeam.revision,1);
  const botTeamId=botTeam.id;
  const botPath=`/api/bot-teams?spaceId=${spaceId}&itemId=${botTeamId}`;
  const botList=await owner.call(`/api/bot-teams?spaceId=${spaceId}`);
  assert.equal(botList.status,200,"Bot team list failed");
  assert.ok(botList.data.records.some(record=>record.id===botTeamId),"Created Bot team missing from list");
  const botCommand=async(command)=>{
    const previousRevision=botTeam.revision;
    const result=await owner.call("/api/bot-teams","PUT",{spaceId,itemId:botTeamId,revision:previousRevision,command});
    assert.equal(result.status,200,`Bot ${command.action} failed`);
    assert.equal(result.data.record.id,botTeamId);
    assert.equal(result.data.record.space_id,spaceId);
    assert.equal(result.data.record.revision,previousRevision+1);
    botTeam=result.data.record;
  };
  const botConfig=structuredClone(botTeam.data.config);
  botConfig.title="Temporary Bot team updated";
  const coordinator=botConfig.bots.find(bot=>bot.kind==="coordinator");
  assert.ok(coordinator,"Product template coordinator missing");
  coordinator.instructions="Propose a bounded review using supplied context only.";
  coordinator.model="openai/gpt-4o-mini";
  coordinator.permissions=["draft","handoff","request-approval"];
  coordinator.memoryScope="team";
  coordinator.position={x:360,y:220};
  const handoff=botConfig.relationships.find(edge=>edge.source===coordinator.id);
  assert.ok(handoff,"Product template handoff missing");
  handoff.label="Review supplied context";
  await botCommand({action:"configure",config:botConfig});
  const configured=await owner.call(botPath);
  assert.equal(configured.status,200,"Configured Bot team reload failed");
  assert.equal(configured.data.records.length,1);
  assert.deepEqual(configured.data.records[0],botTeam);
  assert.deepEqual(configured.data.records[0].data.config,botConfig);
  assert.equal(configured.data.records[0].data.title,botConfig.title);
  const staleBot=await owner.call("/api/bot-teams","PUT",{spaceId,itemId:botTeamId,revision:1,command:{action:"configure",config:botConfig}});
  assert.equal(staleBot.status,409,"Stale Bot revision was not rejected");
  pass("live Bot team creation, configuration persistence and stale revision rejection");

  await botCommand({action:"new-chat",target:"team"});
  const teamChatId=botTeam.data.chats[0].id;
  const botPrompt="Prepare a demo review of the temporary onboarding scope.";
  await botCommand({action:"send",chatId:teamChatId,text:botPrompt});
  const teamChat=botTeam.data.chats.find(chat=>chat.id===teamChatId);
  assert.equal(teamChat.target,"team");
  assert.ok(teamChat.messages.some(message=>message.type==="user" && message.sender===owner.id && message.text===botPrompt));
  assert.ok(teamChat.messages.some(message=>message.type==="demo" && message.text.includes("No tools, model calls, or code execution occurred.")));
  const interbot=teamChat.messages.filter(message=>message.type==="handoff");
  assert.ok(interbot.length>0 && interbot.length<=6,"Expected bounded simulated inter-Bot messages");
  assert.ok(botTeam.data.artifacts.some(artifact=>artifact.chatId===teamChatId && artifact.source==="Demo execution"));
  assert.ok(botTeam.data.tasks.some(task=>task.chatId===teamChatId && task.status==="Proposed"));
  assert.ok(botTeam.data.approvals.some(approval=>approval.chatId===teamChatId && approval.status==="Pending"));
  await botCommand({action:"new-chat",target:coordinator.id});
  const directChatId=botTeam.data.chats[0].id;
  await botCommand({action:"send",chatId:directChatId,text:"Demo direct review only."});
  const directChat=botTeam.data.chats.find(chat=>chat.id===directChatId);
  assert.equal(directChat.target,coordinator.id);
  assert.equal(directChat.messages.length,2);
  assert.ok(!directChat.messages.some(message=>message.type==="handoff"),"Direct chat unexpectedly fanned out");
  const botReload=await owner.call(botPath);
  assert.equal(botReload.status,200,"Bot conversations reload failed");
  assert.deepEqual(botReload.data.records[0],botTeam);
  const storedBot=await owner.db.from("kova_records").select("id,space_id,kind,revision,data").eq("space_id",spaceId).eq("id",botTeamId).single();
  assert.ifError(storedBot.error);
  assert.equal(storedBot.data.kind,"bot");
  assert.equal(storedBot.data.revision,botTeam.revision);
  assert.deepEqual(storedBot.data.data,botTeam.data);
  pass("live Bot team/direct demo chats, handoffs and artifacts persist without generation");

  assert.equal((await outsider.call(`/api/bot-teams?spaceId=${spaceId}`)).status,403,"Foreign Bot team list was not denied");
  assert.equal((await outsider.call(botPath)).status,403,"Foreign Bot team read was not denied");
  assert.equal((await outsider.call("/api/bot-teams","POST",{spaceId,title:"Denied foreign Bot",template:"blank"})).status,403,"Foreign Bot team creation was not denied");
  for(const command of [{action:"configure",config:botConfig},{action:"new-chat",target:"team"},{action:"send",chatId:teamChatId,text:"Denied foreign message"}]){
    const result=await outsider.call("/api/bot-teams","PUT",{spaceId,itemId:botTeamId,revision:botTeam.revision,command});
    assert.equal(result.status,403,`Foreign Bot ${command.action} was not denied`);
  }
  const foreignBot=await outsider.db.from("kova_records").select("id").eq("space_id",spaceId).eq("id",botTeamId);
  assert.ifError(foreignBot.error);
  assert.equal(foreignBot.data.length,0,"Bot record leaked through database RLS");
  const botAfterDenials=await owner.call(botPath);
  assert.equal(botAfterDenials.status,200);
  assert.deepEqual(botAfterDenials.data.records[0],botTeam,"Denied calls changed the Bot team");
  const botListAfterDenials=await owner.call(`/api/bot-teams?spaceId=${spaceId}`);
  assert.equal(botListAfterDenials.status,200);
  assert.deepEqual(botListAfterDenials.data.records.map(record=>record.id).sort(),botList.data.records.map(record=>record.id).sort(),"Denied creation added a Bot team");
  pass("live Bot cross-space reads and mutations denied by API and database RLS");
  // Manual delivery review uses PATCH only; none of these checks request generation.
  const pm=await account("delivery-pm"), developer=await account("delivery-developer"), viewer=await account("delivery-viewer");
  const deliveryMembers=await admin.from("kova_members").insert([
    {space_id:spaceId,user_id:pm.id,role:"PM"},
    {space_id:spaceId,user_id:developer.id,role:"Developer"},
    {space_id:spaceId,user_id:viewer.id,role:"Viewer"},
  ]);
  assert.ifError(deliveryMembers.error);
  const deliveryCreated=await owner.db.from("kova_records").insert({space_id:spaceId,kind:"project",data:{title:"Temporary delivery verification",description:"A manually authored delivery approval smoke check. No generation.",stage:"Clarify",deliveryMode:"delivery"}}).select().single();
  assert.ifError(deliveryCreated.error);
  let deliveryProject=deliveryCreated.data;
  const deliveryId=deliveryProject.id;
  const deliveryPath=`/api/build-chat?projectId=${deliveryId}`;
  const deliveryRead=async()=>{
    const result=await owner.call(deliveryPath);
    assert.equal(result.status,200,"Delivery API reload failed");
    assert.equal(result.data.project.id,deliveryId);
    assert.equal(result.data.project.space_id,spaceId);
    deliveryProject=result.data.project;
    return deliveryProject;
  };
  const deliveryPatch=async(actor,change,expectedStatus=200)=>{
    const revision=deliveryProject.revision;
    const result=await actor.call("/api/build-chat","PATCH",{projectId:deliveryId,revision,...change});
    assert.equal(result.status,expectedStatus,`Delivery ${change.action}${change.kind ? ` ${change.kind}` : ""} returned unexpected status`);
    if(expectedStatus===200){
      assert.equal(result.data.project.id,deliveryId);
      assert.equal(result.data.project.revision,revision+1);
      deliveryProject=result.data.project;
    }else{
      await deliveryRead();
      assert.equal(deliveryProject.revision,revision,"Denied delivery write changed the revision");
    }
  };
  const approvedHtml="<!doctype html><html><body><h1>Manually reviewed delivery</h1><button>Review scope</button></body></html>";
  const forbiddenHtml="<!doctype html><html><body><h1>Unauthorized delivery replacement</h1></body></html>";
  const prdContent="# PRD\nUsers review a scoped delivery prototype. Scope: a review heading and button. Acceptance: both controls are visible; no backend or model calls.";
  const trdContent="# TRD\nImplement static HTML with a heading and review button. Store the HTML in the project builder. Validation: inspect saved HTML and require current PRD and TRD approvals.";
  await deliveryRead();
  await deliveryPatch(developer,{action:"edit",html:forbiddenHtml},403);
  await deliveryPatch(developer,{action:"save-artifact",kind:"trd",content:trdContent},409);
  await deliveryPatch(pm,{action:"save-artifact",kind:"prd",content:prdContent});
  const prdVersion=deliveryProject.data.builder.delivery.prd.version;
  assert.equal(deliveryProject.data.builder.delivery.prd.content,prdContent);
  assert.ok(!deliveryProject.data.builder.delivery.prd.approval);
  await deliveryPatch(developer,{action:"approve-artifact",kind:"prd",artifactVersion:prdVersion},403);
  await deliveryPatch(pm,{action:"approve-artifact",kind:"prd",artifactVersion:prdVersion});
  assert.equal(deliveryProject.data.builder.delivery.prd.approval.userId,pm.id);
  assert.equal(deliveryProject.data.builder.delivery.prd.approval.role,"PM");
  assert.equal(deliveryProject.data.builder.delivery.prd.approval.version,prdVersion);
  await deliveryPatch(developer,{action:"edit",html:forbiddenHtml},403);
  await deliveryPatch(developer,{action:"save-artifact",kind:"trd",content:trdContent});
  const trdVersion=deliveryProject.data.builder.delivery.trd.version;
  assert.equal(deliveryProject.data.builder.delivery.trd.basedOnPrdVersion,prdVersion);
  assert.equal(deliveryProject.data.builder.delivery.trd.content,trdContent);
  await deliveryPatch(pm,{action:"approve-artifact",kind:"trd",artifactVersion:trdVersion},403);
  await deliveryPatch(developer,{action:"edit",html:forbiddenHtml},403);
  await deliveryPatch(developer,{action:"approve-artifact",kind:"trd",artifactVersion:trdVersion});
  assert.equal(deliveryProject.data.builder.delivery.trd.approval.userId,developer.id);
  assert.equal(deliveryProject.data.builder.delivery.trd.approval.role,"Developer");
  assert.equal(deliveryProject.data.builder.delivery.trd.approval.version,trdVersion);
  await deliveryPatch(pm,{action:"edit",html:forbiddenHtml},403);
  await deliveryPatch(developer,{action:"edit",html:approvedHtml});
  await deliveryRead();
  assert.equal(deliveryProject.data.builder.html,approvedHtml);
  const trustedReviews=await owner.db.from("kova_delivery_approvals").select("kind,approved_by,approved_role").eq("project_id",deliveryId);
  assert.ifError(trustedReviews.error);
  assert.equal(trustedReviews.data.length,2);
  assert.ok(trustedReviews.data.some(review=>review.kind==="prd" && review.approved_by===pm.id && review.approved_role==="PM"));
  assert.ok(trustedReviews.data.some(review=>review.kind==="trd" && review.approved_by===developer.id && review.approved_role==="Developer"));
  pass("live delivery PM PRD and Developer TRD reviews gate persisted manual HTML");

  const viewerRead=await viewer.call(deliveryPath);
  assert.equal(viewerRead.status,200,"Delivery Viewer could not read project");
  assert.equal(viewerRead.data.project.data.builder.html,approvedHtml);
  for(const kind of ["prd","trd"]){
    await deliveryPatch(viewer,{action:"save-artifact",kind,content:"Unauthorized Viewer document replacement."},403);
    await deliveryPatch(viewer,{action:"approve-artifact",kind,artifactVersion:deliveryProject.data.builder.delivery[kind].version},403);
  }
  await deliveryPatch(viewer,{action:"edit",html:forbiddenHtml},403);
  const viewerData=structuredClone(deliveryProject.data);
  viewerData.builder.html=forbiddenHtml;
  const viewerRest=await viewer.db.from("kova_records").update({data:viewerData,revision:deliveryProject.revision+1}).eq("space_id",spaceId).eq("id",deliveryId).eq("revision",deliveryProject.revision).select("id");
  assert.ok(viewerRest.error?.code==="42501" || (!viewerRest.error && viewerRest.data?.length===0),"Viewer REST write was not denied by permissions/RLS");
  await deliveryRead();
  assert.equal(deliveryProject.data.builder.html,approvedHtml);
  assert.equal(deliveryProject.revision,viewerRead.data.project.revision);
  pass("live delivery Viewer reads allowed; artifact, approval and HTML writes denied");

  await deliveryPatch(pm,{action:"save-artifact",kind:"prd",content:`${prdContent}\nRevised scope: require a second human review before release.`});
  const revisedPrd=deliveryProject.data.builder.delivery.prd;
  assert.equal(revisedPrd.version,prdVersion+1);
  await deliveryRead();
  assert.ok(!deliveryProject.data.builder.delivery.prd.approval,"PRD edit retained PRD approval");
  assert.ok(!deliveryProject.data.builder.delivery.trd.approval,"PRD edit retained TRD approval");
  assert.equal(deliveryProject.data.builder.delivery.trd.content,trdContent);
  assert.equal(deliveryProject.data.builder.delivery.trd.basedOnPrdVersion,prdVersion);
  assert.equal(deliveryProject.data.builder.html,approvedHtml,"PRD revision lost existing HTML");
  const invalidated=await owner.db.from("kova_delivery_approvals").select("kind").eq("project_id",deliveryId);
  assert.ifError(invalidated.error);
  assert.equal(invalidated.data.length,0,"PRD revision did not invalidate protected approvals");
  await deliveryPatch(developer,{action:"approve-artifact",kind:"trd",artifactVersion:trdVersion},409);
  await deliveryPatch(developer,{action:"edit",html:forbiddenHtml},403);
  pass("live PM PRD revision invalidates both reviews and blocks further HTML changes");

  const forgedData=structuredClone(deliveryProject.data);
  for(const kind of ["prd","trd"]){
    forgedData.builder.delivery[kind].approval={version:forgedData.builder.delivery[kind].version,userId:kind==="prd" ? pm.id : developer.id,role:kind==="prd" ? "PM" : "Developer",at:new Date().toISOString()};
  }
  const forgedProtected=await developer.db.from("kova_delivery_approvals").insert({project_id:deliveryId,kind:"prd",approved_artifact:forgedData.builder.delivery.prd,approved_by:pm.id,approved_role:"PM"});
  assert.equal(forgedProtected.error?.code,"42501","Direct REST could forge protected approval rows");
  // JSON annotations may be stored, but they must never become approval authority.
  const forgedJson=await developer.db.from("kova_records").update({data:forgedData,revision:deliveryProject.revision+1}).eq("space_id",spaceId).eq("id",deliveryId).eq("revision",deliveryProject.revision).select("id,revision,data").single();
  assert.ifError(forgedJson.error);
  assert.equal(forgedJson.data.revision,deliveryProject.revision+1);
  assert.ok(forgedJson.data.data.builder.delivery.prd.approval,"Forged JSON setup did not persist");
  await deliveryRead();
  assert.ok(!deliveryProject.data.builder.delivery.prd.approval,"API trusted forged PRD approval JSON");
  assert.ok(!deliveryProject.data.builder.delivery.trd.approval,"API trusted forged TRD approval JSON");
  await deliveryPatch(developer,{action:"edit",html:forbiddenHtml},403);
  const forgedHtmlData=structuredClone(forgedJson.data.data);
  forgedHtmlData.builder.html=forbiddenHtml;
  const forgedHtml=await developer.db.from("kova_records").update({data:forgedHtmlData,revision:deliveryProject.revision+1}).eq("space_id",spaceId).eq("id",deliveryId).eq("revision",deliveryProject.revision).select("id");
  assert.equal(forgedHtml.error?.code,"P0001","Forged approvals permitted a direct REST HTML update");
  assert.ok(forgedHtml.error.message.includes("Current PRD and TRD approvals required for delivery code"),"HTML write failed for an unexpected reason instead of the delivery guard");
  const actualDelivery=await owner.db.from("kova_records").select("revision,data").eq("space_id",spaceId).eq("id",deliveryId).single();
  assert.ifError(actualDelivery.error);
  assert.equal(actualDelivery.data.revision,deliveryProject.revision);
  assert.equal(actualDelivery.data.data.builder.html,approvedHtml,"Forbidden HTML reached storage");
  const approvalsAfterForgery=await owner.db.from("kova_delivery_approvals").select("kind").eq("project_id",deliveryId);
  assert.ifError(approvalsAfterForgery.error);
  assert.equal(approvalsAfterForgery.data.length,0);
  pass("live forged REST approvals cannot authorize API or database HTML changes");

  const p=await owner.db.from("kova_records").insert({space_id:spaceId,kind:"project",data:{title:"Counter verification",description:"Build a tiny counter with plus and minus buttons. No backend. Choose defaults and build immediately. Keep HTML under 2000 characters.",stage:"Clarify",deliveryMode:"direct",model:"openai/gpt-4o-mini"}}).select().single();
  assert.ifError(p.error);const project=p.data;
  assert.equal((await outsider.call(`/api/build-chat?projectId=${project.id}`)).status,404);
  pass("foreign project access denied through live server");
  const draft={title:"Counter vocabulary",content:"Use QA counter as the visible counter heading.",source:"Temporary acceptance check",stale:false,expiresAt:null};
  const lesson=await owner.call("/api/memory","POST",{spaceId,projectId:project.id,draft});
  assert.equal(lesson.status,201,lesson.data.error || "Memory creation failed");assert.equal(lesson.data.record.status,"proposed");
  const approved=await owner.call("/api/memory","PATCH",{spaceId,id:lesson.data.record.id,version:lesson.data.record.version,action:"approve"});
  assert.equal(approved.status,200);
  const context=await owner.call(`/api/build-chat?projectId=${project.id}`);
  assert.equal(context.status,200);assert.ok(context.data.memory.some(m=>m.id===lesson.data.record.id));
  pass("approved project memory enters builder context");
  const connection=await owner.call("/api/providers","POST",{spaceId,provider:"openrouter",label:"Temporary smoke connection",apiKey:env.OPENROUTER_API_KEY});
  assert.equal(connection.status,200);const connectionId=connection.data.connection.id;
  const list=await owner.call(`/api/providers?spaceId=${spaceId}`);
  assert.equal(list.status,200);assert.ok(!JSON.stringify(list.data).includes(env.OPENROUTER_API_KEY));
  assert.equal((await outsider.call(`/api/providers?spaceId=${spaceId}`)).status,403);
  const tested=await owner.call(`/api/providers/${connectionId}/test?spaceId=${spaceId}`,"POST",{});
  assert.equal(tested.status,200);assert.ok(tested.data.modelCount>2);
  pass("encrypted provider save, safe summaries, live model discovery and tenant isolation");
  if(env.KOVA_SMOKE_GENERATE==="1"){
    const built=await owner.call("/api/build-chat","POST",{projectId:project.id,revision:project.revision,model:"openai/gpt-4o-mini",connectionId,intent:"start"});
    assert.equal(built.status,200,`Generation status ${built.status}: ${built.data.error || ""}`);
    assert.equal(built.data.response.action,"build");
    assert.ok(built.data.project.data.builder.html.toLowerCase().includes("qa counter"));
    const reread=await owner.call(`/api/build-chat?projectId=${project.id}`);
    assert.equal(reread.data.project.data.builder.html,built.data.project.data.builder.html);
    pass("live BYOK generation uses approved memory and persists output");
  }
  const denied=await outsider.call("/api/memory","POST",{spaceId,projectId:project.id,draft});
  assert.equal(denied.status,403);
  pass("foreign memory mutation denied");
  if(env.KOVA_SMOKE_BROWSER==="1"){
    let browserStage="prepare preview";
    try {
      const { chromium, devices, expect:baseExpect }=await import("@playwright/test");
      const expect=baseExpect.configure({timeout:30000});
      const liveContext=await owner.call(`/api/build-chat?projectId=${project.id}`);
      assert.equal(liveContext.status,200,"Browser project context unavailable");
      const manualPreview=!liveContext.data.project.data.builder?.html?.trim();
      if(manualPreview){
        const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Manual verification</title></head><body><h1>Manual verification</h1><p>Hand-authored smoke fixture; not AI-generated.</p><button onclick="document.querySelector(\'output\').textContent=\'Interaction verified\'">Verify interaction</button><output aria-live="polite">Ready</output></body></html>';
        const saved=await owner.call("/api/build-chat","PATCH",{projectId:project.id,revision:liveContext.data.project.revision,action:"edit",html});
        assert.equal(saved.status,200,"Manual verification HTML save failed");
        const reread=await owner.call(`/api/build-chat?projectId=${project.id}`);
        assert.equal(reread.status,200);
        assert.equal(reread.data.project.data.builder.html,html,"Manual verification HTML did not persist");
      }
      fs.mkdirSync("artifacts/live-rebuild",{recursive:true});
      browserStage="launch Chromium";
      browser=await chromium.launch({headless:true});
      const cookieSplit=owner.cookie.indexOf("=");
      const browserOrigin=new URL(origin).origin;
      for(const viewport of [
        {name:"desktop",options:{viewport:{width:1440,height:1000}}},
        {name:"mobile",options:{viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:devices["iPhone 13"].userAgent}},
      ]){
        browserStage=`${viewport.name} authenticated context`;
        const context=await browser.newContext({...viewport.options,baseURL:browserOrigin});
        try {
          // Keep credentials in memory only: no traces, videos or storage-state export.
          await context.addCookies([{name:owner.cookie.slice(0,cookieSplit),value:owner.cookie.slice(cookieSplit+1),url:`${browserOrigin}/`,sameSite:"Lax",secure:browserOrigin.startsWith("https:")}]);
          const page=await context.newPage();
          page.setDefaultTimeout(30000);
          const capture=async(name)=>{
            const masks=[page.locator('input[type="password"], input[autocomplete="one-time-code"], [data-secret]')];
            for(const frame of page.frames()) if(frame!==page.mainFrame()) masks.push(frame.locator('input[type="password"], [data-secret]'));
            await page.screenshot({path:`artifacts/live-rebuild/${viewport.name}-${name}.png`,fullPage:true,mask:masks});
          };
          browserStage=`${viewport.name} project preview interaction`;
          await page.goto(`/projects/${project.id}`,{waitUntil:"domcontentloaded"});
          const builder=page.getByRole("region",{name:"Direct builder",exact:true});
          await expect(builder).toBeVisible();
          if(viewport.name==="mobile"){
            const work=page.getByRole("tab",{name:"Work",exact:true}).or(page.getByRole("button",{name:"Work",exact:true}));
            // Older deployments expose Preview directly; newer mobile shells default to Chat.
            if(await work.count()) await work.click();
          }
          await builder.getByRole("tab",{name:"Preview",exact:true}).click();
          const iframe=page.locator('iframe[title="Generated app preview"]');
          await expect(iframe).toBeVisible();
          const preview=page.frameLocator('iframe[title="Generated app preview"]');
          if(manualPreview){
            await expect(preview.getByRole("heading",{name:"Manual verification",exact:true})).toBeVisible();
            await preview.getByRole("button",{name:"Verify interaction",exact:true}).click();
            await expect(preview.locator("output")).toHaveText("Interaction verified");
          }else{
            // The existing optional generation brief asks for a plus/minus counter.
            const before=await preview.locator("body").innerText();
            await preview.getByRole("button",{name:/\+|increase|increment|add|plus/i}).first().click();
            await expect.poll(async()=> (await preview.locator("body").innerText())!==before).toBe(true);
          }
          await capture(manualPreview ? "project-manual-verification" : "project-generated-preview");

          browserStage=`${viewport.name} persisted Bot team chat`;
          await page.goto(`/bots/${botTeamId}`,{waitUntil:"domcontentloaded"});
          const portal=page.getByRole("region",{name:"Bot portal",exact:true});
          await expect(portal).toBeVisible();
          await portal.getByRole("button").filter({hasText:botPrompt}).click();
          await expect(portal.getByRole("log",{name:"Conversation messages"})).toContainText(botPrompt);
          await expect(portal.getByText("Simulated handoff",{exact:true}).first()).toBeVisible();
          await capture("bot-team-chat");

          browserStage=`${viewport.name} provider settings`;
          const [providerLoaded]=await Promise.all([page.waitForResponse(response=>{
            const url=new URL(response.url());
            return url.origin===browserOrigin && url.pathname==="/api/providers" && url.searchParams.get("spaceId")===spaceId && response.request().method()==="GET";
          }),page.goto("/settings",{waitUntil:"domcontentloaded"})]);
          assert.equal(providerLoaded.status(),200,"Browser provider listing failed");
          const providers=page.getByRole("region",{name:"AI Providers",exact:true});
          await expect(providers).toBeVisible();
          await expect(providers.getByRole("heading",{name:"Temporary smoke connection",exact:true})).toBeVisible();
          await expect(page.getByText(/sign in required/i)).toHaveCount(0);
          await expect(providers.getByRole("dialog")).toHaveCount(0);
          await capture("settings-providers");

          browserStage=`${viewport.name} projects list`;
          await page.goto("/projects",{waitUntil:"domcontentloaded"});
          await expect(page.locator(".platform-content")).toBeVisible();
          await expect(page.getByRole("link",{name:"Counter verification",exact:true})).toBeVisible();
          await expect(page.getByText(/sign in required/i)).toHaveCount(0);
          await capture("projects");
        }finally{
          await context.close();
        }
      }
      pass("live desktop/mobile browser preview interaction verified without AI calls");
      pass("live desktop/mobile browser persisted Bot team chat visible");
      pass("live desktop/mobile browser provider settings authenticated and loaded");
      pass("live desktop/mobile browser projects visible; masked screenshots captured");
    }catch{
      // Do not print Playwright diagnostics that might include cookie arguments or page inputs.
      throw Error(`Live browser smoke failed at: ${browserStage}. No credentials or browser diagnostics were logged.`);
    }
  }
} finally {
  try {
    if(browser) await browser.close();
  } finally {
  for(const id of users){
    const spaces=await admin.from("kova_spaces").delete().eq("owner_id",id);
    if(spaces.error)throw Error("Temporary workspace cleanup failed");
    const result=await admin.auth.admin.deleteUser(id);
    if(result.error)throw Error("Temporary user cleanup failed");
  }
  console.log(`Temporary resources removed; ${checks.length} completed live checks.`);
  }
}
