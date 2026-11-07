import "./style.css";
import { isSupabaseConfigured, supabase } from "./lib/supabase.js";

const status = document.querySelector("#connection-status");
const dialog = document.querySelector("#auth-dialog");
const title = document.querySelector("#auth-title");
const description = document.querySelector("#auth-description");
const form = document.querySelector("#auth-form");
const message = document.querySelector("#auth-message");
const submit = document.querySelector("#auth-submit");

let authMode = "signup";

function openAuth(mode) {
  authMode = mode;
  title.textContent = mode === "signup" ? "Create your account" : "Welcome back";
  description.textContent = isSupabaseConfigured
    ? "Use your email to continue."
    : "Supabase environment settings are needed before account access can work.";
  submit.textContent = mode === "signup" ? "Create account" : "Sign in";
  message.textContent = "";
  dialog.showModal();
}

document.querySelector("#get-started").addEventListener("click", () => openAuth("signup"));
document.querySelector("#sign-in").addEventListener("click", () => openAuth("signin"));

if (isSupabaseConfigured) {
  status.textContent = "Supabase client configured · authentication ready to test";
} else {
  status.textContent = "Interface ready · add Supabase environment variables to connect accounts";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  if (!supabase) {
    message.textContent = "Supabase is not configured yet. Add the Vercel environment variables first.";
    return;
  }

  const email = new FormData(form).get("email")?.toString().trim();
  const password = new FormData(form).get("password")?.toString();

  submit.disabled = true;
  submit.textContent = "Please wait…";

  try {
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) throw result.error;

    message.textContent = authMode === "signup"
      ? "Account request submitted. Check your email if confirmation is enabled."
      : "Signed in successfully.";
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : "Something went wrong.";
  } finally {
    submit.disabled = false;
    submit.textContent = authMode === "signup" ? "Create account" : "Sign in";
  }
});

supabase?.auth.onAuthStateChange((_event, session) => {
  if (session?.user) status.textContent = `Signed in as ${session.user.email ?? "your account"}`;
});
