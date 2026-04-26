// src/pages/HomePage.jsx — Issue 3 fix: connected to real API data

import { useState, useEffect } from "react";
import { C } from "../theme";
import { MacroRow, StatPill } from "../components/shared";

const API_URL = "https://JxChan-nutribuddy-backend.hf.space/api";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)  return { text: "Good morning",   emoji: "☀️" };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (hour >= 17 && hour < 21) return { text: "Good evening",   emoji: "🌇" };
  return { text: "Good night", emoji: "🌙" };
}

export default function HomePage({ user, profile }) {
  const { targets } = profile;
  const greeting = getGreeting();

  const [logged,      setLogged]      = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoadingLogs(false); return; }
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/food/log/${user.id}`);
        const data = await res.json();
        const totals = (data.logs || []).reduce(
          (acc, l) => ({
            calories: acc.calories + (l.cals    || 0),
            protein:  acc.protein  + (l.protein || 0),
            carbs:    acc.carbs    + (l.carbs   || 0),
            fat:      acc.fat      + (l.fat     || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        setLogged(totals);
      } catch (_) {
        // silently fail — leave zeros
      }
      setLoadingLogs(false);
    })();
  }, [user?.id]);

  const remaining = targets.calories - logged.calories;

  // Body fat display (if stored in profile from onboarding)
  const bodyFat = profile?.body_fat_pct;
  const bodyFatMethod = profile?.body_fat_method;

  function BodyFatBadge() {
    if (!bodyFat) return null;
    const isFemale = profile?.gender === "female";
    let label, color;
    if (isFemale) {
      if (bodyFat < 14)      { label = "Essential fat"; color = "#3b82f6"; }
      else if (bodyFat < 21) { label = "Athletic";      color = C.green;   }
      else if (bodyFat < 25) { label = "Fitness";       color = C.green;   }
      else if (bodyFat < 32) { label = "Average";       color = C.orange;  }
      else                   { label = "Obese";         color = C.danger;  }
    } else {
      if (bodyFat < 6)       { label = "Essential fat"; color = "#3b82f6"; }
      else if (bodyFat < 14) { label = "Athletic";      color = C.green;   }
      else if (bodyFat < 18) { label = "Fitness";       color = C.green;   }
      else if (bodyFat < 25) { label = "Average";       color = C.orange;  }
      else                   { label = "Obese";         color = C.danger;  }
    }
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "#f9fafb", border: `1.5px solid ${C.border}`,
        borderRadius: 12, padding: "10px 16px",
      }}>
        <span style={{ fontSize: 20 }}>⚖️</span>
        <div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>Body Fat</div>
          <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: "'Nunito',sans-serif" }}>
            {bodyFat.toFixed(1)}%
            <span style={{ fontSize: 12, fontWeight: 700, color, marginLeft: 6 }}>{label}</span>
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
            via {bodyFatMethod === "navy" ? "US Navy formula" : "BMI estimation"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24 }}>{greeting.text}, {user.name.split(" ")[0]}! {greeting.emoji}</h1>
        <p style={{ color: C.muted, marginTop: 4 }}>Here's your nutrition summary for today</p>
      </div>

      {/* Stat pills row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <StatPill label="Target"    value={targets.calories}           unit="kcal" color={C.green} />
        <StatPill label="Consumed"  value={Math.round(logged.calories)} unit="kcal" color={C.orange} />
        <StatPill label="Remaining" value={Math.round(remaining)}       unit="kcal" color={remaining >= 0 ? C.green : C.danger} />
        <StatPill label="BMR"       value={profile.bmr}                unit="kcal" color={C.muted} />
      </div>

      {/* Body fat badge (only if we have it from onboarding) */}
      {bodyFat && (
        <div style={{ marginBottom: 20 }}>
          <BodyFatBadge />
        </div>
      )}

      {/* Macro card */}
      <div className="nb-card">
        <div className="nb-card-title">Today's Macronutrients</div>
        {loadingLogs ? (
          <p style={{ color: C.muted, fontSize: 13, margin: "8px 0" }}>Loading today's data…</p>
        ) : (
          <>
            <MacroRow label="Protein"       value={Math.round(logged.protein)} max={targets.protein} color={C.green} />
            <MacroRow label="Carbohydrates" value={Math.round(logged.carbs)}   max={targets.carbs}   color={C.orange} />
            <MacroRow label="Fat"           value={Math.round(logged.fat)}     max={targets.fat}     color="#9b59b6" />
          </>
        )}
      </div>

      {/* Goal summary card */}
      <div className="nb-card">
        <div className="nb-card-title">Your Goal</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>Current Goal</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.green, marginTop: 2, textTransform: "capitalize" }}>
              {profile.goal === "lose" ? "🔥 Lose Weight"
               : profile.goal === "gain" ? "💪 Build Muscle"
               : "⚖️ Maintain Weight"}
            </div>
          </div>
          {profile.target_weight && (
            <div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>Target Weight</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.orange, marginTop: 2 }}>
                {profile.target_weight} kg
              </div>
            </div>
          )}
          {profile.goal_weeks && profile.goal !== "maintain" && (
            <div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>Duration</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#7c3aed", marginTop: 2 }}>
                {profile.goal_weeks} weeks
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>Daily Calorie Target</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.green, marginTop: 2 }}>
              {targets.calories} kcal
            </div>
          </div>
        </div>
      </div>

      {/* Calorie progress bar */}
      <div className="nb-card">
        <div className="nb-card-title">Calorie Progress</div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: C.muted }}>
              {Math.round(logged.calories)} kcal consumed
            </span>
            <span style={{ fontSize: 13, color: C.muted }}>
              {targets.calories} kcal target
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ background: "#eaf5ee", borderRadius: 99, height: 12, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min((logged.calories / (targets.calories || 1)) * 100, 100)}%`,
              background: logged.calories > targets.calories ? C.danger : C.green,
              borderRadius: 99,
              transition: "width .6s ease",
            }} />
          </div>
          <div style={{ fontSize: 12, color: remaining >= 0 ? C.green : C.danger, marginTop: 6, fontWeight: 700 }}>
            {remaining >= 0
              ? `${Math.round(remaining)} kcal remaining today`
              : `${Math.abs(Math.round(remaining))} kcal over target`}
          </div>
        </div>
      </div>
    </div>
  );
}
