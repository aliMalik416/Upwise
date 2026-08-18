/* ==========================================================================
   Upwise Authentication & Data Sync Engine (Supabase + LocalStorage Fallback)
   ========================================================================== */

const SUPABASE_URL = "https://<YOUR_PROJECT_ID>.supabase.co";
const SUPABASE_ANON_KEY = "<YOUR_SUPABASE_ANON_KEY>";

// Initialize Supabase Client
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// UI Modal Controls
function openAuthModal() {
  document.getElementById("authModal")?.classList.add("open");
}

function closeAuthModal() {
  document.getElementById("authModal")?.classList.remove("open");
}

// User Sign-In / Auto-Sign-Up
async function handleAuth(event) {
  event.preventDefault();
  if (!supabaseClient) return alert("Supabase configuration missing.");

  const email = document.getElementById("authEmail").value;
  const password = document.getElementById("authPassword").value;
  const authMsg = document.getElementById("authMsg");

  authMsg.textContent = "Authenticating...";

  // Attempt login first
  const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (signInError) {
    // If sign-in fails, attempt user registration
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({ email, password });

    if (signUpError) {
      authMsg.textContent = signUpError.message;
      return;
    }

    authMsg.textContent = "Account created! Check your email to confirm registration.";
    return;
  }

  authMsg.textContent = "Success!";
  closeAuthModal();
  location.reload();
}

// Global Profile Loader with Supabase -> LocalStorage Fallback
async function loadUserProfile() {
  if (supabaseClient) {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
      updateAuthUI(user);
      const { data, error } = await supabaseClient.from("profiles").select("*").eq("user_id", user.id).single();
      if (data && !error) {
        localStorage.setItem("upwise_profile", JSON.stringify(data));
        return data;
      }
    }
  }

  // Fallback to guest LocalStorage
  updateAuthUI(null);
  const local = localStorage.getItem("upwise_profile");
  return local ? JSON.parse(local) : {};
}

// Save Profile seamlessly to PostgreSQL and LocalStorage
async function saveUserProfile(profileData) {
  localStorage.setItem("upwise_profile", JSON.stringify(profileData));

  if (supabaseClient) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
      const payload = { ...profileData, user_id: user.id, updated_at: new Date().toISOString() };
      const { error } = await supabaseClient.from("profiles").upsert(payload);
      if (error) console.error("Database Sync Error:", error.message);
    }
  }
}

// Log Out
async function handleLogout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  localStorage.removeItem("upwise_profile");
  location.reload();
}

// Dynamic Auth UI Update in Navigation
function updateAuthUI(user) {
  const container = document.getElementById("authContainer");
  if (!container) return;

  if (user) {
    container.innerHTML = `
      <div class="auth-pill">
        <span>${user.email.split("@")[0]}</span>
        <button class="btn outline small" onclick="handleLogout()" style="padding: 2px 8px; font-size: 0.75rem;">Exit</button>
      </div>`;
  } else {
    container.innerHTML = `<button class="btn outline small" onclick="openAuthModal()">Log in / Sign up</button>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("authForm")?.addEventListener("submit", handleAuth);
});
