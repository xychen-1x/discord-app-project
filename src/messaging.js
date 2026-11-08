import { supabase } from './lib/supabase.js';

const $ = (selector, root = document) => root.querySelector(selector);
const allowedTypes = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain', 'text/csv', 'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);
const quickReactions = ['👍', '❤️', '😂', '🎉', '🔥'];

let currentUser = null;
let navigateToMessages = () => {};
let messagingInitialized = false;
let activeConversationId = null;
let activeConversation = null;
let conversationCache = [];
let memberProfiles = new Map();
let loadedMessages = [];
let activeAttachments = [];
let activeReactions = [];
let activeBookmarks = new Set();
let activePins = new Set();
let replyTarget = null;
let conversationSearch = '';
let messageSearch = '';
let pickerMode = 'direct';
let pickerFriends = [];
let selectedFriendIds = new Set();
let liveChannel = null;
let listChannel = null;
let typingTimer = null;
let typingStopTimer = null;
let messageSearchTimer = null;
let loadingConversationId = null;

export function renderMessagesView() {
  return '<section class="section-heading messaging-page-heading">' +
    '<div><p class="welcome-kicker">PRIVATE CONVERSATIONS</p><h1>Messages</h1><p>Direct messages and group conversations.</p></div>' +
    '<div class="messaging-page-actions"><button class="message-secondary-button" type="button" data-open-new-message>New message</button><button class="section-action" type="button" data-open-new-group>New group</button></div>' +
    '</section>' +
    '<p id="messaging-feedback" class="messaging-feedback" role="status" aria-live="polite"></p>' +
    '<section class="messaging-layout" aria-label="Messages">' +
      '<aside class="conversation-sidebar">' +
        '<div class="conversation-sidebar-title"><strong>Direct messages</strong><button class="message-icon-button" type="button" data-open-new-message aria-label="Start a new message" title="New message">+</button></div>' +
        '<label class="conversation-search-wrap"><span aria-hidden="true">⌕</span><input id="conversation-search" type="search" placeholder="Find a conversation" autocomplete="off" aria-label="Find a conversation"></label>' +
        '<div id="conversation-list" class="conversation-list"><div class="friends-loading">Loading conversations…</div></div>' +
      '</aside>' +
      '<section id="chat-panel" class="chat-panel"><div class="chat-empty"><span class="empty-illustration">✉</span><h2>Your conversations</h2><p>Choose a conversation or start a new message with one of your friends.</p><button class="section-action" type="button" data-open-new-message>New message</button></div></section>' +
    '</section>' +
    '<div id="new-conversation-modal" class="message-modal-backdrop" hidden>' +
      '<section class="message-modal" role="dialog" aria-modal="true" aria-labelledby="message-modal-title">' +
        '<div class="message-modal-header"><div><p class="welcome-kicker">ORBIT MESSAGES</p><h2 id="message-modal-title">New conversation</h2></div><button class="message-icon-button" type="button" data-close-message-modal aria-label="Close">×</button></div>' +
        '<form id="new-conversation-form" class="message-modal-body">' +
          '<label id="new-group-name-field" class="message-form-label" hidden>GROUP NAME<input id="new-group-name" type="text" maxlength="80" placeholder="Give your group a name"></label>' +
          '<label class="message-form-label">FIND FRIENDS<input id="new-conversation-search" type="search" placeholder="Search your friends" autocomplete="off"></label>' +
          '<p id="new-conversation-hint" class="message-modal-hint">Choose one friend to start a direct message.</p>' +
          '<div id="new-conversation-friends" class="message-friend-picker"><div class="friends-loading">Loading friends…</div></div>' +
          '<p id="new-conversation-error" class="message-feedback" role="status"></p>' +
          '<div class="message-modal-footer"><button class="message-secondary-button" type="button" data-close-message-modal>Cancel</button><button id="new-conversation-submit" class="section-action" type="submit" disabled>Start conversation</button></div>' +
        '</form>' +
      '</section>' +
    '</div>';
}

function setFeedback(text, state = '') {
  const host = $('#messaging-feedback');
  if (!host) return;
  host.textContent = text || '';
  host.dataset.state = state;
}

function setComposerFeedback(text, state = '') {
  const host = $('#chat-feedback');
  if (!host) return;
  host.textContent = text || '';
  host.dataset.state = state;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function initials(value = '') {
  return String(value).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'O';
}

function displayProfile(profile = {}) {
  return profile.display_name || profile.username || 'Orbit user';
}

function formatMessageTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatConversationTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? formatMessageTime(value)
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function profileAvatar(profile, className = 'conversation-avatar') {
  if (profile?.avatar_url) {
    return '<img class="' + className + ' conversation-avatar-image" src="' +
      escapeHtml(profile.avatar_url) + '" alt="" loading="lazy">';
  }
  return '<span class="' + className + '" aria-hidden="true">' +
    escapeHtml(initials(displayProfile(profile || {}))) + '</span>';
}

function conversationName(conversation) {
  if (conversation.conversation_type === 'group') return conversation.title || 'Group conversation';
  const other = (conversation.members || []).find((member) => member.id !== currentUser?.id);
  return other ? displayProfile(other) : 'Direct message';
}

function conversationSubtitle(conversation) {
  if (conversation.conversation_type === 'group') {
    const names = (conversation.members || []).map(displayProfile);
    return names.length ? names.join(', ') : 'Group conversation';
  }
  const other = (conversation.members || []).find((member) => member.id !== currentUser?.id);
  return other?.username ? '@' + other.username : 'Direct message';
}

function renderConversationList() {
  const host = $('#conversation-list');
  if (!host) return;
  const query = conversationSearch.trim().toLowerCase();
  const list = conversationCache.filter((item) => {
    if (!query) return true;
    const text = [conversationName(item), conversationSubtitle(item), item.preview || ''].join(' ').toLowerCase();
    return text.includes(query);
  });
  if (!list.length) {
    host.innerHTML = '<div class="conversation-list-empty"><strong>' +
      (query ? 'No matches' : 'No conversations yet') +
      '</strong><p>' + (query ? 'Try a different search.' : 'Start a direct message with a friend or create a group.') + '</p></div>';
    return;
  }
  host.innerHTML = list.map((item) => {
    const name = conversationName(item);
    const unread = item.unread ? '<span class="conversation-unread-dot" aria-label="Unread"></span>' : '';
    const subtitle = item.preview || (item.conversation_type === 'group' ? 'Group created' : conversationSubtitle(item));
    return '<button class="conversation-list-item' + (item.id === activeConversationId ? ' active' : '') +
      (item.unread ? ' has-unread' : '') + '" type="button" data-conversation-id="' + escapeHtml(item.id) + '">' +
      (item.conversation_type === 'group'
        ? '<span class="conversation-group-avatar" aria-hidden="true">' + escapeHtml(initials(name)) + '</span>'
        : profileAvatar((item.members || []).find((member) => member.id !== currentUser?.id))) +
      '<span class="conversation-list-copy"><strong>' + escapeHtml(name) + '</strong><span>' +
      escapeHtml(subtitle) + '</span></span><span class="conversation-list-meta">' +
      escapeHtml(formatConversationTime(item.last_message_at)) + unread + '</span></button>';
  }).join('');
}

async function loadConversationList() {
  const host = $('#conversation-list');
  if (!host || !supabase || !currentUser) return;
  host.innerHTML = '<div class="friends-loading">Loading conversations…</div>';
  const { data: memberships, error: membershipError } = await supabase
    .from('conversation_members')
    .select('conversation_id,last_read_at,is_muted,joined_at')
    .eq('user_id', currentUser.id)
    .order('joined_at', { ascending: false });
  if (membershipError) {
    host.innerHTML = '<div class="conversation-list-empty"><strong>Could not load messages</strong><p>Check your connection and try again.</p></div>';
    setFeedback('Conversation list could not be loaded.', 'error');
    console.error('Conversation membership load failed:', membershipError);
    return;
  }
  const memberRows = memberships || [];
  const ids = memberRows.map((row) => row.conversation_id);
  if (!ids.length) {
    conversationCache = [];
    renderConversationList();
    return;
  }
  const [conversationResult, membersResult, previewsResult] = await Promise.all([
    supabase.from('conversations')
      .select('id,conversation_type,title,created_by,created_at,updated_at,last_message_at')
      .in('id', ids)
      .order('last_message_at', { ascending: false, nullsFirst: false }),
    supabase.from('conversation_members')
      .select('conversation_id,user_id,last_read_at,is_muted')
      .in('conversation_id', ids),
    supabase.from('messages')
      .select('id,conversation_id,sender_id,content,message_type,created_at')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false })
      .limit(Math.min(500, Math.max(100, ids.length * 8)))
  ]);
  if (conversationResult.error || membersResult.error || previewsResult.error) {
    const error = conversationResult.error || membersResult.error || previewsResult.error;
    setFeedback(error.message || 'Could not load conversations.', 'error');
    console.error('Conversation list query failed:', error);
    return;
  }
  const allMemberRows = membersResult.data || [];
  const memberIds = [...new Set(allMemberRows.map((row) => row.user_id))];
  const { data: profiles, error: profileError } = memberIds.length
    ? await supabase.from('profiles').select('id,username,display_name,avatar_url').in('id', memberIds)
    : { data: [], error: null };
  if (profileError) {
    setFeedback('Conversation profiles could not be loaded.', 'error');
    console.error('Conversation profile query failed:', profileError);
    return;
  }
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const membershipsById = new Map(memberRows.map((row) => [row.conversation_id, row]));
  const membersByConversation = new Map();
  for (const row of allMemberRows) {
    if (!membersByConversation.has(row.conversation_id)) membersByConversation.set(row.conversation_id, []);
    const profile = profileMap.get(row.user_id);
    if (profile) membersByConversation.get(row.conversation_id).push(profile);
  }
  const previewByConversation = new Map();
  for (const message of previewsResult.data || []) {
    if (!previewByConversation.has(message.conversation_id)) previewByConversation.set(message.conversation_id, message);
  }
  conversationCache = (conversationResult.data || []).map((conversation) => {
    const membership = membershipsById.get(conversation.id) || {};
    const members = membersByConversation.get(conversation.id) || [];
    const preview = previewByConversation.get(conversation.id);
    const unread = Boolean(preview && preview.sender_id !== currentUser.id &&
      (!membership.last_read_at || new Date(preview.created_at) > new Date(membership.last_read_at)));
    return {
      ...conversation,
      members,
      is_muted: membership.is_muted,
      last_read_at: membership.last_read_at,
      preview: preview
        ? (preview.message_type === 'image' ? 'Image' : preview.message_type === 'file' ? 'Attachment' : (preview.content || '').slice(0, 64))
        : '',
      unread
    };
  });
  memberProfiles = profileMap;
  renderConversationList();
}

function renderComposer() {
  const reply = replyTarget
    ? '<div class="reply-composer-banner"><span>Replying to <strong>' + escapeHtml(displayProfile(memberProfiles.get(replyTarget.sender_id) || {})) +
      '</strong>: ' + escapeHtml((replyTarget.content || 'Message').slice(0, 90)) +
      '</span><button type="button" data-clear-reply aria-label="Cancel reply">×</button></div>'
    : '';
  return '<div class="chat-composer-wrap">' + reply +
    '<form id="chat-composer" class="chat-composer">' +
      '<label class="chat-attach-button" for="chat-attachment" title="Attach a file" aria-label="Attach a file">＋</label>' +
      '<input id="chat-attachment" type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/csv,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation">' +
      '<textarea id="chat-message-input" rows="1" maxlength="4000" placeholder="Message ' + escapeHtml(conversationName(activeConversation)) + '" aria-label="Write a message"></textarea>' +
      '<button class="chat-send-button" type="submit" aria-label="Send message" title="Send message">➤</button>' +
    '</form><div class="chat-composer-footer"><span>Enter to send · Shift + Enter for a new line</span><span id="chat-attachment-name"></span></div>' +
    '<p id="chat-feedback" class="message-feedback" role="status" aria-live="polite"></p></div>';
}

function renderChatHeader() {
  const name = conversationName(activeConversation);
  const isGroup = activeConversation.conversation_type === 'group';
  const participants = (activeConversation.members || []).length;
  const headerActions = [
    '<button class="message-icon-button" type="button" data-toggle-message-search aria-label="Search messages" title="Search messages">⌕</button>',
    isGroup && activeConversation.created_by === currentUser.id
      ? '<button class="message-icon-button" type="button" data-add-group-members aria-label="Add group members" title="Add members">＋</button>'
      : '',
    isGroup && activeConversation.created_by === currentUser.id
      ? '<button class="message-icon-button" type="button" data-edit-group-title aria-label="Edit group name" title="Edit group name">✎</button>'
      : '',
    isGroup
      ? '<button class="message-icon-button" type="button" data-leave-group aria-label="Leave group" title="Leave group">↗</button>'
      : ''
  ].join('');
  return '<header class="chat-header"><button class="chat-back-button" type="button" data-back-to-conversations aria-label="Back to conversations">‹</button>' +
    (isGroup
      ? '<span class="conversation-group-avatar chat-header-avatar" aria-hidden="true">' + escapeHtml(initials(name)) + '</span>'
      : profileAvatar((activeConversation.members || []).find((member) => member.id !== currentUser.id), 'conversation-avatar chat-header-avatar')) +
    '<div class="chat-header-copy"><strong>' + escapeHtml(name) + '</strong><span>' +
      (isGroup ? participants + ' members' : escapeHtml(conversationSubtitle(activeConversation))) +
    '</span></div><div class="chat-header-actions">' + headerActions + '</div></header>' +
    '<div id="message-search-bar" class="message-search-bar" hidden><input id="message-search-input" type="search" placeholder="Search messages in this conversation"><button class="message-secondary-button" type="button" data-clear-message-search>Clear</button></div>';
}

function renderPins() {
  const pins = (activePins.size ? loadedMessages.filter((message) => activePins.has(message.id)) : []);
  if (!pins.length) return '';
  return '<div class="chat-pinned-strip"><strong>Pinned</strong><div>' +
    pins.slice(0, 3).map((message) => '<button type="button" data-jump-message="' + escapeHtml(message.id) + '">' +
      escapeHtml((message.content || (message.message_type === 'image' ? 'Image' : 'Attachment')).slice(0, 72)) +
      '</button>').join('') + '</div></div>';
}

async function loadMessageAssets(messageIds) {
  if (!messageIds.length) {
    activeAttachments = [];
    activeReactions = [];
    activeBookmarks = new Set();
    activePins = new Set();
    return;
  }
  const [attachments, reactions, bookmarks, pins] = await Promise.all([
    supabase.from('message_attachments')
      .select('id,message_id,storage_path,file_name,mime_type,size_bytes,created_at')
      .in('message_id', messageIds),
    supabase.from('message_reactions')
      .select('id,message_id,user_id,emoji')
      .in('message_id', messageIds),
    supabase.from('message_bookmarks')
      .select('message_id')
      .eq('user_id', currentUser.id)
      .in('message_id', messageIds),
    supabase.from('conversation_pins')
      .select('message_id')
      .eq('conversation_id', activeConversationId)
      .in('message_id', messageIds)
  ]);
  if (attachments.error || reactions.error || bookmarks.error || pins.error) {
    const error = attachments.error || reactions.error || bookmarks.error || pins.error;
    console.error('Message metadata load failed:', error);
  }
  activeAttachments = attachments.data || [];
  activeReactions = reactions.data || [];
  activeBookmarks = new Set((bookmarks.data || []).map((row) => row.message_id));
  activePins = new Set((pins.data || []).map((row) => row.message_id));
}

function renderAttachment(attachment, url) {
  if (!url) return '';
  const imageType = attachment.mime_type.startsWith('image/');
  const safeName = escapeHtml(attachment.file_name || 'Attachment');
  if (imageType) {
    return '<a class="message-attachment message-image-attachment" href="' + escapeHtml(url) +
      '" target="_blank" rel="noopener noreferrer"><img src="' + escapeHtml(url) +
      '" alt="' + safeName + '" loading="lazy"></a>';
  }
  const kb = Math.max(1, Math.round(Number(attachment.size_bytes || 0) / 1024));
  return '<a class="message-attachment message-file-attachment" href="' + escapeHtml(url) +
    '" target="_blank" rel="noopener noreferrer"><span class="message-file-mark">FILE</span><span><strong>' +
    safeName + '</strong><small>' + kb.toLocaleString() + ' KB</small></span><span class="message-file-download">↓</span></a>';
}

function renderReactions(messageId) {
  const rows = activeReactions.filter((item) => item.message_id === messageId);
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.emoji)) grouped.set(row.emoji, []);
    grouped.get(row.emoji).push(row);
  }
  if (!grouped.size) return '';
  return '<div class="message-reactions">' + [...grouped.entries()].map(([emoji, people]) => {
    const mine = people.some((person) => person.user_id === currentUser.id);
    return '<button class="message-reaction' + (mine ? ' mine' : '') + '" type="button" data-message-action="react" data-message-id="' +
      escapeHtml(messageId) + '" data-emoji="' + escapeHtml(emoji) + '" aria-label="' +
      escapeHtml(emoji + ', ' + people.length + ' reactions') + '">' +
      escapeHtml(emoji) + ' <span>' + people.length + '</span></button>';
  }).join('') + '</div>';
}

async function signedAttachmentUrls() {
  const result = new Map();
  await Promise.all(activeAttachments.map(async (attachment) => {
    const { data, error } = await supabase.storage.from('message-attachments')
      .createSignedUrl(attachment.storage_path, 60 * 60);
    if (!error && data?.signedUrl) result.set(attachment.id, data.signedUrl);
  }));
  return result;
}

function renderMessages() {
  const host = $('#chat-panel');
  if (!host || !activeConversation) return;
  const urlMapPromise = signedAttachmentUrls();
  urlMapPromise.then((urlMap) => {
    if (!$('#chat-message-list')) return;
    const list = $('#chat-message-list');
    const wasNearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 140;
    list.querySelectorAll('[data-attachment-placeholder]').forEach((node) => node.remove());
    for (const attachment of activeAttachments) {
      const messageNode = list.querySelector('[data-message-id="' + CSS.escape(attachment.message_id) + '"] .message-attachments');
      if (messageNode) messageNode.innerHTML += renderAttachment(attachment, urlMap.get(attachment.id));
    }
    if (wasNearBottom) list.scrollTop = list.scrollHeight;
  }).catch((error) => console.error('Signed attachment URL load failed:', error));

  const attachmentByMessage = new Map();
  for (const attachment of activeAttachments) {
    if (!attachmentByMessage.has(attachment.message_id)) attachmentByMessage.set(attachment.message_id, []);
    attachmentByMessage.get(attachment.message_id).push(attachment);
  }
  const rows = loadedMessages.map((message) => {
    const sender = memberProfiles.get(message.sender_id) || {};
    const mine = message.sender_id === currentUser.id;
    const deleted = Boolean(message.deleted_at);
    const reply = message.reply_to_id ? loadedMessages.find((candidate) => candidate.id === message.reply_to_id) : null;
    const replySender = reply ? displayProfile(memberProfiles.get(reply.sender_id) || {}) : '';
    const replyMarkup = message.reply_to_id
      ? '<div class="message-reply-preview"><span>Replying to ' + escapeHtml(replySender || 'an earlier message') +
        '</span><strong>' + escapeHtml((reply?.content || 'Original message is outside this history').slice(0, 120)) + '</strong></div>'
      : '';
    const attachmentMarkup = (attachmentByMessage.get(message.id) || []).map((attachment) => {
      return '<span class="message-attachment-placeholder" data-attachment-placeholder>' + escapeHtml(attachment.file_name) + '</span>';
    }).join('');
    const actionMarkup = deleted ? '' :
      '<div class="message-actions">' +
        '<button type="button" data-message-action="reply" data-message-id="' + escapeHtml(message.id) + '">Reply</button>' +
        '<button type="button" data-message-action="' + (activeBookmarks.has(message.id) ? 'unbookmark' : 'bookmark') + '" data-message-id="' + escapeHtml(message.id) + '">' + (activeBookmarks.has(message.id) ? 'Saved' : 'Save') + '</button>' +
        '<button type="button" data-message-action="' + (activePins.has(message.id) ? 'unpin' : 'pin') + '" data-message-id="' + escapeHtml(message.id) + '">' + (activePins.has(message.id) ? 'Unpin' : 'Pin') + '</button>' +
        (mine ? '<button type="button" data-message-action="edit" data-message-id="' + escapeHtml(message.id) + '">Edit</button><button type="button" data-message-action="delete" data-message-id="' + escapeHtml(message.id) + '">Delete</button>' : '') +
        quickReactions.map((emoji) => '<button class="message-quick-reaction" type="button" data-message-action="react" data-message-id="' + escapeHtml(message.id) + '" data-emoji="' + escapeHtml(emoji) + '" aria-label="React with ' + escapeHtml(emoji) + '">' + escapeHtml(emoji) + '</button>').join('') +
      '</div>';
    return '<article class="message-item' + (mine ? ' own-message' : '') + (deleted ? ' deleted-message' : '') + '" data-message-id="' + escapeHtml(message.id) + '">' +
      profileAvatar(sender, 'message-avatar') +
      '<div class="message-main"><div class="message-meta"><strong>' + escapeHtml(displayProfile(sender)) +
        '</strong><time datetime="' + escapeHtml(message.created_at) + '">' + escapeHtml(formatMessageTime(message.created_at)) +
        '</time>' + (message.edited_at && !deleted ? '<span class="message-edited">edited</span>' : '') + '</div>' +
        replyMarkup + '<div class="message-text">' + escapeHtml(deleted ? 'This message was deleted.' : (message.content || '')) + '</div>' +
        '<div class="message-attachments">' + attachmentMarkup + '</div>' +
        renderReactions(message.id) + actionMarkup + '</div></article>';
  }).join('');
  host.innerHTML = renderChatHeader() + renderPins() +
    '<div id="chat-typing-indicator" class="chat-typing-indicator" aria-live="polite"></div>' +
    '<div id="chat-message-list" class="chat-message-list" aria-live="polite">' +
      (rows || '<div class="chat-empty-thread"><strong>Start the conversation</strong><p>Send the first message to begin.</p></div>') +
    '</div>' + renderComposer();
  const list = $('#chat-message-list');
  if (list) list.scrollTop = list.scrollHeight;
}

async function markConversationRead(conversationId) {
  if (!currentUser || !conversationId) return;
  const { error } = await supabase.from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUser.id);
  if (error) console.error('Conversation read marker update failed:', error);
  const item = conversationCache.find((conversation) => conversation.id === conversationId);
  if (item) item.unread = false;
  renderConversationList();
}

function updateTypingIndicator() {
  const host = $('#chat-typing-indicator');
  if (!host || !liveChannel) return;
  const state = liveChannel.presenceState();
  const typingUsers = Object.values(state).flat().filter((presence) =>
    presence.user_id !== currentUser?.id && presence.typing === true
  );
  if (!typingUsers.length) {
    host.textContent = '';
    return;
  }
  const names = [...new Set(typingUsers.map((presence) => displayProfile(memberProfiles.get(presence.user_id) || { display_name: 'Someone' })))];
  host.textContent = names.length === 1 ? names[0] + ' is typing…' :
    names.slice(0, 2).join(' and ') + ' are typing…';
}

async function setupLiveConversation(conversationId) {
  if (!supabase || !currentUser || !conversationId) return;
  if (liveChannel) {
    await supabase.removeChannel(liveChannel);
    liveChannel = null;
  }
  await supabase.realtime.setAuth();
  liveChannel = supabase.channel('orbit-chat:' + conversationId, {
    config: { private: true, presence: { key: currentUser.id } }
  })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + conversationId
    }, async () => {
      if (activeConversationId !== conversationId) return;
      await loadMessages(conversationId, true);
      await loadConversationList();
      await markConversationRead(conversationId);
    })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'message_reactions'
    }, () => {
      if (activeConversationId === conversationId) loadMessages(conversationId, true);
    })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'message_attachments', filter: 'conversation_id=eq.' + conversationId
    }, () => {
      if (activeConversationId === conversationId) loadMessages(conversationId, true);
    })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'conversation_pins', filter: 'conversation_id=eq.' + conversationId
    }, () => {
      if (activeConversationId === conversationId) loadMessages(conversationId, true);
    })
    .on('presence', { event: 'sync' }, updateTypingIndicator)
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await liveChannel.track({ user_id: currentUser.id, typing: false });
      }
    });
}

async function loadMessages(conversationId, preserveScroll = false) {
  if (!conversationId || !currentUser || !supabase) return;
  if (loadingConversationId === conversationId) return;
  loadingConversationId = conversationId;
  const list = $('#chat-message-list');
  const oldScrollHeight = list?.scrollHeight || 0;
  const oldScrollTop = list?.scrollTop || 0;
  if (list && !preserveScroll) list.innerHTML = '<div class="friends-loading">Loading messages…</div>';
  const { data, error } = await supabase.from('messages')
    .select('id,conversation_id,sender_id,content,message_type,reply_to_id,created_at,edited_at,deleted_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) {
    if (list) list.innerHTML = '<div class="conversation-list-empty"><strong>Could not load messages</strong><p>Check your connection and try again.</p></div>';
    setComposerFeedback('Messages could not be loaded.', 'error');
    console.error('Message history load failed:', error);
    loadingConversationId = null;
    return;
  }
  loadedMessages = data || [];
  const senderIds = [...new Set(loadedMessages.map((message) => message.sender_id))];
  const { data: senderProfiles, error: senderProfileError } = senderIds.length
    ? await supabase.from('profiles').select('id,username,display_name,avatar_url').in('id', senderIds)
    : { data: [], error: null };
  if (!senderProfileError) {
    for (const profile of senderProfiles || []) memberProfiles.set(profile.id, profile);
  }
  const messageIds = loadedMessages.map((message) => message.id);
  await loadMessageAssets(messageIds);
  if (activeConversationId === conversationId) {
    renderMessages();
    if (preserveScroll && $('#chat-message-list')) {
      const updated = $('#chat-message-list');
      if (oldScrollHeight - oldScrollTop - updated.clientHeight > 140) {
        updated.scrollTop = Math.max(0, oldScrollTop + updated.scrollHeight - oldScrollHeight);
      }
    }
  }
  loadingConversationId = null;
}

async function openConversation(conversationId) {
  if (!conversationId || !currentUser) return;
  activeConversationId = conversationId;
  activeConversation = conversationCache.find((item) => item.id === conversationId) || null;
  if (!activeConversation) {
    await loadConversationList();
    activeConversation = conversationCache.find((item) => item.id === conversationId) || null;
  }
  if (!activeConversation) {
    setFeedback('This conversation is no longer available.', 'error');
    activeConversationId = null;
    renderConversationList();
    return;
  }
  replyTarget = null;
  messageSearch = '';
  const host = $('#chat-panel');
  if (host) host.innerHTML = '<div class="friends-loading">Opening conversation…</div>';
  renderConversationList();
  await loadMessages(conversationId);
  await markConversationRead(conversationId);
  await setupLiveConversation(conversationId);
  document.querySelectorAll('.messaging-layout').forEach((layout) => layout.classList.add('conversation-open'));
}

export async function activateMessagesView(user) {
  if (!user || !supabase) return;
  if (!currentUser || currentUser.id !== user.id) setMessagingUser(user);
  await loadConversationList();
  if (activeConversationId) {
    const exists = conversationCache.some((item) => item.id === activeConversationId);
    if (exists) await openConversation(activeConversationId);
    else activeConversationId = null;
  }
  renderConversationList();
}

export function setMessagingUser(user) {
  const changed = currentUser?.id !== user?.id;
  currentUser = user || null;
  if (!changed) return;
  activeConversationId = null;
  activeConversation = null;
  conversationCache = [];
  loadedMessages = [];
  memberProfiles = new Map();
  replyTarget = null;
  if (liveChannel && supabase) supabase.removeChannel(liveChannel);
  if (listChannel && supabase) supabase.removeChannel(listChannel);
  liveChannel = null;
  listChannel = null;
  if (!currentUser || !supabase) return;
  listChannel = supabase.channel('orbit-message-list:' + currentUser.id)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
      if (document.querySelector('.messaging-layout') && $('#conversation-list')) loadConversationList();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: 'user_id=eq.' + currentUser.id }, () => {
      if ($('#conversation-list')) loadConversationList();
    })
    .subscribe();
}

async function fetchFriends() {
  if (!currentUser) return [];
  const { data, error } = await supabase.from('friendships')
    .select('user_low_id,user_high_id')
    .or('user_low_id.eq.' + currentUser.id + ',user_high_id.eq.' + currentUser.id);
  if (error) throw error;
  const ids = [...new Set((data || []).map((row) =>
    row.user_low_id === currentUser.id ? row.user_high_id : row.user_low_id
  ))];
  if (!ids.length) return [];
  const { data: profiles, error: profileError } = await supabase.from('profiles')
    .select('id,username,display_name,avatar_url')
    .in('id', ids)
    .order('display_name', { ascending: true });
  if (profileError) throw profileError;
  return profiles || [];
}

function renderFriendPicker() {
  const host = $('#new-conversation-friends');
  const search = ($('#new-conversation-search')?.value || '').trim().toLowerCase();
  if (!host) return;
  const visible = pickerFriends.filter((friend) =>
    [friend.username, friend.display_name].join(' ').toLowerCase().includes(search)
  );
  if (!visible.length) {
    host.innerHTML = '<div class="conversation-list-empty"><strong>No friends found</strong><p>Add friends before starting a chat.</p></div>';
  } else {
    host.innerHTML = visible.map((friend) => {
      const checked = selectedFriendIds.has(friend.id);
      const inputType = pickerMode === 'direct' ? 'radio' : 'checkbox';
      return '<label class="message-friend-option">' + profileAvatar(friend, 'message-friend-avatar') +
        '<span><strong>' + escapeHtml(displayProfile(friend)) + '</strong><small>@' +
        escapeHtml(friend.username || 'orbit-user') + '</small></span><input type="' + inputType +
        '" name="message-friend" value="' + escapeHtml(friend.id) + '" ' + (checked ? 'checked' : '') + '></label>';
    }).join('');
  }
  updateFriendPickerSubmit();
}

function updateFriendPickerSubmit() {
  const button = $('#new-conversation-submit');
  const hint = $('#new-conversation-hint');
  if (!button) return;
  const count = selectedFriendIds.size;
  button.disabled = pickerMode === 'direct' ? count !== 1 : count < 1;
  button.textContent = pickerMode === 'direct' ? 'Start conversation' :
    pickerMode === 'add' ? 'Add selected friends' : 'Create group';
  if (hint) {
    hint.textContent = pickerMode === 'direct'
      ? 'Choose one friend to start a direct message.'
      : pickerMode === 'add'
        ? 'Choose friends to add to this group. The creator can add up to 20 members total.'
        : 'Choose 1 to 19 friends. You will be included as the group creator.';
  }
}

async function openFriendPicker(mode) {
  if (!currentUser) return;
  pickerMode = mode;
  selectedFriendIds = new Set();
  const modal = $('#new-conversation-modal');
  const isGroup = mode === 'group';
  $('#new-group-name-field').hidden = !isGroup;
  $('#new-group-name').value = '';
  $('#new-conversation-search').value = '';
  $('#message-modal-title').textContent = mode === 'direct' ? 'New message' :
    mode === 'add' ? 'Add group members' : 'Create a group';
  $('#new-conversation-error').textContent = '';
  const footer = $('#new-conversation-submit');
  if (footer) footer.disabled = true;
  modal.hidden = false;
  const host = $('#new-conversation-friends');
  host.innerHTML = '<div class="friends-loading">Loading friends…</div>';
  try {
    pickerFriends = await fetchFriends();
    if (mode === 'add' && activeConversation) {
      const existing = new Set((activeConversation.members || []).map((member) => member.id));
      pickerFriends = pickerFriends.filter((friend) => !existing.has(friend.id));
    }
    renderFriendPicker();
  } catch (error) {
    host.innerHTML = '<div class="conversation-list-empty"><strong>Could not load friends</strong><p>' +
      escapeHtml(error.message || 'Try again.') + '</p></div>';
  }
  $('#new-conversation-search')?.focus();
}

function closeFriendPicker() {
  const modal = $('#new-conversation-modal');
  if (modal) modal.hidden = true;
}

function notifyPickerError(text) {
  const host = $('#new-conversation-error');
  if (host) host.textContent = text || '';
}

async function createDirectConversation(userId) {
  if (!currentUser) return;
  setFeedback('Opening direct message…', 'pending');
  const { data, error } = await supabase.rpc('create_or_get_direct_conversation', { target_user: userId });
  if (error) {
    setFeedback(error.message || 'Could not open this conversation.', 'error');
    return;
  }
  activeConversationId = data;
  navigateToMessages();
  setFeedback('', '');
}

async function submitNewConversation() {
  const title = ($('#new-group-name')?.value || '').trim();
  const memberIds = [...selectedFriendIds];
  if (pickerMode === 'direct') {
    if (memberIds.length !== 1) return notifyPickerError('Choose one friend.');
    closeFriendPicker();
    await createDirectConversation(memberIds[0]);
    return;
  }
  if (pickerMode === 'group' && (title.length < 1 || title.length > 80)) {
    return notifyPickerError('Group name must be 1 to 80 characters.');
  }
  if (!memberIds.length) return notifyPickerError('Choose at least one friend.');
  const button = $('#new-conversation-submit');
  button.disabled = true;
  notifyPickerError('Creating conversation…');
  let result;
  if (pickerMode === 'group') {
    result = await supabase.rpc('create_group_conversation', {
      requested_title: title,
      requested_member_ids: memberIds
    });
  } else {
    result = await supabase.rpc('add_group_conversation_members', {
      target_conversation: activeConversationId,
      requested_member_ids: memberIds
    });
  }
  button.disabled = false;
  if (result.error) {
    notifyPickerError(result.error.message || 'The conversation could not be saved.');
    return;
  }
  const newId = pickerMode === 'group' ? result.data : activeConversationId;
  closeFriendPicker();
  if (pickerMode === 'group') activeConversationId = newId;
  navigateToMessages();
}

async function loadMessagesSearch(query) {
  const host = $('#chat-message-list');
  if (!host || !activeConversationId || !query.trim()) return;
  host.innerHTML = '<div class="friends-loading">Searching messages…</div>';
  const { data, error } = await supabase.from('messages')
    .select('id,conversation_id,sender_id,content,message_type,reply_to_id,created_at,edited_at,deleted_at')
    .eq('conversation_id', activeConversationId)
    .textSearch('content', query.trim(), { type: 'websearch', config: 'simple' })
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    host.innerHTML = '<div class="conversation-list-empty"><strong>Search could not be completed</strong><p>' +
      escapeHtml(error.message || 'Try another search.') + '</p></div>';
    return;
  }
  const ids = [...new Set((data || []).map((message) => message.sender_id))];
  if (ids.length) {
    const { data: profiles } = await supabase.from('profiles')
      .select('id,username,display_name,avatar_url').in('id', ids);
    for (const profile of profiles || []) memberProfiles.set(profile.id, profile);
  }
  host.innerHTML = (data || []).map((message) => {
    const sender = memberProfiles.get(message.sender_id) || {};
    return '<button class="message-search-result" type="button" data-jump-message="' + escapeHtml(message.id) + '">' +
      '<strong>' + escapeHtml(displayProfile(sender)) + '</strong><time>' + escapeHtml(formatMessageTime(message.created_at)) +
      '</time><span>' + escapeHtml(message.content || 'Attachment') + '</span></button>';
  }).join('') || '<div class="chat-empty-thread"><strong>No messages found</strong><p>Try another phrase.</p></div>';
}

async function toggleReaction(messageId, emoji) {
  const existing = activeReactions.find((row) =>
    row.message_id === messageId && row.user_id === currentUser.id && row.emoji === emoji
  );
  if (existing) {
    const { error } = await supabase.from('message_reactions').delete().eq('id', existing.id);
    if (error) setComposerFeedback(error.message || 'Could not remove reaction.', 'error');
  } else {
    const { error } = await supabase.from('message_reactions').insert({
      message_id: messageId, user_id: currentUser.id, emoji
    });
    if (error && error.code !== '23505') setComposerFeedback(error.message || 'Could not add reaction.', 'error');
  }
  await loadMessages(activeConversationId, true);
}

async function toggleBookmark(messageId, shouldSave) {
  const query = supabase.from('message_bookmarks');
  const result = shouldSave
    ? await query.insert({ user_id: currentUser.id, message_id: messageId })
    : await query.delete().eq('user_id', currentUser.id).eq('message_id', messageId);
  if (result.error && result.error.code !== '23505') {
    setComposerFeedback(result.error.message || 'Bookmark action failed.', 'error');
    return;
  }
  await loadMessages(activeConversationId, true);
}

async function togglePin(messageId, shouldPin) {
  const result = shouldPin
    ? await supabase.from('conversation_pins').insert({
        conversation_id: activeConversationId, message_id: messageId, pinned_by: currentUser.id
      })
    : await supabase.from('conversation_pins').delete()
        .eq('conversation_id', activeConversationId).eq('message_id', messageId);
  if (result.error && result.error.code !== '23505') {
    setComposerFeedback(result.error.message || 'Pin action failed.', 'error');
    return;
  }
  await loadMessages(activeConversationId, true);
}

async function editMessage(messageId) {
  const message = loadedMessages.find((item) => item.id === messageId);
  if (!message || message.sender_id !== currentUser.id) return;
  const next = window.prompt('Edit your message', message.content || '');
  if (next === null) return;
  const value = next.trim();
  if (!value || value.length > 4000) {
    setComposerFeedback('A message must contain 1 to 4,000 characters.', 'error');
    return;
  }
  const { error } = await supabase.from('messages')
    .update({ content: value, edited_at: new Date().toISOString() })
    .eq('id', messageId).eq('sender_id', currentUser.id);
  if (error) setComposerFeedback(error.message || 'Message could not be edited.', 'error');
  else await loadMessages(activeConversationId, true);
}

async function deleteMessage(messageId) {
  const message = loadedMessages.find((item) => item.id === messageId);
  if (!message || message.sender_id !== currentUser.id) return;
  if (!window.confirm('Delete this message for everyone in the conversation?')) return;
  const { data: attachments } = await supabase.from('message_attachments')
    .select('storage_path,id').eq('message_id', messageId);
  const paths = (attachments || []).map((item) => item.storage_path);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from('message-attachments').remove(paths);
    if (storageError) console.error('Attachment cleanup failed:', storageError);
  }
  const { error } = await supabase.from('messages')
    .update({ content: 'This message was deleted.', deleted_at: new Date().toISOString(), edited_at: null })
    .eq('id', messageId).eq('sender_id', currentUser.id);
  if (error) {
    setComposerFeedback(error.message || 'Message could not be deleted.', 'error');
    return;
  }
  await supabase.from('message_attachments').delete().eq('message_id', messageId);
  await loadMessages(activeConversationId, true);
}

async function uploadMessageAttachment(file, messageId) {
  if (!allowedTypes.has(file.type) || file.size < 1 || file.size > 25 * 1024 * 1024) {
    throw new Error('Choose an allowed image or document up to 25 MB.');
  }
  const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || 'attachment';
  const path = activeConversationId + '/' + messageId + '/' + currentUser.id + '/' + crypto.randomUUID() + '_' + fileName;
  const { error: uploadError } = await supabase.storage.from('message-attachments').upload(path, file, {
    cacheControl: '3600', contentType: file.type, upsert: false
  });
  if (uploadError) throw uploadError;
  const { error: metadataError } = await supabase.from('message_attachments').insert({
    message_id: messageId,
    conversation_id: activeConversationId,
    uploaded_by: currentUser.id,
    storage_path: path,
    file_name: file.name.slice(0, 255),
    mime_type: file.type,
    size_bytes: file.size
  });
  if (metadataError) {
    await supabase.storage.from('message-attachments').remove([path]);
    throw metadataError;
  }
}

async function sendCurrentMessage(event) {
  event.preventDefault();
  if (!currentUser || !activeConversationId) return;
  const input = $('#chat-message-input');
  const fileInput = $('#chat-attachment');
  const file = fileInput?.files?.[0] || null;
  const content = (input?.value || '').trim();
  if (!content && !file) return;
  if (content.length > 4000) return setComposerFeedback('Messages can contain up to 4,000 characters.', 'error');
  if (file && (!allowedTypes.has(file.type) || file.size > 25 * 1024 * 1024)) {
    return setComposerFeedback('Choose an allowed image or document up to 25 MB.', 'error');
  }
  const sendButton = event.target.querySelector('button[type="submit"]');
  sendButton.disabled = true;
  setComposerFeedback(file ? 'Uploading attachment…' : 'Sending…', 'pending');
  const messageType = file ? (file.type.startsWith('image/') ? 'image' : 'file') : 'text';
  const payload = {
    conversation_id: activeConversationId,
    sender_id: currentUser.id,
    message_type: messageType,
    content: content || null,
    reply_to_id: replyTarget?.id || null
  };
  const { data, error } = await supabase.from('messages').insert(payload).select('id').single();
  if (error) {
    sendButton.disabled = false;
    setComposerFeedback(error.message || 'Message could not be sent.', 'error');
    return;
  }
  if (file) {
    try {
      await uploadMessageAttachment(file, data.id);
    } catch (uploadError) {
      console.error('Message attachment upload failed:', uploadError);
      setComposerFeedback(uploadError.message || 'Attachment upload failed.', 'error');
      // Keep the message row so the conversation history remains consistent.
    }
  }
  if (input) input.value = '';
  if (fileInput) fileInput.value = '';
  $('#chat-attachment-name').textContent = '';
  replyTarget = null;
  sendButton.disabled = false;
  setComposerFeedback('', '');
  await loadMessages(activeConversationId, true);
  await loadConversationList();
  await markConversationRead(activeConversationId);
}

function sendTyping() {
  if (!liveChannel || !currentUser) return;
  clearTimeout(typingTimer);
  clearTimeout(typingStopTimer);
  typingTimer = setTimeout(() => {
    liveChannel.track({ user_id: currentUser.id, typing: true }).catch((error) =>
      console.error('Typing presence update failed:', error)
    );
  }, 180);
  typingStopTimer = setTimeout(() => {
    if (liveChannel) liveChannel.track({ user_id: currentUser.id, typing: false }).catch(() => {});
  }, 1400);
}

async function updateGroupTitle() {
  if (!activeConversation || activeConversation.created_by !== currentUser.id) return;
  const title = window.prompt('Group name', activeConversation.title || '');
  if (title === null) return;
  const value = title.trim();
  if (!value || value.length > 80) return setComposerFeedback('Group name must be 1 to 80 characters.', 'error');
  const { error } = await supabase.from('conversations')
    .update({ title: value }).eq('id', activeConversationId);
  if (error) {
    setComposerFeedback(error.message || 'Group name could not be updated.', 'error');
    return;
  }
  await loadConversationList();
  activeConversation = conversationCache.find((item) => item.id === activeConversationId) || activeConversation;
  renderMessages();
}

async function leaveGroup() {
  if (!activeConversation || activeConversation.conversation_type !== 'group') return;
  if (!window.confirm('Leave this group? You will no longer see its messages.')) return;
  const { error } = await supabase.from('conversation_members')
    .delete().eq('conversation_id', activeConversationId).eq('user_id', currentUser.id);
  if (error) {
    setComposerFeedback(error.message || 'Could not leave the group.', 'error');
    return;
  }
  activeConversationId = null;
  activeConversation = null;
  if (liveChannel) supabase.removeChannel(liveChannel);
  liveChannel = null;
  const layout = $('.messaging-layout');
  layout?.classList.remove('conversation-open');
  const host = $('#chat-panel');
  if (host) host.innerHTML = '<div class="chat-empty"><h2>Group left</h2><p>You have left this group.</p></div>';
  await loadConversationList();
}

function handleMessageClick(event) {
  const messageButton = event.target.closest('[data-friend-action="message"]');
  if (messageButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    createDirectConversation(messageButton.dataset.userId);
    return;
  }
  const openNew = event.target.closest('[data-open-new-message]');
  if (openNew) { openFriendPicker('direct'); return; }
  if (event.target.closest('[data-open-new-group]')) { openFriendPicker('group'); return; }
  if (event.target.closest('[data-close-message-modal]') || event.target.id === 'new-conversation-modal') {
    closeFriendPicker(); return;
  }
  const conversationButton = event.target.closest('[data-conversation-id]');
  if (conversationButton) { openConversation(conversationButton.dataset.conversationId); return; }
  if (event.target.closest('[data-back-to-conversations]')) {
    $('.messaging-layout')?.classList.remove('conversation-open');
    return;
  }
  if (event.target.closest('[data-toggle-message-search]')) {
    const bar = $('#message-search-bar');
    if (bar) {
      bar.hidden = !bar.hidden;
      if (!bar.hidden) $('#message-search-input')?.focus();
    }
    return;
  }
  if (event.target.closest('[data-clear-message-search]')) {
    messageSearch = '';
    if ($('#message-search-input')) $('#message-search-input').value = '';
    loadMessages(activeConversationId, true);
    return;
  }
  if (event.target.closest('[data-clear-reply]')) {
    replyTarget = null;
    renderMessages();
    return;
  }
  if (event.target.closest('[data-add-group-members]')) { openFriendPicker('add'); return; }
  if (event.target.closest('[data-edit-group-title]')) { updateGroupTitle(); return; }
  if (event.target.closest('[data-leave-group]')) { leaveGroup(); return; }
  const jump = event.target.closest('[data-jump-message]');
  if (jump) {
    const target = $('#chat-message-list [data-message-id="' + CSS.escape(jump.dataset.jumpMessage) + '"]');
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const action = event.target.closest('[data-message-action]');
  if (action) {
    const id = action.dataset.messageId;
    const type = action.dataset.messageAction;
    if (type === 'reply') {
      replyTarget = loadedMessages.find((message) => message.id === id) || null;
      renderMessages();
      $('#chat-message-input')?.focus();
    }
    if (type === 'react') toggleReaction(id, action.dataset.emoji);
    if (type === 'bookmark') toggleBookmark(id, true);
    if (type === 'unbookmark') toggleBookmark(id, false);
    if (type === 'pin') togglePin(id, true);
    if (type === 'unpin') togglePin(id, false);
    if (type === 'edit') editMessage(id);
    if (type === 'delete') deleteMessage(id);
    return;
  }
}

function handleMessageSubmit(event) {
  if (event.target.id === 'chat-composer') {
    event.preventDefault();
    sendCurrentMessage(event);
    return;
  }
  if (event.target.id === 'new-conversation-form') {
    event.preventDefault();
    submitNewConversation();
  }
}

function handleMessageInput(event) {
  if (event.target.id === 'conversation-search') {
    conversationSearch = event.target.value;
    renderConversationList();
  }
  if (event.target.id === 'new-conversation-search') renderFriendPicker();
  if (event.target.id === 'message-search-input') {
    const value = event.target.value.trim();
    messageSearch = value;
    clearTimeout(messageSearchTimer);
    messageSearchTimer = setTimeout(() => {
      if (value) loadMessagesSearch(value);
      else loadMessages(activeConversationId, true);
    }, 280);
  }
  if (event.target.id === 'chat-message-input') sendTyping();
}

function handleMessageKeydown(event) {
  if (event.target.id !== 'chat-message-input') return;
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    event.target.closest('form')?.requestSubmit();
  }
}

function handleMessageChange(event) {
  if (event.target.name === 'message-friend') {
    const id = event.target.value;
    if (event.target.checked) {
      if (pickerMode === 'direct') selectedFriendIds = new Set([id]);
      else {
        if (selectedFriendIds.size >= 19) {
          event.target.checked = false;
          notifyPickerError('A group can contain up to 20 people, including you.');
          return;
        }
        selectedFriendIds.add(id);
      }
    } else selectedFriendIds.delete(id);
    renderFriendPicker();
  }
  if (event.target.id === 'chat-attachment') {
    const file = event.target.files?.[0];
    $('#chat-attachment-name').textContent = file ? file.name : '';
  }
}

export function initializeMessaging(options = {}) {
  if (messagingInitialized) return;
  messagingInitialized = true;
  navigateToMessages = options.navigateToMessages || navigateToMessages;
  document.addEventListener('click', handleMessageClick, true);
  document.addEventListener('submit', handleMessageSubmit, true);
  document.addEventListener('input', handleMessageInput);
  document.addEventListener('change', handleMessageChange);
  document.addEventListener('keydown', handleMessageKeydown);
}

