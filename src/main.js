import "./style.css";
import { isSupabaseConfigured, supabase } from "./lib/supabase.js";

const $ = (selector) => document.querySelector(selector);
const authScreen = $("#auth-screen");
const workspace = $("#workspace");
const form = $("#auth-form");
const emailInput = $("#email");
const passwordInput = $("#password");
const passwordToggle = $("#password-toggle");
const title = $("#auth-title");
const description = $("#auth-description");
const submit = $("#auth-submit");
const message = $("#auth-message");
const switchButton = $("#auth-switch");
const switchCopy = $("#auth-switch-copy");
const displayNameField = $("#display-name-field");
const usernameField = $("#username-field");
const confirmPasswordField = $("#confirm-password-field");
const confirmPasswordInput = $("#confirm-password");
const forgotPasswordButton = $("#forgot-password");
let authMode = "signin";
let activeSection = "Home";

const icon = {
  friends: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7" r="4"/><path d="M17 11a4 4 0 1 0-1-7.9M21 20v-1.5a4 4 0 0 0-3-3.87"/></svg>',
  messages: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H9l-5 4z"/><path d="M8 8h8M8 12h5"/></svg>',
  communities: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V8l8-5 8 5v12z"/><path d="M9 20v-6h6v6M8 9h.01M16 9h.01"/></svg>'
};

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === "signup";
  title.textContent = signup ? "Create an account" : "Welcome back!";
  description.textContent = signup ? "Join the conversation and find your people." : "We're so excited to see you again!";
  submit.textContent = signup ? "Create Account" : "Log In";
  switchCopy.textContent = signup ? "Already have an account?" : "Need an account?";
  switchButton.textContent = signup ? "Log In" : "Register";
  passwordInput.autocomplete = signup ? "new-password" : "current-password";
  displayNameField.hidden = !signup;
  usernameField.hidden = !signup;
  $("#username").required = signup;
  confirmPasswordField.hidden = !signup;
  confirmPasswordInput.required = signup;
  forgotPasswordButton.hidden = signup;
  message.textContent = "";
  passwordInput.value = "";
  confirmPasswordInput.value = "";
  passwordInput.type = "password";
  passwordToggle.classList.remove("is-visible");
  passwordToggle.setAttribute("aria-label", "Show password");
  passwordToggle.setAttribute("aria-pressed", "false");
}

function showAuth(text = "") {
  authScreen.hidden = false;
  workspace.hidden = true;
  if (text) message.textContent = text;
}

function showWorkspace(user) {
  authScreen.hidden = true;
  workspace.hidden = false;
  const email = user?.email || "Your account";
  const metadataName = user?.user_metadata?.display_name || user?.user_metadata?.username;
  const name = metadataName || email.split("@")[0] || "Your account";
  $("#user-name").textContent = name;
  $("#user-avatar").textContent = name.slice(0, 1).toUpperCase();
  renderSection(activeSection);
  loadAccountProfile();
}

function setPasswordVisibility(visible) {
  passwordInput.type = visible ? "text" : "password";
  passwordToggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
  passwordToggle.setAttribute("aria-pressed", String(visible));
  passwordToggle.classList.toggle("is-visible", visible);
}

function renderSection(section) {
  activeSection = section;
  $("#page-title").textContent = section;
  document.querySelectorAll("[data-section]").forEach((item) => {
    item.classList.toggle("selected", item.dataset.section === section);
  });
  const content = $("#home-content");
  const views = {
    Home: `<section class="welcome-block"><p class="welcome-kicker">YOUR SPACE</p><h1>Welcome to Orbit.</h1><p>Pick a place to start a conversation.</p></section><section class="home-grid" aria-label="Quick access"><button class="home-tile" data-section="Friends"><span class="tile-icon friends-tile-icon">${icon.friends}</span><span class="tile-copy"><strong>Friends</strong><small>Add people and keep in touch.</small></span><span class="tile-arrow">›</span></button><button class="home-tile" data-section="Messages"><span class="tile-icon messages-tile-icon">${icon.messages}</span><span class="tile-copy"><strong>Messages</strong><small>Your private conversations live here.</small></span><span class="tile-arrow">›</span></button><button class="home-tile" data-section="Communities"><span class="tile-icon communities-tile-icon">${icon.communities}</span><span class="tile-copy"><strong>Communities</strong><small>Find a community or create your own.</small></span><span class="tile-arrow">›</span></button></section>`,
    Friends: `<section class="section-heading"><div><p class="welcome-kicker">YOUR PEOPLE</p><h1>Friends</h1><p>Connect with people on Orbit.</p></div></section><section class="friends-shell"><div class="friends-tabs" role="tablist" aria-label="Friends"><button class="friends-tab active" data-friends-tab="all">All</button><button class="friends-tab" data-friends-tab="online">Online</button><button class="friends-tab" data-friends-tab="pending">Pending</button><button class="friends-tab" data-friends-tab="blocked">Blocked</button><button class="friends-tab add-friend-tab" data-friends-tab="add">Add Friend</button></div><div id="friends-panel" class="friends-panel"><div class="friends-loading">Loading friends…</div></div></section>`,
    Messages: `<section class="section-heading"><div><p class="welcome-kicker">PRIVATE CONVERSATIONS</p><h1>Messages</h1><p>Your direct and group conversations.</p></div></section><section class="feature-empty"><span class="empty-illustration">${icon.messages}</span><h2>No conversations yet</h2><p>Your direct messages and group chats will appear here once messaging is implemented.</p></section>`,
    Communities: `<section class="section-heading"><div><p class="welcome-kicker">FIND YOUR PEOPLE</p><h1>Communities</h1><p>Places to talk about what you enjoy.</p></div><button class="section-action" type="button" disabled title="Community creation is part of the next feature build">Create Community</button></section><section class="feature-empty"><span class="empty-illustration">${icon.communities}</span><h2>Make a place of your own</h2><p>Community discovery, creation, invites, and channels will be connected in the Communities feature build.</p></section>`,
    Settings: `<section class="section-heading"><div><p class="welcome-kicker">PREFERENCES</p><h1>User Settings</h1><p>Manage your Orbit account and profile.</p></div></section><div class="settings-layout"><nav class="settings-nav" aria-label="Settings"><button class="settings-nav-item active" data-settings-tab="account">My Account</button><button class="settings-nav-item" data-settings-tab="profile">Profiles</button><button class="settings-nav-item" data-settings-tab="appearance">Appearance</button><button class="settings-nav-item" data-settings-tab="privacy">Privacy &amp; Safety</button><button class="settings-nav-item" data-settings-tab="notifications">Notifications</button></nav><section id="settings-panel" class="settings-panel"><p class="friends-loading">Loading account settings…</p></section></div>`,
    Help: `<section class="section-heading"><div><p class="welcome-kicker">ORBIT SUPPORT</p><h1>Help & Support</h1><p>Find guidance for using Orbit.</p></div></section><section class="feature-empty"><h2>Support resources are being prepared</h2><p>Help articles and support contact options will be available before public launch.</p></section>`
  };
  content.innerHTML = views[section] || views.Home;
  content.focus({ preventScroll: true });
  const user = currentUser;
  if (section === "Settings") loadSettingsTab("account");
  if (section === "Friends") loadFriendsTab("all");
  
  closeMobileSidebar();
}


let friendsTab = "all";
let friendSearchTimer = null;
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function friendRow(profile, actionMarkup = "") {
  const name = profile.display_name || profile.username || "Orbit user";
  const initial = name.slice(0,1).toUpperCase();
  const username = profile.username ? "@"+profile.username : "";
  return `<article class="friend-row"><div class="friend-avatar">${escapeHtml(initial)}</div><div class="friend-identity"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(username)}</span></div><div class="friend-actions">${actionMarkup}</div></article>`;
}
async function loadFriendsTab(tab = friendsTab) {
  friendsTab = tab;
  const panel = $("#friends-panel");
  if (!panel || !supabase || !currentUser) return;
  panel.innerHTML = '<div class="friends-loading">Loading…</div>';
  const tabs = ["all","online","pending","blocked","add"];
  document.querySelectorAll("[data-friends-tab]").forEach((button) => button.classList.toggle("active",button.dataset.friendsTab===tab));
  try {
    if (tab === "add") {
      panel.innerHTML = '<div class="add-friend-panel"><h2>Add Friend</h2><p>Search by Orbit username or display name.</p><form id="friend-search-form" class="friend-search-form"><input id="friend-search-input" type="search" autocomplete="off" maxlength="32" placeholder="Enter a username" aria-label="Search username" required><button class="section-action" type="submit">Search</button></form><div id="friend-search-results" class="friend-list"></div></div>';
      return;
    }
    if (tab === "pending") {
      const {data,error}=await supabase.from("friend_requests").select("id,sender_id,receiver_id,status,created_at").eq("status","pending").or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`).order("created_at",{ascending:false});
      if(error) throw error;
      const ids=[...new Set((data||[]).map(r=>r.sender_id===currentUser.id?r.receiver_id:r.sender_id))];
      const {data:profiles,error:profileError}=ids.length?await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id",ids):{data:[],error:null};
      if(profileError) throw profileError;
      const map=new Map((profiles||[]).map(p=>[p.id,p]));
      const incoming=(data||[]).filter(r=>r.receiver_id===currentUser.id);
      const outgoing=(data||[]).filter(r=>r.sender_id===currentUser.id);
      panel.innerHTML=`<h3 class="friend-list-heading">Incoming — ${incoming.length}</h3><div class="friend-list">${incoming.map(r=>friendRow(map.get(r.sender_id)||{},`<button class="friend-action accept" data-friend-action="accept" data-request-id="${r.id}">Accept</button><button class="friend-action" data-friend-action="decline" data-request-id="${r.id}">Decline</button>`)).join("")||'<p class="friend-empty-note">No incoming requests.</p>'}</div><h3 class="friend-list-heading outgoing-heading">Outgoing — ${outgoing.length}</h3><div class="friend-list">${outgoing.map(r=>friendRow(map.get(r.receiver_id)||{},`<button class="friend-action" data-friend-action="cancel" data-request-id="${r.id}">Cancel</button>`)).join("")||'<p class="friend-empty-note">No outgoing requests.</p>'}</div>`;
      return;
    }
    if (tab === "blocked") {
      const {data,error}=await supabase.from("blocked_users").select("blocked_id").eq("blocker_id",currentUser.id);
      if(error) throw error;
      const ids=(data||[]).map(x=>x.blocked_id);
      const {data:profiles,error:profileError}=ids.length?await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id",ids):{data:[],error:null};
      if(profileError) throw profileError;
      panel.innerHTML=(profiles||[]).map(p=>friendRow(p,`<button class="friend-action" data-friend-action="unblock" data-user-id="${p.id}">Unblock</button>`)).join("")||'<div class="friend-empty-note centered">You have not blocked anyone.</div>';
      return;
    }
    const {data,error}=await supabase.from("friendships").select("user_low_id,user_high_id").or(`user_low_id.eq.${currentUser.id},user_high_id.eq.${currentUser.id}`);
    if(error) throw error;
    const ids=(data||[]).map(f=>f.user_low_id===currentUser.id?f.user_high_id:f.user_low_id);
    const {data:profiles,error:profileError}=ids.length?await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id",ids):{data:[],error:null};
    if(profileError) throw profileError;
    let list=profiles||[];
    if(tab==="online" && list.length) {
      const {data:statuses,error:statusError}=await supabase.from("user_status").select("user_id,presence").in("user_id",ids);
      if(statusError) throw statusError;
      const online=new Set((statuses||[]).filter(s=>s.presence==="online").map(s=>s.user_id));
      list=list.filter(p=>online.has(p.id));
    }
    panel.innerHTML=list.map(p=>friendRow(p,`<button class="friend-action" data-friend-action="message" data-user-id="${p.id}" disabled title="Direct messages are next">Message</button><button class="friend-action danger" data-friend-action="remove" data-user-id="${p.id}">Remove</button><button class="friend-action" data-friend-action="block" data-user-id="${p.id}">Block</button>`)).join("")||`<div class="friend-empty-note centered">${tab==="online"?"No friends are currently online.":"No friends yet. Use Add Friend to find people."}</div>`;
  } catch(error) {
    panel.innerHTML=`<div class="friend-error">${escapeHtml(error.message||"Unable to load friends.")}</div>`;
  }
}
async function searchFriendProfiles(query) {
  const result=$("#friend-search-results");
  if(!result || !query.trim()) { if(result) result.innerHTML=""; return; }
  result.innerHTML='<p class="friends-loading">Searching…</p>';
  const safe=query.trim().replace(/[,%()\\\\]/g,"");
  const pattern=`%${safe}%`;
  const {data,error}=await supabase.from("profiles").select("id,username,display_name,avatar_url").or(`username.ilike.${pattern},display_name.ilike.${pattern}`).neq("id",currentUser.id).limit(12);
  if(error) { result.innerHTML=`<p class="friend-error">${escapeHtml(error.message)}</p>`; return; }
  if(!data?.length) { result.innerHTML='<p class="friend-empty-note">No users found. Check the username and try again.</p>'; return; }
  const ids=data.map(p=>p.id);
  const [friendships,requests,blocks]=await Promise.all([
    supabase.from("friendships").select("user_low_id,user_high_id").or(`user_low_id.eq.${currentUser.id},user_high_id.eq.${currentUser.id}`),
    supabase.from("friend_requests").select("sender_id,receiver_id,status").eq("status","pending").or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`),
    supabase.from("blocked_users").select("blocker_id,blocked_id").or(`blocker_id.eq.${currentUser.id},blocked_id.eq.${currentUser.id}`)
  ]);
  const isFriend=new Set((friendships.data||[]).map(f=>f.user_low_id===currentUser.id?f.user_high_id:f.user_low_id));
  const pending=new Map((requests.data||[]).map(r=>[r.sender_id===currentUser.id?r.receiver_id:r.sender_id,r.sender_id===currentUser.id?"Sent":"Received"]));
  const blocked=new Set((blocks.data||[]).map(b=>b.blocker_id===currentUser.id?b.blocked_id:b.blocker_id));
  result.innerHTML=data.map(p=>{
    let action='<button class="friend-action add" data-friend-action="send" data-user-id="'+p.id+'">Add Friend</button>';
    if(isFriend.has(p.id)) action='<span class="friend-state">Friends</span>';
    else if(blocked.has(p.id)) action='<span class="friend-state">Unavailable</span>';
    else if(pending.has(p.id)) action='<span class="friend-state">'+pending.get(p.id)+'</span>';
    return friendRow(p,action);
  }).join("");
}
async function handleFriendAction(button) {
  const action=button.dataset.friendAction;
  const userId=button.dataset.userId;
  const requestId=button.dataset.requestId;
  button.disabled=true;
  try {
    let result;
    if(action==="send") result=await supabase.rpc("send_friend_request",{target_user:userId});
    if(action==="accept") result=await supabase.rpc("respond_friend_request",{request_id:requestId,accept_request:true});
    if(action==="decline") result=await supabase.rpc("respond_friend_request",{request_id:requestId,accept_request:false});
    if(action==="cancel") result=await supabase.rpc("cancel_friend_request",{request_id:requestId});
    if(action==="remove") result=await supabase.rpc("remove_friend",{target_user:userId});
    if(action==="block") result=await supabase.rpc("block_user",{target_user:userId});
    if(action==="unblock") result=await supabase.rpc("unblock_user",{target_user:userId});
    if(result?.error) throw result.error;
    if(action==="send") { button.textContent="Request Sent"; button.disabled=true; button.classList.add("completed"); return; }
    await loadFriendsTab(friendsTab);
  } catch(error) {
    button.disabled=false;
    window.alert(error.message||"That action could not be completed.");
  }
}


// Account & Profile
let accountProfile = null;
let settingsTab = "account";
let usernameCheckTimer = null;

async function loadAccountProfile() {
  if (!supabase || !currentUser) return;
  const { data, error } = await supabase.from("profiles")
    .select("id,username,display_name,avatar_url,bio,created_at")
    .eq("id", currentUser.id).single();
  if (error) {
    console.error("Profile load failed:", error);
    return;
  }
  accountProfile = data;
  $("#user-name").textContent = data.display_name || data.username || currentUser.email || "Orbit user";
  $("#user-avatar").textContent = (data.display_name || data.username || "O").slice(0,1).toUpperCase();
  if (activeSection === "Settings") loadSettingsTab(settingsTab);
}

function loadSettingsTab(tab = settingsTab) {
  settingsTab = tab;
  const panel = $("#settings-panel");
  if (!panel) return;
  document.querySelectorAll("[data-settings-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.settingsTab === tab);
  });
  const profile = accountProfile || {};
  if (tab === "account") {
    panel.innerHTML = `<div class="settings-panel-heading"><h2>My Account</h2><p>Manage your sign-in details and account security.</p></div>
      <form id="account-email-form" class="settings-form"><div class="form-field"><label>EMAIL ADDRESS</label><input type="email" value="${escapeHtml(currentUser?.email || "")}" disabled></div><p class="settings-help">Email address changes require confirmation from your inbox.</p><label for="new-email">NEW EMAIL ADDRESS</label><input id="new-email" type="email" autocomplete="email" placeholder="new@email.com"><button class="section-action" type="submit">Update Email</button><p id="email-form-message" class="settings-message" role="status"></p></form>
      <form id="password-change-form" class="settings-form"><h3>Change Password</h3><label for="new-password">NEW PASSWORD</label><input id="new-password" type="password" minlength="8" autocomplete="new-password" placeholder="At least 8 characters" required><label for="confirm-new-password">CONFIRM NEW PASSWORD</label><input id="confirm-new-password" type="password" minlength="8" autocomplete="new-password" placeholder="Enter it again" required><button class="section-action" type="submit">Change Password</button><p id="password-form-message" class="settings-message" role="status"></p></form>
      <div class="settings-info-row"><span>Account ID</span><code>${escapeHtml(currentUser?.id || "")}</code></div><button id="settings-logout" class="settings-logout" type="button">Log Out</button>`;
  } else if (tab === "profile") {
    panel.innerHTML = `<div class="settings-panel-heading"><h2>Profiles</h2><p>This is how other people see you on Orbit.</p></div>
      <div class="profile-preview">${profile.avatar_url ? `<img id="profile-preview-avatar" class="profile-preview-avatar profile-preview-image" src="${escapeHtml(profile.avatar_url)}" alt="Profile avatar">` : `<div id="profile-preview-avatar" class="profile-preview-avatar">${escapeHtml((profile.display_name || "O").slice(0,1).toUpperCase())}</div>`}<div><strong id="profile-preview-name">${escapeHtml(profile.display_name || "Your display name")}</strong><span id="profile-preview-username">@${escapeHtml(profile.username || "username")}</span></div></div>
      <form id="profile-edit-form" class="settings-form"><label for="profile-avatar-file">PROFILE AVATAR</label><input id="profile-avatar-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><p class="settings-help">PNG, JPG, WebP, or GIF. Maximum 5 MB.</p><p id="avatar-form-message" class="settings-message" role="status"></p><label for="profile-display-name">DISPLAY NAME</label><input id="profile-display-name" type="text" maxlength="32" value="${escapeHtml(profile.display_name || "")}" required placeholder="Your display name"><label for="profile-username">USERNAME</label><div class="username-input-wrap"><span>@</span><input id="profile-username" type="text" minlength="3" maxlength="20" pattern="[a-z0-9_]{3,20}" autocapitalize="none" autocomplete="username" value="${escapeHtml(profile.username || "")}" required placeholder="username"></div><p id="username-availability" class="settings-help">3–20 characters: lowercase letters, numbers, underscores.</p><label for="profile-bio">ABOUT ME</label><textarea id="profile-bio" maxlength="190" rows="4" placeholder="Tell people a little about yourself…">${escapeHtml(profile.bio || "")}</textarea><div class="bio-counter"><span>Up to 190 characters</span><span id="bio-count">${(profile.bio || "").length}/190</span></div><button class="section-action" type="submit">Save Changes</button><p id="profile-form-message" class="settings-message" role="status"></p></form>`;
  } else if (tab === "appearance") {
    panel.innerHTML = `<div class="settings-panel-heading"><h2>Appearance</h2><p>Choose how Orbit looks on this device.</p></div><div class="settings-info-row"><div><strong>Dark theme</strong><p>Orbit's current interface theme.</p></div><span class="settings-tag">Active</span></div>`;
  } else {
    const label = tab === "privacy" ? "Privacy & Safety" : "Notifications";
    panel.innerHTML = `<div class="settings-panel-heading"><h2>${label}</h2><p>These controls will be connected as their supporting systems are completed.</p></div><div class="settings-info-row"><span>${label} settings</span><span class="settings-tag">Not available yet</span></div>`;
  }
}

async function checkProfileUsername() {
  const input = $("#profile-username");
  const status = $("#username-availability");
  if (!input || !status) return;
  const username = input.value.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    status.textContent = "Use 3–20 lowercase letters, numbers, or underscores.";
    status.dataset.state = "error";
    return;
  }
  if (username === accountProfile?.username) {
    status.textContent = "This is your current username.";
    status.dataset.state = "success";
    return;
  }
  status.textContent = "Checking availability…";
  status.dataset.state = "pending";
  const { data, error } = await supabase.rpc("is_username_available", { requested_username: username });
  if (error) {
    status.textContent = "Could not check username availability.";
    status.dataset.state = "error";
  } else {
    status.textContent = data ? "Username is available." : "That username is already taken.";
    status.dataset.state = data ? "success" : "error";
  }
}


document.addEventListener("change", async (event) => {
  if (event.target.id !== "profile-avatar-file") return;
  const file = event.target.files?.[0];
  const status = $("#avatar-form-message");
  if (!file || !status) return;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
    status.textContent = "Choose a JPG, PNG, WebP, or GIF image up to 5 MB.";
    status.dataset.state = "error";
    event.target.value = "";
    return;
  }
  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" })[file.type];
  const path = `${currentUser.id}/avatar.${extension}`;
  status.textContent = "Uploading avatar…";
  status.dataset.state = "pending";
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600", contentType: file.type, upsert: true
  });
  if (uploadError) {
    status.textContent = uploadError.message || "Avatar upload failed.";
    status.dataset.state = "error";
    return;
  }
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = data.publicUrl + `?v=${Date.now()}`;
  const { error: updateError } = await supabase.from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", currentUser.id);
  if (updateError) {
    status.textContent = updateError.message || "Could not save avatar to your profile.";
    status.dataset.state = "error";
    return;
  }
  status.textContent = "Avatar updated.";
  status.dataset.state = "success";
  await loadAccountProfile();
});

document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-settings-tab]");
  if (tab) loadSettingsTab(tab.dataset.settingsTab);
});

document.addEventListener("input", (event) => {
  if (event.target.id === "profile-username") {
    const value = event.target.value;
    $("#profile-preview-username").textContent = "@" + value.toLowerCase();
    clearTimeout(usernameCheckTimer);
    usernameCheckTimer = setTimeout(checkProfileUsername, 450);
  }
  if (event.target.id === "profile-display-name") {
    $("#profile-preview-name").textContent = event.target.value || "Your display name";
    $("#profile-preview-avatar").textContent = (event.target.value || "O").slice(0,1).toUpperCase();
  }
  if (event.target.id === "profile-bio") $("#bio-count").textContent = event.target.value.length + "/190";
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "profile-edit-form") {
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    const status = $("#profile-form-message");
    button.disabled = true;
    status.textContent = "Saving…";
    const values = {
      requested_username: $("#profile-username").value.trim().toLowerCase(),
      requested_display_name: $("#profile-display-name").value.trim(),
      requested_bio: $("#profile-bio").value.trim()
    };
    const { error } = await supabase.rpc("update_my_profile", values);
    button.disabled = false;
    if (error) {
      status.textContent = error.message || "Unable to save profile.";
      status.dataset.state = "error";
      return;
    }
    status.textContent = "Profile updated.";
    status.dataset.state = "success";
    await loadAccountProfile();
    loadSettingsTab("profile");
  }
  if (event.target.id === "account-email-form") {
    event.preventDefault();
    const status = $("#email-form-message");
    const email = $("#new-email").value.trim();
    if (!email) { status.textContent = "Enter a new email address."; return; }
    const { error } = await supabase.auth.updateUser({ email });
    status.textContent = error ? error.message : "Check your new email address to confirm the change.";
    status.dataset.state = error ? "error" : "success";
  }
  if (event.target.id === "password-change-form") {
    event.preventDefault();
    const status = $("#password-form-message");
    const password = $("#new-password").value;
    if (password !== $("#confirm-new-password").value) {
      status.textContent = "The passwords do not match.";
      status.dataset.state = "error";
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    status.textContent = error ? error.message : "Password updated successfully.";
    status.dataset.state = error ? "error" : "success";
    if (!error) event.target.reset();
  }
});

let currentUser = null;
async function signOut() {
  closeAccountMenu();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    showAuth(error.message);
    return;
  }
  currentUser = null;
  form.reset();
  setAuthMode("signin");
  showAuth();
}

function closeAccountMenu() {
  $("#account-menu").hidden = true;
  $("#account-menu-button").setAttribute("aria-expanded", "false");
}
function closeMobileSidebar() {
  workspace.classList.remove("sidebar-open");
  $("#mobile-backdrop").hidden = true;
}
function openMobileSidebar() {
  workspace.classList.add("sidebar-open");
  $("#mobile-backdrop").hidden = false;
}

passwordToggle.addEventListener("click", () => setPasswordVisibility(passwordInput.type === "password"));
switchButton.addEventListener("click", () => setAuthMode(authMode === "signin" ? "signup" : "signin"));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  if (!isSupabaseConfigured || !supabase) {
    message.textContent = "Account service is not configured.";
    return;
  }
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (authMode === "signup" && !/^[a-z0-9_]{3,20}$/.test($("#username").value.trim().toLowerCase())) {
    message.textContent = "Username must be 3–20 characters using lowercase letters, numbers, or underscores.";
    $("#username").focus();
    return;
  }
  if (authMode === "signup" && password !== confirmPasswordInput.value) {
    message.textContent = "Your passwords do not match.";
    confirmPasswordInput.focus();
    return;
  }
  if (authMode === "signup") {
    const { data: available, error: availabilityError } = await supabase.rpc("is_username_available", { requested_username: $("#username").value.trim().toLowerCase() });
    if (availabilityError || !available) {
      message.textContent = availabilityError ? "Unable to verify username. Please try again." : "That username is already taken. Choose another one.";
      $("#username").focus();
      return;
    }
  }
  submit.disabled = true;
  submit.textContent = authMode === "signup" ? "Creating account…" : "Logging in…";
  try {
    const result = authMode === "signup"
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: $("#display-name").value.trim() || email.split("@")[0], username: $("#username").value.trim().toLowerCase() } }
        })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    if (authMode === "signup" && !result.data.session) {
      message.textContent = "Check your email to confirm your account, then log in.";
      return;
    }
    if (result.data.user) {
      currentUser = result.data.user;
      showWorkspace(result.data.user);
    }
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : "Unable to continue. Please try again.";
  } finally {
    submit.disabled = false;
    submit.textContent = authMode === "signup" ? "Create Account" : "Log In";
  }
});

forgotPasswordButton.addEventListener("click", async () => {
  message.textContent = "";
  if (!isSupabaseConfigured || !supabase) {
    message.textContent = "Account service is not configured.";
    return;
  }
  const email = emailInput.value.trim();
  if (!email) {
    message.textContent = "Enter your email address first.";
    emailInput.focus();
    return;
  }
  forgotPasswordButton.disabled = true;
  forgotPasswordButton.textContent = "Sending…";
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) throw error;
    message.textContent = "If an account exists for that email, a password reset link will be sent.";
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : "Unable to send the reset email.";
  } finally {
    forgotPasswordButton.disabled = false;
    forgotPasswordButton.textContent = "Forgot your password?";
  }
});

document.addEventListener("click", (event) => {
  const friendTabButton=event.target.closest("[data-friends-tab]");
  if(friendTabButton){loadFriendsTab(friendTabButton.dataset.friendsTab);return;}
  const friendActionButton=event.target.closest("[data-friend-action]");
  if(friendActionButton){handleFriendAction(friendActionButton);return;}
  const sectionButton = event.target.closest("[data-section]");
  if (sectionButton) {
    renderSection(sectionButton.dataset.section);
    closeAccountMenu();
    return;
  }
  if (!event.target.closest(".account-bar")) closeAccountMenu();
});

document.addEventListener("submit",(event)=>{
  if(event.target.id==="friend-search-form"){
    event.preventDefault();
    searchFriendProfiles($("#friend-search-input").value);
  }
});
$("#account-menu-button").addEventListener("click", () => {
  const menu = $("#account-menu");
  const willOpen = menu.hidden;
  menu.hidden = !willOpen;
  $("#account-menu-button").setAttribute("aria-expanded", String(willOpen));
});
$("#account-menu").addEventListener("click", (event) => {
  const action = event.target.closest("[data-account-action]")?.dataset.accountAction;
  if (!action) return;
  closeAccountMenu();
  if (action === "logout") signOut();
  if (action === "settings") renderSection("Settings");
  if (action === "profile") { renderSection("Settings"); loadSettingsTab("profile"); }
});
$("#rail-settings").addEventListener("click", () => renderSection("Settings"));
document.querySelectorAll("#create-community, #create-community-shortcut").forEach((button) => button.addEventListener("click", () => renderSection("Communities")));
$("#workspace-menu-button").addEventListener("click", () => renderSection("Home"));
$("#mobile-sidebar-toggle").addEventListener("click", openMobileSidebar);
$("#mobile-backdrop").addEventListener("click", closeMobileSidebar);
$("#inbox-button").addEventListener("click", () => renderSection("Messages"));
$("#help-button").addEventListener("click", () => renderSection("Help"));

setAuthMode("signin");
if (!isSupabaseConfigured || !supabase) {
  showAuth("Account service is not configured.");
} else {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    showWorkspace(session.user);
  } else showAuth();
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      currentUser = session.user;
      showWorkspace(session.user);
    } else if (!session) {
      currentUser = null;
      showAuth();
    }
  });
}
