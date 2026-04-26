// src/components/shared/index.jsx — Shared reusable UI components

import { C } from "../../theme";
import nutriLogo from "../../assets/nutribuddy_logo.png";

// ── Logo icon ─────────────────────────────────────────────────
export function Logo({ size = 32 }) {
  return (
    <img
      src={nutriLogo}
      alt="NutriBuddy"
      style={{ width: size * 3, objectFit: "contain" }}
    />
  );
}

// ── Progress bar ──────────────────────────────────────────────
export function ProgressBar({ value, max, color = C.green, height = 8 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="nb-progress" style={{ height }}>
      <div
        className="nb-progress-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ── Macro row (label + progress bar) ─────────────────────────
export function MacroRow({ label, value, max, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        <span style={{ color: C.muted }}>{label}</span>
        <span style={{ color: C.text }}>
          {value}g{" "}
          <span style={{ color: C.muted, fontWeight: 400 }}>/ {max}g</span>
        </span>
      </div>
      <ProgressBar value={value} max={max} color={color} />
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────
export function StatPill({ label, value, unit, color = C.green }) {
  return (
    <div className="nb-stat">
      <div className="nb-stat-val" style={{ color }}>
        {value}
      </div>
      <div className="nb-stat-lbl">{label}</div>
      <div style={{ fontSize: 10, color: C.muted }}>{unit}</div>
    </div>
  );
}

// ── Meal card ─────────────────────────────────────────────────
export function MealCard({ name, meal, cals, protein, carbs, fat, emoji }) {
  return (
    <div className="meal-card">
      <div className="meal-emoji">{emoji}</div>
      <div className="meal-info">
        <div className="meal-name">{name}</div>
        <div className="meal-sub">
          {meal} · P:{protein}g C:{carbs}g F:{fat}g
        </div>
      </div>
      <div className="meal-cals">{cals}</div>
    </div>
  );
}
