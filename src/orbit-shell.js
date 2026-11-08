// Orbit Screen 1: frontend-only mock interface. No Supabase, auth, or realtime code.
const mock = {
  servers:[{id:"orbit",name:"Orbit",mark:"O",tone:"server-indigo"},{id:"stargazers",name:"Stargazers",mark:"✦",tone:"server-blue"},{id:"pixel",name:"Pixel Lab",mark:"P",tone:"server-pink"},{id:"study",name:"Study Room",mark:"S",tone:"server-green"}],
  dms:[{id:"mika",name:"Mika",initial:"M",avatar:"avatar-mika",unread:2},{id:"kai",name:"Kai",initial:"K",avatar:"avatar-kai"},{id:"nova",name:"Nova",initial:"N",avatar:"avatar-nova"},{id:"team",name:"Orbit Team",initial:"OT",avatar:"avatar-team"}],
  channels:[{id:"general",name:"general",topic:"A place for everything and anything."},{id:"introductions",name:"introductions",topic:"Say hello and introduce yourself."},{id:"media",name:"media-share",topic:"Share what you are creating."},{id:"updates",name:"updates",topic:"Project news and announcements."}],
  members:[{name:"Aevryn",initial:"A",avatar:"avatar-me"},{name:"Mika",initial:"M",avatar:"avatar-mika"},{name:"Kai",initial:"K",avatar:"avatar-kai"},{name:"Nova",initial:"N",avatar:"avatar-nova"}],
  messages:[{author:"Mika",initial:"M",avatar:"avatar-mika",time:"Today at 8:41 PM",text:"Hey everyone! How's the new space looking?"},{author:"Kai",initial:"K",avatar:"avatar-kai",time:"Today at 8:43 PM",text:"The layout is coming together. I like the channel organization."},{author:"Aevryn",initial:"A",avatar:"avatar-me",time:"Today at 8:45 PM",text:"Still polishing the main experience. More screens are coming soon."},{author:"Nova",initial:"N",avatar:"avatar-nova",time:"Today at 8:47 PM",text:"Looking forward to seeing the next update!"}]
};
const $=s=>document.querySelector(s);let activeChannel="general";
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function renderServers(){$("#server-list").innerHTML=mock.servers.map((s,i)=>`<div class="server-item"><button class="server-icon ${s.tone} ${i===0?"active":""}" data-server="${s.id}" title="${esc(s.name)}" aria-label="${esc(s.name)}">${esc(s.mark)}</button><button class="server-more" data-server-menu="${s.id}" aria-label="Options for ${esc(s.name)}" title="Server options">•••</button></div>`).join("");}
function renderDMs(){$("#dm-list").innerHTML=mock.dms.map(d=>`<button class="list-row" data-dm="${d.id}"><span class="avatar ${d.avatar}">${esc(d.initial)}</span><span class="row-name">${esc(d.name)}</span>${d.unread?`<span class="unread-pill">${d.unread}</span>`:""}</button>`).join("");}
function renderChannels(){$("#channel-list").innerHTML=mock.channels.map(c=>`<button class="list-row ${c.id===activeChannel?"active":""}" data-channel="${c.id}"><span class="row-symbol">#</span><span class="row-name">${esc(c.name)}</span></button>`).join("");}
function renderMembers(){$("#member-list").innerHTML=mock.members.map(m=>`<div class="member-row"><span class="avatar ${m.avatar}">${esc(m.initial)}</span><span>${esc(m.name)}</span></div>`).join("");}
function renderMessages(){$("#messages").innerHTML=mock.messages.map(m=>`<article class="message-row"><span class="avatar message-avatar ${m.avatar}">${esc(m.initial)}</span><div class="message-content"><div class="message-meta"><b>${esc(m.author)}</b><time>${esc(m.time)}</time></div><p class="message-text">${esc(m.text)}</p></div></article>`).join("");$("#chat-scroll").scrollTop=$("#chat-scroll").scrollHeight;}
function selectChannel(id){activeChannel=id;const c=mock.channels.find(x=>x.id===id);if(!c)return;$("#header-symbol").textContent="#";$("#header-title").textContent=c.name;$("#header-topic").textContent=c.topic;$("#message-input").placeholder="Message #"+c.name;renderChannels();renderMessages();}
renderServers();renderDMs();renderChannels();renderMembers();renderMessages();
$("#channel-list").addEventListener("click",e=>{const b=e.target.closest("[data-channel]");if(b)selectChannel(b.dataset.channel);});
$("#server-list").addEventListener("click",e=>{const menuButton=e.target.closest("[data-server-menu]");if(menuButton){openServerMenu(menuButton.dataset.serverMenu,menuButton);return;}const b=e.target.closest("[data-server]");if(!b)return;document.querySelectorAll(".server-icon").forEach(x=>x.classList.toggle("active",x===b));});
$("#dm-list").addEventListener("click",e=>{const b=e.target.closest("[data-dm]");if(!b)return;const d=mock.dms.find(x=>x.id===b.dataset.dm);$("#header-symbol").textContent="@";$("#header-title").textContent=d.name;$("#header-topic").textContent="This is the beginning of your direct message history.";$("#message-input").placeholder="Message @"+d.name;});
$("#composer").addEventListener("submit",e=>{e.preventDefault();const input=$("#message-input"),value=input.value.trim();if(!value)return;mock.messages.push({author:"Aevryn",initial:"A",avatar:"avatar-me",time:"Just now",text:value});input.value="";renderMessages();});
function closeSidebar(){$("#side-panel").classList.remove("open");$("#mobile-backdrop").classList.remove("show");}
$("#mobile-open").addEventListener("click",()=>{$("#side-panel").classList.add("open");$("#mobile-backdrop").classList.add("show");});
$("#mobile-close").addEventListener("click",closeSidebar);$("#mobile-backdrop").addEventListener("click",closeSidebar);


// Orbit Screen 2: server context menu and channel visibility controls (mock UI only).
const channelVisibility={text:true,voice:true,categories:true};
let activeServerMenu=null;
function ensureServerMenu(){
  if($("#server-menu-layer"))return;
  const layer=document.createElement("div");
  layer.id="server-menu-layer";
  layer.className="server-menu-layer";
  layer.hidden=true;
  layer.innerHTML=`
    <button class="server-menu-backdrop" data-server-menu-close aria-label="Close server menu"></button>
    <section class="server-menu-card" role="dialog" aria-modal="true" aria-labelledby="server-menu-title">
      <header class="server-menu-header">
        <div><span class="server-menu-eyebrow">SERVER MENU</span><h2 id="server-menu-title">Server options</h2></div>
        <button class="server-menu-close" data-server-menu-close aria-label="Close">×</button>
      </header>
      <div class="server-menu-actions">
        <button class="server-menu-action boost-action" data-server-action="boost"><span class="menu-action-icon">✦</span><span><b>Server Boost</b><small>Unlock more community perks</small></span><span class="menu-chevron">›</span></button>
        <button class="server-menu-action invite-action" data-server-action="invite"><span class="menu-action-icon">↗</span><span><b>Invite People</b><small>Share an invite to this server</small></span><span class="menu-chevron">›</span></button>
        <button class="server-menu-action" data-server-action="settings"><span class="menu-action-icon">⚙</span><span><b>Server Settings</b><small>Manage your server preferences</small></span><span class="menu-chevron">›</span></button>
      </div>
      <div class="server-menu-divider"></div>
      <div class="server-menu-section-heading"><div><b>Channel visibility</b><p>Choose which channel groups appear in the sidebar.</p></div><span class="visibility-label">DISPLAY</span></div>
      <div class="server-visibility-list">
        <label class="visibility-row"><span class="visibility-symbol">#</span><span><b>Text channels</b><small>Chats, announcements and updates</small></span><input type="checkbox" data-channel-visibility="text" checked><i></i></label>
        <label class="visibility-row"><span class="visibility-symbol">◖</span><span><b>Voice channels</b><small>Voice rooms and live conversations</small></span><input type="checkbox" data-channel-visibility="voice" checked><i></i></label>
        <label class="visibility-row"><span class="visibility-symbol">▤</span><span><b>Channel categories</b><small>Group channels by topic</small></span><input type="checkbox" data-channel-visibility="categories" checked><i></i></label>
      </div>
      <footer class="server-menu-footer"><span class="menu-status-dot"></span> Changes are local preview settings</footer>
    </section>`;
  document.body.appendChild(layer);
  layer.addEventListener("click",e=>{
    if(e.target.closest("[data-server-menu-close]"))closeServerMenu();
    const action=e.target.closest("[data-server-action]")?.dataset.serverAction;
    if(action){const labels={boost:"Server Boost screen is planned for a later UI pass.",invite:"Invite flow will be connected after the UI phase.",settings:"Server Settings screen is planned for a later UI pass."};showOrbitToast(labels[action]);}
  });
  layer.addEventListener("change",e=>{
    const key=e.target.dataset.channelVisibility;
    if(!key)return;
    channelVisibility[key]=e.target.checked;
    applyChannelVisibility();
  });
}
function openServerMenu(serverId,trigger){
  ensureServerMenu();
  activeServerMenu=mock.servers.find(s=>s.id===serverId);
  if(!activeServerMenu)return;
  const layer=$("#server-menu-layer"),card=layer.querySelector(".server-menu-card");
  $("#server-menu-title").textContent=activeServerMenu.name+" options";
  layer.hidden=false;
  layer.classList.add("is-open");
  document.body.classList.add("server-menu-open");
  Object.entries(channelVisibility).forEach(([key,value])=>{const input=layer.querySelector('[data-channel-visibility="'+key+'"]');if(input)input.checked=value;});
  if(window.matchMedia("(max-width: 700px)").matches){
    card.style.left="";card.style.top="";card.style.bottom="";
  }else{
    const rect=trigger.getBoundingClientRect();
    card.style.left=Math.min(rect.right+12,window.innerWidth-340)+"px";
    card.style.top=Math.max(12,Math.min(rect.top,window.innerHeight-560))+"px";
    card.style.bottom="";
  }
  layer.querySelector(".server-menu-close").focus();
}
function closeServerMenu(){
  const layer=$("#server-menu-layer");
  if(!layer)return;
  layer.hidden=true;layer.classList.remove("is-open");document.body.classList.remove("server-menu-open");
}
function applyChannelVisibility(){
  document.querySelectorAll(".side-section").forEach(section=>{
    const label=section.querySelector(".section-label")?.textContent||"";
    if(label.includes("TEXT CHANNELS"))section.hidden=!channelVisibility.text;
    if(label.includes("VOICE CHANNELS"))section.hidden=!channelVisibility.voice;
    const heading=section.querySelector(".section-label");
    if(heading)heading.hidden=!channelVisibility.categories;
  });
  document.querySelectorAll(".channel-static").forEach(el=>el.hidden=!channelVisibility.voice);
}
function showOrbitToast(message){
  let toast=$("#orbit-toast");
  if(!toast){toast=document.createElement("div");toast.id="orbit-toast";toast.className="orbit-toast";toast.setAttribute("role","status");document.body.appendChild(toast);}
  toast.textContent=message;toast.classList.add("visible");
  clearTimeout(showOrbitToast.timer);showOrbitToast.timer=setTimeout(()=>toast.classList.remove("visible"),2600);
}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeServerMenu();});
document.querySelectorAll(".server-icon").forEach(button=>button.addEventListener("contextmenu",e=>{e.preventDefault();openServerMenu(button.dataset.server,button);}));
