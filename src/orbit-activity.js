// Orbit Screen 18 — Activity & Status Center. Local preview only.
(() => {
 const $=s=>document.querySelector(s);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const defaults={status:"Online",custom:"",emoji:"",expiry:"Never",showActivity:true,shareGame:true,shareListening:true,shareRecent:true};
 let state={...defaults};try{state={...state,...JSON.parse(localStorage.getItem("orbit-presence-v1")||"{}")};}catch{}
 if(state.expiresAt&&Date.now()>=state.expiresAt){state.custom="";state.emoji="";state.expiresAt=null;}
 else if(state.expiresAt){setTimeout(()=>{state.custom="";state.emoji="";state.expiresAt=null;persist();if($("#orbit-activity-view"))sync();},state.expiresAt-Date.now());}
 const activities=[
  {icon:"✦",name:"Exploring Orbit",detail:"Browsing communities",time:"Active now",type:"Orbit"},
  {icon:"⌘",name:"Learning Python",detail:"Study Room · Focus session",time:"Today",type:"Learning"},
  {icon:"◉",name:"Astronomy watchlist",detail:"Personal activity",time:"Yesterday",type:"Personal"}
 ];
 const style=document.createElement("style");
 style.textContent=`
 #orbit-activity-view{position:absolute;z-index:49;inset:0;overflow:auto;padding:30px clamp(16px,4vw,48px) 42px;background:#17191f;color:#e9ebf2}
 #orbit-activity-view[hidden]{display:none!important}
 .oa-head{display:flex;justify-content:space-between;gap:16px;margin-bottom:23px}.oa-head small{font-size:9px;letter-spacing:1.5px;color:#98a1b4;font-weight:800}.oa-head h1{font-size:clamp(22px,3vw,30px);margin:7px 0}.oa-head p{font-size:11px;color:#a5acba;margin:0;line-height:1.6}.oa-close{width:36px;height:36px;border:1px solid #414754;border-radius:9px;background:#242831;color:#e2e5ed;font-size:20px}
 .oa-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:17px;align-items:start}.oa-main{display:grid;gap:14px}.oa-panel,.oa-side{padding:18px;border:1px solid #363c48;border-radius:11px;background:#20242c}.oa-panel h2,.oa-side h3{font-size:13px;margin:0 0 6px}.oa-muted{font-size:10px;color:#a5acba;line-height:1.65}.oa-status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px}.oa-status{display:flex;align-items:center;gap:8px;padding:10px 8px;border:1px solid #414856;border-radius:8px;background:#252a34;color:#dce1eb;font-size:10px}.oa-status.active{border-color:#8794e8;background:#303752}.oa-dot{width:9px;height:9px;border-radius:50%;background:#3ba878}.oa-dot.idle{background:#e3b34c}.oa-dot.dnd{background:#df626a}.oa-dot.invisible{background:#8991a0}
 .oa-field{display:grid;gap:6px;margin:12px 0;color:#cbd0dc;font-size:10px;font-weight:700}.oa-field input,.oa-field select{width:100%;padding:10px;border:1px solid #444b5a;border-radius:7px;background:#1c2028;color:#f1f2f6;font:inherit;font-size:11px}.oa-row{display:grid;grid-template-columns:1fr 120px;gap:9px}.oa-primary{padding:9px 13px;border:0;border-radius:7px;background:#6878c8;color:white;font-size:10px;font-weight:750}.oa-secondary{padding:8px 10px;border:1px solid #454c5b;border-radius:6px;background:#292e39;color:#d5dae5;font-size:9px}.oa-toggle{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:12px 0;border-bottom:1px solid #373d49;color:#d2d7e1;font-size:10px}.oa-toggle:last-child{border-bottom:0}.oa-toggle small{display:block;margin-top:4px;color:#939cab;font-size:9px}.oa-toggle input{width:16px;height:16px;accent-color:#7c8be0}
 .oa-activity{display:flex;align-items:center;gap:11px;padding:12px 0;border-bottom:1px solid #373d49}.oa-activity:last-child{border-bottom:0}.oa-activity-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;background:#343d59;color:#dce2ff;font-size:16px}.oa-activity b{font-size:10px}.oa-activity small{display:block;margin-top:4px;color:#9ba4b4;font-size:9px}.oa-side p{font-size:10px;color:#aab1bf;line-height:1.7}.oa-preview{margin-top:14px;padding:13px;border:1px solid #414856;border-radius:9px;background:#1b1f27}.oa-preview b{font-size:11px}.oa-preview small{display:block;margin-top:5px;color:#9ba4b4;font-size:9px}
 @media(max-width:850px){.oa-layout{grid-template-columns:1fr}.oa-side{display:grid;grid-template-columns:1fr 1fr;gap:12px}.oa-side h3{grid-column:1/-1}}
 @media(max-width:560px){#orbit-activity-view{padding:22px 14px 34px}.oa-status-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.oa-panel,.oa-side{padding:14px}.oa-side{display:block}.oa-row{grid-template-columns:1fr 100px}}
 `;
 document.head.appendChild(style);
 function ensure(){
  if($("#orbit-activity-view"))return;
  const view=document.createElement("section");view.id="orbit-activity-view";view.hidden=true;
  view.innerHTML='<header class="oa-head"><div><small>PRESENCE & PERSONAL ACTIVITY</small><h1>Activity & Status</h1><p>Control how you appear to others and choose what activity information you share.</p></div><button class="oa-close" data-oa="close" aria-label="Close activity and status">×</button></header><div class="oa-layout"><main class="oa-main"><section class="oa-panel"><h2>Set your status</h2><p class="oa-muted">Your status helps friends understand whether you are available.</p><div class="oa-status-grid"><button class="oa-status" data-status="Online"><i class="oa-dot"></i> Online</button><button class="oa-status" data-status="Idle"><i class="oa-dot idle"></i> Idle</button><button class="oa-status" data-status="Do Not Disturb"><i class="oa-dot dnd"></i> Do Not Disturb</button><button class="oa-status" data-status="Invisible"><i class="oa-dot invisible"></i> Invisible</button></div><label class="oa-field">Custom status<div class="oa-row"><input id="oa-emoji" maxlength="4" placeholder="Emoji" aria-label="Status emoji"><input id="oa-custom" maxlength="100" placeholder="What are you up to?"></div></label><label class="oa-field">Clear custom status after<select id="oa-expiry"><option>Never</option><option>30 minutes</option><option>1 hour</option><option>4 hours</option><option>Today</option></select></label><button class="oa-primary" data-oa="save">Save status</button> <button class="oa-secondary" data-oa="clear">Clear custom status</button></section><section class="oa-panel"><h2>Activity privacy</h2><p class="oa-muted">Choose what activity details can appear on your profile and in friend views.</p><label class="oa-toggle"><span>Share activity status<small>Allow friends to see a summary of what you are doing.</small></span><input type="checkbox" id="oa-show"></label><label class="oa-toggle"><span>Share game activity<small>Show supported games when detected.</small></span><input type="checkbox" id="oa-game"></label><label class="oa-toggle"><span>Share listening activity<small>Show supported music activity.</small></span><input type="checkbox" id="oa-listening"></label><label class="oa-toggle"><span>Show recent activity<small>Display recent activity cards on your profile.</small></span><input type="checkbox" id="oa-recent"></label></section><section class="oa-panel"><h2>Recent activity</h2><p class="oa-muted">A preview of activity cards visible to friends when sharing is enabled.</p><div id="oa-activities"></div></section></main><aside class="oa-side"><section><h3>Profile preview</h3><div class="oa-preview"><b id="oa-preview-name">Aevryn</b><small id="oa-preview-status">Online · No custom status</small></div><p>Your status and activity visibility are separate. Invisible hides your online presence in this preview; privacy controls determine which activity cards are shown.</p></section><section><h3>About presence</h3><p>Online, Idle, Do Not Disturb, and Invisible are simulated in this frontend preview. They do not currently broadcast to other users.</p><p>Activity cards below are sample content and do not represent live device activity.</p></section></aside></div>';
  $(".main-panel").appendChild(view);view.addEventListener("click",click);
  document.querySelector('[data-view="Activity"]')?.addEventListener("click",open);
  sync();renderActivities();
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!view.hidden)close();});
 }
 function persist(){try{localStorage.setItem("orbit-presence-v1",JSON.stringify(state));}catch{}}
 function expiryTime(value){return value==="30 minutes"?1800000:value==="1 hour"?3600000:value==="4 hours"?14400000:value==="Today"?Math.max(60000,new Date().setHours(23,59,59,999)-Date.now()):0;}
 function sync(){
  $("#orbit-activity-view").querySelectorAll("[data-status]").forEach(b=>b.classList.toggle("active",b.dataset.status===state.status));
  $("#oa-emoji").value=state.emoji;$("#oa-custom").value=state.custom;$("#oa-expiry").value=state.expiry;
  $("#oa-show").checked=state.showActivity;$("#oa-game").checked=state.shareGame;$("#oa-listening").checked=state.shareListening;$("#oa-recent").checked=state.shareRecent;
  $("#oa-preview-status").textContent=state.status+(state.custom?" · "+state.emoji+" "+state.custom:" · No custom status");
  const small=document.querySelector("#dock-profile .dock-user small");if(small)small.textContent=state.status;
  const dot=document.querySelector("#dock-profile .online-dot");if(dot){dot.style.background=state.status==="Online"?"#3ba878":state.status==="Idle"?"#e3b34c":state.status==="Do Not Disturb"?"#df626a":"#8991a0";}
 }
 function renderActivities(){
  const show=state.showActivity&&state.shareRecent;
  $("#oa-activities").innerHTML=show?activities.filter(a=>(a.type!=="Learning"||state.shareGame)&&(a.type!=="Personal"||state.shareListening)).map(a=>'<article class="oa-activity"><span class="oa-activity-icon">'+esc(a.icon)+'</span><div><b>'+esc(a.name)+'</b><small>'+esc(a.detail)+' · '+esc(a.time)+'</small></div></article>').join(""):'<p class="oa-muted">Recent activity is hidden by your privacy settings.</p>';
 }
 function open(){ensure();$("#orbit-activity-view").hidden=false;$(".main-header").hidden=true;$(".chat-layout").hidden=true;sync();renderActivities();}
 function close(){const v=$("#orbit-activity-view");if(v)v.hidden=true;$(".main-header").hidden=false;$(".chat-layout").hidden=false;}
 function click(e){
  const action=e.target.closest("[data-oa]")?.dataset.oa;
  if(action==="close"){close();return;}
  if(action==="save"){state.emoji=$("#oa-emoji").value.trim();state.custom=$("#oa-custom").value.trim();state.expiry=$("#oa-expiry").value;const duration=expiryTime(state.expiry);state.expiresAt=duration?Date.now()+duration:null;if(duration)setTimeout(()=>{state.custom="";state.emoji="";state.expiresAt=null;persist();if($("#orbit-activity-view"))sync();notify("Custom status expired.");},duration);persist();sync();notify("Status saved in this preview.");return;}
  if(action==="clear"){state.emoji="";state.custom="";state.expiresAt=null;$("#oa-emoji").value="";$("#oa-custom").value="";persist();sync();notify("Custom status cleared.");return;}
  const b=e.target.closest("[data-status]");if(b){state.status=b.dataset.status;persist();sync();notify("Presence updated in this preview.");return;}
  const toggles={"oa-show":"showActivity","oa-game":"shareGame","oa-listening":"shareListening","oa-recent":"shareRecent"};
  if(toggles[e.target.id]){state[toggles[e.target.id]]=e.target.checked;persist();renderActivities();}
 }
 function notify(m){let n=$("#orbit-toast");if(!n){n=document.createElement("div");n.id="orbit-toast";n.className="orbit-toast";n.setAttribute("role","status");document.body.appendChild(n);}n.textContent=m;n.classList.add("visible");clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.classList.remove("visible"),2200);}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure,{once:true});else ensure();
})();