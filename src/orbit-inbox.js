// Orbit Screen 9 — Notifications & Inbox Center (frontend mock only).
(() => {
 const $=s=>document.querySelector(s);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const items=[
  {id:1,type:"mention",name:"Mika",initial:"M",avatar:"mika",where:"# general · Stargazers",text:"mentioned you in a conversation",detail:"Are you joining the astronomy discussion later?",time:"2 min ago",unread:true},
  {id:2,type:"friend",name:"Skyline",initial:"S",avatar:"sky",where:"Friend requests",text:"sent you a friend request",detail:"@skyline",time:"18 min ago",unread:true},
  {id:3,type:"message",name:"Kai",initial:"K",avatar:"kai",where:"Direct message",text:"sent you a message",detail:"I added the latest mockups to the project.",time:"42 min ago",unread:true},
  {id:4,type:"community",name:"Cosmic Observatory",initial:"✦",avatar:"cosmic",where:"Community updates",text:"posted a new announcement",detail:"This week's skywatching schedule is now available.",time:"Yesterday",unread:false},
  {id:5,type:"mention",name:"Nova",initial:"N",avatar:"nova",where:"# observations · Stargazers",text:"mentioned you in a conversation",detail:"Your telescope setup looks interesting!",time:"Yesterday",unread:false},
  {id:6,type:"friend",name:"Taylor",initial:"T",avatar:"taylor",where:"Friend requests",text:"accepted your friend request",detail:"You are now connected on Orbit.",time:"2 days ago",unread:false}
 ];
 let tab="all",filter="all",settingsOpen=false;
 function ensure(){
  if($("#orbit-inbox-view"))return;
  const view=document.createElement("section");view.id="orbit-inbox-view";view.className="oi-view";view.hidden=true;
  view.innerHTML=`
   <header class="oi-header"><div><small>YOUR ORBIT</small><h1>Notifications & Inbox</h1><p>Stay up to date with conversations and communities.</p></div><button data-oi="settings">⚙ <span>Notification settings</span></button></header>
   <div class="oi-layout"><main class="oi-main"><nav class="oi-tabs"><button data-oi-tab="all" class="active">All <i id="oi-all-count">6</i></button><button data-oi-tab="unread">Unread <i id="oi-unread-count">3</i></button><button data-oi-tab="mentions">Mentions</button></nav><div class="oi-toolbar"><div><b id="oi-list-title">Recent activity</b><small id="oi-list-subtitle">Your latest updates across Orbit</small></div><button data-oi="mark-all">✓ Mark all as read</button></div><div id="oi-list" class="oi-list"></div></main>
   <aside class="oi-aside"><div class="oi-summary"><small>INBOX SUMMARY</small><div><b id="oi-summary-unread">3</b><span>Unread updates</span></div><div><b id="oi-summary-mentions">2</b><span>Recent mentions</span></div><div><b id="oi-summary-requests">1</b><span>Friend requests</span></div></div><div class="oi-tip"><span>✦</span><b>Keep your focus</b><p>Mark updates as read to keep your inbox organized. You can adjust notification preferences at any time.</p><button data-oi="settings">Manage preferences →</button></div></aside></div>`;
  $(".main-panel").appendChild(view);
  const modal=document.createElement("div");modal.id="oi-settings-layer";modal.className="oi-settings-layer";modal.hidden=true;
  modal.innerHTML=`<button class="oi-settings-backdrop" data-oi-close aria-label="Close settings"></button><section class="oi-settings-card" role="dialog" aria-modal="true" aria-labelledby="oi-settings-title"><header><div><small>PERSONAL PREFERENCES</small><h2 id="oi-settings-title">Notification settings</h2></div><button data-oi-close aria-label="Close">×</button></header><p>Choose which updates appear in your Orbit inbox.</p><label><span><b>Direct messages</b><small>New messages and group conversations</small></span><input type="checkbox" checked></label><label><span><b>Mentions</b><small>When someone mentions you in a channel</small></span><input type="checkbox" checked></label><label><span><b>Friend activity</b><small>Requests and connection updates</small></span><input type="checkbox" checked></label><label><span><b>Community updates</b><small>Announcements from joined communities</small></span><input type="checkbox" checked></label><footer><button data-oi-close>Done</button></footer></section>`;
  document.body.appendChild(modal);view.addEventListener("click",onClick);modal.addEventListener("click",e=>{if(e.target.closest("[data-oi-close]"))modal.hidden=true;});
 }
 function render(){
  const unread=items.filter(x=>x.unread).length,mentions=items.filter(x=>x.type==="mention").length,requests=items.filter(x=>x.type==="friend"&&x.unread).length;
  $("#oi-all-count").textContent=items.length;$("#oi-unread-count").textContent=unread;$("#oi-summary-unread").textContent=unread;$("#oi-summary-mentions").textContent=mentions;$("#oi-summary-requests").textContent=requests;
  let rows=items.filter(x=>(tab!=="unread"||x.unread)&&(tab!=="mentions"||x.type==="mention")&&(filter==="all"||x.type===filter));
  $("#oi-list-title").textContent=tab==="unread"?"Unread updates":tab==="mentions"?"Your mentions":"Recent activity";
  $("#oi-list-subtitle").textContent=rows.length+" updates in this view";
  $("#oi-list").innerHTML=rows.length?rows.map(x=>`<article class="oi-item ${x.unread?"is-unread":""}"><span class="oi-avatar oi-${x.avatar}">${esc(x.initial)}</span><div class="oi-item-copy"><div class="oi-item-meta"><b>${esc(x.name)}</b><span>${esc(x.where)}</span><time>${esc(x.time)}</time></div><p>${esc(x.text)}</p><small>${esc(x.detail)}</small></div><div class="oi-item-actions">${x.unread?'<button data-oi-read="'+x.id+'" title="Mark as read" aria-label="Mark as read">✓</button>':'<span class="oi-read-mark">Read</span>'}<button data-oi-dismiss="${x.id}" title="Dismiss" aria-label="Dismiss notification">×</button></div></article>`).join(""):'<div class="oi-empty"><span>✓</span><b>You\'re all caught up</b><p>No updates match this inbox view.</p></div>';
  $("#orbit-inbox-view").querySelectorAll("[data-oi-tab]").forEach(b=>b.classList.toggle("active",b.dataset.oiTab===tab));
 }
 function open(){ensure();tab="all";filter="all";render();$("#orbit-inbox-view").hidden=false;$(".main-header").hidden=true;$(".chat-layout").hidden=true;}
 function close(){const v=$("#orbit-inbox-view");if(v)v.hidden=true;$(".main-header").hidden=false;$(".chat-layout").hidden=false;}
 function toast(msg){let t=$("#orbit-toast");if(!t){t=document.createElement("div");t.id="orbit-toast";t.className="orbit-toast";document.body.appendChild(t);}t.textContent=msg;t.classList.add("visible");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("visible"),2200);}
 function onClick(e){
  const t=e.target.closest("[data-oi-tab]");if(t){tab=t.dataset.oiTab;render();return;}
  const read=e.target.closest("[data-oi-read]");if(read){const x=items.find(x=>x.id===Number(read.dataset.oiRead));if(x)x.unread=false;render();return;}
  const dismiss=e.target.closest("[data-oi-dismiss]");if(dismiss){const i=items.findIndex(x=>x.id===Number(dismiss.dataset.oiDismiss));if(i>=0)items.splice(i,1);render();return;}
  const act=e.target.closest("[data-oi]")?.dataset.oi;if(act==="mark-all"){items.forEach(x=>x.unread=false);render();toast("All notifications marked as read.");}
  if(act==="settings"){$("#oi-settings-layer").hidden=false;}
 }
 document.addEventListener("click",e=>{if(e.target.closest('[aria-label="Notifications"]')||e.target.closest('[aria-label="Inbox"]')){e.preventDefault();open();}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){const modal=$("#oi-settings-layer");if(modal&&!modal.hidden)modal.hidden=true;const v=$("#orbit-inbox-view");if(v&&!v.hidden)close();}});
})();
