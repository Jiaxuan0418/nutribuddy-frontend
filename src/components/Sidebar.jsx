// src/components/Sidebar.jsx — Fully responsive sidebar
// Desktop (≥1024px): full sidebar 220px fixed left
// Tablet  (640–1023px): collapsed icon-only sidebar 64px, expands on hover
// Mobile  (<640px): hidden sidebar + bottom tab bar + hamburger drawer overlay

import { useState, useEffect } from "react";
import { C } from "../theme";
import logo from "../assets/nutribuddy_logo.png";

const NAV_ITEMS = [
  { id: "home",      icon: "🏠", label: "Home" },
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "dietplan",  icon: "🥗", label: "Diet Plan" },
  { id: "foodlog",   icon: "📝", label: "Food Log" },
  { id: "chatbot",   icon: "💬", label: "AI Chatbot" },
  { id: "profile",   icon: "👤", label: "Profile" },
];

// Bottom tab bar — show only 5 most important items on mobile
const BOTTOM_TAB_ITEMS = [
  { id: "home",      icon: "🏠", label: "Home" },
  { id: "foodlog",   icon: "📝", label: "Log" },
  { id: "chatbot",   icon: "💬", label: "Chat" },
  { id: "dashboard", icon: "📊", label: "Stats" },
  { id: "profile",   icon: "👤", label: "Profile" },
];

export default function Sidebar({ page, setPage, user, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close drawer when page changes
  useEffect(() => { setDrawerOpen(false); }, [page]);

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ── Shared sidebar content (used in both desktop sidebar and mobile drawer) ──
  function SidebarContent({ onClose }) {
    return (
      <>
        {/* Logo + close button (mobile drawer only) */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px 24px",
          borderBottom: `1px solid ${C.border}`,
        }}>
          <img src={logo} alt="NutriBuddy" style={{ width: 90, objectFit: "contain" }} />
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                fontSize: 22, color: C.muted, lineHeight: 1, padding: 4,
              }}
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`nb-nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => { setPage(item.id); onClose?.(); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && (setPage(item.id), onClose?.())}
            >
              <span className="nb-nav-icon">{item.icon}</span>
              <span className="nb-nav-label">{item.label}</span>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="nb-sidebar-user">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="nb-sidebar-avatar"
              onClick={() => { setPage("profile"); onClose?.(); }}
              style={{ cursor: "pointer", flexShrink: 0 }}
              title="View Profile"
            >
              {initials}
            </div>
            <div
              style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
              onClick={() => { setPage("profile"); onClose?.(); }}
            >
              <div style={{
                fontSize: 13, fontWeight: 700, color: C.text,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {user.name}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>View Profile</div>
            </div>
            <button
              className="btn-ghost"
              style={{ padding: "4px 6px", fontSize: 16, flexShrink: 0 }}
              onClick={onLogout}
              title="Log out"
            >
              ⏻
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Desktop / Tablet sidebar ── */}
      <div className="nb-sidebar">
        <SidebarContent />
      </div>

      {/* ── Mobile: top header bar with hamburger ── */}
      {isMobile && (
        <header className="nb-mobile-header">
          <button
            className="nb-hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>
          <img src={logo} alt="NutriBuddy" style={{ height: 32, objectFit: "contain" }} />
          <div
            className="nb-sidebar-avatar"
            onClick={() => setPage("profile")}
            style={{ cursor: "pointer", width: 32, height: 32, fontSize: 13 }}
          >
            {initials}
          </div>
        </header>
      )}

      {/* ── Mobile: full-screen drawer overlay ── */}
      {isMobile && (
        <>
          {/* Backdrop */}
          <div
            className={`nb-drawer-backdrop ${drawerOpen ? "open" : ""}`}
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div className={`nb-drawer ${drawerOpen ? "open" : ""}`}>
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* ── Mobile: bottom tab bar ── */}
      {isMobile && (
        <nav className="nb-bottom-nav">
          {BOTTOM_TAB_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nb-bottom-tab ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nb-bottom-tab-icon">{item.icon}</span>
              <span className="nb-bottom-tab-label">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
