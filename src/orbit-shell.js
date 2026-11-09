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
        <button class="server-menu-action" data-server-action="moderation"><span class="menu-action-icon">◆</span><span><b>Moderation Center</b><small>Review reports and member safety</small></span><span class="menu-chevron">›</span></button>
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
    if(action){const labels={boost:"Server Boost screen is planned for a later UI pass.",invite:"Invite flow will be connected after the UI phase.",settings:""};if(action==="moderation"){closeServerMenu();document.dispatchEvent(new CustomEvent("orbit:open-moderation"));}else if(action==="settings"){closeServerMenu();openPermissionsScreen();}else showOrbitToast(labels[action]);}
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


// Orbit Screen 3: advanced server permissions (frontend mock only).
const permissionState = {
  selectedRole:"moderator",
  mode:"basic",
  roles:[
    {id:"admin",name:"Admin",color:"#e5a84b",members:2},
    {id:"moderator",name:"Moderator",color:"#58a6d8",members:4},
    {id:"member",name:"Member",color:"#8b91a1",members:18},
    {id:"guest",name:"Guest",color:"#8d75c7",members:3}
  ],
  values:{
    admin:{manageServer:true,manageRoles:true,manageChannels:true,kickMembers:true,banMembers:true,manageMessages:true,mentionEveryone:true,viewChannels:true,sendMessages:true,attachFiles:true,connectVoice:true,speak:true},
    moderator:{manageServer:false,manageRoles:false,manageChannels:true,kickMembers:true,banMembers:false,manageMessages:true,mentionEveryone:false,viewChannels:true,sendMessages:true,attachFiles:true,connectVoice:true,speak:true},
    member:{manageServer:false,manageRoles:false,manageChannels:false,kickMembers:false,banMembers:false,manageMessages:false,mentionEveryone:false,viewChannels:true,sendMessages:true,attachFiles:true,connectVoice:true,speak:true},
    guest:{manageServer:false,manageRoles:false,manageChannels:false,kickMembers:false,banMembers:false,manageMessages:false,mentionEveryone:false,viewChannels:true,sendMessages:false,attachFiles:false,connectVoice:true,speak:false}
  }
};
const permissionGroups=[
  {title:"General permissions",items:[["viewChannels","View channels"],["manageChannels","Manage channels"],["manageServer","Manage server"],["manageRoles","Manage roles"]]},
  {title:"Membership",items:[["kickMembers","Kick members"],["banMembers","Ban members"]]},
  {title:"Text channel permissions",items:[["sendMessages","Send messages"],["manageMessages","Manage messages"],["attachFiles","Attach files"],["mentionEveryone","Mention @everyone, @here and all roles"]]},
  {title:"Voice channel permissions",items:[["connectVoice","Connect"],["speak","Speak"]]}
];
function ensurePermissionsScreen(){
  if($("#permissions-layer"))return;
  const layer=document.createElement("div");
  layer.id="permissions-layer";layer.className="permissions-layer";layer.hidden=true;
  layer.innerHTML=`
    <button class="permissions-backdrop" data-permissions-close aria-label="Close permissions"></button>
    <section class="permissions-window" role="dialog" aria-modal="true" aria-labelledby="permissions-title">
      <aside class="permissions-sidebar">
        <div class="permissions-side-top"><span class="permissions-eyebrow">SERVER SETTINGS</span><h2 id="permissions-title">Roles &amp; permissions</h2><p>Control what each role can do in this server.</p></div>
        <div class="permissions-role-heading">ROLES <button type="button" data-add-role>＋</button></div>
        <div class="permissions-role-list" id="permissions-role-list"></div>
        <div class="permissions-side-footer">Preview mode · Changes are not saved</div>
      </aside>
      <div class="permissions-main">
        <header class="permissions-main-header"><div><span class="permissions-eyebrow">ROLE CONFIGURATION</span><h3 id="permissions-role-title">Moderator</h3></div><button class="permissions-close" data-permissions-close aria-label="Close">×</button></header>
        <div class="permissions-toolbar"><div class="permissions-mode-switch" role="group" aria-label="Permission detail"><button type="button" data-permission-mode="basic" class="active">Basic</button><button type="button" data-permission-mode="advanced">Advanced</button></div><span class="permissions-mode-note" id="permissions-mode-note">Essential role permissions</span></div>
        <div class="permissions-content" id="permissions-content"></div>
        <footer class="permissions-footer"><span><i></i> Local preview only</span><div><button type="button" class="permissions-cancel" data-permissions-close>Close</button><button type="button" class="permissions-save" data-permissions-save>Save preview</button></div></footer>
      </div>
    </section>`;
  document.body.appendChild(layer);
  layer.addEventListener("click",e=>{
    if(e.target.closest("[data-permissions-close]"))closePermissionsScreen();
    if(e.target.closest("[data-add-role]"))showOrbitToast("Role creation will be added in a later UI pass.");
    const role=e.target.closest("[data-role-id]")?.dataset.roleId;
    if(role){permissionState.selectedRole=role;renderPermissionsScreen();}
    const mode=e.target.closest("[data-permission-mode]")?.dataset.permissionMode;
    if(mode){permissionState.mode=mode;renderPermissionsScreen();}
    if(e.target.closest("[data-permissions-save]"))showOrbitToast("Preview updated locally. Nothing has been saved to the server.");
  });
  layer.addEventListener("change",e=>{
    const key=e.target.dataset.permissionKey;
    if(!key)return;
    permissionState.values[permissionState.selectedRole][key]=e.target.checked;
  });
}
function renderPermissionsScreen(){
  const layer=$("#permissions-layer");if(!layer)return;
  const role=permissionState.roles.find(r=>r.id===permissionState.selectedRole)||permissionState.roles[0];
  $("#permissions-role-title").textContent=role.name;
  $("#permissions-role-list").innerHTML=permissionState.roles.map(r=>`<button type="button" class="permissions-role ${r.id===role.id?"selected":""}" data-role-id="${r.id}"><span class="role-color" style="--role-color:${r.color}"></span><span>${esc(r.name)}</span><small>${r.members}</small></button>`).join("");
  document.querySelectorAll("[data-permission-mode]").forEach(b=>b.classList.toggle("active",b.dataset.permissionMode===permissionState.mode));
  $("#permissions-mode-note").textContent=permissionState.mode==="basic"?"Essential role permissions":"Full permission controls";
  const visibleGroups=permissionState.mode==="basic"?permissionGroups.filter(g=>["General permissions","Membership","Text channel permissions"].includes(g.title)):permissionGroups;
  $("#permissions-content").innerHTML=visibleGroups.map(group=>`<section class="permission-group"><h4>${group.title}</h4>${group.items.map(([key,label])=>`<label class="permission-row"><span><b>${label}</b><small>${permissionDescriptions[key]||"Allow this role to use this permission."}</small></span><input type="checkbox" data-permission-key="${key}" ${permissionState.values[role.id][key]?"checked":""}><i></i></label>`).join("")}</section>`).join("");
}
const permissionDescriptions={
  viewChannels:"Lets members view channels they have access to.",
  manageChannels:"Lets members create, edit and delete channels.",
  manageServer:"Lets members change server settings and configuration.",
  manageRoles:"Lets members create and edit roles below their own role.",
  kickMembers:"Lets members remove people from this server.",
  banMembers:"Lets members ban people from this server.",
  sendMessages:"Lets members send messages in text channels.",
  manageMessages:"Lets members delete or pin other members' messages.",
  attachFiles:"Lets members upload files and images.",
  mentionEveryone:"Lets members use @everyone, @here and role mentions.",
  connectVoice:"Lets members join voice channels.",
  speak:"Lets members speak in voice channels."
};
function openPermissionsScreen(){ensurePermissionsScreen();renderPermissionsScreen();const layer=$("#permissions-layer");layer.hidden=false;layer.classList.add("is-open");document.body.classList.add("permissions-open");layer.querySelector(".permissions-close").focus();}
function closePermissionsScreen(){const layer=$("#permissions-layer");if(!layer)return;layer.hidden=true;layer.classList.remove("is-open");document.body.classList.remove("permissions-open");}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closePermissionsScreen();});


// Orbit Screen 4: user profile modal (frontend mock only).
const profileMock={
  name:"Aevryn",username:"aevryn",pronouns:"",status:"Online",
  bio:"Building ideas, exploring technology, and learning something new every day.",
  joined:"November 2026",connections:[
    {label:"GitHub",value:"Connected account",icon:"⌘"},
    {label:"Orbit",value:"Community member",icon:"◈"}
  ]
};
let activeProfileTab="about";
function ensureProfileModal(){
  if($("#profile-modal-layer"))return;
  const layer=document.createElement("div");layer.id="profile-modal-layer";layer.className="profile-modal-layer";layer.hidden=true;
  layer.innerHTML=`
    <button class="profile-modal-backdrop" data-profile-close aria-label="Close profile"></button>
    <section class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-display-name">
      <button class="profile-modal-x" data-profile-close aria-label="Close">×</button>
      <div class="profile-banner"><div class="profile-banner-glow"></div><span class="profile-banner-label">ORBIT MEMBER</span></div>
      <div class="profile-identity">
        <div class="profile-avatar-wrap"><span class="profile-avatar">A</span><i class="profile-online-dot"></i></div>
        <div class="profile-actions"><button type="button" class="profile-message" data-profile-action="message">Message</button><button type="button" class="profile-more" data-profile-action="more" aria-label="More profile actions">•••</button></div>
      </div>
      <div class="profile-body">
        <div class="profile-name-block"><h2 id="profile-display-name">Aevryn</h2><p id="profile-username">@aevryn</p><span class="profile-status"><i></i> Online</span></div>
        <div class="profile-tabs" role="tablist" aria-label="Profile sections">
          <button type="button" role="tab" data-profile-tab="about" class="active" aria-selected="true">About me</button>
          <button type="button" role="tab" data-profile-tab="connections" aria-selected="false">Connections</button>
        </div>
        <div id="profile-tab-content" class="profile-tab-content"></div>
        <footer class="profile-modal-footer"><span>Member since November 2026</span><button type="button" data-profile-close>Close</button></footer>
      </div>
    </section>`;
  document.body.appendChild(layer);
  layer.addEventListener("click",e=>{
    if(e.target.closest("[data-profile-close]"))closeProfileModal();
    const tab=e.target.closest("[data-profile-tab]")?.dataset.profileTab;
    if(tab){activeProfileTab=tab;renderProfileTab();}
    const action=e.target.closest("[data-profile-action]")?.dataset.profileAction;
    if(action==="message"){closeProfileModal();showOrbitToast("Messaging is a mock preview until backend integration.");}
    if(action==="more")showOrbitToast("More profile actions will be added in a later UI pass.");
  });
}
function renderProfileTab(){
  const content=$("#profile-tab-content");if(!content)return;
  document.querySelectorAll("[data-profile-tab]").forEach(b=>{const active=b.dataset.profileTab===activeProfileTab;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
  if(activeProfileTab==="about"){
    content.innerHTML=`<section class="profile-info-card"><h3>ABOUT ME</h3><p>${esc(profileMock.bio)}</p></section><section class="profile-info-card profile-details"><h3>MEMBER DETAILS</h3><div><span>Username</span><b>@${esc(profileMock.username)}</b></div><div><span>Status</span><b>${esc(profileMock.status)}</b></div><div><span>Joined Orbit</span><b>${esc(profileMock.joined)}</b></div></section>`;
  }else{
    content.innerHTML=`<section class="profile-info-card"><h3>CONNECTED ACCOUNTS</h3><div class="profile-connections">${profileMock.connections.map(c=>`<div class="profile-connection"><span class="connection-icon">${esc(c.icon)}</span><span><b>${esc(c.label)}</b><small>${esc(c.value)}</small></span><span class="connection-check">✓</span></div>`).join("")}</div></section><p class="profile-connection-note">Connections shown here are sample profile data.</p>`;
  }
}
function openProfileModal(){ensureProfileModal();activeProfileTab="about";renderProfileTab();const layer=$("#profile-modal-layer");layer.hidden=false;layer.classList.add("is-open");document.body.classList.add("profile-modal-open");layer.querySelector(".profile-modal-x").focus();}
function closeProfileModal(){const layer=$("#profile-modal-layer");if(!layer)return;layer.hidden=true;layer.classList.remove("is-open");document.body.classList.remove("profile-modal-open");}
$("#dock-profile")?.addEventListener("click",openProfileModal);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeProfileModal();});


// Orbit Screen 5: Friends & Social Hub (frontend mock only).
const friendsMock=[
 {id:"mika",name:"Mika",tag:"mika_07",initial:"M",avatar:"avatar-mika",status:"online",activity:"Playing Stardew Valley",note:"Usually around in the evening"},
 {id:"kai",name:"Kai",tag:"kai_dev",initial:"K",avatar:"avatar-kai",status:"online",activity:"Exploring Orbit",note:""},
 {id:"nova",name:"Nova",tag:"nova.star",initial:"N",avatar:"avatar-nova",status:"idle",activity:"Listening to music",note:""},
 {id:"jules",name:"Jules",tag:"jules_art",initial:"J",avatar:"avatar-jules",status:"offline",activity:"Last seen recently",note:""},
 {id:"ren",name:"Ren",tag:"ren.exe",initial:"R",avatar:"avatar-team",status:"offline",activity:"Last seen yesterday",note:""}
];
let friendsTab="online";
function ensureFriendsView(){
 if($("#friends-view"))return;
 const view=document.createElement("section");view.id="friends-view";view.className="friends-view";view.hidden=true;
 view.innerHTML=`
  <header class="friends-header"><div class="friends-heading"><span class="friends-heading-icon">♧</span><h2>Friends</h2><span class="friends-divider"></span><nav class="friends-tabs"><button data-friends-tab="online" class="active">Online</button><button data-friends-tab="all">All</button><button data-friends-tab="pending">Pending</button><button data-friends-tab="add" class="friends-add-tab">Add Friend</button></nav></div><button class="friends-inbox" type="button" aria-label="Inbox">▣</button></header>
  <div class="friends-content"><div class="friends-main"><div class="friends-page-title"><div><h1 id="friends-title">Online Friends</h1><p id="friends-subtitle">See who's around and start a conversation.</p></div><span class="friends-count" id="friends-count">2 ONLINE</span></div>
   <div id="friends-add-form" class="friends-add-form" hidden><h3>ADD FRIEND</h3><p>You can add friends using their Orbit username.</p><form id="friends-add-submit"><input id="friends-username" autocomplete="off" placeholder="Enter a username, e.g. orbit_user" maxlength="32"><button type="submit">Send Friend Request</button></form><small>For this preview, requests are simulated locally.</small></div>
   <div id="friends-list" class="friends-list"></div>
  </div><aside class="friends-activity"><h3>ACTIVE NOW</h3><p class="friends-activity-intro">See what your friends are up to.</p><div class="friends-activity-card"><span class="avatar avatar-mika">M<i class="online-dot"></i></span><div><b>Mika</b><small>Playing Stardew Valley</small><small class="activity-time">Active now</small></div></div><div class="friends-activity-card"><span class="avatar avatar-kai">K<i class="online-dot"></i></span><div><b>Kai</b><small>Exploring Orbit</small><small class="activity-time">Active now</small></div></div><div class="friends-activity-empty">When friends start activities, you'll see them here.</div></aside></div>`;
 $(".main-panel")?.appendChild(view);
 view.addEventListener("click",e=>{
  const tab=e.target.closest("[data-friends-tab]")?.dataset.friendsTab;
  if(tab){friendsTab=tab;renderFriendsView();}
  const action=e.target.closest("[data-friend-action]")?.dataset.friendAction;
  const id=e.target.closest("[data-friend-id]")?.dataset.friendId;
  if(action==="message"){const friend=friendsMock.find(x=>x.id===id);if(friend){closeFriendsView();const d=mock.dms.find(x=>x.id===id);if(d){document.querySelector('[data-dm="'+id+'"]')?.click();}else showOrbitToast("Direct message preview for "+friend.name+" will be added in a later pass.");}}
  if(action==="more")showOrbitToast("Friend options will be added in a later UI pass.");
  const pending=e.target.closest("[data-pending-action]")?.dataset.pendingAction;
  if(pending)showOrbitToast(pending==="accept"?"Request accepted in local preview.":"Request ignored in local preview.");
 });
 $("#friends-add-submit").addEventListener("submit",e=>{e.preventDefault();const input=$("#friends-username"),name=input.value.trim();if(!name)return;showOrbitToast("Friend request to @"+name+" simulated locally.");input.value="";});
}
function renderFriendsView(){
 ensureFriendsView();
 const view=$("#friends-view");view.hidden=false;
 document.querySelectorAll("[data-friends-tab]").forEach(b=>b.classList.toggle("active",b.dataset.friendsTab===friendsTab));
 const titles={online:["Online Friends","See who's around and start a conversation."],all:["All Friends","Everyone you've added on Orbit."],pending:["Pending Requests","Review incoming and outgoing friend requests."],add:["Add a Friend","Connect with people on Orbit."]};
 $("#friends-title").textContent=titles[friendsTab][0];$("#friends-subtitle").textContent=titles[friendsTab][1];
 $("#friends-add-form").hidden=friendsTab!=="add";
 const list=$("#friends-list");const count=$("#friends-count");
 count.textContent=friendsTab==="online"?"2 ONLINE":friendsTab==="all"?friendsMock.length+" FRIENDS":friendsTab==="pending"?"2 PENDING":"";
 if(friendsTab==="add"){list.innerHTML='<div class="friends-empty"><span>＋</span><b>Find your people</b><p>Enter an Orbit username above to send a friend request.</p></div>';return;}
 if(friendsTab==="pending"){list.innerHTML='<div class="friends-pending-card"><div class="pending-avatar">S</div><div><b>Skyline</b><small>Incoming friend request · @skyline</small></div><div class="pending-actions"><button data-pending-action="accept">Accept</button><button data-pending-action="ignore">Ignore</button></div></div><div class="friends-pending-card"><div class="pending-avatar outgoing">T</div><div><b>Taylor</b><small>Outgoing friend request · @taylor</small></div><span class="pending-waiting">Pending</span></div>';return;}
 const rows=friendsMock.filter(f=>friendsTab==="all"||f.status==="online"||f.status==="idle");
 list.innerHTML=rows.length?rows.map(f=>'<article class="friend-row" data-friend-id="'+f.id+'"><span class="avatar '+f.avatar+'">'+esc(f.initial)+'<i class="friend-status-dot '+f.status+'"></i></span><div class="friend-row-info"><b>'+esc(f.name)+'</b><small>@'+esc(f.tag)+' · '+esc(f.activity)+'</small></div><span class="friend-presence '+f.status+'">'+(f.status==="online"?"Online":f.status==="idle"?"Idle":"Offline")+'</span><div class="friend-row-actions"><button type="button" data-friend-action="message" data-friend-id="'+f.id+'" aria-label="Message '+esc(f.name)+'">▤</button><button type="button" data-friend-action="more" data-friend-id="'+f.id+'" aria-label="More options">•••</button></div></article>').join(""):'<div class="friends-empty">No friends to show here yet.</div>';
}
function openFriendsView(){renderFriendsView();$("#friends-view").hidden=false;closeSidebar();}
function closeFriendsView(){const v=$("#friends-view");if(v)v.hidden=true;}
document.querySelector('[data-view="Friends"]')?.addEventListener("click",openFriendsView);
document.querySelector('[data-view="Nitro"]')?.addEventListener("click",()=>showOrbitToast("Discover will be designed in a later UI pass."));
document.querySelector('[data-view="Shop"]')?.addEventListener("click",()=>showOrbitToast("Orbit Shop will be designed in a later UI pass."));


// Orbit Screen 11: Voice Channels & Live Rooms (frontend mock only).
// This screen does not access microphones, cameras, screen capture, Supabase, or realtime services.
(() => {
  const rooms = [
    {id:"lounge",name:"Lounge",type:"voice",topic:"Open conversation",count:7,people:["Mika","Kai","Nova","Jules","Ren"]},
    {id:"focus",name:"Focus Room",type:"voice",topic:"Quiet co-working",count:3,people:["Mika","Ren"]},
    {id:"hangout",name:"Late Night Hangout",type:"voice",topic:"Relax and chat",count:0,people:[]},
    {id:"stage",name:"Creator Q&A",type:"stage",topic:"Community stage event",count:12,people:["Nova","Mika","Kai"]}
  ];
  const people = [
    {name:"Aevryn",initial:"A",role:"You",tone:"self"},
    {name:"Mika",initial:"M",role:"Member",tone:"violet"},
    {name:"Kai",initial:"K",role:"Member",tone:"blue"},
    {name:"Nova",initial:"N",role:"Speaker",tone:"pink"},
    {name:"Jules",initial:"J",role:"Member",tone:"green"},
    {name:"Ren",initial:"R",role:"Member",tone:"amber"}
  ];
  const state = {room:"lounge",joined:false,muted:false,deafened:false,camera:false,sharing:false};
  const $v = (s,r=document) => r.querySelector(s);
  const safe = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const currentRoom = () => rooms.find(r=>r.id===state.room) || rooms[0];
  function toastVoice(message){
    let t=$v("#orbit-toast");
    if(!t){t=document.createElement("div");t.id="orbit-toast";t.className="orbit-toast";t.setAttribute("role","status");document.body.appendChild(t);}
    t.textContent=message;t.classList.add("visible");clearTimeout(toastVoice.timer);toastVoice.timer=setTimeout(()=>t.classList.remove("visible"),2400);
  }
  function ensureVoice(){
    if($v("#orbit-voice-view"))return;
    const style=document.createElement("style");style.id="orbit-voice-style";
    style.textContent=[
      ".ov-view{position:absolute;inset:56px 0 0;z-index:25;display:flex;flex-direction:column;background:#23252b;color:#e7e9ef;overflow:auto}",
      ".ov-view[hidden]{display:none}.ov-top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:20px 24px;border-bottom:1px solid #393b44;background:#272930}",
      ".ov-top h1{margin:5px 0;font-size:22px}.ov-top p{margin:0;color:#a8adba;font-size:11px}.ov-eyebrow{color:#9299a8;font-size:9px;font-weight:800;letter-spacing:1.5px}",
      ".ov-top-actions{display:flex;align-items:center;gap:10px}.ov-preview{padding:6px 9px;border:1px solid #4a4d59;border-radius:20px;color:#c0c5d1;font-size:8px}.ov-close{width:34px;height:34px;border:1px solid #484b55;border-radius:8px;background:#30323a;color:#c9ced8;font-size:19px}",
      ".ov-layout{display:grid;grid-template-columns:240px minmax(0,1fr) 210px;flex:1}.ov-sidebar,.ov-right{padding:17px 12px;background:#25272d}.ov-sidebar{border-right:1px solid #383a43}.ov-right{border-left:1px solid #383a43}",
      ".ov-label{padding:0 7px 10px;color:#a7adba;font-size:9px;font-weight:800;letter-spacing:1px}.ov-room{display:flex;align-items:center;gap:9px;width:100%;padding:10px 8px;border:0;border-radius:8px;background:transparent;color:#c8ccd5;text-align:left}.ov-room:hover,.ov-room.active{background:#363943;color:white}.ov-room-icon{display:grid;place-items:center;width:29px;height:29px;border-radius:8px;background:#41445a;color:#c2caff}.ov-room-copy{display:grid;gap:3px;min-width:0;flex:1}.ov-room-copy b{font-size:10px}.ov-room-copy small{color:#9299a8;font-size:8px}.ov-room-count{color:#aab0bd;font-size:9px}.ov-main{display:flex;flex-direction:column;min-width:0;padding:20px}.ov-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:17px}.ov-heading h2{margin:0 0 5px;font-size:18px}.ov-heading p{margin:0;color:#9ca3b1;font-size:10px}.ov-live{padding:6px 9px;border:1px solid #3f5c50;border-radius:20px;background:#293a33;color:#9fe0bd;font-size:8px}",
      ".ov-stage{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;padding:12px;border:1px solid #4c4162;border-radius:9px;background:#393047}.ov-stage b{font-size:10px}.ov-stage p{margin:4px 0 0;color:#b8adc9;font-size:9px}.ov-stage button{padding:8px 10px;border-radius:6px;background:#8b6ac4;color:white;font-size:9px}",
      ".ov-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ov-person{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:138px;padding:12px 6px;border:1px solid #3e414b;border-radius:10px;background:linear-gradient(145deg,#30333c,#292b32)}.ov-person.speaking{border-color:#6578db;box-shadow:0 0 0 1px #6578db33}.ov-avatar{display:grid;place-items:center;width:54px;height:54px;margin-bottom:8px;border:3px solid #454956;border-radius:50%;background:#4b5270;color:white;font-size:18px;font-weight:800}.ov-avatar.self{background:linear-gradient(145deg,#5865f2,#8a75dd)}.ov-avatar.violet{background:linear-gradient(145deg,#7655a8,#a77bd2)}.ov-avatar.blue{background:linear-gradient(145deg,#3d709e,#67a5d5)}.ov-avatar.pink{background:linear-gradient(145deg,#a35c85,#d78bad)}.ov-avatar.green{background:linear-gradient(145deg,#3c846f,#6bb79a)}.ov-avatar.amber{background:linear-gradient(145deg,#9a7442,#d4a45e)}.ov-name{font-size:10px}.ov-role{margin-top:3px;color:#969dab;font-size:8px}.ov-speaking-bars{display:flex;gap:2px;height:9px;margin-top:5px}.ov-speaking-bars i{width:3px;border-radius:3px;background:#83a1ff}.ov-speaking-bars i:nth-child(1){height:4px}.ov-speaking-bars i:nth-child(2){height:9px}.ov-speaking-bars i:nth-child(3){height:6px}",
      ".ov-empty{grid-column:1/-1;display:grid;place-items:center;min-height:190px;padding:20px;border:1px dashed #454955;border-radius:10px;text-align:center}.ov-empty b{margin-top:8px;font-size:12px}.ov-empty p{max-width:260px;color:#9299a8;font-size:10px;line-height:1.5}",
      ".ov-controls{display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:18px}.ov-control{display:grid;place-items:center;gap:4px;min-width:56px;padding:9px 8px;border:1px solid #454853;border-radius:8px;background:#30333b;color:#d8dce5;font-size:16px}.ov-control small{font-size:8px;color:#aab0bd}.ov-control.active{border-color:#6875e8;background:#41476d;color:white}.ov-join,.ov-leave{padding:11px 18px;border-radius:8px;background:#5865f2;color:white;font-size:10px;font-weight:700}.ov-leave{background:#9c4149}",
      ".ov-right h3{margin:0 0 12px;color:#aeb4c0;font-size:9px;letter-spacing:1px}.ov-stat{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #393c45;color:#aeb4c0;font-size:9px}.ov-stat b{color:#e0e3e9}.ov-member{display:flex;align-items:center;gap:8px;margin-top:12px;color:#cbd0da;font-size:9px}.ov-member span{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#454b66;color:white}.ov-member small{display:block;color:#8f97a6;font-size:8px}",
      ".ov-settings{position:fixed;z-index:150;inset:0;display:grid;place-items:center;padding:15px}.ov-settings[hidden]{display:none}.ov-settings-bg{position:absolute;inset:0;background:#08090bd9}.ov-settings-card{position:relative;width:min(400px,100%);padding:20px;border:1px solid #484b56;border-radius:12px;background:#2b2e36}.ov-settings-card header{display:flex;justify-content:space-between}.ov-settings-card h3{margin:0;font-size:16px}.ov-settings-card p,.ov-settings-note{color:#aeb4c0;font-size:10px;line-height:1.6}.ov-settings-card header button{background:transparent;color:#c8ced8;font-size:20px}.ov-settings-note{padding:10px;border-radius:7px;background:#3b352b;color:#d9c89f}",
      "@media(max-width:1050px){.ov-layout{grid-template-columns:210px minmax(0,1fr)}.ov-right{display:none}}",
      "@media(max-width:700px){.ov-view{inset:0 0 58px}.ov-top{padding:14px 12px}.ov-top h1{font-size:18px}.ov-top p{font-size:9px}.ov-preview{display:none}.ov-layout{display:flex;flex-direction:column}.ov-sidebar{order:2;padding:10px;border-top:1px solid #3b3e47;border-right:0}.ov-main{order:1;padding:14px 11px}.ov-room-list{display:flex;gap:6px;overflow:auto}.ov-room{flex:0 0 145px;padding:7px}.ov-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.ov-person{min-height:120px}.ov-controls{gap:5px}.ov-control{min-width:49px;padding:8px 6px}.ov-stage{align-items:flex-start}}"
    ].join("");
    document.head.appendChild(style);
    const view=document.createElement("section");view.id="orbit-voice-view";view.className="ov-view";view.hidden=true;
    view.innerHTML='<header class="ov-top"><div><span class="ov-eyebrow">COMMUNITY VOICE</span><h1>Voice &amp; Live Rooms</h1><p>Join a room, talk with your community, or host a stage event.</p></div><div class="ov-top-actions"><span class="ov-preview">LOCAL UI PREVIEW</span><button class="ov-close" data-ov-close aria-label="Close voice center">×</button></div></header><div class="ov-layout"><aside class="ov-sidebar"><div class="ov-label">VOICE CHANNELS</div><div id="ov-room-list" class="ov-room-list"></div><div class="ov-label" style="margin-top:18px">STAGE CHANNELS</div><div id="ov-stage-list"></div></aside><main class="ov-main"><div id="ov-main-content"></div></main><aside class="ov-right"><h3>ROOM DETAILS</h3><div id="ov-room-details"></div></aside></div>';
    document.querySelector(".main-panel")?.appendChild(view);
    const settings=document.createElement("div");settings.id="ov-settings";settings.className="ov-settings";settings.hidden=true;
    settings.innerHTML='<button class="ov-settings-bg" data-ov-settings-close aria-label="Close settings"></button><section class="ov-settings-card" role="dialog" aria-modal="true" aria-labelledby="ov-settings-title"><header><h3 id="ov-settings-title">Voice settings</h3><button data-ov-settings-close aria-label="Close">×</button></header><p>Display-only preferences. No device permissions are requested.</p><div class="ov-settings-note">Microphone, camera, screen sharing, and live audio are not connected yet. These controls only preview the interface.</div></section>';
    document.body.appendChild(settings);
    view.addEventListener("click",onVoiceClick);
    settings.addEventListener("click",e=>{if(e.target.closest("[data-ov-settings-close]"))settings.hidden=true;});
    renderVoice();
  }
  function renderVoice(){
    const r=currentRoom(),stage=r.type==="stage";
    const open=rooms.filter(x=>x.type==="voice"),stages=rooms.filter(x=>x.type==="stage");
    $v("#ov-room-list").innerHTML=open.map(x=>'<button class="ov-room '+(x.id===r.id?"active":"")+'" data-ov-room="'+x.id+'"><span class="ov-room-icon">◖</span><span class="ov-room-copy"><b>'+safe(x.name)+'</b><small>'+safe(x.topic)+'</small></span><span class="ov-room-count">'+x.count+'</span></button>').join("");
    $v("#ov-stage-list").innerHTML=stages.map(x=>'<button class="ov-room '+(x.id===r.id?"active":"")+'" data-ov-room="'+x.id+'"><span class="ov-room-icon">▤</span><span class="ov-room-copy"><b>'+safe(x.name)+'</b><small>Live stage event</small></span><span class="ov-room-count">LIVE</span></button>').join("");
    const visible=state.joined?people.slice(0,r.id==="focus"?3:6):people.slice(1,r.id==="focus"?3:6);
    const cards=visible.map((p,i)=>'<article class="ov-person '+(state.joined&&i===1?"speaking":"")+'"><span class="ov-avatar '+p.tone+'">'+safe(p.initial)+'</span><b class="ov-name">'+safe(p.name)+'</b><small class="ov-role">'+safe(p.role)+'</small>'+(state.joined&&i===1?'<span class="ov-speaking-bars"><i></i><i></i><i></i></span>':"")+'</article>').join("");
    $v("#ov-main-content").innerHTML='<div class="ov-heading"><div><h2>'+safe(r.name)+'</h2><p>'+safe(r.topic)+' · '+(r.count+(state.joined?1:0))+' participants</p></div><span class="ov-live">● '+(stage?"STAGE LIVE":"VOICE ROOM")+'</span></div>'+(stage?'<div class="ov-stage"><div><b>Community Creator Q&amp;A</b><p>Listeners can raise a hand to request to speak.</p></div><button data-ov-action="raise">Raise hand</button></div>':"")+'<div class="ov-grid">'+(cards||'<div class="ov-empty"><b>This room is quiet</b><p>Join the room to start a conversation with your community.</p></div>')+'</div><div class="ov-controls">'+(state.joined?'<button class="ov-control '+(state.muted?"active":"")+'" data-ov-action="mute">♩<small>'+(state.muted?"Unmute":"Mute")+'</small></button><button class="ov-control '+(state.deafened?"active":"")+'" data-ov-action="deafen">◖<small>'+(state.deafened?"Undeafen":"Deafen")+'</small></button><button class="ov-control '+(state.camera?"active":"")+'" data-ov-action="camera">▣<small>Camera</small></button><button class="ov-control '+(state.sharing?"active":"")+'" data-ov-action="share">▧<small>Share</small></button><button class="ov-control" data-ov-action="settings">⚙<small>Settings</small></button><button class="ov-leave" data-ov-action="leave">Leave room</button>':'<button class="ov-join" data-ov-action="join">'+(stage?"Join as listener":"Join voice room")+'</button><button class="ov-control" data-ov-action="settings">⚙<small>Settings</small></button>')+'</div>';
    $v("#ov-room-details").innerHTML='<div class="ov-stat"><span>Room type</span><b>'+(stage?"Stage":"Voice")+'</b></div><div class="ov-stat"><span>Participants</span><b>'+(r.count+(state.joined?1:0))+'</b></div><div class="ov-stat"><span>Your status</span><b>'+(state.joined?"Joined (mock)":"Not connected")+'</b></div>'+visible.map(p=>'<div class="ov-member"><span>'+safe(p.initial)+'</span><div>'+safe(p.name)+'<small>'+safe(p.role)+'</small></div></div>').join("");
  }
  function openVoice(roomId){
    ensureVoice();if(roomId&&rooms.some(r=>r.id===roomId))state.room=roomId;
    $v("#orbit-voice-view").hidden=false;
    document.querySelector(".main-header")?.setAttribute("hidden","");
    document.querySelector(".chat-layout")?.setAttribute("hidden","");
    $v("#friends-view")?.setAttribute("hidden","");
    $v("#orbit-inbox-view")?.setAttribute("hidden","");
    closeSidebar();renderVoice();
  }
  function closeVoice(){
    const v=$v("#orbit-voice-view");if(!v)return;v.hidden=true;
    document.querySelector(".main-header")?.removeAttribute("hidden");
    document.querySelector(".chat-layout")?.removeAttribute("hidden");
  }
  function onVoiceClick(e){
    const roomButton=e.target.closest("[data-ov-room]");
    if(roomButton){state.room=roomButton.dataset.ovRoom;state.joined=false;state.muted=false;state.deafened=false;state.camera=false;state.sharing=false;renderVoice();return;}
    if(e.target.closest("[data-ov-close]")){closeVoice();return;}
    const action=e.target.closest("[data-ov-action]")?.dataset.ovAction;if(!action)return;
    if(action==="join"){state.joined=true;renderVoice();toastVoice("Joined "+currentRoom().name+" in local preview.");}
    if(action==="leave"){state.joined=false;state.muted=false;state.deafened=false;state.camera=false;state.sharing=false;renderVoice();toastVoice("Left the room in local preview.");}
    if(action==="mute"){state.muted=!state.muted;renderVoice();}
    if(action==="deafen"){state.deafened=!state.deafened;if(state.deafened)state.muted=true;renderVoice();}
    if(action==="camera"){state.camera=!state.camera;renderVoice();toastVoice("Camera control is visual only in this preview.");}
    if(action==="share"){state.sharing=!state.sharing;renderVoice();toastVoice("Screen sharing is not connected yet.");}
    if(action==="settings")$v("#ov-settings").hidden=false;
    if(action==="raise")toastVoice("Hand raised in local preview.");
  }
  document.addEventListener("click",e=>{
    if(e.target.closest(".channel-static")){openVoice("lounge");return;}
    if(e.target.closest("[aria-label='Mute microphone']")||e.target.closest("[aria-label='Deafen']")){openVoice("lounge");return;}
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){
      if($v("#ov-settings")&&!$v("#ov-settings").hidden)$v("#ov-settings").hidden=true;
      else closeVoice();
    }
  });
})();

// Orbit Screen 12: Server Events & Scheduled Events (frontend-only local mock).
// No Supabase, database, authentication, push notifications, or realtime calls.
(() => {
  const events = [
    {id:1201,title:"Orbit Community Night",description:"Meet the community, share what you are building, and catch up with everyone.",date:"2026-11-12",time:"19:00",type:"voice",place:"Lounge",host:"Aevryn",attending:28,interested:14,status:"upcoming",rsvp:"going",reminder:true},
    {id:1202,title:"AI & Future Technology",description:"A friendly discussion about new AI tools, emerging technology, and ideas for the future.",date:"2026-11-15",time:"16:30",type:"stage",place:"Creator Q&A",host:"Nova",attending:46,interested:21,status:"upcoming",rsvp:"interested",reminder:false},
    {id:1203,title:"Pixel Art Workshop",description:"A collaborative creative session. Bring a small idea and work on it with other members.",date:"2026-11-18",time:"14:00",type:"external",place:"Community Studio",host:"Mika",attending:17,interested:9,status:"upcoming",rsvp:"none",reminder:false},
    {id:1204,title:"Weekly Study Session",description:"A quiet focus session with short breaks and a group check-in.",date:"2026-11-03",time:"18:00",type:"voice",place:"Focus Room",host:"Kai",attending:12,interested:5,status:"past",rsvp:"none",reminder:false}
  ];
  const eventState = {filter:"upcoming",query:"",editing:null,detail:null};
  const event$ = (s,r=document) => r.querySelector(s);
  const eventEsc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const eventDate = (date,time) => new Date(date+"T"+time);
  const eventFormat = (date,time) => eventDate(date,time).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})+" · "+eventDate(date,time).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
  const eventTypeName = type => ({voice:"Voice channel",stage:"Stage event",external:"External location"}[type]||"Community event");
  const eventIcon = type => ({voice:"◖",stage:"▤",external:"↗"}[type]||"✦");
  function eventToast(message){
    if(typeof showOrbitToast==="function"){showOrbitToast(message);return;}
    let toast=event$("#orbit-toast");
    if(!toast){toast=document.createElement("div");toast.id="orbit-toast";toast.className="orbit-toast";toast.setAttribute("role","status");document.body.appendChild(toast);}
    toast.textContent=message;toast.classList.add("visible");clearTimeout(eventToast.timer);eventToast.timer=setTimeout(()=>toast.classList.remove("visible"),2400);
  }
  function installEventsStyles(){
    if(event$("#orbit-events-style"))return;
    const style=document.createElement("style");style.id="orbit-events-style";
    style.textContent=[
      ".oe-view{position:absolute;inset:56px 0 0;z-index:24;display:flex;flex-direction:column;overflow:auto;background:#23252b;color:#e8eaf0}.oe-view[hidden],.oe-modal[hidden]{display:none}",
      ".oe-nav{position:relative}.oe-nav:before{content:'';position:absolute;left:-9px;top:7px;bottom:7px;width:3px;border-radius:3px;background:#8b91ff}.oe-top{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:22px 25px;border-bottom:1px solid #383a43;background:#272930}.oe-kicker{color:#9299a8;font-size:9px;font-weight:800;letter-spacing:1.5px}.oe-top h1{margin:5px 0 4px;font-size:23px;letter-spacing:-.5px}.oe-top p{margin:0;color:#a8adba;font-size:11px}.oe-top-actions{display:flex;align-items:center;gap:9px}.oe-create{padding:10px 14px;border:0;border-radius:8px;background:#5865f2;color:white;font-size:10px;font-weight:800}.oe-create:hover{background:#6b76ff}.oe-content{width:100%;max-width:1220px;margin:0 auto;padding:21px 24px 30px}.oe-hero{position:relative;display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:144px;padding:23px 25px;overflow:hidden;border:1px solid #4a4c75;border-radius:13px;background:radial-gradient(ellipse at 80% 10%,#6469ba55,transparent 40%),linear-gradient(110deg,#343651,#292d40 65%,#34304b)}.oe-hero:after{content:'✦';position:absolute;right:12%;top:-33px;color:#a7aaff22;font-size:160px;line-height:1}.oe-hero-copy{position:relative;z-index:1;max-width:580px}.oe-hero-label{color:#c0c4ff;font-size:9px;font-weight:800;letter-spacing:1.4px}.oe-hero h2{margin:8px 0 5px;font-size:20px}.oe-hero p{max-width:440px;margin:0;color:#b8bdcc;font-size:10px;line-height:1.6}.oe-hero-stats{position:relative;z-index:1;display:flex;gap:22px;padding-right:10px}.oe-stat{display:grid;gap:3px}.oe-stat b{font-size:21px}.oe-stat small{color:#aeb4c4;font-size:8px;letter-spacing:.7px;text-transform:uppercase}.oe-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:21px 0 15px}.oe-tabs{display:flex;gap:5px;padding:4px;border:1px solid #3d404a;border-radius:9px;background:#292c33}.oe-tab{padding:8px 12px;border:0;border-radius:6px;background:transparent;color:#aeb4c0;font-size:9px;font-weight:700}.oe-tab.active{background:#454a65;color:#fff}.oe-search{display:flex;align-items:center;gap:8px;width:min(250px,45%);padding:8px 10px;border:1px solid #41444e;border-radius:8px;background:#292c33;color:#aeb4c0}.oe-search input{width:100%;border:0;outline:0;background:transparent;color:#e8eaf0;font-size:10px}.oe-grid-layout{display:grid;grid-template-columns:minmax(0,1fr) 245px;gap:16px;align-items:start}.oe-section-head{display:flex;justify-content:space-between;align-items:center;margin:0 0 10px}.oe-section-head h3{margin:0;color:#c9ced8;font-size:10px;letter-spacing:.8px;text-transform:uppercase}.oe-section-head span{color:#8f97a6;font-size:9px}.oe-event-list{display:grid;gap:10px}.oe-card{display:grid;grid-template-columns:65px minmax(0,1fr) auto;gap:13px;align-items:center;padding:13px;border:1px solid #3e414b;border-radius:10px;background:linear-gradient(120deg,#30333b,#2a2d34);transition:border-color .16s,transform .16s}.oe-card:hover{border-color:#656b92;transform:translateY(-1px)}.oe-datebox{display:grid;place-items:center;align-content:center;min-height:69px;border:1px solid #4b4e62;border-radius:8px;background:#383b50}.oe-datebox small{color:#b7bce1;font-size:8px;font-weight:800;letter-spacing:1px;text-transform:uppercase}.oe-datebox b{margin-top:3px;font-size:23px;line-height:1.1}.oe-datebox span{margin-top:3px;color:#aeb4c0;font-size:8px}.oe-card-main{min-width:0}.oe-card-type{display:flex;align-items:center;gap:6px;margin-bottom:5px;color:#aeb5ff;font-size:8px;font-weight:800;letter-spacing:.6px;text-transform:uppercase}.oe-card h4{margin:0 0 5px;overflow:hidden;color:#f0f1f5;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.oe-card-meta{display:flex;flex-wrap:wrap;gap:9px;color:#9ea5b3;font-size:9px}.oe-card-meta span{white-space:nowrap}.oe-card-bottom{display:flex;align-items:center;gap:8px;margin-top:8px}.oe-avatar-stack{display:flex;padding-left:2px}.oe-avatar-stack i{display:grid;place-items:center;width:19px;height:19px;margin-left:-3px;border:2px solid #30333b;border-radius:50%;background:#596184;color:white;font-size:7px;font-style:normal}.oe-card-bottom small{color:#9ea5b3;font-size:8px}.oe-card-actions{display:grid;justify-items:end;gap:7px}.oe-rsvp{padding:8px 10px;border:1px solid #5965d8;border-radius:7px;background:#414a86;color:#fff;font-size:9px;font-weight:800}.oe-rsvp.going{border-color:#3f765d;background:#2e5848;color:#b5f0d0}.oe-rsvp.interested{border-color:#6c5a91;background:#493b62;color:#e2d2ff}.oe-detail-link{border:0;background:transparent;color:#aeb5ff;font-size:8px}.oe-side-card{margin-bottom:11px;padding:14px;border:1px solid #3e414b;border-radius:10px;background:#2c2f37}.oe-side-card h3{margin:0 0 12px;color:#c9ced8;font-size:9px;letter-spacing:.8px;text-transform:uppercase}.oe-agenda-row{display:flex;gap:9px;padding:9px 0;border-top:1px solid #3d4049}.oe-agenda-date{min-width:31px;color:#aeb5ff;font-size:9px;font-weight:800}.oe-agenda-copy b{display:block;color:#dce0e8;font-size:9px}.oe-agenda-copy small{display:block;margin-top:3px;color:#9299a8;font-size:8px}.oe-reminder-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #3d4049;color:#aeb4c0;font-size:9px}.oe-reminder-row b{color:#e2e5ec;font-size:9px}.oe-empty{display:grid;place-items:center;min-height:230px;padding:24px;border:1px dashed #454955;border-radius:10px;text-align:center}.oe-empty-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#393d56;color:#b7bcff;font-size:19px}.oe-empty b{margin-top:10px;font-size:12px}.oe-empty p{max-width:280px;margin:5px 0 0;color:#969dab;font-size:9px;line-height:1.6}.oe-modal{position:fixed;z-index:160;inset:0;display:grid;place-items:center;padding:15px}.oe-modal-backdrop{position:absolute;inset:0;border:0;background:#08090bd9}.oe-modal-card{position:relative;width:min(520px,100%);max-height:min(88vh,760px);overflow:auto;padding:20px;border:1px solid #484b56;border-radius:13px;background:#2b2e36;box-shadow:0 22px 70px #0009}.oe-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.oe-modal-head h3{margin:0;font-size:16px}.oe-modal-close{border:0;background:transparent;color:#c8ced8;font-size:21px}.oe-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.oe-field{display:grid;gap:5px}.oe-field.full{grid-column:1/-1}.oe-field label{color:#aeb4c0;font-size:9px;font-weight:700}.oe-field input,.oe-field select,.oe-field textarea{width:100%;padding:10px;border:1px solid #484c58;border-radius:7px;outline:0;background:#23262d;color:#e8eaf0;font:inherit;font-size:10px}.oe-field textarea{min-height:76px;resize:vertical}.oe-field input:focus,.oe-field select:focus,.oe-field textarea:focus{border-color:#7781f5}.oe-form-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:16px}.oe-form-note{max-width:230px;color:#8f97a6;font-size:8px;line-height:1.5}.oe-form-actions{display:flex;gap:7px}.oe-secondary{padding:9px 12px;border:1px solid #4b4f5b;border-radius:7px;background:#343741;color:#d5d9e2;font-size:9px}.oe-primary{padding:9px 13px;border-radius:7px;background:#5865f2;color:white;font-size:9px;font-weight:800}.oe-detail-card{width:min(480px,100%)}.oe-detail-banner{margin:-20px -20px 16px;padding:21px 20px;background:linear-gradient(110deg,#383c60,#353047)}.oe-detail-banner small{color:#c0c4ff;font-size:8px;font-weight:800;letter-spacing:1px}.oe-detail-banner h3{margin:7px 0 4px;font-size:19px}.oe-detail-banner p{margin:0;color:#c0c4ce;font-size:9px;line-height:1.5}.oe-detail-facts{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:13px 0}.oe-fact{padding:10px;border:1px solid #41444e;border-radius:8px;background:#30333b}.oe-fact small{display:block;color:#9299a8;font-size:8px;text-transform:uppercase}.oe-fact b{display:block;margin-top:4px;color:#e5e7ed;font-size:10px}.oe-detail-description{color:#b8beca;font-size:10px;line-height:1.7}.oe-detail-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}.oe-danger{padding:9px 12px;border:1px solid #78494e;border-radius:7px;background:#4e3035;color:#ffc7cb;font-size:9px}.oe-canceled{color:#ffb8bd;font-size:8px;font-weight:800;text-transform:uppercase}.oe-toggle{accent-color:#6875ed}",
      "@media(max-width:1050px){.oe-grid-layout{grid-template-columns:minmax(0,1fr) 205px}.oe-content{padding:18px}}",
      "@media(max-width:760px){.oe-view{inset:0 0 58px}.oe-top{padding:15px 12px}.oe-top h1{font-size:19px}.oe-top p{font-size:9px}.oe-content{padding:12px}.oe-hero{min-height:125px;padding:16px}.oe-hero h2{font-size:17px}.oe-hero-stats{gap:10px;padding:0}.oe-stat b{font-size:17px}.oe-grid-layout{grid-template-columns:1fr}.oe-side-column{display:grid;grid-template-columns:1fr 1fr;gap:8px}.oe-side-card{margin:0}.oe-toolbar{align-items:stretch;flex-direction:column}.oe-search{width:100%}.oe-card{grid-template-columns:52px minmax(0,1fr);gap:9px;padding:10px}.oe-datebox{min-height:62px}.oe-datebox b{font-size:20px}.oe-card-actions{grid-column:2;display:flex;justify-content:space-between;justify-items:initial}.oe-card h4{font-size:11px}.oe-hero-stats .oe-stat:last-child{display:none}}",
      "@media(max-width:420px){.oe-hero-stats{display:none}.oe-card-meta{gap:6px}.oe-card-bottom{margin-top:6px}.oe-side-column{grid-template-columns:1fr}.oe-form-grid{grid-template-columns:1fr}.oe-field.full{grid-column:auto}.oe-form-foot{align-items:flex-start;flex-direction:column}.oe-form-actions{width:100%;justify-content:flex-end}}"
    ].join("");
    document.head.appendChild(style);
  }
  function ensureEventsView(){
    if(event$("#orbit-events-view"))return;
    installEventsStyles();
    const nav=document.querySelector(".primary-nav");
    if(nav&&!event$("#orbit-events-nav")){
      const button=document.createElement("button");button.id="orbit-events-nav";button.className="nav-item oe-nav";button.type="button";button.innerHTML="<span>▦</span> Events";
      button.addEventListener("click",openEventsView);nav.appendChild(button);
    }
    const view=document.createElement("section");view.id="orbit-events-view";view.className="oe-view";view.hidden=true;
    view.innerHTML='<header class="oe-top"><div><span class="oe-kicker">COMMUNITY CALENDAR</span><h1>Events</h1><p>Discover what is happening and plan your next community meetup.</p></div><div class="oe-top-actions"><button class="oe-create" data-oe-create>＋ Create Event</button></div></header><div class="oe-content"><section class="oe-hero"><div class="oe-hero-copy"><span class="oe-hero-label">MAKE SOMETHING HAPPEN</span><h2>Your community, in sync.</h2><p>Schedule voice hangouts, host stage discussions, or organize events outside Orbit.</p></div><div class="oe-hero-stats"><div class="oe-stat"><b id="oe-upcoming-count">0</b><small>Upcoming</small></div><div class="oe-stat"><b id="oe-going-count">0</b><small>Going</small></div><div class="oe-stat"><b id="oe-hosted-count">0</b><small>Hosted</small></div></div></section><div class="oe-toolbar"><div class="oe-tabs" role="tablist" aria-label="Event filters"><button class="oe-tab active" data-oe-filter="upcoming">Upcoming</button><button class="oe-tab" data-oe-filter="past">Past</button><button class="oe-tab" data-oe-filter="hosting">Hosting</button></div><label class="oe-search"><span>⌕</span><input id="oe-search" type="search" placeholder="Search events..." aria-label="Search events"></label></div><div class="oe-grid-layout"><section><div class="oe-section-head"><h3 id="oe-list-title">Upcoming events</h3><span id="oe-result-count"></span></div><div id="oe-event-list" class="oe-event-list"></div></section><aside class="oe-side-column"><section class="oe-side-card"><h3>Your schedule</h3><div id="oe-agenda"></div></section><section class="oe-side-card"><h3>Quick overview</h3><div class="oe-reminder-row"><span>Events you are going to</span><b id="oe-going-side">0</b></div><div class="oe-reminder-row"><span>Interested</span><b id="oe-interested-side">0</b></div><div class="oe-reminder-row"><span>Reminders enabled</span><b id="oe-reminder-side">0</b></div></section></aside></div></div>';
    document.querySelector(".main-panel")?.appendChild(view);
    const modal=document.createElement("div");modal.id="oe-editor";modal.className="oe-modal";modal.hidden=true;
    modal.innerHTML='<button class="oe-modal-backdrop" data-oe-close aria-label="Close event form"></button><section class="oe-modal-card" role="dialog" aria-modal="true" aria-labelledby="oe-editor-title"><header class="oe-modal-head"><h3 id="oe-editor-title">Create an event</h3><button class="oe-modal-close" data-oe-close aria-label="Close">×</button></header><form id="oe-event-form"><div class="oe-form-grid"><div class="oe-field full"><label for="oe-title">Event name</label><input id="oe-title" name="title" maxlength="80" required placeholder="Give your event a name"></div><div class="oe-field full"><label for="oe-description">Description</label><textarea id="oe-description" name="description" maxlength="500" placeholder="What is this event about?"></textarea></div><div class="oe-field"><label for="oe-date">Date</label><input id="oe-date" name="date" type="date" required></div><div class="oe-field"><label for="oe-time">Start time</label><input id="oe-time" name="time" type="time" required></div><div class="oe-field"><label for="oe-type">Event type</label><select id="oe-type" name="type"><option value="voice">Voice channel</option><option value="stage">Stage event</option><option value="external">External location</option></select></div><div class="oe-field"><label for="oe-place">Location / channel</label><input id="oe-place" name="place" maxlength="80" required placeholder="e.g. Lounge"></div></div><div class="oe-form-foot"><span class="oe-form-note">Local preview only. Event data will not be saved to a server.</span><div class="oe-form-actions"><button type="button" class="oe-secondary" data-oe-close>Cancel</button><button type="submit" class="oe-primary">Save event</button></div></div></form></section>';
    document.body.appendChild(modal);
    const detail=document.createElement("div");detail.id="oe-detail";detail.className="oe-modal";detail.hidden=true;
    detail.innerHTML='<button class="oe-modal-backdrop" data-oe-detail-close aria-label="Close event details"></button><section class="oe-modal-card oe-detail-card" role="dialog" aria-modal="true" aria-labelledby="oe-detail-title"><div id="oe-detail-content"></div></section>';
    document.body.appendChild(detail);
    view.addEventListener("click",onEventsClick);
    modal.addEventListener("click",e=>{if(e.target.closest("[data-oe-close]"))closeEventEditor();});
    detail.addEventListener("click",e=>{if(e.target.closest("[data-oe-detail-close]")){closeEventDetail();return;}onEventDetailAction(e);});
    event$("#oe-event-form").addEventListener("submit",saveEvent);
    event$("#oe-search").addEventListener("input",e=>{eventState.query=e.target.value.trim().toLowerCase();renderEvents();});
    renderEvents();
  }
  function openEventsView(){
    ensureEventsView();
    event$("#orbit-events-view").hidden=false;
    event$("#orbit-events-nav")?.classList.add("active");
    document.querySelector(".main-header")?.setAttribute("hidden","");
    document.querySelector(".chat-layout")?.setAttribute("hidden","");
    event$("#friends-view")?.setAttribute("hidden","");
    event$("#orbit-inbox-view")?.setAttribute("hidden","");
    event$("#orbit-voice-view")?.setAttribute("hidden","");
    closeSidebar();
    renderEvents();
  }
  function closeEventsView(){
    const view=event$("#orbit-events-view");if(!view)return;view.hidden=true;
    event$("#orbit-events-nav")?.classList.remove("active");
    document.querySelector(".main-header")?.removeAttribute("hidden");
    document.querySelector(".chat-layout")?.removeAttribute("hidden");
  }
  function filteredEvents(){
    return events.filter(e=>{
      if(eventState.filter==="upcoming"&&e.status!=="upcoming")return false;
      if(eventState.filter==="past"&&e.status!=="past")return false;
      if(eventState.filter==="hosting"&&e.host!=="Aevryn")return false;
      if(eventState.query&&!((e.title+" "+e.description+" "+e.place+" "+e.host).toLowerCase().includes(eventState.query)))return false;
      return true;
    }).sort((a,b)=>eventDate(a.date,a.time)-eventDate(b.date,b.time));
  }
  function renderEvents(){
    const view=event$("#orbit-events-view");if(!view)return;
    const upcoming=events.filter(e=>e.status==="upcoming"),going=upcoming.filter(e=>e.rsvp==="going").length,interested=upcoming.filter(e=>e.rsvp==="interested").length;
    event$("#oe-upcoming-count").textContent=upcoming.length;
    event$("#oe-going-count").textContent=going;
    event$("#oe-hosted-count").textContent=upcoming.filter(e=>e.host==="Aevryn").length;
    event$("#oe-going-side").textContent=going;
    event$("#oe-interested-side").textContent=interested;
    event$("#oe-reminder-side").textContent=upcoming.filter(e=>e.reminder).length;
    document.querySelectorAll("[data-oe-filter]").forEach(b=>b.classList.toggle("active",b.dataset.oeFilter===eventState.filter));
    event$("#oe-list-title").textContent=({upcoming:"Upcoming events",past:"Past events",hosting:"Events you host"}[eventState.filter]);
    const list=filteredEvents();event$("#oe-result-count").textContent=list.length+" events";
    event$("#oe-event-list").innerHTML=list.length?list.map(e=>{
      const d=eventDate(e.date,e.time),rsvp=e.rsvp==="going"?"going":e.rsvp==="interested"?"interested":"";
      return '<article class="oe-card"><div class="oe-datebox"><small>'+d.toLocaleDateString(undefined,{month:"short"})+'</small><b>'+d.getDate()+'</b><span>'+d.toLocaleDateString(undefined,{weekday:"short"})+'</span></div><div class="oe-card-main"><div class="oe-card-type"><span>'+eventIcon(e.type)+'</span>'+eventTypeName(e.type)+'</div><h4>'+eventEsc(e.title)+'</h4><div class="oe-card-meta"><span>◷ '+eventFormat(e.date,e.time)+'</span><span>⌖ '+eventEsc(e.place)+'</span></div><div class="oe-card-bottom"><span class="oe-avatar-stack"><i>A</i><i>M</i><i>N</i></span><small>'+e.attending+' going · '+e.interested+' interested</small></div></div><div class="oe-card-actions">'+(e.status==="past"?'<span class="oe-canceled">Completed</span>':'<button class="oe-rsvp '+rsvp+'" data-oe-rsvp="'+e.id+'">'+(e.rsvp==="going"?"✓ Going":e.rsvp==="interested"?"★ Interested":"RSVP")+'</button>')+'<button class="oe-detail-link" data-oe-detail="'+e.id+'">View details →</button></div></article>';
    }).join(""):'<div class="oe-empty"><span class="oe-empty-icon">▦</span><b>No events found</b><p>Try another filter or search term, or create a new event for your community.</p></div>';
    const agenda=upcoming.slice().sort((a,b)=>eventDate(a.date,a.time)-eventDate(b.date,b.time)).slice(0,3);
    event$("#oe-agenda").innerHTML=agenda.length?agenda.map(e=>'<div class="oe-agenda-row"><span class="oe-agenda-date">'+eventDate(e.date,e.time).toLocaleDateString(undefined,{month:"short",day:"numeric"})+'</span><div class="oe-agenda-copy"><b>'+eventEsc(e.title)+'</b><small>'+eventDate(e.date,e.time).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})+' · '+eventEsc(e.place)+'</small></div></div>').join(""):'<p class="oe-form-note">No upcoming events scheduled.</p>';
  }
  function onEventsClick(e){
    const filter=e.target.closest("[data-oe-filter]")?.dataset.oeFilter;
    if(filter){eventState.filter=filter;renderEvents();return;}
    if(e.target.closest("[data-oe-create]")){openEventEditor();return;}
    const rsvp=e.target.closest("[data-oe-rsvp]")?.dataset.oeRsvp;
    if(rsvp){const item=events.find(x=>x.id===Number(rsvp));if(item){item.rsvp=item.rsvp==="going"?"none":"going";if(item.rsvp==="going")item.attending++;else item.attending=Math.max(0,item.attending-1);renderEvents();eventToast(item.rsvp==="going"?"You are going to "+item.title:"RSVP updated.");}return;}
    const detail=e.target.closest("[data-oe-detail]")?.dataset.oeDetail;
    if(detail){openEventDetail(Number(detail));return;}
  }
  function openEventEditor(id){
    ensureEventsView();
    const form=event$("#oe-event-form"),item=events.find(x=>x.id===id);
    eventState.editing=item?item.id:null;
    event$("#oe-editor-title").textContent=item?"Edit event":"Create an event";
    form.reset();
    if(item){["title","description","date","time","type","place"].forEach(key=>form.elements[key].value=item[key]||"");}
    else{const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);form.elements.date.value=tomorrow.getFullYear()+"-"+String(tomorrow.getMonth()+1).padStart(2,"0")+"-"+String(tomorrow.getDate()).padStart(2,"0");form.elements.time.value="18:00";form.elements.type.value="voice";}
    event$("#oe-editor").hidden=false;
    event$("#oe-title").focus();
  }
  function closeEventEditor(){event$("#oe-editor").hidden=true;eventState.editing=null;}
  function saveEvent(e){
    e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form).entries());
    if(!data.title.trim()||!data.date||!data.time||!data.place.trim())return;
    if(eventDate(data.date,data.time).getTime()<Date.now()&&!eventState.editing){eventToast("Choose a future date and time for a new event.");return;}
    if(eventState.editing){
      const item=events.find(x=>x.id===eventState.editing);if(item)Object.assign(item,data);
      eventToast("Event updated in local preview.");
    }else{
      events.push({id:Date.now(),...data,host:"Aevryn",attending:1,interested:0,status:"upcoming",rsvp:"going",reminder:false});
      eventToast("Event created in local preview.");
    }
    eventState.filter="upcoming";eventState.query="";event$("#oe-search").value="";closeEventEditor();renderEvents();
  }
  function openEventDetail(id){
    const e=events.find(x=>x.id===id);if(!e)return;eventState.detail=id;
    event$("#oe-detail-content").innerHTML='<div class="oe-detail-banner"><small>'+eventTypeName(e.type).toUpperCase()+'</small><h3 id="oe-detail-title">'+eventEsc(e.title)+'</h3><p>Hosted by '+eventEsc(e.host)+' · '+(e.status==="past"?"Completed":"Community event")+'</p></div><div class="oe-detail-facts"><div class="oe-fact"><small>Date &amp; time</small><b>'+eventFormat(e.date,e.time)+'</b></div><div class="oe-fact"><small>Location</small><b>'+eventEsc(e.place)+'</b></div><div class="oe-fact"><small>Going</small><b>'+e.attending+' members</b></div><div class="oe-fact"><small>Interested</small><b>'+e.interested+' members</b></div></div><p class="oe-detail-description">'+eventEsc(e.description||"No event description provided.")+'</p><div class="oe-detail-actions">'+(e.status==="upcoming"?'<button class="oe-primary" data-oe-detail-rsvp="'+e.id+'">'+(e.rsvp==="going"?"✓ Going":"RSVP to event")+'</button><button class="oe-secondary" data-oe-reminder="'+e.id+'">'+(e.reminder?"Reminder on":"Set reminder")+'</button>':"")+(e.host==="Aevryn"&&e.status==="upcoming"?'<button class="oe-secondary" data-oe-edit="'+e.id+'">Edit event</button><button class="oe-danger" data-oe-cancel="'+e.id+'">Cancel event</button>':"")+'</div>';
    event$("#oe-detail").hidden=false;
  }
  function onEventDetailAction(e){
    const id=Number(e.target.closest("[data-oe-detail-rsvp]")?.dataset.oeDetailRsvp||e.target.closest("[data-oe-reminder]")?.dataset.oeReminder||e.target.closest("[data-oe-edit]")?.dataset.oeEdit||e.target.closest("[data-oe-cancel]")?.dataset.oeCancel);
    if(!id)return;const item=events.find(x=>x.id===id);if(!item)return;
    if(e.target.closest("[data-oe-detail-rsvp]")){item.rsvp=item.rsvp==="going"?"none":"going";item.attending=Math.max(0,item.attending+(item.rsvp==="going"?1:-1));openEventDetail(id);renderEvents();eventToast("RSVP updated.");}
    if(e.target.closest("[data-oe-reminder]")){item.reminder=!item.reminder;openEventDetail(id);renderEvents();eventToast(item.reminder?"Reminder enabled in local preview.":"Reminder disabled.");}
    if(e.target.closest("[data-oe-edit]")){closeEventDetail();openEventEditor(id);}
    if(e.target.closest("[data-oe-cancel]")){item.status="canceled";closeEventDetail();renderEvents();eventToast("Event canceled in local preview.");}
  }
  function closeEventDetail(){event$("#oe-detail").hidden=true;eventState.detail=null;}
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){
      if(event$("#oe-detail")&&!event$("#oe-detail").hidden)closeEventDetail();
      else if(event$("#oe-editor")&&!event$("#oe-editor").hidden)closeEventEditor();
      else if(event$("#orbit-events-view")&&!event$("#orbit-events-view").hidden)closeEventsView();
    }
  });
  // Initialize the Events navigation item during app startup so it is discoverable.
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",ensureEventsView,{once:true});
  else ensureEventsView();
})();
