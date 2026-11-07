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
    Friends: `<section class="section-heading"><div><p class="welcome-kicker">YOUR PEOPLE</p><h1>Friends</h1><p>Connect with people on Orbit.</p></div><button class="section-action" type="button" disabled title="Friend requests are part of the next feature build">Add Friend</button></section><section class="feature-empty"><span class="empty-illustration">${icon.friends}</span><h2>Your friends list is waiting</h2><p>Friend search, requests, and your friends list will be connected in the Friends feature build.</p></section>`,
    Messages: `<section class="section-heading"><div><p class="welcome-kicker">PRIVATE CONVERSATIONS</p><h1>Messages</h1><p>Your direct and group conversations.</p></div></section><section class="feature-empty"><span class="empty-illustration">${icon.messages}</span><h2>No conversations yet</h2><p>Your direct messages and group chats will appear here once messaging is implemented.</p></section>`,
    Communities: `<section class="section-heading"><div><p class="welcome-kicker">FIND YOUR PEOPLE</p><h1>Communities</h1><p>Places to talk about what you enjoy.</p></div><button class="section-action" type="button" disabled title="Community creation is part of the next feature build">Create Community</button></section><section class="feature-empty"><span class="empty-illustration">${icon.communities}</span><h2>Make a place of your own</h2><p>Community discovery, creation, invites, and channels will be connected in the Communities feature build.</p></section>`,
    Settings: `<section class="section-heading"><div><p class="welcome-kicker">PREFERENCES</p><h1>User Settings</h1><p>Manage your Orbit account and app preferences.</p></div></section><section class="settings-list"><div class="settings-row"><div><strong>Account</strong><p>Signed in as <span id="settings-email"></span></p></div><span class="settings-tag">Connected</span></div><div class="settings-row"><div><strong>Appearance</strong><p>Orbit currently uses its dark theme.</p></div><span class="settings-tag">Dark</span></div><div class="settings-row"><div><strong>Privacy & Safety</strong><p>Privacy controls will be added with the account settings feature.</p></div><span class="settings-tag">Coming later</span></div><button id="settings-logout" class="settings-logout" type="button">Log Out</button></section>`,
    Help: `<section class="section-heading"><div><p class="welcome-kicker">ORBIT SUPPORT</p><h1>Help & Support</h1><p>Find guidance for using Orbit.</p></div></section><section class="feature-empty"><h2>Support resources are being prepared</h2><p>Help articles and support contact options will be available before public launch.</p></section>`
  };
  content.innerHTML = views[section] || views.Home;
  content.focus({ preventScroll: true });
  const user = currentUser;
  const settingsEmail = $("#settings-email");
  if (settingsEmail) settingsEmail.textContent = user?.email || "Not available";
  const settingsLogout = $("#settings-logout");
  if (settingsLogout) settingsLogout.addEventListener("click", signOut);
  closeMobileSidebar();
}

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
  if (authMode === "signup" && password !== confirmPasswordInput.value) {
    message.textContent = "Your passwords do not match.";
    confirmPasswordInput.focus();
    return;
  }
  submit.disabled = true;
  submit.textContent = authMode === "signup" ? "Creating account…" : "Logging in…";
  try {
    const result = authMode === "signup"
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: $("#display-name").value.trim() || email.split("@")[0] } }
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
  const sectionButton = event.target.closest("[data-section]");
  if (sectionButton) {
    renderSection(sectionButton.dataset.section);
    closeAccountMenu();
    return;
  }
  if (!event.target.closest(".account-bar")) closeAccountMenu();
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
  if (action === "profile") renderSection("Settings");
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
