// Orbit Screen 13 — Account & User Settings (frontend-only local preview).
// Preferences are stored in this browser only. No Supabase, auth, database, or device permissions.
(() => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const defaults = {
    displayName:"Aevryn", username:"aevryn", about:"Building things and exploring ideas.",
    allowDMs:true, allowFriendRequests:true, filterSensitiveMedia:true, shareActivity:true,
    desktopNotifications:true, messageNotifications:true, friendNotifications:true, eventNotifications:true,
    density:"comfortable", fontScale:"normal", reduceMotion:false, highContrast:false,
    largeText:false, microphone:"Default microphone", output:"Default output", camera:"Default camera",
    developerMode:false, hardwareAcceleration:true
  };
  let state = {...defaults};
  try { state = {...defaults, ...JSON.parse(localStorage.getItem("orbit-settings-v1") || "{}")}; } catch {}
  let activeSection = "account";
  const sections = [
    ["account","My Account","◉"],["profiles","Profiles","◎"],["privacy","Privacy & Safety","◇"],
    ["notifications","Notifications","♧"],["appearance","Appearance","◐"],["accessibility","Accessibility","⊞"],
    ["voice","Voice & Video","◖"],["sessions","Sessions & Devices","▣"],["advanced","Advanced","⚙"]
  ];
  function persist(){ try { localStorage.setItem("orbit-settings-v1", JSON.stringify(state)); } catch {} }
  function toast(message){
    let node=$("#orbit-toast");
    if(!node){node=document.createElement("div");node.id="orbit-toast";node.className="orbit-toast";node.setAttribute("role","status");document.body.appendChild(node);}
    node.textContent=message;node.classList.add("visible");clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove("visible"),2300);
  }
  function installStyles(){
    if($("#orbit-settings-style"))return;
    const style=document.createElement("style");style.id="orbit-settings-style";
    style.textContent=`
      .os-view{position:absolute;z-index:55;inset:0;display:flex;min-width:0;background:#23252b;color:#e8eaf0;overflow:hidden}
      .os-view[hidden]{display:none!important}
      .os-sidebar{width:238px;flex:0 0 238px;display:flex;flex-direction:column;overflow:auto;padding:24px 13px 16px;background:#202228;border-right:1px solid #383a43}
      .os-brand{padding:0 10px 22px}.os-brand small{color:#9299a8;font-size:9px;font-weight:800;letter-spacing:1.5px}.os-brand h2{margin:5px 0 0;font-size:19px}
      .os-nav-label{padding:0 10px 8px;color:#858d9b;font-size:8px;font-weight:800;letter-spacing:1.2px}
      .os-nav{display:flex;align-items:center;gap:10px;width:100%;min-height:38px;margin:2px 0;padding:0 10px;border:0;border-radius:7px;background:transparent;color:#b8bec9;text-align:left;font-size:10px}
      .os-nav span{width:18px;color:#aeb5ff;text-align:center;font-size:14px}.os-nav:hover{background:#30333b;color:#fff}.os-nav.active{background:#3b3f54;color:#fff}
      .os-side-footer{margin-top:auto;padding:14px 9px 0;border-top:1px solid #383a43;color:#858d9b;font-size:8px;line-height:1.6}
      .os-main{min-width:0;flex:1;display:flex;flex-direction:column;overflow:hidden}
      .os-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 24px;border-bottom:1px solid #383a43;background:#272930}
      .os-header-copy small{color:#9299a8;font-size:8px;font-weight:800;letter-spacing:1.4px}.os-header-copy h1{margin:4px 0 0;font-size:19px;letter-spacing:-.3px}
      .os-close{width:32px;height:32px;border:1px solid #484b55;border-radius:8px;background:#33363f;color:#d9dde5;font-size:20px}
      .os-content{width:100%;max-width:900px;margin:0 auto;padding:24px;overflow:auto}
      .os-intro{margin-bottom:19px}.os-intro h2{margin:0 0 6px;font-size:17px}.os-intro p{max-width:620px;margin:0;color:#a3aab6;font-size:10px;line-height:1.6}
      .os-card{margin-bottom:13px;padding:17px;border:1px solid #3e414b;border-radius:10px;background:#2b2e35}
      .os-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.os-card-head h3{margin:0;font-size:11px}.os-card-head small{color:#9299a8;font-size:8px}
      .os-account{display:flex;align-items:center;gap:13px}.os-avatar{width:52px;height:52px;display:grid;place-items:center;border:3px solid #4c5270;border-radius:50%;background:linear-gradient(145deg,#5865f2,#8c75df);color:#fff;font-size:20px;font-weight:800}
      .os-account-copy{min-width:0;flex:1}.os-account-copy b{display:block;font-size:12px}.os-account-copy small{display:block;margin-top:4px;color:#9da5b2;font-size:9px}
      .os-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border:1px solid #4a4d58;border-radius:20px;color:#aeb5c2;font-size:8px}
      .os-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.os-field{display:grid;gap:6px}.os-field.full{grid-column:1/-1}.os-field label{color:#aeb5c2;font-size:9px;font-weight:700}
      .os-field input,.os-field textarea,.os-field select{width:100%;min-height:37px;padding:9px 10px;border:1px solid #484c57;border-radius:7px;outline:0;background:#22252b;color:#e8eaf0;font:inherit;font-size:10px}
      .os-field textarea{min-height:88px;resize:vertical}.os-field input:focus,.os-field textarea:focus,.os-field select:focus{border-color:#7782ff}
      .os-help{color:#8e96a4;font-size:8px;line-height:1.5}
      .os-row{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:12px 0;border-top:1px solid #3d4049}
      .os-row:first-of-type{border-top:0}.os-row-copy{min-width:0;flex:1}.os-row-copy b{display:block;color:#e2e5eb;font-size:10px;font-weight:650}.os-row-copy small{display:block;margin-top:4px;color:#929aa8;font-size:8px;line-height:1.5}
      .os-switch{position:relative;flex:0 0 36px;width:36px;height:20px}.os-switch input{position:absolute;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}.os-switch i{position:absolute;inset:0;border-radius:20px;background:#555a65;pointer-events:none;transition:background .15s}.os-switch i:after{content:"";position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s}.os-switch input:checked+i{background:#5865f2}.os-switch input:checked+i:after{transform:translateX(16px)}.os-switch input:focus-visible+i{outline:2px solid #aab4ff;outline-offset:3px}
      .os-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:15px}.os-button{min-height:34px;padding:0 13px;border:1px solid #4a4e59;border-radius:7px;background:#393c45;color:#e0e3e9;font-size:9px;font-weight:700}.os-button.primary{border-color:#5865f2;background:#5865f2;color:white}.os-button:hover{filter:brightness(1.12)}
      .os-info{padding:12px;border:1px solid #484b58;border-radius:8px;background:#30333d;color:#aeb5c2;font-size:9px;line-height:1.6}
      .os-session{display:flex;align-items:center;gap:11px;padding:12px 0;border-top:1px solid #3d4049}.os-session-icon{width:35px;height:35px;display:grid;place-items:center;border-radius:9px;background:#3b4055;color:#c1c7ff;font-size:16px}.os-session-copy{min-width:0;flex:1}.os-session-copy b{display:block;font-size:10px}.os-session-copy small{display:block;margin-top:4px;color:#929aa8;font-size:8px}
      .os-preview-label{padding:5px 7px;border:1px solid #62563c;border-radius:20px;color:#d6c28e;font-size:8px;white-space:nowrap}
      .os-view[data-density="compact"] .os-row{padding:7px 0}.os-view[data-font="large"] .os-row-copy b{font-size:11px}.os-view[data-contrast="high"] .os-card{border-color:#777f94}.os-view[data-contrast="high"] .os-row-copy small,.os-view[data-contrast="high"] .os-help{color:#c0c6d1}
      body.orbit-settings-reduce-motion *,body.orbit-settings-reduce-motion *:before,body.orbit-settings-reduce-motion *:after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
      body.orbit-settings-large-text .os-view{font-size:1.08em}
      @media(max-width:760px){
        .os-view{inset:0 0 58px;flex-direction:column;overflow:auto}.os-sidebar{width:100%;flex:0 0 auto;padding:12px 10px 9px;border-right:0;border-bottom:1px solid #383a43}
        .os-brand{display:flex;align-items:center;justify-content:space-between;padding:0 5px 9px}.os-brand h2{font-size:15px}.os-nav-label,.os-side-footer{display:none}
        .os-nav-list{display:flex;gap:5px;overflow:auto;padding-bottom:2px}.os-nav{flex:0 0 auto;width:auto;min-height:34px;margin:0;padding:0 9px;font-size:9px}.os-nav span{width:auto}
        .os-header{padding:12px 14px}.os-header-copy h1{font-size:16px}.os-content{padding:13px 12px 22px}
        .os-card{padding:13px}.os-fields{grid-template-columns:1fr}.os-field.full{grid-column:auto}.os-account{align-items:flex-start;flex-wrap:wrap}.os-account-copy{flex-basis:calc(100% - 68px)}
        .os-preview-label{margin-left:auto}
      }
    `;
    document.head.appendChild(style);
  }
  function row(label, description, key){
    return '<div class="os-row"><div class="os-row-copy"><b>'+esc(label)+'</b><small>'+esc(description)+'</small></div><label class="os-switch"><input type="checkbox" data-setting="'+key+'" '+(state[key]?'checked':'')+' aria-label="'+esc(label)+'"><i></i></label></div>';
  }
  function intro(title, description){
    return '<div class="os-intro"><h2>'+title+'</h2><p>'+description+'</p></div>';
  }
  function card(title, body, note=""){
    return '<section class="os-card"><header class="os-card-head"><h3>'+title+'</h3>'+(note?'<small>'+note+'</small>':'')+'</header>'+body+'</section>';
  }
  function field(label,key,value,type="text",extra=""){
    return '<div class="os-field '+extra+'"><label for="os-'+key+'">'+label+'</label><input id="os-'+key+'" name="'+key+'" type="'+type+'" value="'+esc(value)+'" data-profile-field="'+key+'"></div>';
  }
  function selectField(label,key,value,options){
    return '<div class="os-field"><label for="os-'+key+'">'+label+'</label><select id="os-'+key+'" data-setting="'+key+'">'+options.map(([v,t])=>'<option value="'+v+'" '+(value===v?'selected':'')+'>'+t+'</option>').join('')+'</select></div>';
  }
  function renderSection(){
    const content=$("#os-content");if(!content)return;
    let html="";
    if(activeSection==="account"){
      html=intro("My Account","Review the account details currently shown in this local Orbit preview.")+
        card("Account profile",'<div class="os-account"><span class="os-avatar">A</span><div class="os-account-copy"><b>'+esc(state.displayName)+'</b><small>@'+esc(state.username)+'</small></div><span class="os-chip">● Online</span></div><div class="os-row"><div class="os-row-copy"><b>Email address</b><small>Not connected in this frontend preview.</small></div><span class="os-preview-label">Not connected</span></div><div class="os-row"><div class="os-row-copy"><b>Password &amp; authentication</b><small>Account security controls require backend authentication.</small></div><span class="os-preview-label">Unavailable</span></div><div class="os-actions"><button class="os-button primary" data-settings-go="profiles">Edit Profile</button></div>')+
        card("Account status",'<div class="os-info">This screen currently uses mock account details. Changes made here affect only this browser preview and do not update a real Orbit account.</div>');
    } else if(activeSection==="profiles"){
      html=intro("Profiles","Customize the name and short bio displayed around Orbit.")+
        card("Profile information",'<form id="os-profile-form"><div class="os-fields">'+field("Display name","displayName",state.displayName)+field("Username","username",state.username)+
        '<div class="os-field full"><label for="os-about">About Me</label><textarea id="os-about" name="about" maxlength="190" data-profile-field="about">'+esc(state.about)+'</textarea><small class="os-help">Maximum 190 characters. Saved locally in this browser.</small></div></div><div class="os-actions"><button class="os-button primary" type="submit">Save Profile</button></div></form>')+
        card("Avatar & banner",'<div class="os-info">Avatar and banner uploads are not connected in this frontend-only screen. The current Orbit profile artwork remains unchanged.</div>');
    } else if(activeSection==="privacy"){
      html=intro("Privacy & Safety","Choose how other members can interact with you. These are local preview preferences only.")+
        card("Who can interact with you",row("Allow direct messages","Allow messages from people in shared communities.","allowDMs")+row("Allow friend requests","Show the friend-request option on your profile.","allowFriendRequests")+row("Share activity status","Display your current activity to other members.","shareActivity"))+
        card("Safety filters",row("Filter sensitive media","Show the safer-content preference in the local preview.","filterSensitiveMedia"))+
        card("Privacy controls",'<div class="os-info">Blocking, reporting, message screening, and data-request controls will need server-side enforcement before they can provide real protection. No security guarantee is implied by these preview switches.</div>');
    } else if(activeSection==="notifications"){
      html=intro("Notifications","Configure which Orbit updates you want the interface to highlight.")+
        card("Notification preferences",row("Desktop notifications","Allow browser notification prompts when notification delivery is implemented.","desktopNotifications")+row("Direct messages","Highlight incoming direct-message notifications.","messageNotifications")+row("Friend activity","Highlight friend requests and friend status updates.","friendNotifications")+row("Community events","Highlight event reminders and community updates.","eventNotifications"))+
        card("Delivery status",'<div class="os-info">These switches change local preferences only. Browser push notifications and server delivery are not connected.</div>');
    } else if(activeSection==="appearance"){
      html=intro("Appearance","Adjust the visual density and text scale of the Orbit interface.")+
        card("Display preferences",'<div class="os-fields">'+selectField("Message & list density","density",state.density,[["comfortable","Comfortable"],["compact","Compact"]])+selectField("Text size","fontScale",state.fontScale,[["normal","Default"],["large","Large"]])+'</div><div class="os-help" style="margin-top:12px">These preferences are previewed on this settings screen. A full app-wide theme selector can be connected during the UI reconstruction pass.</div>')+
        card("Motion",row("Reduce motion","Limit interface transitions and animation in this browser.","reduceMotion"));
    } else if(activeSection==="accessibility"){
      html=intro("Accessibility","Use display preferences that can make the interface easier to read and navigate.")+
        card("Visual accessibility",row("High contrast","Increase contrast on settings cards and supporting text.","highContrast")+row("Larger text","Slightly increase text size in the settings interface.","largeText")+row("Reduce motion","Reduce animation and transition effects.","reduceMotion"))+
        card("Keyboard & navigation",'<div class="os-info">Settings can be navigated with standard buttons, inputs, and keyboard focus. Escape closes the settings screen.</div>');
    } else if(activeSection==="voice"){
      html=intro("Voice & Video","Review the device preference interface. Orbit is not requesting microphone or camera access.")+
        card("Input & output devices",'<div class="os-fields">'+selectField("Microphone","microphone",state.microphone,[["Default microphone","Default microphone"],["Built-in microphone","Built-in microphone"],["External microphone","External microphone"]])+selectField("Output device","output",state.output,[["Default output","Default output"],["Phone speaker","Phone speaker"],["Headphones","Headphones"]])+selectField("Camera","camera",state.camera,[["Default camera","Default camera"],["Front camera","Front camera"],["Rear camera","Rear camera"]])+'</div><div class="os-actions"><button class="os-button" data-settings-action="test-audio">Test audio interface</button></div>')+
        card("Connection status",'<div class="os-info">Microphone capture, camera streaming, screen sharing, and WebRTC are not connected. Device choices are visual placeholders only.</div>');
    } else if(activeSection==="sessions"){
      html=intro("Sessions & Devices","Review the session-management area planned for Orbit accounts.")+
        card("Current session",'<div class="os-session"><span class="os-session-icon">▣</span><div class="os-session-copy"><b>Current browser session</b><small>Device details and session identifiers are not available in this mock preview.</small></div><span class="os-preview-label">This device</span></div>')+
        card("Session management",'<div class="os-info">Active-session listing, remote sign-out, and trusted-device management require real authentication and backend session records. No real sessions can be viewed or revoked here.</div>');
    } else if(activeSection==="advanced"){
      html=intro("Advanced","Additional interface preferences for testing and troubleshooting.")+
        card("Developer options",row("Developer mode","Show developer-oriented interface options when implemented.","developerMode")+row("Hardware acceleration preference","Display the preferred acceleration setting in this local preview.","hardwareAcceleration"))+
        card("Application information",'<div class="os-row"><div class="os-row-copy"><b>Orbit frontend</b><small>Screen 13 · Account &amp; User Settings</small></div><span class="os-chip">UI preview</span></div><div class="os-actions"><button class="os-button" data-settings-action="reset">Reset local preferences</button></div>');
    }
    content.innerHTML=html;
    const view=$("#orbit-settings-view");
    if(view){view.dataset.density=state.density;view.dataset.font=state.fontScale;view.dataset.contrast=state.highContrast?"high":"normal";}
    document.body.classList.toggle("orbit-settings-reduce-motion",!!state.reduceMotion);
    document.body.classList.toggle("orbit-settings-large-text",!!state.largeText);
    document.querySelectorAll("[data-settings-section]").forEach(button=>button.classList.toggle("active",button.dataset.settingsSection===activeSection));
  }
  function ensureView(){
    if($("#orbit-settings-view"))return;
    installStyles();
    const nav=$(".primary-nav");
    if(nav&&!$("#orbit-settings-nav")){
      const button=document.createElement("button");button.id="orbit-settings-nav";button.type="button";button.className="nav-item";button.innerHTML="<span>⚙</span> Settings";
      button.addEventListener("click",openSettings);nav.appendChild(button);
    }
    const view=document.createElement("section");view.id="orbit-settings-view";view.className="os-view";view.hidden=true;
    view.innerHTML='<aside class="os-sidebar"><div class="os-brand"><div><small>ORBIT PREFERENCES</small><h2>Settings</h2></div><span class="os-preview-label">LOCAL PREVIEW</span></div><div class="os-nav-label">USER SETTINGS</div><nav class="os-nav-list" aria-label="User settings sections">'+sections.map(([id,label,icon])=>'<button class="os-nav" type="button" data-settings-section="'+id+'"><span>'+icon+'</span>'+label+'</button>').join("")+'</nav><div class="os-side-footer">Changes are stored in this browser only.<br>Account and device services are not connected.</div></aside><main class="os-main"><header class="os-header"><div class="os-header-copy"><small>USER SETTINGS</small><h1 id="os-heading">My Account</h1></div><button class="os-close" type="button" data-settings-close aria-label="Close settings">×</button></header><div class="os-content" id="os-content"></div></main>';
    $(".main-panel")?.appendChild(view);
    view.addEventListener("click",onViewClick);
    view.addEventListener("change",onViewChange);
    view.addEventListener("submit",onViewSubmit);
    renderSection();
  }
  function openSettings(){
    ensureView();
    const view=$("#orbit-settings-view");if(!view)return;
    view.hidden=false;
    document.querySelector(".main-header")?.setAttribute("hidden","");
    document.querySelector(".chat-layout")?.setAttribute("hidden","");
    ["#friends-view","#orbit-inbox-view","#orbit-voice-view","#orbit-events-view","#orbit-moderation-view"].forEach(selector=>{const node=$(selector);if(node)node.hidden=true;});
    document.querySelectorAll(".nav-item").forEach(button=>button.classList.remove("active"));
    $("#orbit-settings-nav")?.classList.add("active");
    closeSidebarIfAvailable();
    renderSection();
  }
  function closeSidebarIfAvailable(){
    $("#side-panel")?.classList.remove("open");$("#mobile-backdrop")?.classList.remove("show");
  }
  function closeSettings(){
    const view=$("#orbit-settings-view");if(!view)return;view.hidden=true;
    $("#orbit-settings-nav")?.classList.remove("active");
    document.querySelector(".main-header")?.removeAttribute("hidden");
    document.querySelector(".chat-layout")?.removeAttribute("hidden");
  }
  function onViewClick(event){
    const close=event.target.closest("[data-settings-close]");if(close){closeSettings();return;}
    const nav=event.target.closest("[data-settings-section]");if(nav){activeSection=nav.dataset.settingsSection;$("#os-heading").textContent=sections.find(x=>x[0]===activeSection)?.[1]||"Settings";renderSection();return;}
    const go=event.target.closest("[data-settings-go]");if(go){activeSection=go.dataset.settingsGo;$("#os-heading").textContent="Profiles";renderSection();return;}
    const action=event.target.closest("[data-settings-action]")?.dataset.settingsAction;
    if(action==="test-audio")toast("Audio testing is not connected in this preview.");
    if(action==="reset"){
      if(confirm("Reset local Orbit settings preferences in this browser?")){state={...defaults};persist();renderSection();toast("Local preferences reset.");}
    }
  }
  function onViewChange(event){
    const key=event.target.dataset.setting;if(!key||!(key in defaults))return;
    state[key]=event.target.type==="checkbox"?event.target.checked:event.target.value;
    persist();renderSection();
  }
  function onViewSubmit(event){
    if(event.target.id!=="os-profile-form")return;
    event.preventDefault();
    event.target.querySelectorAll("[data-profile-field]").forEach(input=>{const key=input.dataset.profileField;if(key in defaults)state[key]=input.value.trim();});
    persist();renderSection();toast("Profile updated in this browser preview.");
  }
  document.addEventListener("click",event=>{
    if(event.target.closest('[aria-label="User settings"]')||event.target.closest('.rail-bottom [aria-label="Settings"]')){
      event.preventDefault();openSettings();
    }
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&$("#orbit-settings-view")&&!$("#orbit-settings-view").hidden)closeSettings();
  });
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensureView,{once:true});
  else ensureView();
})();