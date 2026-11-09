// Orbit Screen 26 — Integrations & Webhooks (local frontend simulation only).
(() => {
 const $=(s,r=document)=>r.querySelector(s), KEY="orbit.integrations.v1";
 const defaults=[
  {id:"int-1",name:"Welcome announcements",kind:"webhook",channel:"#announcements",enabled:true,description:"Posts approved community updates.",created:"Nov 8, 2026",secret:"wh_demo_••••••••••••••••"},
  {id:"int-2",name:"GitHub activity",kind:"service",channel:"#general",enabled:false,description:"A sample connection for repository activity.",created:"Nov 6, 2026",secret:""},
  {id:"int-3",name:"Event reminders",kind:"webhook",channel:"#events",enabled:true,description:"Sends scheduled event reminders.",created:"Nov 4, 2026",secret:"wh_demo_••••••••••••••••"}
 ];
 let items=load(),view=null,modal=null,editing=null,tab="all";
 function load(){try{const v=JSON.parse(localStorage.getItem(KEY));return Array.isArray(v)?v:defaults.map(x=>({...x}));}catch{return defaults.map(x=>({...x}));}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(items));}catch{}}
 function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
 function ensure(){
  if(view)return;
  view=document.createElement("section");view.id="orbit-integrations";view.className="oi-view";view.hidden=true;
  view.innerHTML='<header class="oi-header"><div><small>SERVER MANAGEMENT / CONNECTED SERVICES</small><h1>Integrations</h1><p>Manage webhook endpoints and connected service previews for this community.</p></div><button class="oi-close" data-oi="close" aria-label="Close">×</button></header><div class="oi-notice"><b>Local preview only</b><span>Connections and webhook actions are simulated in this browser. No external service receives data.</span></div><div class="oi-overview"><div><b id="oi-total">3</b><small>CONFIGURATIONS</small></div><div><b id="oi-active">2</b><small>ENABLED</small></div><div><b>2</b><small>INTEGRATION TYPES</small></div></div><div class="oi-toolbar"><div class="oi-tabs"><button data-oi-tab="all" class="active">All</button><button data-oi-tab="webhook">Webhooks</button><button data-oi-tab="service">Services</button></div><button class="oi-primary" data-oi="create">＋ Add integration</button></div><div id="oi-list" class="oi-list"></div><section class="oi-guide"><div><small>ABOUT WEBHOOKS</small><h2>Send updates to a channel</h2><p>Webhooks let an external service publish messages to a chosen channel. In a live implementation, keep endpoint URLs and tokens private and restrict who can manage them.</p></div><span>⌘</span></section>';
  $(".main-panel").appendChild(view);view.addEventListener("click",onViewClick);
  modal=document.createElement("div");modal.className="oi-modal-layer";modal.hidden=true;
  modal.innerHTML='<button class="oi-backdrop" data-oi-close aria-label="Close dialog"></button><section class="oi-modal" role="dialog" aria-modal="true" aria-labelledby="oi-modal-title"><header><div><small>SERVER INTEGRATION</small><h2 id="oi-modal-title">Add integration</h2></div><button data-oi-close aria-label="Close">×</button></header><p id="oi-modal-description">Create a local integration configuration.</p><label>DISPLAY NAME<input id="oi-name" maxlength="48" placeholder="e.g. Release announcements"></label><label>TYPE<select id="oi-kind"><option value="webhook">Webhook</option><option value="service">Connected service (preview)</option></select></label><label>DESTINATION CHANNEL<select id="oi-channel"><option>#announcements</option><option>#general</option><option>#events</option><option>#welcome</option></select></label><label>DESCRIPTION<input id="oi-description" maxlength="100" placeholder="What will this integration do?"></label><div class="oi-modal-note">Do not paste real webhook URLs, passwords, or API tokens here. This demo does not connect to external services.</div><footer><button data-oi-close>Cancel</button><button class="oi-primary" data-oi-save>Save integration</button></footer></section>';
  document.body.appendChild(modal);modal.addEventListener("click",onModalClick);
 }
 function render(){
  const rows=items.filter(x=>tab==="all"||x.kind===tab);
  $("#oi-total").textContent=items.length;$("#oi-active").textContent=items.filter(x=>x.enabled).length;
  $("#oi-list").innerHTML=rows.map(x=>'<article class="oi-card"><div class="oi-card-icon '+x.kind+'">'+(x.kind==="webhook"?"⌁":"◇")+'</div><div class="oi-card-main"><div class="oi-card-title"><h3>'+esc(x.name)+'</h3><span class="oi-status '+(x.enabled?"on":"off")+'">'+(x.enabled?"Enabled":"Paused")+'</span></div><p>'+esc(x.description||"No description added.")+'</p><div class="oi-meta"><span>'+ (x.kind==="webhook"?"Webhook":"Connected service")+'</span><span>'+esc(x.channel)+'</span><span>Added '+esc(x.created)+'</span></div></div><div class="oi-actions"><button data-oi="toggle" data-id="'+x.id+'">'+(x.enabled?"Pause":"Enable")+'</button><button data-oi="edit" data-id="'+x.id+'">Edit</button><button data-oi="delete" data-id="'+x.id+'" class="danger">Remove</button></div></article>').join("")||'<div class="oi-empty">No integrations in this category yet.</div>';
 }
 function open(){ensure();view.hidden=false;$("#orbit-server-home").hidden=true;$("#orbit-automod-view")?.setAttribute("hidden","");$("#orbit-audit-log")?.setAttribute("hidden","");$(".main-header").hidden=true;$(".chat-layout").hidden=true;render();}
 function close(){view.hidden=true;if($("#orbit-server-home"))$("#orbit-server-home").hidden=false;else{$(".main-header").hidden=false;$(".chat-layout").hidden=false;}}
 function showForm(item){
  editing=item?.id||null;$("#oi-modal-title").textContent=item?"Edit integration":"Add integration";$("#oi-modal-description").textContent=item?"Update this local configuration.":"Create a local integration configuration.";
  $("#oi-name").value=item?.name||"";$("#oi-kind").value=item?.kind||"webhook";$("#oi-channel").value=item?.channel||"#announcements";$("#oi-description").value=item?.description||"";modal.hidden=false;$("#oi-name").focus();
 }
 function onViewClick(e){
  if(e.target.closest('[data-oi="close"]')){close();return;}
  const tabBtn=e.target.closest("[data-oi-tab]");if(tabBtn){tab=tabBtn.dataset.oiTab;view.querySelectorAll("[data-oi-tab]").forEach(b=>b.classList.toggle("active",b===tabBtn));render();return;}
  const btn=e.target.closest("[data-oi]");if(!btn)return;const id=btn.dataset.id,item=items.find(x=>x.id===id);
  if(btn.dataset.oi==="create")showForm(null);
  if(btn.dataset.oi==="edit"&&item)showForm(item);
  if(btn.dataset.oi==="toggle"&&item){item.enabled=!item.enabled;save();render();}
  if(btn.dataset.oi==="delete"&&item){items=items.filter(x=>x.id!==id);save();render();}
 }
 function onModalClick(e){
  if(e.target.closest("[data-oi-close]")){modal.hidden=true;return;}
  if(e.target.closest("[data-oi-save]")){
   const name=$("#oi-name").value.trim();if(!name){$("#oi-name").focus();return;}
   const data={name,kind:$("#oi-kind").value,channel:$("#oi-channel").value,description:$("#oi-description").value.trim(),enabled:true};
   if(editing){const old=items.find(x=>x.id===editing);if(old)Object.assign(old,data);}
   else items.unshift({id:"local-"+Date.now(),...data,created:"Just now",secret:data.kind==="webhook"?"Generated only in a real backend":""});
   save();modal.hidden=true;render();
  }
 }
 document.addEventListener("orbit:open-integrations",open);
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(modal&&!modal.hidden)modal.hidden=true;else if(view&&!view.hidden)close();}});
})();