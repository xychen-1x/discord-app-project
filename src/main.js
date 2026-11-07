import "./style.css";
import { isSupabaseConfigured, supabase } from "./lib/supabase.js";

const authScreen = document.querySelector("#auth-screen");
const workspace = document.querySelector("#workspace");
const form = document.querySelector("#auth-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("#password-toggle");
const title = document.querySelector("#auth-title");
const description = document.querySelector("#auth-description");
const submit = document.querySelector("#auth-submit");
const message = document.querySelector("#auth-message");
const switchButton = document.querySelector("#auth-switch");
const switchCopy = document.querySelector("#auth-switch-copy");

let authMode = "signin";

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === "signup";
  title.textContent = signup ? "Create an account" : "Welcome back";
  description.textContent = signup ? "Create your Orbit account." : "Sign in to continue to Orbit.";
  submit.textContent = signup ? "Create account" : "Sign in";
  switchCopy.textContent = signup ? "Already have an account?" : "New to Orbit?";
  switchButton.textContent = signup ? "Sign in" : "Create an account";
  passwordInput.autocomplete = signup ? "new-password" : "current-password";
  message.textContent = "";
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
  document.querySelector("#user-name").textContent = name;
  document.querySelector("#user-avatar").textContent = name.slice(0, 1).toUpperCase();
}

passwordToggle.addEventListener("click", () => {
  const visible = passwordInput.type === "password";
  passwordInput.type = visible ? "text" : "password";
  passwordToggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
  passwordToggle.setAttribute("aria-pressed", String(visible));
});

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
  submit.disabled = true;
  submit.textContent = "Please wait…";

  try {
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) throw result.error;

    if (authMode === "signup" && !result.data.session) {
      message.textContent = "Check your email to confirm your account, then sign in.";
      return;
    }
    if (result.data.user) showWorkspace(result.data.user);
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : "Unable to continue. Try again.";
  } finally {
    submit.disabled = false;
    submit.textContent = authMode === "signup" ? "Create account" : "Sign in";
  }
});

document.querySelector("#logout").addEventListener("click", async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    message.textContent = error.message;
    showAuth();
    return;
  }
  passwordInput.value = "";
  setAuthMode("signin");
  showAuth();
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    const section = button.dataset.section;
    document.querySelector("#page-title").textContent = section;
    const content = document.querySelector("#home-content");
    if (section === "Home") {
      content.innerHTML = '<div class="welcome-block"><p class="welcome-kicker">ORBIT</p><h1>Welcome in.</h1><p>Your space starts here.</p></div><div class="quick-grid"><article class="quick-card"><span class="quick-symbol">♧</span><div><h2>Friends</h2><p>Your people will appear here.</p></div></article><article class="quick-card"><span class="quick-symbol">▤</span><div><h2>Messages</h2><p>Your conversations will appear here.</p></div></article><article class="quick-card"><span class="quick-symbol">◈</span><div><h2>Communities</h2><p>Your communities will appear here.</p></div></article></div>';
    } else {
      content.innerHTML = '<div class="section-empty"><h1>' + section + '</h1><p>This section is not available yet.</p></div>';
    }
  });
});

document.querySelector("#rail-settings").addEventListener("click", () => {
  document.querySelector("#page-title").textContent = "Settings";
  document.querySelector("#home-content").innerHTML = '<div class="section-empty"><h1>Settings</h1><p>Account settings will be added in a later step.</p></div>';
});

setAuthMode("signin");

if (!isSupabaseConfigured || !supabase) {
  showAuth("Account service is not configured.");
} else {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) showWorkspace(session.user);
  else showAuth();

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showWorkspace(session.user);
  });
}
