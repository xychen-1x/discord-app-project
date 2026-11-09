// Orbit Screen 27 — Bot Directory & Management (local frontend simulation only).
(() => {
 const $=(s,r=document)=>r.querySelector(s),KEY="orbit.bots.v1";
 const catalog=[
  {id:"orbit-mod",name:"Orbit Mod",category:"moderation",icon:"⛨",color:"violet",tag:"Moderation",description:"A sample moderation assistant for keeping community spaces organized.",features:["Keyword alerts","Member report queue","Moderation summaries"],permissions:["View channels","Read message history","Manage messages"],verified:true},
  {id:"starboard",name:"Starboard",category:"community",icon:"✦",color:"gold",tag:"Community",description:"Collects notable community moments in a shared highlight feed.",features:["Highlight reactions","Community showcase","Weekly recap"],permissions:["View channels","Read message history","Send messages"],verified:true},
  {id:"pollmate",name:"Pollmate",category:"utility",icon:"▤",color:"blue",tag:"Utility",description:"Creates simple polls and helps summarize community choices.",features:["Quick polls","Anonymous poll preview","Result summaries"],permissions:["View channels","Send messages","Embed links"],verified:true},
  {id:"welcomer",name:"Welcomer",category:"community",icon:"⌂",color:"green",tag:"Community",description:"Greets new members and points them toward important channels.",features:["Welcome messages","Getting-started guide","Channel suggestions"],permissions:["View channels","Send messages"],verified:false},
  {id:"remindly",name:"Remindly",category:"utility",icon:"◷",color:"blue",tag:"Utility",description:"Keeps track of community reminders and scheduled prompts.",features:["Reminder previews","Recurring schedule preview","Event prompts"],permissions:["View channels","Send messages"],verified:false},
  {id:"guardrail",name:"Guardrail",category:"moderation",icon:"◇",color:"violet",tag:"Moderation",description:"Provides a sample safety checklist and moderation activity overview.",features:["Safety checklist","Mod activity summary","Escalation notes"],permissions:["View channels","Read message history","Manage messages","Timeout members"],verified:true}
 ];
 const defaults={installed:["orbit-mod","starboard","pollmate"],enabled:{"orbit-mod":true,starboard:true,pollmate:false},permissions:{}};
 function cloneDefaults(){return JSON.parse(JSON.stringify(defaults));}
 function load(){try{const v=JSON.parse(localStorage.getItem(KEY));return v&&Array.isArray(v.installed)?Object.assign(cloneDefaults(),v,{enabled:Object.assign({},defaults.enabled,v.enabled||{}),permissions:v.permissions||{}}):cloneDefaults();}catch{return cloneDefaults();}}
 let state=load(),view=null,modal=null,filter="all",query="",modalBot=null;
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
 function toast(msg){let t=$("#orbit-bots-toast");if(!t){t=document.createElement("div");t.id="orbit-bots-toast";t.className="ob-toast";document.body.appendChild(t);}t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2200);}
 function ensure(){
  if(view)return;
  view=document.createElement("section");view.id="orbit-bots-view";view.className="ob-view";view.hidden=true;
  view.innerHTML='<header class="ob-header"><div><small>SERVER MANAGEMENT / APP DIRECTORY</small><h1>Bots &amp; Apps</h1><p>Discover helper apps and manage the bots installed in this community.</p></div><button class="ob-close" data-ob="close" aria-label="Close">×</button></header><div class="ob-notice"><b>Preview environment</b><span>Bot installation and permissions are simulated locally. No bot account is invited and no external service is contacted.</span></div><div class="ob-stats"><div><b id="ob-count">3</b><small>INSTALLED BOTS</small></div><div><b id="ob-enabled">2</b><small>ENABLED</small></div><div><b>6</b><small>DIRECTORY APPS</small></div></div><div class="ob-toolbar"><label class="ob-search">⌕ <input id="ob-search" type="search" placeholder="Search bots and apps…" autocomplete="off"></label><button data-ob-filter="all" class="active">All apps</button><button data-ob-filter="installed">Installed</button></div><nav class="ob-categories" aria-label="Bot categories"><button data-ob-category="all" class="active">All</button><button data-ob-category="moderation">Moderation</button><button data-ob-category="utility">Utility</button><button data-ob-category="community">Community</button></nav><div id="ob-grid" class="ob-grid"></div><section class="ob-permissions-note"><div><small>SERVER ADMINISTRATION</small><h2>Review permissions before installing</h2><p>Only grant the access a bot needs. In a live Orbit release, installation will require server-side authorization and verified bot ownership.</p></div><span>◇</span></section>';
  $(".main-panel").appendChild(view);view.addEventListener("click",onViewClick);
  $("#ob-search").addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();render();});
  modal=document.createElement("div");modal.className="ob-modal-layer";modal.hidden=true;
  modal.innerHTML='<button class="ob-backdrop" data-ob-close aria-label="Close dialog"></button><section class="ob-modal" role="dialog" aria-modal="true" aria-labelledby="ob-modal-title"><header><div><small>BOT DETAILS &amp; PERMISSIONS</small><h2 id="ob-modal-title">Bot details</h2></div><button data-ob-close aria-label="Close">×</button></header><div id="ob-modal-body"></div><footer id="ob-modal-footer"></footer></section>';
  document.body.appendChild(modal);modal.addEventListener("click",onModalClick);
 }
 function render(){
  $("#ob-count").textContent=state.installed.length;
  $("#ob-enabled").textContent=state.installed.filter(id=>state.enabled[id]!==false).length;
  const category=view.dataset.category||"all";
  const rows=catalog.filter(b=>(filter==="all"||(filter==="installed"&&state.installed.includes(b.id)))&&(category==="all"||b.category===category)&&(!query||(b.name+" "+b.description+" "+b.tag).toLowerCase().includes(query)));
  $("#ob-grid").innerHTML=rows.map(b=>{
   const installed=state.installed.includes(b.id),enabled=state.enabled[b.id]!==false;
   return '<article class="ob-card"><div class="ob-card-top"><span class="ob-icon '+b.color+'">'+b.icon+'</span><span class="ob-category">'+esc(b.tag)+'</span></div><div class="ob-title"><h3>'+esc(b.name)+'</h3>'+(b.verified?'<span class="ob-verified" title="Verified sample listing">✓</span>':"")+'</div><p>'+esc(b.description)+'</p><div class="ob-features">'+b.features.slice(0,2).map(x=>'<span>'+esc(x)+'</span>').join("")+'</div><div class="ob-card-footer"><span class="ob-installed-state '+(installed?"is-installed":"")+'">'+(installed?(enabled?"Installed · On":"Installed · Off"):"Directory listing")+'</span><div><button data-ob="details" data-id="'+b.id+'">Details</button><button class="'+(installed?"ob-remove":"ob-install")+'" data-ob="'+(installed?"remove":"install")+'" data-id="'+b.id+'">'+(installed?"Remove":"Add")+'</button></div></div></article>';
  }).join("")||'<div class="ob-empty">No apps match this search or filter.</div>';
 }
 function open(){
  ensure();view.hidden=false;view.dataset.category="all";filter="all";query="";$("#ob-search").value="";
  view.querySelectorAll("[data-ob-filter]").forEach(b=>b.classList.toggle("active",b.dataset.obFilter==="all"));
  view.querySelectorAll("[data-ob-category]").forEach(b=>b.classList.toggle("active",b.dataset.obCategory==="all"));
  $("#orbit-server-home").hidden=true;$("#orbit-integrations")?.setAttribute("hidden","");$("#orbit-automod-view")?.setAttribute("hidden","");$("#orbit-audit-log")?.setAttribute("hidden","");
  $(".main-header").hidden=true;$(".chat-layout").hidden=true;render();
 }
 function close(){view.hidden=true;if($("#orbit-server-home"))$("#orbit-server-home").hidden=false;else{$(".main-header").hidden=false;$(".chat-layout").hidden=false;}}
 function showDetails(bot){
  modalBot=bot;const installed=state.installed.includes(bot.id),enabled=state.enabled[bot.id]!==false,granted=state.permissions[bot.id]||bot.permissions;
  $("#ob-modal-title").textContent=bot.name;
  $("#ob-modal-body").innerHTML='<div class="ob-detail-head"><span class="ob-icon '+bot.color+'">'+bot.icon+'</span><div><b>'+esc(bot.tag)+' app</b><p>'+esc(bot.description)+'</p></div></div><h3>Capabilities</h3><ul class="ob-capabilities">'+bot.features.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><h3>Requested permissions</h3><div class="ob-permission-list">'+bot.permissions.map(p=>'<label><input type="checkbox" data-ob-permission value="'+esc(p)+'" '+(granted.includes(p)?"checked":"")+'> '+esc(p)+'</label>').join("")+'</div><p class="ob-modal-hint">Permission choices are saved only in this browser preview.</p>';
  $("#ob-modal-footer").innerHTML='<button data-ob-close>Close</button>'+(installed?'<button data-ob-toggle>'+(enabled?"Pause bot":"Enable bot")+'</button>':'<button class="ob-install" data-ob-install>＋ Add to server</button>');
  modal.hidden=false;
 }
 function onViewClick(e){
  if(e.target.closest('[data-ob="close"]')){close();return;}
  const f=e.target.closest("[data-ob-filter]");if(f){filter=f.dataset.obFilter;view.querySelectorAll("[data-ob-filter]").forEach(b=>b.classList.toggle("active",b===f));render();return;}
  const c=e.target.closest("[data-ob-category]");if(c){view.dataset.category=c.dataset.obCategory;view.querySelectorAll("[data-ob-category]").forEach(b=>b.classList.toggle("active",b===c));render();return;}
  const b=e.target.closest("[data-ob]");if(!b)return;const bot=catalog.find(x=>x.id===b.dataset.id);if(!bot)return;
  if(b.dataset.ob==="details")showDetails(bot);
  if(b.dataset.ob==="install"){if(!state.installed.includes(bot.id))state.installed.push(bot.id);state.enabled[bot.id]=true;save();render();toast(bot.name+" added to this local preview.");}
  if(b.dataset.ob==="remove"){state.installed=state.installed.filter(x=>x!==bot.id);delete state.enabled[bot.id];save();render();toast(bot.name+" removed from this local preview.");}
 }
 function onModalClick(e){
  if(e.target.closest("[data-ob-close]")){modal.hidden=true;return;}
  if(e.target.closest("[data-ob-install]")&&modalBot){if(!state.installed.includes(modalBot.id))state.installed.push(modalBot.id);state.enabled[modalBot.id]=true;save();modal.hidden=true;render();toast(modalBot.name+" added to this local preview.");return;}
  if(e.target.closest("[data-ob-toggle]")&&modalBot){state.enabled[modalBot.id]=state.enabled[modalBot.id]===false;save();showDetails(modalBot);render();return;}
  if(e.target.closest("[data-ob-permission]")){state.permissions[modalBot.id]=[...modal.querySelectorAll("[data-ob-permission]:checked")].map(x=>x.value);save();}
 }
 document.addEventListener("orbit:open-bots",open);
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(modal&&!modal.hidden)modal.hidden=true;else if(view&&!view.hidden)close();}});
})();