import { supabase } from "./lib/supabase.js";

const $ = (selector, root = document) => root.querySelector(selector);
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const state = {
  user: null, communities: [], discovered: [], activeCommunity: null,
  channels: [], categories: [], activeChannel: null, messages: [],
  members: [], roles: [], tab: "joined", realtime: null, messageRealtime: null,
  loading: false
};

export function renderCommunitiesView() {
  return `
    <section class="section-heading community-page-heading">
      <div><p class="welcome-kicker">YOUR COMMUNITIES</p><h1>Communities</h1><p>Build a space, join a community, and talk in channels.</p></div>
      <button class="section-action" type="button" data-community-action="create">Create community</button>
    </section>
    <section class="community-app">
      <aside class="community-browser">
        <div class="community-browser-tabs">
          <button type="button" data-community-tab="joined" class="community-browser-tab active">Joined</button>
          <button type="button" data-community-tab="discover" class="community-browser-tab">Discover</button>
        </div>
        <label class="community-search"><span>⌕</span><input id="community-search" type="search" placeholder="Search communities" autocomplete="off"></label>
        <div id="community-list" class="community-list"><p class="friends-loading">Loading communities…</p></div>
        <form id="community-join-form" class="community-join-form">
          <label for="community-invite-input">Have an invite link?</label>
          <div><input id="community-invite-input" type="url" placeholder="Paste invite link"><button type="submit" aria-label="Join with invite">Join</button></div>
          <p id="community-browser-feedback" role="status"></p>
        </form>
      </aside>
      <div id="community-detail" class="community-detail">
        <div class="community-welcome-empty"><span class="community-empty-mark">O</span><h2>Your communities, together.</h2><p>Select a community or discover a new one to get started.</p><button type="button" class="section-action" data-community-tab="discover">Explore communities</button></div>
      </div>
    </section>
    <div id="community-modal-root"></div>`;
}

export async function activateCommunitiesView(user) {
  state.user = user || null;
  if (!state.user || !supabase) return;
  await loadCommunities();
  setupCommunityRealtime();
  const invite = new URLSearchParams(location.search).get("invite");
  if (invite) await redeemInvite(invite, true);
}

export function cleanupCommunities() {
  if (state.realtime) supabase?.removeChannel(state.realtime);
  if (state.messageRealtime) supabase?.removeChannel(state.messageRealtime);
  state.realtime = null;
  state.messageRealtime = null;
  state.user = null;
}

function setFeedback(message, isError = false) {
  const node = $("#community-browser-feedback");
  if (node) { node.textContent = message; node.dataset.state = isError ? "error" : "success"; }
}

function setupCommunityRealtime() {
  if (!supabase || !state.user) return;
  if (state.realtime) supabase.removeChannel(state.realtime);
  state.realtime = supabase.channel(`orbit-communities-${state.user.id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_members", filter: `user_id=eq.${state.user.id}` }, () => {
      if (document.querySelector(".community-app")) loadCommunities();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "communities" }, () => {
      if (document.querySelector(".community-app")) loadCommunities();
    })
    .subscribe();
}

async function loadCommunities() {
  const list = $("#community-list");
  if (!list || !state.user) return;
  list.innerHTML = '<p class="friends-loading">Loading…</p>';
  const { data, error } = await supabase.from("communities")
    .select("id,name,description,icon_url,owner_id,visibility,community_members!inner(user_id,member_state)")
    .eq("community_members.user_id", state.user.id)
    .eq("community_members.member_state", "active")
    .order("name");
  if (error) {
    list.innerHTML = '<div class="community-list-empty">Could not load communities. Try again.</div>';
    console.error("Community list failed:", error);
    return;
  }
  state.communities = data || [];
  await renderCommunityList();
  if (state.activeCommunity) {
    const stillJoined = state.communities.find((item) => item.id === state.activeCommunity.id);
    if (stillJoined) await openCommunity(stillJoined.id, false);
    else {
      state.activeCommunity = null;
      state.activeChannel = null;
      renderCommunityEmpty();
    }
  }
}

async function renderCommunityList() {
  const list = $("#community-list");
  if (!list) return;
  let items = state.communities;
  if (state.tab === "discover") {
    const joinedIds = state.communities.map((item) => item.id);
    let query = supabase.from("communities").select("id,name,description,icon_url,owner_id,visibility")
      .eq("visibility", "public").order("created_at", { ascending: false }).limit(60);
    const { data, error } = await query;
    if (error) {
      list.innerHTML = '<div class="community-list-empty">Could not load discovery.</div>';
      return;
    }
    state.discovered = (data || []).filter((item) => !joinedIds.includes(item.id));
    items = state.discovered;
  }
  const search = ($("#community-search")?.value || "").trim().toLowerCase();
  if (search) items = items.filter((item) => item.name.toLowerCase().includes(search) || (item.description || "").toLowerCase().includes(search));
  if (!items.length) {
    list.innerHTML = state.tab === "discover"
      ? '<div class="community-list-empty"><strong>No communities found</strong><span>Try another search or create a new community.</span></div>'
      : '<div class="community-list-empty"><strong>No communities yet</strong><span>Join a public community or create your own.</span></div>';
    return;
  }
  list.innerHTML = items.map((item) => `
    <button type="button" class="community-list-item ${state.activeCommunity?.id === item.id ? "selected" : ""}" data-community-id="${escapeHtml(item.id)}">
      <span class="community-list-avatar">${item.icon_url ? `<img src="${escapeHtml(item.icon_url)}" alt="">` : escapeHtml(item.name.slice(0, 1).toUpperCase())}</span>
      <span class="community-list-copy"><strong>${escapeHtml(item.name)}</strong><small>${state.tab === "discover" ? "Public community" : escapeHtml(item.description || "Community")}</small></span>
      ${state.tab === "discover" ? '<span class="community-list-join">+</span>' : ""}
    </button>`).join("");
}

function renderCommunityEmpty() {
  const detail = $("#community-detail");
  if (detail) detail.innerHTML = '<div class="community-welcome-empty"><span class="community-empty-mark">O</span><h2>Your communities, together.</h2><p>Select a community or discover a new one to get started.</p></div>';
}

async function openCommunity(id, selectFirst = true) {
  const community = [...state.communities, ...state.discovered].find((item) => item.id === id);
  if (!community) return;
  state.activeCommunity = community;
  if (selectFirst) state.activeChannel = null;
  try {
    await Promise.all([loadCommunityStructure(), loadCommunityMembers(), loadCommunityRoles()]);
    if (!state.activeChannel && state.channels.length) state.activeChannel = state.channels.find((channel) => channel.channel_type === "text") || state.channels[0];
    await renderCommunityDetail();
    if (state.activeChannel) await loadChannelMessages();
    else renderChannelEmpty();
  } catch (error) {
    const detail = $("#community-detail");
    if (detail) detail.innerHTML = `<div class="community-channel-placeholder"><h3>Could not open community</h3><p>${escapeHtml(error.message || "Please try again.")}</p></div>`;
    console.error("Community open failed:", error);
  }
  renderCommunityList();
}

async function loadCommunityStructure() {
  const id = state.activeCommunity.id;
  const [categoriesResult, channelsResult] = await Promise.all([
    supabase.from("channel_categories").select("id,name,position").eq("community_id", id).order("position"),
    supabase.from("channels").select("id,community_id,category_id,name,description,channel_type,is_private,position").eq("community_id", id).order("position")
  ]);
  if (categoriesResult.error) throw categoriesResult.error;
  if (channelsResult.error) throw channelsResult.error;
  state.categories = categoriesResult.data || [];
  state.channels = channelsResult.data || [];
}

async function loadCommunityMembers() {
  const { data, error } = await supabase.from("community_members")
    .select("user_id,joined_at")
    .eq("community_id", state.activeCommunity.id).eq("member_state", "active")
    .order("joined_at").limit(200);
  if (error) throw error;
  const ids = (data || []).map((item) => item.user_id);
  const { data: profiles, error: profileError } = ids.length
    ? await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", ids)
    : { data: [], error: null };
  if (profileError) throw profileError;
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  state.members = (data || []).map((item) => ({ ...item, profiles: profileMap.get(item.user_id) || null }));
}

async function loadCommunityRoles() {
  const { data, error } = await supabase.from("roles")
    .select("id,name,color,position,is_default,is_managed")
    .eq("community_id", state.activeCommunity.id).order("position");
  if (error) throw error;
  state.roles = data || [];
}

async function renderCommunityDetail() {
  const detail = $("#community-detail");
  if (!detail || !state.activeCommunity) return;
  const community = state.activeCommunity;
  const owner = community.owner_id === state.user.id;
  const grouped = state.categories.map((category) => ({
    ...category, channels: state.channels.filter((channel) => channel.category_id === category.id)
  }));
  const uncategorized = state.channels.filter((channel) => !channel.category_id);
  detail.innerHTML = `
    <header class="community-detail-header">
      <div class="community-detail-identity"><span class="community-detail-avatar">${community.icon_url ? `<img src="${escapeHtml(community.icon_url)}" alt="">` : escapeHtml(community.name.slice(0,1).toUpperCase())}</span><div><h2>${escapeHtml(community.name)}</h2><p>${escapeHtml(community.description || "A place for your community.")}</p></div></div>
      <div class="community-header-actions">
        <button type="button" class="community-secondary-button" data-community-action="invite">Invite</button>
        ${owner ? '<button type="button" class="community-secondary-button" data-community-action="settings">Settings</button>' : '<button type="button" class="community-secondary-button danger" data-community-action="leave">Leave</button>'}
      </div>
    </header>
    <div class="community-detail-body">
      <aside class="community-channel-sidebar">
        <div class="community-channel-tools"><span>CHANNELS</span>${owner ? '<button type="button" data-community-action="add-category" aria-label="Add category" title="Add category">+</button><button type="button" data-community-action="add-channel" aria-label="Add channel" title="Add channel">＋</button>' : ""}</div>
        <div class="community-channel-list">
          ${grouped.map((category) => `<section class="community-channel-group"><div class="community-channel-category"><span>${escapeHtml(category.name)}</span>${owner ? `<button type="button" data-community-action="rename-category" data-category-id="${category.id}" aria-label="Rename ${escapeHtml(category.name)}">···</button>` : ""}</div>${category.channels.map(channelButton).join("")}</section>`).join("")}
          ${uncategorized.map(channelButton).join("")}
          ${!state.channels.length ? '<p class="community-channel-empty">No channels yet.</p>' : ""}
        </div>
      </aside>
      <section class="community-channel-content" id="community-channel-content">
        <div class="community-channel-placeholder"><h3>Choose a channel</h3><p>Select a channel to open its conversation.</p></div>
      </section>
      <aside class="community-member-sidebar">
        <div class="community-member-heading">MEMBERS <span>${state.members.length}</span></div>
        ${state.members.map((entry) => {
          const profile = entry.profiles || {};
          const label = profile.display_name || profile.username || "Orbit member";
          return `<div class="community-member-row"><span class="community-member-avatar">${profile.avatar_url ? `<img src="${escapeHtml(profile.avatar_url)}" alt="">` : escapeHtml(label.slice(0,1).toUpperCase())}</span><span><strong>${escapeHtml(label)}</strong><small>${entry.user_id === community.owner_id ? "Owner" : "Member"}</small></span></div>`;
        }).join("")}
        ${owner ? '<button type="button" class="community-manage-roles" data-community-action="roles">Manage roles</button>' : ""}
      </aside>
    </div>`;
}

function channelButton(channel) {
  const symbol = channel.channel_type === "voice" ? "◖" : "#";
  return `<button type="button" class="community-channel-item ${state.activeChannel?.id === channel.id ? "selected" : ""}" data-channel-id="${escapeHtml(channel.id)}"><span>${symbol}</span>${escapeHtml(channel.name)}</button>`;
}

async function openChannel(id) {
  const channel = state.channels.find((item) => item.id === id);
  if (!channel) return;
  state.activeChannel = channel;
  await renderCommunityDetail();
  await loadChannelMessages();
  if (state.messageRealtime) supabase.removeChannel(state.messageRealtime);
  state.messageRealtime = supabase.channel(`orbit-channel-${id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "channel_messages", filter: `channel_id=eq.${id}` }, () => {
      if (state.activeChannel?.id === id) loadChannelMessages();
    }).subscribe();
}

async function loadChannelMessages() {
  const channel = state.activeChannel;
  const root = $("#community-channel-content");
  if (!channel || !root) return renderChannelEmpty();
  if (channel.channel_type !== "text" && channel.channel_type !== "announcement") {
    root.innerHTML = `<div class="community-channel-placeholder"><h3>${channel.channel_type === "voice" ? "Voice channel" : escapeHtml(channel.channel_type)} </h3><p>This channel type is set up. Its live experience will be added in the voice and community feature stages.</p></div>`;
    return;
  }
  root.innerHTML = '<p class="friends-loading">Loading channel…</p>';
  const { data, error } = await supabase.from("channel_messages")
    .select("id,content,sender_id,created_at,edited_at,deleted_at")
    .eq("channel_id", channel.id).order("created_at", { ascending: true }).limit(100);
  if (error) {
    root.innerHTML = '<div class="community-channel-placeholder"><h3>Could not load messages</h3><p>Check your connection and try again.</p><button type="button" class="community-secondary-button" data-community-action="retry-channel">Retry</button></div>';
    console.error("Channel messages failed:", error);
    return;
  }
  const senderIds = [...new Set((data || []).map((item) => item.sender_id))];
  const { data: profiles, error: profileError } = senderIds.length
    ? await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", senderIds)
    : { data: [], error: null };
  if (profileError) {
    root.innerHTML = '<div class="community-channel-placeholder"><h3>Could not load member profiles</h3><p>Try again in a moment.</p></div>';
    return;
  }
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  state.messages = (data || []).map((item) => ({ ...item, profiles: profileMap.get(item.sender_id) || null }));
  renderChannelMessages();
}

function renderChannelMessages() {
  const root = $("#community-channel-content");
  const channel = state.activeChannel;
  if (!root || !channel) return;
  const messages = state.messages.map((message) => {
    const profile = message.profiles || {};
    const name = profile.display_name || profile.username || "Orbit member";
    const deleted = Boolean(message.deleted_at);
    return `<article class="community-message"><span class="community-message-avatar">${profile.avatar_url ? `<img src="${escapeHtml(profile.avatar_url)}" alt="">` : escapeHtml(name.slice(0,1).toUpperCase())}</span><div class="community-message-copy"><div class="community-message-meta"><strong>${escapeHtml(name)}</strong><time>${escapeHtml(new Date(message.created_at).toLocaleString())}</time>${message.edited_at ? "<small>edited</small>" : ""}</div><p>${deleted ? "This message was deleted." : escapeHtml(message.content)}</p></div>${!deleted && message.sender_id === state.user.id ? `<button type="button" data-community-action="delete-message" data-message-id="${message.id}" aria-label="Delete message">×</button>` : ""}</article>`;
  }).join("");
  root.innerHTML = `
    <header class="community-channel-header"><div><h3><span>#</span> ${escapeHtml(channel.name)}</h3><p>${escapeHtml(channel.description || "Community conversation")}</p></div>${state.activeCommunity.owner_id === state.user.id ? `<button type="button" class="community-secondary-button" data-community-action="channel-settings">Channel settings</button>` : ""}</header>
    <div class="community-message-list" id="community-message-list">${messages || '<div class="community-channel-placeholder"><h3>Start the conversation</h3><p>Be the first to send a message in this channel.</p></div>'}</div>
    <form id="community-message-form" class="community-message-form"><label class="sr-only" for="community-message-input">Message #${escapeHtml(channel.name)}</label><textarea id="community-message-input" maxlength="4000" rows="1" placeholder="Message #${escapeHtml(channel.name)}" required></textarea><button type="submit" aria-label="Send message">Send</button></form>`;
  const messageList = $("#community-message-list");
  if (messageList) messageList.scrollTop = messageList.scrollHeight;
}

function renderChannelEmpty() {
  const root = $("#community-channel-content");
  if (root) root.innerHTML = '<div class="community-channel-placeholder"><h3>No text channel selected</h3><p>Create a channel or select one from the sidebar.</p></div>';
}

function showModal(title, body) {
  const root = $("#community-modal-root");
  if (!root) return;
  root.innerHTML = `<div class="community-modal-backdrop" data-modal-dismiss><section class="community-modal" role="dialog" aria-modal="true" aria-labelledby="community-modal-title"><header><h2 id="community-modal-title">${escapeHtml(title)}</h2><button type="button" data-modal-dismiss aria-label="Close">×</button></header>${body}</section></div>`;
  $("#community-modal-root input")?.focus();
}

function createCommunityModal() {
  showModal("Create a community", `<form id="community-create-form" class="community-form"><label>Community name<input name="name" minlength="2" maxlength="80" required placeholder="e.g. Space Explorers"></label><label>Description<textarea name="description" maxlength="1000" rows="3" placeholder="What is this community about?"></textarea></label><label>Visibility<select name="visibility"><option value="public">Public — anyone can discover and join</option><option value="invite_only">Invite only</option><option value="private">Private</option></select></label><p class="community-form-note">A GENERAL category and #general channel will be created automatically.</p><p class="community-modal-feedback" role="status"></p><button class="primary-button" type="submit">Create community</button></form>`);
}

function inviteModal() {
  showModal("Invite people", `<form id="community-invite-create-form" class="community-form"><p>Create a link that expires in 7 days and allows up to 25 uses.</p><button class="primary-button" type="submit">Generate invite link</button><label>Invite link<input id="community-generated-invite" readonly placeholder="Your invite link will appear here"></label><p class="community-modal-feedback" role="status"></p></form>`);
}

function settingsModal() {
  const community = state.activeCommunity;
  showModal("Community settings", `<form id="community-settings-form" class="community-form"><label>Community name<input name="name" minlength="2" maxlength="80" required value="${escapeHtml(community.name)}"></label><label>Description<textarea name="description" maxlength="1000" rows="3">${escapeHtml(community.description || "")}</textarea></label><label>Visibility<select name="visibility">${["public","private","approval","invite_only","hidden"].map((v) => `<option value="${v}" ${community.visibility === v ? "selected" : ""}>${v.replace("_"," ")}</option>`).join("")}</select></label><p class="community-modal-feedback" role="status"></p><button class="primary-button" type="submit">Save changes</button><button class="community-danger-button" type="button" data-community-action="delete-community">Delete community</button></form>`);
}

function channelModal() {
  showModal("Create a channel", `<form id="community-channel-create-form" class="community-form"><label>Channel name<input name="name" maxlength="80" required placeholder="new-channel"></label><label>Description<textarea name="description" maxlength="500" rows="2"></textarea></label><label>Category<select name="category_id"><option value="">No category</option>${state.categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}</select></label><label>Channel type<select name="channel_type"><option value="text">Text</option><option value="announcement">Announcement</option><option value="voice">Voice (setup only)</option><option value="forum">Forum (setup only)</option></select></label><p class="community-form-note">Private channel access controls will be available in the permissions stage.</p><p class="community-modal-feedback" role="status"></p><button class="primary-button" type="submit">Create channel</button></form>`);
}

function categoryModal(category = null) {
  showModal(category ? "Rename category" : "Create category", `<form id="community-category-form" class="community-form"><input type="hidden" name="id" value="${category?.id || ""}"><label>Category name<input name="name" minlength="1" maxlength="60" required value="${escapeHtml(category?.name || "")}" placeholder="e.g. COMMUNITY"></label><p class="community-modal-feedback" role="status"></p><button class="primary-button" type="submit">Save category</button></form>`);
}

function rolesModal() {
  showModal("Community roles", `<div class="community-role-list">${state.roles.map((role) => `<div class="community-role-row"><span style="--role-color:${escapeHtml(role.color || "#8b79e8")}"></span><strong>${escapeHtml(role.name)}</strong><small>${role.is_default ? "Default role" : "Custom role"}</small></div>`).join("")}</div><form id="community-role-form" class="community-form"><label>New role name<input name="name" maxlength="40" required placeholder="e.g. Moderator"></label><label>Role color<input name="color" type="color" value="#8b79e8"></label><p class="community-modal-feedback" role="status"></p><button class="primary-button" type="submit">Create role</button></form>`);
}

async function hashToken(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function redeemInvite(value, fromUrl = false) {
  const token = (value.match(/[?&]invite=([a-f0-9]{64})/i)?.[1] || value.trim()).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(token)) { setFeedback("That invite link is not valid.", true); return; }
  try {
    const tokenHash = await hashToken(token);
    const { data, error } = await supabase.rpc("redeem_community_invite", { requested_token_hash: tokenHash });
    if (error) throw error;
    if (fromUrl) history.replaceState({}, "", location.pathname + location.hash);
    setFeedback("Invite accepted. You joined the community.");
    await loadCommunities();
    await openCommunity(data);
  } catch (error) {
    setFeedback(error.message || "Unable to use this invite.", true);
  }
}

async function handleCommunityAction(action, button) {
  const owner = state.activeCommunity?.owner_id === state.user?.id;
  if (action === "create") return createCommunityModal();
  if (action === "invite") return inviteModal();
  if (action === "settings" && owner) return settingsModal();
  if (action === "add-channel" && owner) return channelModal();
  if (action === "add-category" && owner) return categoryModal();
  if (action === "rename-category" && owner) {
    const category = state.categories.find((item) => item.id === button.dataset.categoryId);
    if (category) categoryModal(category);
    return;
  }
  if (action === "roles" && owner) return rolesModal();
  if (action === "retry-channel") return loadChannelMessages();
  if (action === "channel-settings" && owner) {
    const channel = state.activeChannel;
    if (!channel) return;
    showModal("Channel settings", `<form id="community-channel-settings-form" class="community-form"><label>Channel name<input name="name" maxlength="80" required value="${escapeHtml(channel.name)}"></label><label>Description<textarea name="description" maxlength="500" rows="2">${escapeHtml(channel.description || "")}</textarea></label><label>Category<select name="category_id"><option value="">No category</option>${state.categories.map((c) => `<option value="${c.id}" ${channel.category_id === c.id ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select></label><p class="community-modal-feedback" role="status"></p><button class="primary-button" type="submit">Save channel</button><button class="community-danger-button" type="button" data-community-action="delete-channel">Delete channel</button></form>`);
    return;
  }
  if (action === "delete-message") {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("channel_messages").update({ deleted_at: new Date().toISOString(), content: "Message deleted" })
      .eq("id", button.dataset.messageId).eq("sender_id", state.user.id);
    if (error) setFeedback(error.message, true);
    else await loadChannelMessages();
    return;
  }
  if (action === "leave") {
    if (!confirm("Leave this community? You can rejoin public communities or use a new invite.")) return;
    const { error } = await supabase.from("community_members").delete()
      .eq("community_id", state.activeCommunity.id).eq("user_id", state.user.id);
    if (error) return setFeedback(error.message, true);
    state.activeCommunity = null; state.activeChannel = null;
    await loadCommunities(); renderCommunityEmpty();
    return;
  }
  if (action === "delete-community" && owner) {
    if (!confirm("Delete this community and its channels, messages, and invites? This cannot be undone.")) return;
    const { error } = await supabase.from("communities").delete().eq("id", state.activeCommunity.id).eq("owner_id", state.user.id);
    if (error) return modalFeedback(error.message, true);
    $("#community-modal-root").innerHTML = "";
    state.activeCommunity = null; state.activeChannel = null;
    await loadCommunities(); renderCommunityEmpty();
  }
  if (action === "delete-channel" && owner) {
    if (!confirm("Delete this channel and its messages?")) return;
    const { error } = await supabase.from("channels").delete().eq("id", state.activeChannel.id).eq("community_id", state.activeCommunity.id);
    if (error) return modalFeedback(error.message, true);
    $("#community-modal-root").innerHTML = "";
    state.activeChannel = null;
    await loadCommunityStructure(); await renderCommunityDetail(); renderChannelEmpty();
  }
}

function modalFeedback(message, isError = false) {
  const node = $(".community-modal-feedback");
  if (node) { node.textContent = message; node.dataset.state = isError ? "error" : "success"; }
}

document.addEventListener("click", async (event) => {
  if (!document.querySelector(".community-app")) return;
  const tab = event.target.closest("[data-community-tab]");
  if (tab) {
    state.tab = tab.dataset.communityTab;
    document.querySelectorAll("[data-community-tab]").forEach((item) => item.classList.toggle("active", item.dataset.communityTab === state.tab));
    await renderCommunityList();
    return;
  }
  if (event.target.closest("[data-modal-dismiss]")) {
    if (event.target.matches("[data-modal-dismiss]") || event.target.closest("button[data-modal-dismiss]")) $("#community-modal-root").innerHTML = "";
    return;
  }
  const actionButton = event.target.closest("[data-community-action]");
  if (actionButton) { await handleCommunityAction(actionButton.dataset.communityAction, actionButton); return; }
  const communityButton = event.target.closest("[data-community-id]");
  if (communityButton) {
    const id = communityButton.dataset.communityId;
    if (state.tab === "discover") {
      const { error } = await supabase.rpc("join_community", { target_community: id });
      if (error) return setFeedback(error.message, true);
      await loadCommunities();
      await openCommunity(id);
    } else await openCommunity(id);
    return;
  }
  const channelButton = event.target.closest("[data-channel-id]");
  if (channelButton) { await openChannel(channelButton.dataset.channelId); return; }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "community-search" && document.querySelector(".community-app")) renderCommunityList();
});

document.addEventListener("submit", async (event) => {
  if (!document.querySelector(".community-app")) return;
  const form = event.target;
  if (form.id === "community-create-form") {
    event.preventDefault();
    const values = new FormData(form);
    const button = form.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = "Creating…";
    const { data, error } = await supabase.rpc("create_community", {
      requested_name: values.get("name").trim(),
      requested_description: values.get("description").trim() || null,
      requested_visibility: values.get("visibility")
    });
    if (error) { modalFeedback(error.message, true); button.disabled = false; button.textContent = "Create community"; return; }
    $("#community-modal-root").innerHTML = "";
    state.tab = "joined";
    await loadCommunities(); await openCommunity(data);
  }
  if (form.id === "community-join-form") {
    event.preventDefault();
    const input = $("#community-invite-input");
    if (!input.value.trim()) return setFeedback("Paste an invite link first.", true);
    await redeemInvite(input.value);
    input.value = "";
  }
  if (form.id === "community-invite-create-form") {
    event.preventDefault();
    const feedback = $(".community-modal-feedback");
    const button = form.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = "Generating…";
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const token = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
      const tokenHash = await hashToken(token);
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      const { error } = await supabase.from("community_invites").insert({
        community_id: state.activeCommunity.id, created_by: state.user.id,
        token_hash: tokenHash, max_uses: 25, expires_at: expiresAt
      });
      if (error) throw error;
      const input = $("#community-generated-invite");
      input.value = `${location.origin}${location.pathname}?invite=${token}`;
      feedback.textContent = "Invite created. Copy the link and share it with people you trust.";
      const copy = document.createElement("button");
      copy.type = "button"; copy.className = "community-secondary-button"; copy.textContent = "Copy link";
      copy.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(input.value); feedback.textContent = "Invite link copied."; }
        catch { input.select(); feedback.textContent = "Select and copy the invite link."; }
      });
      form.append(copy);
    } catch (error) { feedback.textContent = error.message || "Could not create invite."; }
    finally { button.disabled = false; button.textContent = "Generate invite link"; }
  }
  if (form.id === "community-settings-form") {
    event.preventDefault();
    const values = new FormData(form);
    const { data, error } = await supabase.from("communities").update({
      name: values.get("name").trim(), description: values.get("description").trim() || null,
      visibility: values.get("visibility"), updated_at: new Date().toISOString()
    }).eq("id", state.activeCommunity.id).eq("owner_id", state.user.id)
      .select("id,name,description,icon_url,owner_id,visibility").single();
    if (error) return modalFeedback(error.message, true);
    state.activeCommunity = data;
    $("#community-modal-root").innerHTML = "";
    await loadCommunities(); await openCommunity(data.id, false);
  }
  if (form.id === "community-channel-create-form") {
    event.preventDefault();
    const values = new FormData(form);
    const { error } = await supabase.from("channels").insert({
      community_id: state.activeCommunity.id, name: values.get("name").trim().toLowerCase().replace(/\s+/g, "-"),
      description: values.get("description").trim() || null, category_id: values.get("category_id") || null,
      channel_type: values.get("channel_type"), is_private: false,
      position: state.channels.length
    });
    if (error) return modalFeedback(error.message, true);
    $("#community-modal-root").innerHTML = "";
    await loadCommunityStructure(); await renderCommunityDetail();
  }
  if (form.id === "community-category-form") {
    event.preventDefault();
    const values = new FormData(form);
    const id = values.get("id");
    const result = id
      ? await supabase.from("channel_categories").update({ name: values.get("name").trim() }).eq("id", id).eq("community_id", state.activeCommunity.id)
      : await supabase.from("channel_categories").insert({ community_id: state.activeCommunity.id, name: values.get("name").trim(), position: state.categories.length });
    if (result.error) return modalFeedback(result.error.message, true);
    $("#community-modal-root").innerHTML = "";
    await loadCommunityStructure(); await renderCommunityDetail();
  }
  if (form.id === "community-channel-settings-form") {
    event.preventDefault();
    const values = new FormData(form);
    const { error } = await supabase.from("channels").update({
      name: values.get("name").trim().toLowerCase().replace(/\s+/g, "-"),
      description: values.get("description").trim() || null, category_id: values.get("category_id") || null
    }).eq("id", state.activeChannel.id).eq("community_id", state.activeCommunity.id);
    if (error) return modalFeedback(error.message, true);
    $("#community-modal-root").innerHTML = "";
    await loadCommunityStructure(); await renderCommunityDetail(); await loadChannelMessages();
  }
  if (form.id === "community-role-form") {
    event.preventDefault();
    const values = new FormData(form);
    const { error } = await supabase.from("roles").insert({
      community_id: state.activeCommunity.id, name: values.get("name").trim(),
      color: values.get("color"), position: state.roles.length, is_default: false, is_managed: false
    });
    if (error) return modalFeedback(error.message, true);
    await loadCommunityRoles(); rolesModal();
  }
  if (form.id === "community-message-form") {
    event.preventDefault();
    const input = $("#community-message-input");
    const content = input.value.trim();
    if (!content || !state.activeChannel) return;
    const button = form.querySelector("button");
    button.disabled = true;
    const { error } = await supabase.from("channel_messages").insert({
      channel_id: state.activeChannel.id, sender_id: state.user.id, content
    });
    button.disabled = false;
    if (error) return setFeedback(error.message, true);
    input.value = "";
    await loadChannelMessages();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $("#community-modal-root")?.innerHTML) $("#community-modal-root").innerHTML = "";
});
