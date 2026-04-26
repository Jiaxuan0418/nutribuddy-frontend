// src/components/Sidebar.jsx

import { C } from "../theme";
import logo from "../assets/nutribuddy_logo.png";

const NAV_ITEMS = [
  { id: "home",      icon: "🏠", label: "Home" },
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "dietplan",   icon: "🥗", label: "Diet Plan" },
  { id: "foodlog",    icon: "📝", label: "Food Log" },
  { id: "chatbot",    icon: "💬", label: "AI Chatbot" },
  { id: "profile",   icon: "👤", label: "Profile & Settings" },
];

export default function Sidebar({ page, setPage, user, onLogout }) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="nb-sidebar">
      {/* Logo */}
      <div className="nb-logo">
        <img
          src={logo}
          alt="NutriBuddy"
          style={{ width: 100, objectFit: "contain" }}
        />
      </div>

      {/* Navigation */}
      <nav className="nb-nav">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nb-nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            <span className="nb-nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="nb-sidebar-user">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="nb-sidebar-avatar"
            onClick={() => setPage("profile")}
            style={{ cursor: "pointer" }}
            title="View Profile"
          >
            {initials}
          </div>
          <div
            style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
            onClick={() => setPage("profile")}
            title="Go to Profile"
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>View Profile</div>
          </div>
          <button
            className="btn-ghost"
            style={{ padding: "4px 6px", fontSize: 16 }}
            onClick={onLogout}
            title="Log out"
          >
            ⏻
          </button>
        </div>
      </div>
    </div>
  );
}
