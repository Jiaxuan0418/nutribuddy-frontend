// src/pages/ProfilePage.jsx — Profile & Settings
// Mirrors all onboarding fields: personal info, activity, goal,
// dietary preferences, allergies, and live targets preview.

import { useState } from "react";
import { C } from "../theme";
import { calcBMR, calcTDEE, calcMacros } from "../utils/nutrition";

const API_URL = "https://JxChan-nutribuddy-backend.hf.space/api";

const PREFERENCES = ["Vegetarian", "Vegan", "Halal", "Keto", "Low-carb", "High-protein", "Mediterranean"];
const ALLERGIES   = ["Nuts", "Dairy", "Gluten", "Eggs", "Shellfish", "Soy", "Fish"];

function TogglePill({ value, selected, color, bgColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "8px 16px", borderRadius: 99,
        border: `1.5px solid ${selected ? color : C.border}`,
        background: selected ? bgColor : "#fff",
        color: selected ? color : C.muted,
        fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .18s",
        userSelect: "none",
      }}
    >
      {value}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: C.muted,
      textTransform: "uppercase", letterSpacing: ".5px",
      marginBottom: 14, marginTop: 4,
    }}>
      {children}
    </div>
  );
}

export default function ProfilePage({ user, profile, onUpdate, onLogout }) {
  const [form, setForm] = useState({
    name:        user.name               || "",
    age:         profile.age             || "",
    weight:      profile.weight          || "",
    height:      profile.height          || "",
    gender:      profile.gender          || "female",
    activity:    profile.activity        || "moderate",
    goal:        profile.goal            || "maintain",
    preferences: profile.preferences    || [],
    allergies:   profile.allergies      || [],
  });

  const [status,  setStatus]  = useState("idle"); // idle | saving | saved | error
  const [errMsg,  setErrMsg]  = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function toggleList(key, val) {
    const cur = form[key];
    set(key, cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]);
  }

  // Live targets preview
  function TargetsPreview() {
    if (!form.weight || !form.height || !form.age) return null;
    const bmr  = calcBMR(+form.weight, +form.height, +form.age, form.gender);
    const tdee = calcTDEE(bmr, form.activity);
    const t    = calcMacros(tdee, form.goal);
    return (
      <div style={{ background: C.greenLight, borderRadius: 12, padding: 16, marginTop: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 10 }}>
          📊 Calculated Targets
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "BMR",     val: `${Math.round(bmr)} kcal` },
            { label: "TDEE",    val: `${tdee} kcal`            },
            { label: "Target",  val: `${t.calories} kcal`      },
            { label: "Protein", val: `${t.protein}g`           },
            { label: "Carbs",   val: `${t.carbs}g`             },
            { label: "Fat",     val: `${t.fat}g`               },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, color: C.green, fontSize: 15 }}>
                {s.val}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  async function save() {
    if (!form.name.trim())  { setErrMsg("Name cannot be empty.");           return; }
    if (!form.age)          { setErrMsg("Please enter your age.");          return; }
    if (!form.weight)       { setErrMsg("Please enter your weight.");       return; }
    if (!form.height)       { setErrMsg("Please enter your height.");       return; }

    setStatus("saving");
    setErrMsg("");

    const bmr     = calcBMR(+form.weight, +form.height, +form.age, form.gender);
    const tdee    = calcTDEE(bmr, form.activity);
    const targets = calcMacros(tdee, form.goal);

    const updatedProfile = {
      ...form,
      age:    +form.age,
      weight: +form.weight,
      height: +form.height,
      bmr:    Math.round(bmr),
      tdee,
      targets,
    };

    try {
      // 1. Save profile (body metrics, goals, preferences, allergies)
      const res  = await fetch(`${API_URL}/onboarding/save`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: user.id, ...updatedProfile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile.");

      // 2. Save name to the User table (separate endpoint)
      const nameRes  = await fetch(`${API_URL}/update-name`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: user.id, name: form.name }),
      });
      const nameData = await nameRes.json();
      if (!nameRes.ok) throw new Error(nameData.message || "Failed to update name.");

      // 3. Propagate both profile AND updated user (with new name) to App
      const updatedUser = { ...user, name: form.name };
      onUpdate(updatedProfile, updatedUser);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      setErrMsg(e.message);
      setStatus("error");
    }
  }

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Profile & Settings 👤</h1>
      <p style={{ color: C.muted, marginBottom: 28 }}>Manage your information and goals</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Personal Information ── */}
        <div className="nb-card">
          <div className="nb-card-title">Personal Information</div>
          <SectionTitle>Account</SectionTitle>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div className="nb-form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="nb-label">Full Name</label>
              <input className="nb-input" value={form.name}
                onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="nb-form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="nb-label">Email</label>
              <input className="nb-input" value={user.email} disabled
                style={{ background: "#f5f5f5", color: C.muted, cursor: "not-allowed" }} />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Email cannot be changed.</div>
            </div>
          </div>

          <SectionTitle>Body Measurements</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="nb-form-group">
              <label className="nb-label">Age</label>
              <input className="nb-input" type="number" placeholder="e.g. 25"
                value={form.age} onChange={(e) => set("age", e.target.value)} />
            </div>
            <div className="nb-form-group">
              <label className="nb-label">Gender</label>
              <select className="nb-select" value={form.gender}
                onChange={(e) => set("gender", e.target.value)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div className="nb-form-group">
              <label className="nb-label">Weight (kg)</label>
              <input className="nb-input" type="number" placeholder="e.g. 60"
                value={form.weight} onChange={(e) => set("weight", e.target.value)} />
            </div>
            <div className="nb-form-group">
              <label className="nb-label">Height (cm)</label>
              <input className="nb-input" type="number" placeholder="e.g. 165"
                value={form.height} onChange={(e) => set("height", e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Health Goals ── */}
        <div className="nb-card">
          <div className="nb-card-title">Health Goals</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div className="nb-form-group">
              <label className="nb-label">Activity Level</label>
              <select className="nb-select" value={form.activity}
                onChange={(e) => set("activity", e.target.value)}>
                <option value="sedentary">Sedentary (little/no exercise)</option>
                <option value="light">Light (1–3 days/week)</option>
                <option value="moderate">Moderate (3–5 days/week)</option>
                <option value="active">Active (6–7 days/week)</option>
                <option value="very_active">Very Active (physical job)</option>
              </select>
            </div>
            <div className="nb-form-group">
              <label className="nb-label">Goal</label>
              <select className="nb-select" value={form.goal}
                onChange={(e) => set("goal", e.target.value)}>
                <option value="lose">Lose Weight</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Build Muscle / Gain Weight</option>
              </select>
            </div>
          </div>

          <TargetsPreview />
        </div>

        {/* ── Dietary Preferences ── */}
        <div className="nb-card">
          <div className="nb-card-title">Dietary Preferences</div>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            Select all that apply — used to personalise your meal suggestions.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PREFERENCES.map((p) => (
              <TogglePill
                key={p} value={p}
                selected={form.preferences.includes(p)}
                color={C.green} bgColor={C.greenLight}
                onClick={() => toggleList("preferences", p)}
              />
            ))}
          </div>
        </div>

        {/* ── Allergies ── */}
        <div className="nb-card">
          <div className="nb-card-title">Allergies & Restrictions</div>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            These will be avoided in your meal plans and AI recommendations.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALLERGIES.map((a) => (
              <TogglePill
                key={a} value={a}
                selected={form.allergies.includes(a)}
                color={C.danger} bgColor="#fef0f0"
                onClick={() => toggleList("allergies", a)}
              />
            ))}
          </div>
        </div>

        {/* ── Error message ── */}
        {errMsg && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5",
            borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#dc2626",
          }}>
            ⚠️ {errMsg}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div style={{ display: "flex", gap: 12, paddingBottom: 32 }}>
          <button
            className="btn-green"
            onClick={save}
            disabled={status === "saving"}
            style={{ opacity: status === "saving" ? 0.7 : 1 }}
          >
            {status === "saving" ? "Saving…"
              : status === "saved" ? "✓ Saved!"
              : "Save Changes"}
          </button>
          <button
            className="btn-outline"
            style={{ color: "#dc2626", borderColor: "#dc2626" }}
            onClick={onLogout}
          >
            Log Out
          </button>
        </div>

      </div>
    </div>
  );
}
