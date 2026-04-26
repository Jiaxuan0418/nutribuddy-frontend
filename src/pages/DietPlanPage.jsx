// src/pages/DietPlanPage.jsx — Personalised daily diet plan
// FIXES:
//  1. Date navigator lets user browse past plans
//  2. Plans are saved to the DB (dietplan table) and reloaded on revisit
//  3. user prop passed through so userId is available for save/load
//  4. Regenerate button saves the new plan immediately

import { useState, useEffect } from "react";
import { C } from "../theme";
import { ProgressBar } from "../components/shared";

const API_URL = "https://jxchan-nutribuddy.hf.space/api";

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateStr(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDisplayDate(dateStr) {
  const d         = new Date(dateStr + "T00:00:00");
  const today     = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today)     return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

// ── Static fallback plan ──────────────────────────────────────────────────────

const FALLBACK_PLAN = {
  Breakfast: {
    name: "Avocado Toast & Eggs",
    cals: 380, protein: 18, carbs: 32, fat: 20, emoji: "🥑",
    ingredients: ["2 slices wholegrain bread","1 ripe avocado","2 poached eggs","Salt, pepper, chilli flakes"],
  },
  Lunch: {
    name: "Grilled Chicken Buddha Bowl",
    cals: 550, protein: 45, carbs: 48, fat: 14, emoji: "🍗",
    ingredients: ["150g chicken breast","½ cup brown rice","Mixed greens","Cherry tomatoes","Tahini dressing"],
  },
  Dinner: {
    name: "Baked Salmon & Quinoa",
    cals: 490, protein: 40, carbs: 35, fat: 18, emoji: "🐟",
    ingredients: ["180g salmon fillet","½ cup quinoa","Steamed broccoli","Lemon, olive oil, dill"],
  },
};

const TIPS = [
  "Drink at least 2L of water throughout the day",
  "Prep your lunch the night before to save time",
  "Add a handful of veggies to any meal for extra fibre",
];

const MEAL_EMOJIS = { Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙", Snack: "🍎" };

// ── Parse AI text response into structured meal cards ─────────────────────────

function parsePlanText(text) {
  const meals = {};
  const mealPatterns = [
    { key: "Breakfast", regex: /breakfast[:\s]+(.+?)(?=\n(?:lunch|dinner|snack)|$)/is },
    { key: "Lunch",     regex: /lunch[:\s]+(.+?)(?=\n(?:breakfast|dinner|snack)|$)/is },
    { key: "Dinner",    regex: /dinner[:\s]+(.+?)(?=\n(?:breakfast|lunch|snack)|$)/is },
  ];
  for (const { key, regex } of mealPatterns) {
    const match = text.match(regex);
    if (match) {
      const lines = match[1].trim().split("\n").filter(l => l.trim());
      const name  = lines[0].replace(/^[-•*]\s*/, "").trim();
      const ingrs = lines.slice(1)
        .filter(l => l.match(/^[-•*]/))
        .map(l => l.replace(/^[-•*]\s*/, "").trim())
        .slice(0, 5);
      meals[key] = {
        name:        name || `${key} meal`,
        cals:        FALLBACK_PLAN[key]?.cals    || 400,
        protein:     FALLBACK_PLAN[key]?.protein  || 30,
        carbs:       FALLBACK_PLAN[key]?.carbs    || 40,
        fat:         FALLBACK_PLAN[key]?.fat      || 15,
        emoji:       MEAL_EMOJIS[key] || "🍽️",
        ingredients: ingrs.length ? ingrs : FALLBACK_PLAN[key]?.ingredients || [],
        aiGenerated: true,
      };
    }
  }
  return Object.keys(meals).length >= 2 ? meals : null;
}

// ── Date navigator ────────────────────────────────────────────────────────────

function DateNav({ selectedDate, onChange, datesWithPlans }) {
  const today   = toDateStr(new Date());
  const isToday = selectedDate === today;

  function shift(days) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    const next = toDateStr(d);
    if (next <= today) onChange(next);
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "#f0f9f4", borderRadius: 12, padding: "8px 12px",
      marginBottom: 20,
    }}>
      <button onClick={() => shift(-1)} style={{
        background: "none", border: `1.5px solid ${C.border}`,
        borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 16, color: C.text,
      }}>‹</button>

      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {formatDisplayDate(selectedDate)}
          {datesWithPlans.includes(selectedDate) && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.green,
              background: C.greenLight, padding: "2px 7px", borderRadius: 99,
            }}>Saved</span>
          )}
        </div>
        <input
          type="date" value={selectedDate} max={today}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          style={{ fontSize: 11, color: C.muted, border: "none", background: "transparent", cursor: "pointer", textAlign: "center" }}
        />
      </div>

      <button onClick={() => shift(1)} disabled={isToday} style={{
        background: "none", border: `1.5px solid ${C.border}`,
        borderRadius: 8, padding: "4px 10px",
        cursor: isToday ? "not-allowed" : "pointer",
        fontSize: 16, color: isToday ? C.muted : C.text, opacity: isToday ? 0.4 : 1,
      }}>›</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DietPlanPage({ profile, user, onMealLogged }) {
  const todayStr = toDateStr(new Date());

  const [selectedDate,   setSelectedDate]   = useState(todayStr);
  const [dietPlan,       setDietPlan]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [expanded,       setExpanded]       = useState(null);
  const [isAI,           setIsAI]           = useState(false);
  const [datesWithPlans, setDatesWithPlans] = useState([]);
  const [saving,         setSaving]         = useState(false);
  const [addingMeal,     setAddingMeal]     = useState(null);   // mealTime being added
  const [addSuccess,     setAddSuccess]     = useState(null);   // mealTime just added

  async function addMealToFoodLog(mealTime, meal) {
    if (!user?.id) return;
    setAddingMeal(mealTime);
    try {
      const res = await fetch(`${API_URL}/food/log`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:   user.id,
          food_name: meal.name,
          meal_type: mealTime,
          calories:  meal.cals,
          protein:   meal.protein,
          fat:       meal.fat,
          carbs:     meal.carbs,
          log_date:  selectedDate,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setAddSuccess(mealTime);
      setTimeout(() => setAddSuccess(null), 2500);
      // Notify App so FoodLogPage re-fetches immediately
      if (onMealLogged) onMealLogged();
    } catch (_) {}
    setAddingMeal(null);
  }

  const isToday = selectedDate === todayStr;

  // Load list of dates with saved plans (for "Saved" badge)
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/diet-plan/dates/${user.id}`);
        const data = await res.json();
        if (data.dates) setDatesWithPlans(data.dates);
      } catch (_) {}
    })();
  }, [user?.id]);

  // Load plan for the selected date
  useEffect(() => {
    if (!profile) { setDietPlan(FALLBACK_PLAN); setLoading(false); return; }
    loadOrGeneratePlan(selectedDate);
  }, [selectedDate]);

  async function loadOrGeneratePlan(dateStr) {
    setLoading(true);
    setError("");
    setDietPlan(null);
    setIsAI(false);

    // 1. Always try loading saved plan from DB first (works for any date)
    if (user?.id) {
      try {
        const res  = await fetch(`${API_URL}/diet-plan/${user.id}?date=${dateStr}`);
        const data = await res.json();
        if (data.plan) {
          setDietPlan(data.plan);
          setIsAI(true);
          setLoading(false);
          return;
        }
      } catch (_) {}
    }

    // 2. No saved plan found — auto-generate if today, show notice if past day
    if (dateStr === todayStr) {
      await generateAndSavePlan(dateStr);
    } else {
      // Past day: no plan was ever saved for this date
      setError(`No saved plan found for ${formatDisplayDate(dateStr)}. Plans are saved automatically each day when you visit Diet Plan.`);
      setDietPlan(FALLBACK_PLAN);
      setIsAI(false);
      setLoading(false);
    }
  }

  async function generateAndSavePlan(dateStr) {
    setLoading(true);
    setError("");
    try {
      const targets    = profile?.targets || {};
      const allergies  = (profile?.allergies || []).join(", ") || "none";
      const prefs      = (profile?.preferences || []).join(", ") || "none";
      const conditions = (profile?.medical_conditions || []).join(", ") || "none";
      const goal       = profile?.goal || "maintain";

      const prompt = (
        `Create a personalised one-day meal plan (Breakfast, Lunch, Dinner) for me.\n` +
        `My daily targets: ${targets.calories || 2000} kcal, ` +
        `${targets.protein || 150}g protein, ${targets.carbs || 200}g carbs, ${targets.fat || 65}g fat.\n` +
        `Goal: ${goal}. Dietary preferences: ${prefs}. Allergies (MUST avoid): ${allergies}. ` +
        `Medical conditions: ${conditions}.\n\n` +
        `Format each meal exactly like this:\n` +
        `Breakfast: [Meal Name]\n- ingredient 1\n- ingredient 2\n- ingredient 3\n\n` +
        `Lunch: [Meal Name]\n- ingredient 1\n- ingredient 2\n\n` +
        `Dinner: [Meal Name]\n- ingredient 1\n- ingredient 2\n\n` +
        `Keep meal names concise (under 6 words). List 3-5 ingredients per meal. ` +
        `Respect all allergies and medical conditions strictly.`
      );

      const res  = await fetch(`${API_URL}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user:    user || {},
          profile: profile || {},
          history: [{ role: "user", text: prompt }],
        }),
      });
      if (!res.ok) throw new Error("Backend error");
      const data   = await res.json();
      const parsed = parsePlanText(data.reply || "");

      const finalPlan = parsed || FALLBACK_PLAN;
      setDietPlan(finalPlan);
      setIsAI(!!parsed);

      // Save to DB
      if (user?.id && parsed) {
        setSaving(true);
        try {
          await fetch(`${API_URL}/diet-plan/${user.id}`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: dateStr, plan: finalPlan }),
          });
          setDatesWithPlans((prev) => prev.includes(dateStr) ? prev : [dateStr, ...prev]);
        } catch (_) {}
        setSaving(false);
      }
    } catch (e) {
      setError("Could not generate a personalised plan. Showing default plan.");
      setDietPlan(FALLBACK_PLAN);
      setIsAI(false);
    }
    setLoading(false);
  }

  const plan  = dietPlan || FALLBACK_PLAN;
  const total = Object.values(plan).reduce(
    (a, m) => ({ cals: a.cals + m.cals, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }),
    { cals: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Diet Plan 🥗</h1>
          <p style={{ color: C.muted, marginTop: 4 }}>Your personalised meal plans</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isAI && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.green,
              background: C.greenLight, padding: "4px 10px", borderRadius: 99,
              display: "flex", alignItems: "center", gap: 4,
            }}>✨ AI Personalised</span>
          )}
          {saving && <span style={{ fontSize: 12, color: C.muted }}>💾 Saving…</span>}
          {isToday && (
            <button className="btn-outline" onClick={() => generateAndSavePlan(selectedDate)} disabled={loading}>
              {loading ? "⏳ Generating…" : "🔄 Regenerate"}
            </button>
          )}
        </div>
      </div>

      {/* Date navigator */}
      <DateNav selectedDate={selectedDate} onChange={setSelectedDate} datesWithPlans={datesWithPlans} />

      {/* Error banner */}
      {error && (
        <div style={{
          background: "#fffbe6", border: "1px solid #fde68a",
          borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#92400e",
        }}>⚠️ {error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
          <p style={{ fontWeight: 700 }}>Generating your personalised meal plan…</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>Taking your goals, preferences and health conditions into account.</p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Summary banner */}
          <div className="nb-card" style={{ background: C.greenLight, border: `1.5px solid ${C.greenMid}` }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 12 }}>
              {[
                { label: "Daily Target", val: `${profile?.targets?.calories || 2000} kcal` },
                { label: "Plan Total",   val: `${total.cals} kcal` },
                { label: "Protein",      val: `${total.protein}g` },
                { label: "Carbs",        val: `${total.carbs}g` },
                { label: "Fat",          val: `${total.fat}g` },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
                  <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 18, fontWeight: 900, color: C.green }}>{s.val}</div>
                </div>
              ))}
            </div>
            <ProgressBar value={total.cals} max={profile?.targets?.calories || 2000} color={C.green} height={10} />
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
              {Math.round((total.cals / (profile?.targets?.calories || 2000)) * 100)}% of daily target covered
            </div>
          </div>

          {/* Meal cards */}
          {Object.entries(plan).map(([mealTime, meal]) => (
            <div className="nb-card" key={mealTime}>
              {/* Clickable header */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
                onClick={() => setExpanded(expanded === mealTime ? null : mealTime)}>
                <div className="meal-emoji">{meal.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{mealTime}</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{meal.name}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="meal-cals">{meal.cals} kcal</div>
                  <div style={{ fontSize: 20, color: C.muted, marginTop: 4 }}>{expanded === mealTime ? "▲" : "▼"}</div>
                </div>
              </div>

              {/* Expanded ingredients */}
              {expanded === mealTime && meal.ingredients?.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Ingredients:</div>
                  <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                    {meal.ingredients.map((ing) => (
                      <li key={ing} style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Add to Food Log button */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); addMealToFoodLog(mealTime, meal); }}
                  disabled={addingMeal === mealTime}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13,
                    background: addSuccess === mealTime ? C.greenLight : C.green,
                    color:      addSuccess === mealTime ? C.green      : "#fff",
                    border:     addSuccess === mealTime ? `1.5px solid ${C.green}` : "none",
                    transition: "all .2s",
                    opacity: addingMeal === mealTime ? 0.7 : 1,
                  }}
                >
                  {addingMeal === mealTime ? "Adding…"
                    : addSuccess === mealTime ? "✓ Added to Food Log!"
                    : "📝 Add to Food Log"}
                </button>
                <span style={{ fontSize: 12, color: C.muted }}>
                  Log this meal for {selectedDate === new Date().toISOString().slice(0,10) ? "today" : selectedDate}
                </span>
              </div>
            </div>
          ))}

          {/* Tips */}
          <div className="nb-card" style={{ background: "#fffbf0", border: "1.5px solid #fde8c0" }}>
            <div className="nb-card-title" style={{ color: C.orange }}>💡 Quick Tips</div>
            <ul style={{ paddingLeft: 20 }}>
              {TIPS.map((t) => (
                <li key={t} style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>{t}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
