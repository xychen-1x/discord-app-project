// Orbit Screen 24 — AutoMod rules dashboard. Frontend simulation only.
(() => {
 const $=(s,r=document)=>r.querySelector(s), KEY="orbit.automod.rules.v1";
 const starter=[
  {id:"am-keywords",name:"Blocked terms",type:"keywords",description:"Review messages containing configured terms.",terms:["free nitro","fake giveaway"],action:"block",enabled:true,exempt:["Moderators","Trusted members"],hits:12},
  {id:"am-spam",name:"Repeated messages",type:"spam",description:"Flag repeated or rapidly repeated messages.",terms:[],action:"block",enabled:true,exempt:["Moderators"],hits:8},
  {id:"am-mentions",name:"Mention spam",type:"mentions",description:"Flag messages that mention too many members.",limit:5,action:"timeout",enabled:true,exempt:["Moderators"],hits:3},
  {id:"am-links",name:"Suspicious links",type:"links",description:"Review messages containing untrusted links.",terms:["short.example","unknown.example"],action:"alert",enabled:false,exempt:["Moderators"],hits:0}
 ];
 let rules=read(),activeTab="rules",editing=null,overlay=null,view=null;
 function read(){try{const x=JSON.parse(localStorage.getItem(KEY));return Array.isArray(x)?x:starter;}catch{return starter;}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(rules));}catch{}}
 function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
 function ensure(){
  if(view)return;
  view=document.createElement("section");view.id="orbit-automod-view";view.className="oam-view";view.hidden=true;
  view.innerHTML='<header class="oam-header"><div><small>SERVER SAFETY / AUTOMATION</small><h1>AutoMod</h1><p>Configure local rule previews and inspect how messages would be handled.</p></div><button class="oam-close" data-oam="close" aria-label="Close">×</button></header><div class="oam-notice"><b>Preview mode</b><span>Rules are saved in this browser only. They do not scan or moderate real server messages.</span></div><nav class="oam-tabs"><button data-oam-tab="rules">Rules</button><button data-oam-tab="test">Message tester</button><button data-oam-tab="exemptions">Exemptions</button></nav><div id="oam-content"></div>';
  $(".main-panel").appendChild(view);view.addEventListener("click",click);view.addEventListener("submit",submit);
  overlay=document.createElement("div");overlay.className="oam-overlay";overlay.hidden=true;
  overlay.innerHTML='<button class="oam-backdrop" data-oam="cancel" aria-label="Close dialog"></button><form class="oam-dialog" id="oam-rule-form"><header><div><small>RULE CONFIGURATION</small><h2 id="oam-dialog-title">Create rule</h2></div><button type="button" data-oam="cancel" aria-label="Close">×</button></header><label>Rule name<input name="name" maxlength="48" required placeholder="e.g. Block invite links"></label><label>Rule type<select name="type"><option value="keywords">Keyword filter</option><option value="spam">Repeated message detection</option><option value="mentions">Mention spam</option><option value="links">Link filter</option></select></label><label>Terms or patterns <small>(comma-separated; for keyword and link rules)</small><input name="terms" placeholder="term one, term two"></label><label>Mention threshold<input name="limit" type="number" min="2" max="30" value="5"></label><label>Action<select name="action"><option value="block">Block message</option><option value="alert">Send moderator alert</option><option value="timeout">Temporary timeout (preview)</option></select></label><label class="oam-check"><input name="enabled" type="checkbox" checked> Enable this rule in the local preview</label><footer><button type="button" class="oam-secondary" data-oam="cancel">Cancel</button><button class="oam-primary">Save rule</button></footer></form></div>';
  document.body.appendChild(overlay);overlay.addEventListener("click",e=>{if(e.target.closest("[data-oam=cancel]"))overlay.hidden=true;});overlay.addEventListener("submit",submit);
 }
 function open(){ensure();activeTab="rules";view.hidden=false;$(".main-header").hidden=true;$(".chat-layout").hidden=true;$("#orbit-server-home").hidden=true;render();}
 function close(){if(view)view.hidden=true;$("#orbit-server-home")?.removeAttribute("hidden");if(!$("#orbit-server-home")){$(".main-header").hidden=false;$(".chat-layout").hidden=false;}}
 function tabs(){view.querySelectorAll("[data-oam-tab]").forEach(b=>b.classList.toggle("active",b.dataset.oamTab===activeTab));}
 function renderRules(){
  const enabled=rules.filter(r=>r.enabled).length;
  $("#oam-content").innerHTML=`<div class="oam-stats"><div><b>${rules.length}</b><small>TOTAL RULES</small></div><div><b>${enabled}</b><small>ACTIVE RULES</small></div><div><b>${rules.reduce((n,r)=>n+r.hits,0)}</b><small>SIMULATED MATCHES</small></div></div><div class="oam-section-head"><div><small>PROTECTION CONFIGURATION</small><h2>Server rules</h2></div><button class="oam-primary" data-oam="create">＋ Create rule</button></div><div class="oam-rule-list">${rules.map(r=>`<article class="oam-rule"><div class="oam-rule-icon">${icon(r.type)}</div><div class="oam-rule-copy"><div class="oam-rule-title"><b>${esc(r.name)}</b><span class="oam-state ${r.enabled?"on":"off"}">${r.enabled?"ACTIVE":"PAUSED"}</span></div><p>${esc(r.description)}</p><div class="oam-rule-meta"><span>${label(r.type)}</span><span>Action: ${labelAction(r.action)}</span><span>${r.hits} simulated matches</span></div></div><div class="oam-rule-actions"><button data-oam-edit="${r.id}">Edit</button><button data-oam-toggle="${r.id}">${r.enabled?"Pause":"Enable"}</button><button class="oam-delete" data-oam-delete="${r.id}">Delete</button></div></article>`).join("")||'<div class="oam-empty">No rules yet. Create your first AutoMod rule.</div>'}</div>`;
 }
 function renderTest(){
  $("#oam-content").innerHTML='<div class="oam-test-grid"><section class="oam-panel"><small>SIMULATE A MESSAGE</small><h2>Message tester</h2><p>Enter sample text and choose a mention count to see which enabled rules would match.</p><form id="oam-test-form"><label>Sample message<textarea name="message" maxlength="1200" required placeholder="Paste a sample message here…"></textarea></label><label>Number of mentions<input name="mentions" type="number" min="0" max="100" value="0"></label><button class="oam-primary">Run simulation</button></form></section><section class="oam-panel oam-results" id="oam-results"><div class="oam-result-placeholder">◇<b>Results will appear here</b><span>This tester does not send messages or apply moderation.</span></div></section></div>';
 }
 function renderExemptions(){
  $("#oam-content").innerHTML=`<section class="oam-panel oam-exempt"><small>RULE EXCEPTIONS</small><h2>Role exemptions</h2><p>These are example role exclusions attached to individual rules. Actual permission checks are not connected in this preview.</p>${rules.map(r=>`<div class="oam-exempt-row"><div><b>${esc(r.name)}</b><small>${esc(label(r.type))}</small></div><span>${(r.exempt||[]).map(esc).join(", ")||"No exemptions"}</span><button data-oam-edit="${r.id}">Configure</button></div>`).join("")}</section>`;
 }
 function render(){tabs();if(activeTab==="rules")renderRules();else if(activeTab==="test")renderTest();else renderExemptions();}
 function icon(t){return t==="keywords"?"⌕":t==="spam"?"≋":t==="mentions"?"♧":"↗";}
 function label(t){return ({keywords:"Keyword filter",spam:"Repeated messages",mentions:"Mention spam",links:"Link filter"})[t]||t;}
 function labelAction(a){return ({block:"Block",alert:"Moderator alert",timeout:"Temporary timeout"})[a]||a;}
 function openForm(rule){editing=rule?.id||null;const f=$("#oam-rule-form");f.reset();$("#oam-dialog-title").textContent=rule?"Edit rule":"Create rule";f.elements.name.value=rule?.name||"";f.elements.type.value=rule?.type||"keywords";f.elements.terms.value=(rule?.terms||[]).join(", ");f.elements.limit.value=rule?.limit||5;f.elements.action.value=rule?.action||"block";f.elements.enabled.checked=rule?rule.enabled:true;overlay.hidden=false;}
 function matchRules(message,mentions){const low=message.toLowerCase();return rules.filter(r=>r.enabled&&((r.type==="keywords"&&(r.terms||[]).some(t=>t&&low.includes(t.toLowerCase())))||(r.type==="links"&&(r.terms||[]).some(t=>t&&low.includes(t.toLowerCase())))||(r.type==="spam"&&/(.)\1{7,}/i.test(message))||(r.type==="mentions"&&mentions>=Number(r.limit||5))));}
 function click(e){
  const act=e.target.closest("[data-oam]")?.dataset.oam;
  if(act==="close"){close();return;}if(act==="create"){openForm();return;}
  const tab=e.target.closest("[data-oam-tab]");if(tab){activeTab=tab.dataset.oamTab;render();return;}
  const edit=e.target.closest("[data-oam-edit]");if(edit){openForm(rules.find(r=>r.id===edit.dataset.oamEdit));return;}
  const toggle=e.target.closest("[data-oam-toggle]");if(toggle){const r=rules.find(x=>x.id===toggle.dataset.oamToggle);if(r){r.enabled=!r.enabled;save();render();}return;}
  const del=e.target.closest("[data-oam-delete]");if(del){rules=rules.filter(r=>r.id!==del.dataset.oamDelete);save();render();}
 }
 function submit(e){
  if(e.target.id==="oam-rule-form"){e.preventDefault();const f=e.target,name=f.elements.name.value.trim();if(!name)return;const type=f.elements.type.value,terms=f.elements.terms.value.split(",").map(x=>x.trim()).filter(Boolean);const item={id:editing||"rule-"+Date.now(),name,type,description:label(type)+" configured for this server.",terms,limit:Math.max(2,Math.min(30,Number(f.elements.limit.value)||5)),action:f.elements.action.value,enabled:f.elements.enabled.checked,exempt:editing?(rules.find(r=>r.id===editing)?.exempt||["Moderators"]):["Moderators"],hits:editing?(rules.find(r=>r.id===editing)?.hits||0):0};if(editing)rules=rules.map(r=>r.id===editing?item:r);else rules.unshift(item);save();overlay.hidden=true;activeTab="rules";render();return;}
  if(e.target.id==="oam-test-form"){e.preventDefault();const f=e.target,message=f.elements.message.value,mentions=Number(f.elements.mentions.value)||0,matched=matchRules(message,mentions);matched.forEach(m=>m.hits++);save();const box=$("#oam-results");box.innerHTML='<div class="oam-result-head"><small>SIMULATION RESULT</small><h2>'+(matched.length?"Rules matched":"No rules matched")+'</h2><p>'+(matched.length?matched.length+" enabled rule(s) would be triggered.":"This sample did not match any enabled rule.")+'</p></div>'+(matched.map(r=>'<div class="oam-match"><b>'+esc(r.name)+'</b><span>'+esc(labelAction(r.action))+'</span><small>'+esc(r.description)+'</small></div>').join("")||'<div class="oam-no-match">No simulated moderation action.</div>')+'<small class="oam-footnote">Simulation only. No message was sent, blocked, or acted upon.</small>';renderStatsOnly();}
 }
 function renderStatsOnly(){if(activeTab==="rules")renderRules();}
 document.addEventListener("orbit:open-automod",open);
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&view&&!view.hidden){if(overlay&&!overlay.hidden)overlay.hidden=true;else close();}});
})();
