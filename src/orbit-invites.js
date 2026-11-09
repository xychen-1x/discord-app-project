// Orbit Screen 17 — Server Invites & Join Flow. Local preview only.
(() => {
 const $=s=>document.querySelector(s);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let invites=[
  {code:"ORBIT-7KQ2",server:"Stargazers",channel:"general",creator:"Aevryn",created:"Just now",expires:"7 days",uses:2,max:25,active:true},
  {code:"ORBIT-M4P9",server:"Pixel Lab",channel:"showcase",creator:"Jules",created:"Yesterday",expires:"Never",uses:8,max:0,active:true},
  {code:"ORBIT-X8D3",server:"Study Room",channel:"study-room",creator:"Nova",created:"Nov 4",expires:"1 day",uses:10,max:10,active:false}
 ];
 let currentServer="Stargazers", tab="create";
 const style=document.createElement("style");
 style.textContent=`
 #orbit-invites-view{position:absolute;z-index:49;inset:0;overflow:auto;padding:30px clamp(16px,4vw,48px) 40px;background:#17191f;color:#e9ebf2}
 #orbit-invites-view[hidden],#oi-modal[hidden]{display:none!important}
 .oi-head{display:flex;justify-content:space-between;gap:16px;margin-bottom:24px}.oi-head small{font-size:9px;letter-spacing:1.5px;color:#98a1b4;font-weight:800}.oi-head h1{font-size:clamp(22px,3vw,30px);margin:7px 0}.oi-head p{font-size:11px;color:#a5acba;margin:0;line-height:1.6}.oi-close{width:36px;height:36px;border:1px solid #414754;border-radius:9px;background:#242831;color:#e2e5ed;font-size:20px}
 .oi-tabs{display:flex;gap:8px;border-bottom:1px solid #343944;margin-bottom:20px}.oi-tab{padding:11px 14px;border:0;border-bottom:2px solid transparent;background:transparent;color:#aeb4c2;font-size:11px;font-weight:700}.oi-tab.active{border-bottom-color:#8c9bf0;color:white}
 .oi-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:18px}.oi-panel,.oi-aside{padding:18px;border:1px solid #363c48;border-radius:11px;background:#20242c}.oi-panel h2,.oi-aside h3{font-size:14px;margin:0 0 7px}.oi-muted{font-size:10px;color:#a5acba;line-height:1.6}.oi-field{display:grid;gap:6px;margin:15px 0;color:#cbd0dc;font-size:10px;font-weight:700}.oi-field select,.oi-field input{width:100%;padding:10px;border:1px solid #444b5a;border-radius:7px;background:#1c2028;color:#f1f2f6;font:inherit;font-size:11px}.oi-check{display:flex;align-items:center;gap:8px;margin:12px 0;color:#bbc2cf;font-size:10px}.oi-primary{padding:10px 14px;border:0;border-radius:7px;background:#6878c8;color:white;font-size:10px;font-weight:750}.oi-secondary{padding:8px 10px;border:1px solid #454c5b;border-radius:6px;background:#292e39;color:#d5dae5;font-size:9px}.oi-linkbox{display:flex;gap:8px;margin-top:16px;padding:10px;border:1px solid #414856;border-radius:8px;background:#191d24}.oi-linkbox code{min-width:0;flex:1;overflow-wrap:anywhere;color:#c9d0ff;font-size:10px}.oi-invite-list{display:grid;gap:9px}.oi-invite{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px;border:1px solid #363c48;border-radius:9px;background:#20242c}.oi-invite b{font-size:11px}.oi-invite small{display:block;margin-top:5px;color:#9ca5b5;font-size:9px;line-height:1.5}.oi-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.oi-badge{padding:4px 7px;border-radius:5px;background:#263e35;color:#9de0bb;font-size:8px}.oi-badge.off{background:#3c3033;color:#e5aeb4}.oi-aside p{font-size:10px;color:#aab1bf;line-height:1.7}.oi-modal{position:fixed;z-index:198;inset:0;display:grid;place-items:center;padding:16px;background:#08090dcc}.oi-dialog{width:min(430px,100%);padding:20px;border:1px solid #4a5060;border-radius:13px;background:#252a34}.oi-dialog h2{font-size:17px;margin:0 0 8px}.oi-dialog p{font-size:10px;color:#aab1bf;line-height:1.6}.oi-dialog input{width:100%;padding:10px;border:1px solid #444b5a;border-radius:7px;background:#1c2028;color:white}
 @media(max-width:760px){.oi-layout{grid-template-columns:1fr}}@media(max-width:560px){#orbit-invites-view{padding:22px 14px 34px}.oi-invite{align-items:flex-start;flex-direction:column}.oi-actions{justify-content:flex-start;width:100%}}
 `;
 document.head.appendChild(style);
 function ensure(){
  if($("#orbit-invites-view"))return;
  const view=document.createElement("section");view.id="orbit-invites-view";view.hidden=true;
  view.innerHTML='<header class="oi-head"><div><small>COMMUNITY ACCESS</small><h1>Server Invites</h1><p>Invite people into your Orbit communities and manage shared invite codes.</p></div><button class="oi-close" data-oi="close" aria-label="Close invites">×</button></header><nav class="oi-tabs"><button class="oi-tab active" data-oi-tab="create">Create Invite</button><button class="oi-tab" data-oi-tab="manage">Manage Invites</button><button class="oi-tab" data-oi-tab="join">Join with Code</button></nav><div id="oi-content"></div>';
  $(".main-panel").appendChild(view);view.addEventListener("click",click);
  view.addEventListener("submit",submit);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#orbit-invites-view").hidden)close();});
  render();
 }
 function render(){
  const c=$("#oi-content");if(!c)return;
  $("#orbit-invites-view").querySelectorAll("[data-oi-tab]").forEach(b=>b.classList.toggle("active",b.dataset.oiTab===tab));
  if(tab==="create")c.innerHTML='<div class="oi-layout"><section class="oi-panel"><h2>Create a server invite</h2><p class="oi-muted">Choose where new members should arrive and how long the invite should remain valid.</p><form id="oi-create-form"><label class="oi-field">Server<select name="server"><option>Stargazers</option><option>Pixel Lab</option><option>Study Room</option></select></label><label class="oi-field">Default channel<select name="channel"><option>general</option><option>introductions</option><option>observations</option><option>study-room</option><option>showcase</option></select></label><label class="oi-field">Expire after<select name="expires"><option>1 day</option><option selected>7 days</option><option>30 days</option><option>Never</option></select></label><label class="oi-field">Maximum uses<select name="max"><option value="1">1 use</option><option value="10">10 uses</option><option value="25" selected>25 uses</option><option value="50">50 uses</option><option value="0">No limit</option></select></label><button class="oi-primary" type="submit">Generate invite</button></form><div id="oi-generated"></div></section><aside class="oi-aside"><h3>Invite tips</h3><p>Only share invite codes with people you want to join this community.</p><p>Use a shorter expiration and lower use limit for temporary events.</p><p>These are simulated preview codes. They do not grant access to a real server.</p></aside></div>';
  else if(tab==="manage")c.innerHTML='<section class="oi-panel"><h2>Active and recent invites</h2><p class="oi-muted">Review invite details, copy a code, or revoke an active invite.</p><div class="oi-invite-list" id="oi-invite-list"></div></section>';
  else c.innerHTML='<section class="oi-panel"><h2>Join a community</h2><p class="oi-muted">Enter an Orbit invite code to preview the join flow.</p><form id="oi-join-form"><label class="oi-field">Invite code<input name="code" maxlength="30" required placeholder="e.g. ORBIT-7KQ2"></label><button class="oi-primary" type="submit">Continue</button></form><div id="oi-join-result"></div></section>';
  if(tab==="manage")renderList();
 }
 function renderList(){
  $("#oi-invite-list").innerHTML=invites.map(i=>'<article class="oi-invite"><div><b>'+esc(i.server)+' · #'+esc(i.channel)+'</b><small>'+esc(i.code)+' · '+esc(i.created)+' · '+esc(i.expires)+' · '+i.uses+'/'+(i.max||"∞")+' uses</small><span class="oi-badge '+(i.active?"":"off")+'">'+(i.active?"ACTIVE":"REVOKED")+'</span></div><div class="oi-actions"><button class="oi-secondary" data-oi-copy="'+esc(i.code)+'">Copy code</button>'+(i.active?'<button class="oi-secondary" data-oi-revoke="'+esc(i.code)+'">Revoke</button>':'')+'</div></article>').join("");
 }
 function submit(e){
  e.preventDefault();const d=new FormData(e.target);
  if(e.target.id==="oi-create-form"){
   const code="ORBIT-"+Math.random().toString(36).slice(2,6).toUpperCase();
   const invite={code,server:String(d.get("server")),channel:String(d.get("channel")),creator:"You",created:"Just now",expires:String(d.get("expires")),uses:0,max:Number(d.get("max")),active:true};
   invites.unshift(invite);const out=$("#oi-generated");
   out.innerHTML='<div class="oi-linkbox"><code>'+esc(code)+'</code><button class="oi-secondary" data-oi-copy="'+esc(code)+'">Copy</button></div><p class="oi-muted">Invite generated for '+esc(invite.server)+'. Manage or revoke it from Manage Invites.</p>';
   return;
  }
  if(e.target.id==="oi-join-form"){
   const code=String(d.get("code")).trim().toUpperCase(),invite=invites.find(i=>i.code===code&&i.active);
   const out=$("#oi-join-result");
   if(!invite){out.innerHTML='<p class="oi-muted">That code was not found or is no longer active in this preview.</p>';return;}
   out.innerHTML='<div class="oi-linkbox"><code>'+esc(invite.server)+'</code><button class="oi-primary" type="button" data-oi-join="'+esc(invite.code)+'">Preview Join</button></div><p class="oi-muted">You will arrive in #'+esc(invite.channel)+'. No real membership will be created.</p>';
  }
 }
 async function copy(code){
  try{await navigator.clipboard.writeText(code);notify("Invite code copied.");}
  catch{const input=document.createElement("textarea");input.value=code;document.body.appendChild(input);input.select();try{document.execCommand("copy");notify("Invite code copied.");}catch{notify("Copy is unavailable. Code: "+code);}input.remove();}
 }
 function click(e){
  const t=e.target.closest("[data-oi-tab]");if(t){tab=t.dataset.oiTab;render();return;}
  const action=e.target.closest("[data-oi]")?.dataset.oi;if(action==="close"){close();return;}
  const cp=e.target.closest("[data-oi-copy]");if(cp){copy(cp.dataset.oiCopy);return;}
  const rv=e.target.closest("[data-oi-revoke]");if(rv){const i=invites.find(x=>x.code===rv.dataset.oiRevoke);if(i)i.active=false;renderList();notify("Invite revoked in this preview.");return;}
  const j=e.target.closest("[data-oi-join]");if(j){const i=invites.find(x=>x.code===j.dataset.oiJoin);if(i){i.uses++;notify("Join preview complete for "+i.server+".");}return;}
 }
 function open(server){ensure();currentServer=server||"Stargazers";tab="create";$("#orbit-invites-view").hidden=false;$(".main-header").hidden=true;$(".chat-layout").hidden=true;render();}
 function close(){const v=$("#orbit-invites-view");if(v)v.hidden=true;$(".main-header").hidden=false;$(".chat-layout").hidden=false;}
 function notify(m){let n=$("#orbit-toast");if(!n){n=document.createElement("div");n.id="orbit-toast";n.className="orbit-toast";n.setAttribute("role","status");document.body.appendChild(n);}n.textContent=m;n.classList.add("visible");clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.classList.remove("visible"),2200);}
 document.addEventListener("orbit:open-invites",e=>open(e.detail?.server));
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure,{once:true});else ensure();
})();