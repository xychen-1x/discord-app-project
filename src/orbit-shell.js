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
    if(action){const labels={boost:"Server Boost screen is planned for a later UI pass.",invite:"Invite flow will be connected after the UI phase.",settings:""};if(action==="settings"){closeServerMenu();openPermissionsScreen();}else showOrbitToast(labels[action]);}
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
 $("#main-panel")?.appendChild(view);
 view.addEventListener("click",e=>{
  const tab=e.target.closest("[data-friends-tab]")?.dataset.friendsTab;
  if(tab){friendsTab=tab;renderFriendsView();}
  const action=e.target.closest("[data-friend-action]")?.dataset.friendAction;
  const id=e.target.closest("[data-friend-id]")?.dataset.friendId;
  if(action==="message"){const friend=friendsMock.find(x=>x.id===id);if(friend){closeFriendsView();const d=mock.dms.find(x=>x.id===id);if(d){document.querySelector('[data-dm="'+id+'"]')?.click();}else showOrbitToast("Direct message preview for "+friend.name+" will be added in a later pass.");}}
  if(action==="more")showOrbitToast("Friend options will be added in a later UI pass.");
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
