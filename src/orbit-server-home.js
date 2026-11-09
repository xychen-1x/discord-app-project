// Orbit Screen 8 — Server Home & Channel Manager (frontend mock only).
(() => {
 const $=s=>document.querySelector(s);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const servers={
  stargazers:{name:"Stargazers",mark:"✦",tagline:"A place for curious minds to explore the universe.",members:1284,online:186,tone:"violet",categories:[{name:"WELCOME",channels:[["welcome","Welcome and introductions"],["announcements","Server announcements"]]},{name:"ASTRONOMY",channels:[["general","Space talk"],["observations","Observations and astrophotography"],["missions","Space missions"]]},{name:"COMMUNITY",channels:[["off-topic","Off-topic chat"]]}]},
  pixel:{name:"Pixel Lab",mark:"P",tagline:"Create, share, and experiment with digital art.",members:932,online:104,tone:"pink",categories:[{name:"START HERE",channels:[["welcome","Welcome to Pixel Lab"],["rules","Community guidelines"]]},{name:"CREATIVE",channels:[["general","Creative chat"],["showcase","Show your work"],["feedback","Feedback and critique"]]}]},
  study:{name:"Study Room",mark:"S",tagline:"Study together, stay focused, and learn something new.",members:654,online:78,tone:"green",categories:[{name:"STUDY",channels:[["general","Study room chat"],["resources","Share helpful resources"],["questions","Ask questions"]]},{name:"VOICE",channels:[["study-together","Quiet co-working"]]}]}
 };
 let active="stargazers",currentChannel="general",modal=null,search="";
 function ensure(){
  if($("#orbit-server-home"))return;
  const view=document.createElement("section");view.id="orbit-server-home";view.className="osh-view";view.hidden=true;
  view.innerHTML=`
   <header class="osh-header"><div class="osh-server-mark" id="osh-mark">✦</div><div class="osh-head-copy"><small>COMMUNITY / SERVER HOME</small><h1 id="osh-title">Stargazers</h1></div><div class="osh-head-actions"><button data-osh="forum">▤ Forum</button><button data-osh="invite">↗ Invite</button><button data-osh="settings">⚙ Settings</button></div></header>
   <div class="osh-layout"><aside class="osh-channel-sidebar"><div class="osh-server-banner"><span id="osh-banner-mark">✦</span><div><b id="osh-banner-title">Stargazers</b><small>Community server</small></div><button data-osh="server-menu">•••</button></div><label class="osh-channel-search">⌕ <input id="osh-channel-search" placeholder="Find a channel"></label><div id="osh-channel-tree"></div><button class="osh-add-channel" data-osh="add-channel">＋ Create channel</button></aside>
   <main class="osh-content"><div class="osh-welcome"><span class="osh-welcome-kicker">WELCOME TO THE COMMUNITY</span><div class="osh-welcome-symbol" id="osh-welcome-symbol">✦</div><h2 id="osh-welcome-title">Stargazers</h2><p id="osh-tagline"></p><div class="osh-stats"><div><b id="osh-members">1,284</b><small>MEMBERS</small></div><div><b id="osh-online">186</b><small>ONLINE NOW</small></div><div><b id="osh-channels-count">6</b><small>CHANNELS</small></div></div><div class="osh-quick-actions"><button data-osh="browse">▤ Browse channels</button><button data-osh="invite">↗ Invite friends</button><button data-osh="edit">✎ Edit server profile</button></div></div>
   <section class="osh-home-section"><div class="osh-section-heading"><div><small>GETTING STARTED</small><h3>Make yourself at home</h3></div><button data-osh="onboarding">Customize onboarding →</button></div><div class="osh-start-grid"><button data-osh="welcome-channel"><span>✦</span><b>Say hello</b><small>Introduce yourself to the community.</small><i>Open welcome channel →</i></button><button data-osh="rules"><span>◇</span><b>Read the guidelines</b><small>Help keep this space welcoming.</small><i>View community rules →</i></button><button data-osh="invite"><span>↗</span><b>Invite your friends</b><small>Bring people you know into the conversation.</small><i>Create an invite →</i></button></div></section>
   <section class="osh-home-section"><div class="osh-section-heading"><div><small>COMMUNITY ACTIVITY</small><h3>Recently active</h3></div><button data-osh="browse">View all channels →</button></div><div class="osh-activity-list" id="osh-activity"></div></section></main></div>`;
  $(".main-panel").appendChild(view);
  modal=document.createElement("div");modal.id="osh-modal-layer";modal.className="osh-modal-layer";modal.hidden=true;
  modal.innerHTML=`<button class="osh-modal-backdrop" data-osh-close aria-label="Close dialog"></button><section class="osh-modal" role="dialog" aria-modal="true" aria-labelledby="osh-modal-title"><header><div><small>SERVER MANAGEMENT</small><h2 id="osh-modal-title">Create a channel</h2></div><button data-osh-close aria-label="Close">×</button></header><p id="osh-modal-desc">Add a new place for your community to talk.</p><label>CHANNEL NAME<input id="osh-new-name" maxlength="50" placeholder="new-channel"></label><label>CHANNEL TYPE<select id="osh-new-type"><option value="text">Text channel</option><option value="voice">Voice channel</option><option value="announcement">Announcement channel</option></select></label><label>CATEGORY<select id="osh-new-category"></select></label><footer><button data-osh-close>Cancel</button><button data-osh-confirm>Create channel</button></footer></section>`;
  document.body.appendChild(modal);view.addEventListener("click",onClick);modal.addEventListener("click",onModalClick);
  $("#osh-channel-search").addEventListener("input",e=>{search=e.target.value.toLowerCase();renderChannels();});
 }
 function renderChannels(){
  const s=servers[active];let count=0;
  $("#osh-channel-tree").innerHTML=s.categories.map((cat,ci)=>{const rows=cat.channels.filter(ch=>ch[0].includes(search)||ch[1].toLowerCase().includes(search));count+=rows.length;if(!rows.length)return "";return `<div class="osh-category"><div class="osh-category-title"><span>⌄ ${esc(cat.name)}</span><button data-osh="add-channel" data-osh-category="${ci}" title="Add channel">＋</button></div>${rows.map(ch=>`<button class="osh-channel-row ${ch[0]===currentChannel?"active":""}" data-osh-channel="${esc(ch[0])}"><span>${ch[0].startsWith("study-together")?"◖":"#"}</span><b>${esc(ch[0])}</b><i>•••</i></button>`).join("")}</div>`}).join("")||'<div class="osh-no-channels">No matching channels.</div>';
  $("#osh-channels-count").textContent=s.categories.reduce((n,c)=>n+c.channels.length,0);
 }
 function render(){
  const s=servers[active];$("#osh-mark").textContent=s.mark;$("#osh-title").textContent=s.name;$("#osh-banner-mark").textContent=s.mark;$("#osh-banner-title").textContent=s.name;$("#osh-welcome-symbol").textContent=s.mark;$("#osh-welcome-title").textContent=s.name;$("#osh-tagline").textContent=s.tagline;$("#osh-members").textContent=s.members.toLocaleString();$("#osh-online").textContent=s.online.toLocaleString();
  renderChannels();const activity=[["Mika","shared a new space photo","observations","8 min ago"],["Kai","started a discussion","general","16 min ago"],["Nova","posted an update","missions","28 min ago"]];
  $("#osh-activity").innerHTML=activity.map((a,i)=>`<button data-osh-channel="${a[2]}"><span class="osh-activity-avatar av-${i}">${a[0][0]}</span><span><b>${a[0]}</b> ${a[1]}<small># ${a[2]}</small></span><time>${a[3]}</time></button>`).join("");
 }
 function open(serverId){ensure();active=servers[serverId]?serverId:"stargazers";currentChannel="general";search="";$("#osh-channel-search").value="";render();$("#orbit-server-home").hidden=false;$(".main-header").hidden=true;$(".chat-layout").hidden=true;}
 function close(){const v=$("#orbit-server-home");if(v)v.hidden=true;$(".main-header").hidden=false;$(".chat-layout").hidden=false;}
 function toast(msg){let t=$("#orbit-toast");if(!t){t=document.createElement("div");t.id="orbit-toast";t.className="orbit-toast";document.body.appendChild(t);}t.textContent=msg;t.classList.add("visible");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("visible"),2400);}
 function channelClick(id){currentChannel=id;const channel=servers[active].categories.flatMap(c=>c.channels).find(c=>c[0]===id);if(!channel){toast("That channel is not in this local preview.");return;}close();const shellButton=document.querySelector('[data-channel="'+id+'"]');if(shellButton)shellButton.click();else toast("Opened #"+id+" in the local preview.");}
 function onClick(e){
  const ch=e.target.closest("[data-osh-channel]");if(ch){channelClick(ch.dataset.oshChannel);return;}
  const act=e.target.closest("[data-osh]")?.dataset.osh;if(!act)return;
  if(act==="add-channel"){modal.hidden=false;$("#osh-modal-title").textContent="Create a channel";$("#osh-modal-desc").textContent="Add a channel to organize conversations.";const ci=e.target.closest("[data-osh-category]")?.dataset.oshCategory;$("#osh-new-category").innerHTML=servers[active].categories.map((c,i)=>`<option value="${i}" ${String(i)===ci?"selected":""}>${esc(c.name)}</option>`).join("");$("#osh-new-name").focus();}
  else if(act==="forum")document.dispatchEvent(new CustomEvent("orbit:open-forum"));
  else if(act==="browse"){toast("Browse channels is available in this local UI preview.");}
  else if(act==="onboarding")document.dispatchEvent(new CustomEvent("orbit:open-onboarding"));
  else if(act==="invite")toast("Invite link flow will be connected in the backend phase.");
  else if(act==="settings"||act==="server-menu"||act==="edit")document.dispatchEvent(new CustomEvent("orbit:open-onboarding"));
  else if(act==="welcome-channel")channelClick("welcome");
  else if(act==="rules")channelClick("rules");
 }
 function onModalClick(e){
  if(e.target.closest("[data-osh-close]")){modal.hidden=true;return;}
  if(e.target.closest("[data-osh-confirm]")){const name=$("#osh-new-name").value.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-_]/g,"");if(!name){toast("Enter a channel name.");$("#osh-new-name").focus();return;}const ci=Number($("#osh-new-category").value)||0;const type=$("#osh-new-type").value;servers[active].categories[ci].channels.push([name,type==="voice"?"Voice room":type==="announcement"?"Announcements":"New text channel"]);modal.hidden=true;search="";$("#osh-channel-search").value="";render();toast("Created #"+name+" in this local preview.");}
 }
 document.addEventListener("click",e=>{const b=e.target.closest("[data-server]");if(b&&!e.target.closest("[data-server-menu]")){const id=b.dataset.server;if(servers[id])open(id);}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(modal&&!modal.hidden)modal.hidden=true;const v=$("#orbit-server-home");if(v&&!v.hidden)close();}});
})();
