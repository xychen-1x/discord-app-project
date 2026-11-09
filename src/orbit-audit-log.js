// Orbit Screen 25 — Server Audit Log. Frontend demonstration with local filters only.
(() => {
 const $=(s,r=document)=>r.querySelector(s), KEY="orbit.audit-log.filters.v1";
 const entries=[
  {id:"AL-1048",actor:"Mika",initial:"M",color:"violet",action:"updated",target:"#welcome channel topic",category:"channels",detail:"Changed the channel topic to “Start here: introductions, updates, and community links.”",time:"2026-11-10T20:42:00",relative:"8 minutes ago",icon:"✎"},
  {id:"AL-1047",actor:"Kai",initial:"K",color:"blue",action:"created",target:"#art-feedback channel",category:"channels",detail:"Created a new text channel in the CREATIVE category.",time:"2026-11-10T20:18:00",relative:"32 minutes ago",icon:"＋"},
  {id:"AL-1046",actor:"Nova",initial:"N",color:"pink",action:"changed",target:"Member role: Contributor",category:"roles",detail:"Updated role display settings and channel access for Contributor.",time:"2026-11-10T19:56:00",relative:"54 minutes ago",icon:"◇"},
  {id:"AL-1045",actor:"Aevryn",initial:"A",color:"green",action:"paused",target:"AutoMod rule: Suspicious links",category:"moderation",detail:"Paused the Suspicious links rule in the local AutoMod preview.",time:"2026-11-10T19:30:00",relative:"1 hour ago",icon:"⛨"},
  {id:"AL-1044",actor:"Jules",initial:"J",color:"orange",action:"removed",target:"Old event: Community Q&A",category:"events",detail:"Removed an expired event from the sample server activity.",time:"2026-11-10T18:50:00",relative:"2 hours ago",icon:"×"},
  {id:"AL-1043",actor:"Mika",initial:"M",color:"violet",action:"added",target:"Kai to Stargazers",category:"members",detail:"A member joined through an invite link.",time:"2026-11-10T18:22:00",relative:"2 hours ago",icon:"♧"},
  {id:"AL-1042",actor:"Aevryn",initial:"A",color:"green",action:"created",target:"Server invite",category:"invites",detail:"Created a sample invite with a 7-day expiry.",time:"2026-11-10T17:40:00",relative:"3 hours ago",icon:"↗"},
  {id:"AL-1041",actor:"Kai",initial:"K",color:"blue",action:"updated",target:"Server welcome settings",category:"server",detail:"Updated the welcome message and onboarding preview.",time:"2026-11-10T16:55:00",relative:"4 hours ago",icon:"✦"},
  {id:"AL-1040",actor:"Nova",initial:"N",color:"pink",action:"deleted",target:"#temporary-chat channel",category:"channels",detail:"Deleted a temporary text channel from the sample server.",time:"2026-11-10T15:32:00",relative:"5 hours ago",icon:"−"}
 ];
 let view=null,detail=null,filters={query:"",category:"all",actor:"all",period:"7d"};
 const categories={server:"Server",channels:"Channels",roles:"Roles",members:"Members",moderation:"Moderation",events:"Events",invites:"Invites"};
 function ensure(){
  if(view)return;
  view=document.createElement("section");view.id="orbit-audit-log";view.className="oal-view";view.hidden=true;
  view.innerHTML='<header class="oal-header"><div><small>SERVER MANAGEMENT / TRANSPARENCY</small><h1>Audit Log</h1><p>A chronological record of important server changes and moderation activity.</p></div><button class="oal-close" data-oal="close" aria-label="Close">×</button></header><div class="oal-notice"><b>Sample activity</b><span>These entries demonstrate the interface. They are not fetched from a live server or database.</span></div><div class="oal-toolbar"><label class="oal-search">⌕ <input id="oal-search" placeholder="Search actions, people, or targets"></label><select id="oal-category" aria-label="Filter by category"><option value="all">All categories</option><option value="server">Server</option><option value="channels">Channels</option><option value="roles">Roles</option><option value="members">Members</option><option value="moderation">Moderation</option><option value="events">Events</option><option value="invites">Invites</option></select><select id="oal-actor" aria-label="Filter by member"><option value="all">All members</option><option>Mika</option><option>Kai</option><option>Nova</option><option>Jules</option><option>Aevryn</option></select><select id="oal-period" aria-label="Filter by time"><option value="7d">Last 7 days</option><option value="24h">Last 24 hours</option><option value="all">All time</option></select></div><div class="oal-summary"><div><b id="oal-count">9</b><small>VISIBLE ENTRIES</small></div><div><b>7</b><small>EVENT CATEGORIES</small></div><div><b>Newest first</b><small>SORT ORDER</small></div></div><div class="oal-list-head"><div><small>ACTIVITY HISTORY</small><h2>Recent actions</h2></div><button data-oal="reset">Reset filters</button></div><div id="oal-list" class="oal-list" aria-live="polite"></div>';
  $(".main-panel").appendChild(view);view.addEventListener("click",click);
  ["#oal-search","#oal-category","#oal-actor","#oal-period"].forEach(sel=>$(sel).addEventListener(sel==="#oal-search"?"input":"change",e=>{filters[({ "#oal-search":"query","#oal-category":"category","#oal-actor":"actor","#oal-period":"period"})[sel]]=e.target.value;renderList();}));
  detail=document.createElement("div");detail.className="oal-detail-layer";detail.hidden=true;
  detail.innerHTML='<button class="oal-detail-backdrop" data-oal-detail-close aria-label="Close details"></button><section class="oal-detail" role="dialog" aria-modal="true" aria-labelledby="oal-detail-title"><header><div><small>AUDIT ENTRY</small><h2 id="oal-detail-title">Action details</h2></div><button data-oal-detail-close aria-label="Close">×</button></header><div id="oal-detail-body"></div></section>';
  document.body.appendChild(detail);detail.addEventListener("click",e=>{if(e.target.closest("[data-oal-detail-close]"))detail.hidden=true;});
 }
 function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
 function filtered(){
  const q=filters.query.toLowerCase();
  return entries.filter(x=>(filters.category==="all"||x.category===filters.category)&&(filters.actor==="all"||x.actor===filters.actor)&&(!q||[x.actor,x.action,x.target,x.detail,x.id].join(" ").toLowerCase().includes(q))&&(filters.period!=="24h"||new Date(x.time)>=new Date("2026-11-09T20:00:00")));
 }
 function renderList(){
  const rows=filtered();$("#oal-count").textContent=rows.length;
  $("#oal-list").innerHTML=rows.map(x=>'<button class="oal-entry" data-oal-entry="'+x.id+'"><span class="oal-entry-icon '+x.color+'">'+x.icon+'</span><span class="oal-entry-main"><span class="oal-entry-title"><b>'+esc(x.actor)+'</b> '+esc(x.action)+' <strong>'+esc(x.target)+'</strong></span><small>'+esc(categories[x.category])+' · '+esc(x.id)+'</small></span><time>'+esc(x.relative)+'</time><span class="oal-chevron">›</span></button>').join("")||'<div class="oal-empty"><b>No matching activity</b><span>Try changing the filters or search terms.</span></div>';
 }
 function open(){
  ensure();view.hidden=false;$("#orbit-server-home").hidden=true;$("#orbit-automod-view")?.setAttribute("hidden","");$(".main-header").hidden=true;$(".chat-layout").hidden=true;renderList();
 }
 function close(){view.hidden=true;if($("#orbit-server-home"))$("#orbit-server-home").hidden=false;else{$(".main-header").hidden=false;$(".chat-layout").hidden=false;}}
 function showDetail(id){
  const x=entries.find(e=>e.id===id);if(!x)return;
  $("#oal-detail-title").textContent=x.id;
  $("#oal-detail-body").innerHTML='<div class="oal-detail-actor"><span class="oal-entry-icon '+x.color+'">'+x.initial+'</span><div><b>'+esc(x.actor)+'</b><small>Performed this action</small></div></div><dl><div><dt>Action</dt><dd>'+esc(x.action)+'</dd></div><div><dt>Target</dt><dd>'+esc(x.target)+'</dd></div><div><dt>Category</dt><dd>'+esc(categories[x.category])+'</dd></div><div><dt>Time</dt><dd>'+new Date(x.time).toLocaleString()+'</dd></div><div><dt>Entry ID</dt><dd>'+esc(x.id)+'</dd></div></dl><p class="oal-detail-description">'+esc(x.detail)+'</p><small class="oal-detail-foot">Sample audit data · Not a live server record</small>';
  detail.hidden=false;
 }
 function click(e){
  if(e.target.closest('[data-oal="close"]')){close();return;}
  if(e.target.closest('[data-oal="reset"]')){filters={query:"",category:"all",actor:"all",period:"7d"};$("#oal-search").value="";$("#oal-category").value="all";$("#oal-actor").value="all";$("#oal-period").value="7d";renderList();return;}
  const row=e.target.closest("[data-oal-entry]");if(row)showDetail(row.dataset.oalEntry);
 }
 document.addEventListener("orbit:open-audit-log",open);
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(detail&&!detail.hidden)detail.hidden=true;else if(view&&!view.hidden)close();}});
})();