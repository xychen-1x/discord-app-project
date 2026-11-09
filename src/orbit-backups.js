// Orbit Screen 28 — Server Backup & Restore (local preview only; no server data is exported or restored).
(() => {
 const $=(s,r=document)=>r.querySelector(s),KEY="orbit.server-backups.v1";
 const sample={server:"Stargazers",channels:12,categories:4,roles:8,settings:16,members:1284};
 const initial=[
  {id:"seed-2026-11-08",name:"Before channel reorganization",created:"2026-11-08T09:30:00.000Z",type:"Manual",status:"Complete",size: "24 KB",counts:{channels:12,categories:4,roles:8,settings:16}},
  {id:"seed-2026-11-05",name:"Weekly server snapshot",created:"2026-11-05T14:15:00.000Z",type:"Scheduled preview",status:"Complete",size:"22 KB",counts:{channels:11,categories:4,roles:8,settings:15}}
 ];
 function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return Array.isArray(x)?x:initial.map(v=>({...v,counts:{...v.counts}}));}catch{return initial.map(v=>({...v,counts:{...v.counts}}));}}
 let backups=load(),view=null,modal=null,selected=null,filter="all";
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const date=v=>new Date(v).toLocaleString(undefined,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
 function save(){try{localStorage.setItem(KEY,JSON.stringify(backups));}catch{}}
 function toast(s){let t=$("#orbit-backups-toast");if(!t){t=document.createElement("div");t.id="orbit-backups-toast";t.className="obk-toast";document.body.appendChild(t);}t.textContent=s;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2300);}
 function ensure(){
  if(view)return;
  view=document.createElement("section");view.id="orbit-backups-view";view.className="obk-view";view.hidden=true;
  view.innerHTML='<header class="obk-header"><div><small>SERVER MANAGEMENT / DATA SAFETY</small><h1>Server Backup</h1><p>Review local backup snapshots and preview recovery options for this community.</p></div><button data-obk="close" class="obk-close" aria-label="Close">×</button></header><div class="obk-warning"><b>Local preview only</b><span>These are sample backup records saved in this browser. No real server data is exported, uploaded, or restored.</span></div><section class="obk-overview"><div><small>AVAILABLE SNAPSHOTS</small><b id="obk-total">2</b></div><div><small>LAST SNAPSHOT</small><b id="obk-last">—</b></div><div><small>SERVER</small><b>Stargazers</b></div></section><section class="obk-create"><div><small>CREATE A RESTORE POINT</small><h2>Save a new snapshot</h2><p>Create a local record of the current sample server structure.</p></div><div class="obk-create-action"><input id="obk-name" maxlength="55" placeholder="Snapshot name (optional)" aria-label="Snapshot name"><button data-obk="create">＋ Create backup</button></div></section><div class="obk-list-head"><div><small>BACKUP HISTORY</small><h2>Saved snapshots</h2></div><select id="obk-filter" aria-label="Filter backups"><option value="all">All snapshots</option><option value="manual">Manual</option><option value="scheduled">Scheduled preview</option></select></div><div id="obk-list" class="obk-list"></div><div class="obk-footnote"><b>Before restoring</b><p>A real restore process must validate permissions, check compatibility, show exactly what will change, and create a recovery point first. This screen only demonstrates that review flow.</p></div>';
  $(".main-panel").appendChild(view);view.addEventListener("click",onViewClick);
  $("#obk-filter").addEventListener("change",e=>{filter=e.target.value;render();});
  modal=document.createElement("div");modal.className="obk-modal-layer";modal.hidden=true;
  modal.innerHTML='<button class="obk-backdrop" data-obk-close aria-label="Close dialog"></button><section class="obk-modal" role="dialog" aria-modal="true" aria-labelledby="obk-modal-title"><header><div><small>SNAPSHOT REVIEW</small><h2 id="obk-modal-title">Backup details</h2></div><button data-obk-close aria-label="Close">×</button></header><div id="obk-modal-body"></div><footer id="obk-modal-footer"></footer></section>';
  document.body.appendChild(modal);modal.addEventListener("click",onModalClick);
 }
 function render(){
  $("#obk-total").textContent=backups.length;
  $("#obk-last").textContent=backups.length?date(backups.slice().sort((a,b)=>new Date(b.created)-new Date(a.created))[0].created).split(",")[0]:"None";
  const rows=backups.filter(b=>filter==="all"||(filter==="manual"&&b.type==="Manual")||(filter==="scheduled"&&b.type!=="Manual")).sort((a,b)=>new Date(b.created)-new Date(a.created));
  $("#obk-list").innerHTML=rows.map(b=>'<article class="obk-card"><div class="obk-card-main"><span class="obk-file-icon">▧</span><div class="obk-card-copy"><h3>'+esc(b.name)+'</h3><p>'+esc(date(b.created))+' · '+esc(b.type)+' · '+esc(b.size)+'</p><span class="obk-status">● '+esc(b.status)+'</span></div></div><div class="obk-card-actions"><button data-obk="details" data-id="'+esc(b.id)+'">Details</button><button data-obk="restore" data-id="'+esc(b.id)+'">Restore preview</button><button class="obk-delete" data-obk="delete" data-id="'+esc(b.id)+'" aria-label="Delete '+esc(b.name)+'">Delete</button></div></article>').join("")||'<div class="obk-empty">No snapshots in this filter. Create a backup to get started.</div>';
 }
 function open(){ensure();view.hidden=false;filter="all";$("#obk-filter").value="all";$("#orbit-server-home").hidden=true;$("#orbit-bots-view")?.setAttribute("hidden","");$("#orbit-integrations")?.setAttribute("hidden","");$("#orbit-audit-log")?.setAttribute("hidden","");$("#orbit-automod-view")?.setAttribute("hidden","");$(".main-header").hidden=true;$(".chat-layout").hidden=true;render();}
 function close(){view.hidden=true;if($("#orbit-server-home"))$("#orbit-server-home").hidden=false;else{$(".main-header").hidden=false;$(".chat-layout").hidden=false;}}
 function create(){
  const name=$("#obk-name").value.trim()||("Server snapshot · "+new Date().toLocaleDateString());
  const now=new Date(),id="local-"+now.getTime().toString(36);
  backups.unshift({id,name,created:now.toISOString(),type:"Manual",status:"Complete",size:"~"+(18+Math.floor(Math.random()*13))+" KB",counts:{channels:sample.channels,categories:sample.categories,roles:sample.roles,settings:sample.settings}});
  save();$("#obk-name").value="";filter="all";$("#obk-filter").value="all";render();toast("Local backup snapshot created.");
 }
 function showDetails(b,restore=false){
  selected=b;$("#obk-modal-title").textContent=restore?"Restore preview":"Backup details";
  const c=b.counts||{};
  $("#obk-modal-body").innerHTML='<div class="obk-detail-name"><span class="obk-file-icon">▧</span><div><b>'+esc(b.name)+'</b><small>'+esc(date(b.created))+' · '+esc(b.type)+'</small></div></div>'+(restore?'<div class="obk-restore-alert"><b>Review before continuing</b><p>This preview will not change your server. A real restore may replace current configuration and should require a separate confirmation.</p></div>':'')+'<h3>Snapshot contents</h3><div class="obk-count-grid"><div><b>'+(c.channels??0)+'</b><small>CHANNELS</small></div><div><b>'+(c.categories??0)+'</b><small>CATEGORIES</small></div><div><b>'+(c.roles??0)+'</b><small>ROLES</small></div><div><b>'+(c.settings??0)+'</b><small>SETTINGS</small></div></div><div class="obk-detail-meta"><span>Estimated size</span><b>'+esc(b.size)+'</b><span>Snapshot status</span><b>'+esc(b.status)+'</b></div>';
  $("#obk-modal-footer").innerHTML=restore?'<button data-obk-close>Cancel</button><button class="obk-confirm-preview" data-obk-confirm-restore>Confirm preview</button>':'<button data-obk-close>Close</button><button data-obk-restore-selected>Restore preview</button>';
  modal.hidden=false;
 }
 function onViewClick(e){
  if(e.target.closest('[data-obk="close"]')){close();return;}
  const b=e.target.closest("[data-obk]");if(!b)return;
  if(b.dataset.obk==="create"){create();return;}
  const item=backups.find(x=>x.id===b.dataset.id);if(!item)return;
  if(b.dataset.obk==="details")showDetails(item);
  if(b.dataset.obk==="restore")showDetails(item,true);
  if(b.dataset.obk==="delete"){selected=item;$("#obk-modal-title").textContent="Delete snapshot?";$("#obk-modal-body").innerHTML='<p class="obk-delete-copy">Delete <b>'+esc(item.name)+'</b> from this browser preview? This cannot be undone in the local list.</p>';$("#obk-modal-footer").innerHTML='<button data-obk-close>Cancel</button><button class="obk-delete-confirm" data-obk-confirm-delete>Delete snapshot</button>';modal.hidden=false;}
 }
 function onModalClick(e){
  if(e.target.closest("[data-obk-close]")){modal.hidden=true;return;}
  if(e.target.closest("[data-obk-restore-selected]")&&selected){showDetails(selected,true);return;}
  if(e.target.closest("[data-obk-confirm-restore]")&&selected){modal.hidden=true;toast("Restore preview reviewed. No server data was changed.");return;}
  if(e.target.closest("[data-obk-confirm-delete]")&&selected){backups=backups.filter(x=>x.id!==selected.id);save();modal.hidden=true;selected=null;render();toast("Snapshot removed from this browser preview.");}
 }
 document.addEventListener("orbit:open-backups",open);
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(modal&&!modal.hidden)modal.hidden=true;else if(view&&!view.hidden)close();}});
})();