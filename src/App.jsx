// src/App.jsx — Root component, manages screen/page routing
// FIX (Issue 4): DashboardPage now receives user prop — without it the
//               useEffect fetch never ran and the page was blank.

import { useState } from "react";
import { GLOBAL_CSS } from "./theme";
import Sidebar        from "./components/Sidebar";
import AuthPage       from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import HomePage       from "./pages/HomePage";
import DashboardPage  from "./pages/DashboardPage";
import DietPlanPage   from "./pages/DietPlanPage";
import FoodLogPage    from "./pages/FoodLogPage";
import ChatbotPage    from "./pages/ChatbotPage";
import ProfilePage    from "./pages/ProfilePage";

const API_URL = "https://jxchan-nutribuddy.hf.space/api";
const STORAGE_KEY = "nutribuddy_session";

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveSession(user, profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, profile }));
}
function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function App() {
  const saved = loadSession();

  const [screen,            setScreen]            = useState(saved ? "app" : "auth");
  const [user,              setUser]              = useState(saved?.user    ?? null);
  const [profile,           setProfile]           = useState(saved?.profile ?? null);
  const [page,              setPage]              = useState("home");
  const [foodLogRefreshKey, setFoodLogRefreshKey] = useState(0);

  // Called by DietPlanPage after successfully logging a meal to the food log
  // — increments a key so FoodLogPage's useEffect re-fires and re-fetches
  function handleDietPlanLogged() {
    setFoodLogRefreshKey((k) => k + 1);
  }

  async function fetchProfile(userId, rememberMe, u) {
    try {
      const res  = await fetch(`${API_URL}/onboarding/profile`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.profile) {
        if (rememberMe) saveSession(u, data.profile);
        setProfile(data.profile);
        setScreen("app");
      } else {
        if (rememberMe) saveSession(u, null);
        setScreen("onboard");
      }
    } catch {
      setScreen("onboard");
    }
  }

  async function handleAuth(u, needsOnboard, rememberMe = false) {
    setUser(u);
    if (needsOnboard) {
      if (rememberMe) saveSession(u, null);
      setScreen("onboard");
    } else {
      await fetchProfile(u.id, rememberMe, u);
    }
  }

  function handleOnboard(p) {
    setProfile(p);
    if (localStorage.getItem(STORAGE_KEY)) saveSession(user, p);
    setScreen("app");
  }

  function handleLogout() {
    clearSession();
    setScreen("auth");
    setUser(null);
    setProfile(null);
    setPage("home");
  }

  // Pages that should stay mounted (keep state alive) even when not visible.
  // Using display:none instead of conditional rendering so that async tasks
  // (e.g. food image recognition) keep running while the user navigates away.
  const PERSISTENT_PAGES = ["foodlog", "chatbot", "dietplan"];

  const persistentPages = [
    {
      key: "foodlog",
      el: <FoodLogPage profile={profile} user={user} refreshKey={foodLogRefreshKey} />,
    },
    {
      key: "chatbot",
      el: <ChatbotPage profile={profile} user={user} />,
    },
    {
      key: "dietplan",
      el: <DietPlanPage profile={profile} user={user} onMealLogged={handleDietPlanLogged} />,
    },
  ];

  // Pages that are fine to unmount when not active (no long-running tasks).
  const lightPageMap = {
    home:      <HomePage      user={user}    profile={profile} />,
    dashboard: <DashboardPage profile={profile} user={user} />,
    profile:   <ProfilePage   user={user}    profile={profile} onLogout={handleLogout} onUpdate={(p, updatedUser) => {
      setProfile(p);
      if (updatedUser) setUser(updatedUser);
      const u = updatedUser || user;
      if (localStorage.getItem(STORAGE_KEY)) saveSession(u, p);
    }} />,
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {screen === "auth"    && <AuthPage       onAuth={handleAuth} />}
      {screen === "onboard" && <OnboardingPage user={user} onComplete={handleOnboard} />}

      {screen === "app" && (
        <div className="nb-app">
          <Sidebar page={page} setPage={setPage} user={user} onLogout={handleLogout} />
          <main className="nb-main">
            {/* Persistent pages: always mounted, hidden via CSS when not active.
                This keeps async tasks (food scan, chat) alive during navigation. */}
            {persistentPages.map(({ key, el }) => (
              <div
                key={key}
                style={{ display: page === key ? "block" : "none" }}
              >
                {el}
              </div>
            ))}

            {/* Light pages: only rendered when active (no long-running state). */}
            {!PERSISTENT_PAGES.includes(page) && (
              <div key={page}>
                {lightPageMap[page]}
              </div>
            )}
          </main>
        </div>
      )}
    </>
  );
}