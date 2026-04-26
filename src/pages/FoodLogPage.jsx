// src/pages/FoodLogPage.jsx — Daily food logging with manual entry + CNN recognition
// FIXES:
//  1. All API URLs changed from hardcoded http://localhost:5000/api to relative /api
//  2. Food entries are now saved to MealLog DB on add
//  3. Logs are loaded from DB on mount and on date change
//  4. Delete removes from DB, not just local state
//  5. Date picker lets user browse past days' logs

import { useState, useRef, useEffect } from "react";
import { C } from "../theme";
import { MacroRow } from "../components/shared";

const API_URL  = "https://jxchan-nutribuddy.hf.space/api";
const MEAL_TIMES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const EMPTY_FORM = {
  name: "", meal: "Breakfast", cals: "", protein: "", carbs: "", fat: "",
};

// ── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d) {
  // Returns YYYY-MM-DD for a Date object (local time)
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDisplayDate(dateStr) {
  // "2025-04-15" → "Tuesday, 15 Apr 2025"
  const d = new Date(dateStr + "T00:00:00");
  const today    = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today)     return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}

// ── Shared nutrition fetcher ──────────────────────────────────────────────────

async function fetchNutrition(foodName) {
  const res = await fetch(
    `${API_URL}/food/nutrition?name=${encodeURIComponent(foodName)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error) return null;
  // Normalise: backend returns { calculated: { calories, protein_g, carbs_g, fat_g }, source }
  // Map to flat shape so the rest of the component can use data.calories etc.
  const calc = data.calculated || {};
  return {
    calories: calc.calories   ?? 0,
    protein:  calc.protein_g  ?? 0,
    carbs:    calc.carbs_g    ?? 0,
    fat:      calc.fat_g      ?? 0,
    // Pass source through as-is: "kg" | "usda" | "ai_estimate"
    source:   data.source     ?? "usda",
  };
}

// ── Small sub-components ──────────────────────────────────────────────────────

function DateNav({ selectedDate, onChange }) {
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
      <button
        onClick={() => shift(-1)}
        style={{
          background: "none", border: `1.5px solid ${C.border}`,
          borderRadius: 8, padding: "4px 10px", cursor: "pointer",
          fontSize: 16, color: C.text,
        }}
      >‹</button>

      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>
          {formatDisplayDate(selectedDate)}
        </div>
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          style={{
            fontSize: 11, color: C.muted, border: "none",
            background: "transparent", cursor: "pointer", textAlign: "center",
          }}
        />
      </div>

      <button
        onClick={() => shift(1)}
        disabled={isToday}
        style={{
          background: "none", border: `1.5px solid ${C.border}`,
          borderRadius: 8, padding: "4px 10px",
          cursor: isToday ? "not-allowed" : "pointer",
          fontSize: 16, color: isToday ? C.muted : C.text,
          opacity: isToday ? 0.4 : 1,
        }}
      >›</button>
    </div>
  );
}

function TabToggle({ active, onChange }) {
  const tabs = [
    { id: "manual", icon: "✏️", label: "Manual Entry" },
    { id: "image",  icon: "📷", label: "Scan Food"    },
  ];
  return (
    <div style={{
      display: "flex", background: "#f0f9f4", borderRadius: 12,
      padding: 4, marginBottom: 20, gap: 4,
    }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 9,
            border: "none", cursor: "pointer",
            fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14,
            transition: "all .18s",
            background: active === t.id ? C.green : "transparent",
            color:      active === t.id ? "#fff"  : C.muted,
            boxShadow:  active === t.id ? "0 2px 8px rgba(76,175,125,.3)" : "none",
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

function PredictionBadge({ item, selected, onSelect }) {
  const isTop = item.confidence >= 60;
  return (
    <button
      onClick={() => onSelect(item)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "11px 14px", borderRadius: 10, cursor: "pointer",
        border: selected
          ? `2px solid ${C.green}`
          : `1.5px solid ${C.border}`,
        background: selected ? C.greenLight : "#fafffe",
        marginBottom: 8, transition: "all .15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: isTop ? C.green : C.muted, flexShrink: 0,
        }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
          {item.display}
        </span>
        {isTop && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.green,
            background: C.greenLight, padding: "2px 7px", borderRadius: 99,
          }}>
            Best match
          </span>
        )}
      </div>
      <span style={{ fontWeight: 800, fontSize: 14, color: isTop ? C.green : C.muted }}>
        {item.confidence}%
      </span>
    </button>
  );
}

function NutritionPreview({ nutrition, loading }) {
  if (loading) {
    return (
      <div style={{
        background: C.greenLight, borderRadius: 10, padding: "12px 14px",
        marginBottom: 14, fontSize: 13, color: C.muted, textAlign: "center",
      }}>
        🔍 Looking up nutrition info…
      </div>
    );
  }
  if (!nutrition) return null;

  const isAI   = nutrition.source === "ai_estimate";
  const isUSDA = nutrition.source === "usda";

  const sourceLabel = isAI
    ? "AI Estimate ✨"
    : isUSDA
    ? "USDA"
    : "Knowledge Graph";

  const rows = [
    { label: "Calories", value: `${nutrition.calories} kcal`, color: C.orange },
    { label: "Protein",  value: `${nutrition.protein} g`,     color: C.green  },
    { label: "Carbs",    value: `${nutrition.carbs} g`,       color: "#f39c12" },
    { label: "Fat",      value: `${nutrition.fat} g`,         color: "#9b59b6" },
  ];

  return (
    <div style={{
      background:   isAI ? "#fffbeb" : C.greenLight,
      border:       `1px solid ${isAI ? "#f59e0b" : C.green}`,
      borderRadius: 10, padding: "12px 16px", marginBottom: 14,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: isAI ? "#b45309" : C.green,
          textTransform: "uppercase", letterSpacing: ".4px",
        }}>
          Nutrition Info ({sourceLabel})
        </div>
        {isAI && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#b45309",
            background: "#fef3c7", padding: "2px 8px", borderRadius: 99,
            border: "1px solid #f59e0b",
          }}>
            Approximate
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
        {rows.map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: C.muted }}>{label}</span>
            <span style={{ fontWeight: 800, color }}>{value}</span>
          </div>
        ))}
      </div>

      {isAI && (
        <div style={{
          marginTop: 10, fontSize: 11, color: "#92400e",
          background: "#fef3c7", borderRadius: 6, padding: "6px 10px",
          lineHeight: 1.5,
        }}>
          ⚠️ These are <strong>AI-estimated</strong> values based on typical recipes.
          You can adjust the numbers manually before logging.
        </div>
      )}
    </div>
  );
}

// ── Manual entry form ─────────────────────────────────────────────────────────

function ManualForm({ onAdd, onCancel }) {
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [nutrition, setNutrition] = useState(null);
  const [kgLoading, setKgLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleNameBlur() {
    if (!form.name.trim()) return;
    setKgLoading(true);
    setNutrition(null);
    try {
      const data = await fetchNutrition(form.name.trim());
      if (data && !data.error) {
        setNutrition(data);
        setForm((f) => ({
          ...f,
          cals:    f.cals    || String(data.calories),
          protein: f.protein || String(data.protein),
          carbs:   f.carbs   || String(data.carbs),
          fat:     f.fat     || String(data.fat),
        }));
      }
    } catch (_) {}
    setKgLoading(false);
  }

  function handleAdd() {
    if (!form.name || !form.cals) return;
    onAdd({
      name:    form.name,
      meal:    form.meal,
      cals:    +form.cals,
      protein: +form.protein || 0,
      carbs:   +form.carbs   || 0,
      fat:     +form.fat     || 0,
    });
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="nb-form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="nb-label">Food Name</label>
          <input
            className="nb-input"
            placeholder="e.g. Brown rice, Nasi lemak"
            value={form.name}
            onChange={(e) => { set("name", e.target.value); setNutrition(null); }}
            onBlur={handleNameBlur}
            onKeyDown={(e) => e.key === "Enter" && handleNameBlur()}
          />
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            Tab out or press Enter after typing to auto-fill nutrition from the Knowledge Graph.
          </div>
        </div>
        <div className="nb-form-group">
          <label className="nb-label">Meal</label>
          <select className="nb-select" value={form.meal}
            onChange={(e) => set("meal", e.target.value)}>
            {MEAL_TIMES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="nb-form-group">
          <label className="nb-label">Calories (kcal) *</label>
          <input className="nb-input" type="number" placeholder="e.g. 350"
            value={form.cals} onChange={(e) => set("cals", e.target.value)} />
        </div>
        <div className="nb-form-group">
          <label className="nb-label">Protein (g)</label>
          <input className="nb-input" type="number" placeholder="e.g. 25"
            value={form.protein} onChange={(e) => set("protein", e.target.value)} />
        </div>
        <div className="nb-form-group">
          <label className="nb-label">Carbs (g)</label>
          <input className="nb-input" type="number" placeholder="e.g. 40"
            value={form.carbs} onChange={(e) => set("carbs", e.target.value)} />
        </div>
        <div className="nb-form-group">
          <label className="nb-label">Fat (g)</label>
          <input className="nb-input" type="number" placeholder="e.g. 10"
            value={form.fat} onChange={(e) => set("fat", e.target.value)} />
        </div>
      </div>

      <NutritionPreview nutrition={nutrition} loading={kgLoading} />

      {!form.name && (
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          * Food name and calories are required.
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button className="btn-green" onClick={handleAdd}
          style={{ opacity: (!form.name || !form.cals) ? 0.5 : 1 }}>
          Add Entry
        </button>
        <button className="btn-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Image recognition panel ───────────────────────────────────────────────────

function ImageRecognitionForm({ onAdd, onCancel }) {
  const [preview,     setPreview]     = useState(null);
  const [file,        setFile]        = useState(null);
  const [status,      setStatus]      = useState("idle");
  const [predictions, setPredictions] = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [meal,        setMeal]        = useState("Lunch");
  const [errorMsg,    setErrorMsg]    = useState("");
  const [useOverride,  setUseOverride]  = useState(false);
  const [overrideName, setOverrideName] = useState("");
  const [nutrition,    setNutrition]    = useState(null);
  const [kgLoading,    setKgLoading]    = useState(false);

  const inputRef = useRef();

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    resetScanState(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f || !f.type.startsWith("image/")) return;
    resetScanState(f);
  }

  function resetScanState(f) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("idle");
    setPredictions([]);
    setSelected(null);
    setErrorMsg("");
    setUseOverride(false);
    setOverrideName("");
    setNutrition(null);
  }

  async function handleScan() {
    if (!file) return;
    setStatus("scanning");
    setErrorMsg("");
    setNutrition(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res  = await fetch(`${API_URL}/food/recognize`, {
        method: "POST",
        body:   formData,
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Recognition failed.");
        setStatus("error");
        return;
      }

      const preds = data.predictions;
      setPredictions(preds);
      const best = preds[0];
      setSelected(best);
      setStatus("confirming");
      await lookupNutrition(best.display);
    } catch (err) {
      setErrorMsg("Could not reach the server. Make sure the Flask backend is running.");
      setStatus("error");
    }
  }

  async function lookupNutrition(foodName) {
    setKgLoading(true);
    setNutrition(null);
    try {
      const data = await fetchNutrition(foodName);
      if (data && !data.error) setNutrition(data);
    } catch (_) {}
    setKgLoading(false);
  }

  async function handleSelectPrediction(item) {
    setSelected(item);
    setUseOverride(false);
    setOverrideName("");
    await lookupNutrition(item.display);
  }

  async function handleOverrideBlur() {
    const name = overrideName.trim();
    if (!name) return;
    await lookupNutrition(name);
  }

  function handleConfirm() {
    const foodName = useOverride ? overrideName.trim() : selected?.display;
    if (!foodName) return;
    onAdd({
      name:    foodName,
      meal,
      cals:    nutrition?.calories || 0,
      protein: nutrition?.protein  || 0,
      carbs:   nutrition?.carbs    || 0,
      fat:     nutrition?.fat      || 0,
    });
  }

  const confirmReady = useOverride ? !!overrideName.trim() : !!selected;

  return (
    <div>
      <div className="nb-form-group">
        <label className="nb-label">Meal</label>
        <select className="nb-select" value={meal}
          onChange={(e) => setMeal(e.target.value)}>
          {MEAL_TIMES.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border:       `2px dashed ${preview ? C.green : C.border}`,
          borderRadius: 14,
          padding:      preview ? 0 : "32px 16px",
          textAlign:    "center",
          cursor:       "pointer",
          background:   preview ? "transparent" : C.greenLight,
          overflow:     "hidden",
          transition:   "border .2s",
          marginBottom: 14,
          position:     "relative",
        }}
      >
        <input
          ref={inputRef} type="file" accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        {preview ? (
          <>
            <img
              src={preview} alt="food preview"
              style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
            />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "rgba(0,0,0,.45)", color: "#fff",
              fontSize: 12, fontWeight: 700, padding: "6px 0", textAlign: "center",
            }}>
              Tap to change photo
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>
              Tap to upload or drag & drop
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              JPG, PNG or WEBP — your food photo
            </div>
          </>
        )}
      </div>

      {preview && status !== "confirming" && (
        <button
          className="btn-green"
          onClick={handleScan}
          disabled={status === "scanning"}
          style={{
            width: "100%", marginBottom: 14,
            opacity: status === "scanning" ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {status === "scanning" ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
              Recognising food…
            </>
          ) : (
            "🔍 Recognise Food"
          )}
        </button>
      )}

      {status === "error" && (
        <div style={{
          background: "#fef2f2", border: `1px solid #fca5a5`,
          borderRadius: 10, padding: "12px 14px", marginBottom: 12,
          fontSize: 13, color: "#dc2626",
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {status === "confirming" && (
        <div>
          <div style={{
            fontSize: 12, fontWeight: 700, color: C.muted,
            textTransform: "uppercase", letterSpacing: ".3px", marginBottom: 10,
          }}>
            Top predictions — select one
          </div>
          {predictions.map((p) => (
            <PredictionBadge
              key={p.label}
              item={p}
              selected={!useOverride && selected?.label === p.label}
              onSelect={handleSelectPrediction}
            />
          ))}

          <div style={{
            marginTop: 10, marginBottom: 12,
            background: useOverride ? "#fff8e1" : "#f9fafb",
            border: `1.5px solid ${useOverride ? "#f59e0b" : C.border}`,
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: useOverride ? 10 : 0 }}>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 600, flex: 1 }}>
                ❌ Not the right food?
              </span>
              <button
                onClick={() => {
                  setUseOverride((v) => !v);
                  setNutrition(null);
                  setOverrideName("");
                }}
                style={{
                  padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700,
                  background: useOverride ? "#f59e0b" : C.green,
                  color: "#fff",
                }}
              >
                {useOverride ? "Cancel override" : "Type food name"}
              </button>
            </div>
            {useOverride && (
              <div>
                <input
                  className="nb-input"
                  placeholder="e.g. Nasi lemak, Char kway teow…"
                  value={overrideName}
                  onChange={(e) => { setOverrideName(e.target.value); setNutrition(null); }}
                  onBlur={handleOverrideBlur}
                  onKeyDown={(e) => e.key === "Enter" && handleOverrideBlur()}
                  autoFocus
                />
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  Tab out or press Enter to look up nutrition info.
                </div>
              </div>
            )}
          </div>

          <NutritionPreview nutrition={nutrition} loading={kgLoading} />

          {!nutrition && !kgLoading && (
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
              💡 Nutrition data could not be found automatically. The values above
              may be zeros — you can edit them manually after logging.
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {status === "confirming" && (
          <>
            <button
              className="btn-green"
              onClick={handleConfirm}
              disabled={!confirmReady}
              style={{ opacity: confirmReady ? 1 : 0.5 }}
            >
              ✓ Confirm &amp; Log
            </button>
            <button
              className="btn-outline"
              onClick={() => { setStatus("idle"); setNutrition(null); }}
            >
              Re-scan
            </button>
          </>
        )}
        <button className="btn-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FoodLogPage({ profile, user, refreshKey = 0 }) {
  const todayStr = toDateStr(new Date());

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [logs,         setLogs]         = useState([]);
  const [showAdd,      setShowAdd]      = useState(false);
  const [activeTab,    setActiveTab]    = useState("manual");
  const [dbLoading,    setDbLoading]    = useState(true);
  const [saveErr,      setSaveErr]      = useState("");

  // ── AI meal analysis ──────────────────────────────────────────────────────
  const [aiAnalysis,   setAiAnalysis]   = useState(null);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const isToday = selectedDate === todayStr;

  // Load logs from DB whenever the selected date or refreshKey changes
  useEffect(() => {
    if (!user?.id) {
      setDbLoading(false);
      setSaveErr("User session not found. Please log in again.");
      return;
    }
    setLogs([]);
    setShowAdd(false);
    setShowAnalysis(false);
    setAiAnalysis(null);
    setDbLoading(true);
    setSaveErr("");
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/food/log/${user.id}?date=${selectedDate}`);
        const data = await res.json();
        if (!res.ok) {
          console.error("[FoodLog] Backend error:", data.error || res.status);
          setSaveErr(`Could not load food log: ${data.error || "Server error"}`);
        } else {
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("[FoodLog] Fetch failed:", err);
        setSaveErr("Could not connect to the server. Make sure Flask is running.");
      }
      setDbLoading(false);
    })();
  }, [user?.id, selectedDate, refreshKey]);

  async function handleAnalyse() {
    if (!logs.length) return;
    setAiLoading(true);
    setShowAnalysis(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API_URL}/chat/analyse`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: user || {}, profile, logs }),
      });
      const data = await res.json();
      setAiAnalysis(data.analysis || "Sorry, I couldn't generate an analysis right now.");
    } catch {
      setAiAnalysis("Could not reach the server. Make sure the Flask backend is running.");
    }
    setAiLoading(false);
  }

  const totals = logs.reduce(
    (a, l) => ({
      cals:    a.cals    + l.cals,
      protein: a.protein + l.protein,
      carbs:   a.carbs   + l.carbs,
      fat:     a.fat     + l.fat,
    }),
    { cals: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Save to DB — always logs against selectedDate
  async function addLog(entry) {
    setSaveErr("");
    try {
      const res  = await fetch(`${API_URL}/food/log`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:   user.id,
          food_name: entry.name,
          meal_type: entry.meal,
          calories:  entry.cals,
          protein:   entry.protein,
          fat:       entry.fat,
          carbs:     entry.carbs,
          log_date:  selectedDate,   // send the selected date so past-day logs work
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setLogs((prev) => [...prev, { ...entry, id: data.log_id }]);
      setShowAdd(false);
    } catch (e) {
      setSaveErr(`Could not save to database: ${e.message}`);
    }
  }

  // Delete from DB
  async function deleteLog(id) {
    try {
      await fetch(`${API_URL}/food/log/${user.id}/${id}`, { method: "DELETE" });
    } catch (_) {}
    setLogs(logs.filter((l) => l.id !== id));
  }

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Food Log 📝</h1>
          <p style={{ color: C.muted, marginTop: 4 }}>Track your daily intake</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {logs.length > 0 && (
            <button
              className="btn-outline"
              onClick={handleAnalyse}
              disabled={aiLoading}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {aiLoading
                ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span> Analysing…</>
                : "🤖 AI Analysis"
              }
            </button>
          )}
          {isToday && (
            <button
              className="btn-green"
              onClick={() => { setShowAdd(!showAdd); setActiveTab("manual"); setSaveErr(""); }}
            >
              + Log Food
            </button>
          )}
        </div>
      </div>

      {/* ── Date navigator ── */}
      <DateNav selectedDate={selectedDate} onChange={setSelectedDate} />

      {/* ── Today's/selected-day summary ── */}
      <div className="nb-card">
        <div className="nb-card-title">
          {isToday ? "Today's Summary" : `Summary for ${formatDisplayDate(selectedDate)}`}
        </div>
        <MacroRow label="Calories" value={totals.cals}    max={profile?.targets?.calories || 2000} color={C.orange} />
        <MacroRow label="Protein"  value={totals.protein} max={profile?.targets?.protein  || 150}  color={C.green}  />
        <MacroRow label="Carbs"    value={totals.carbs}   max={profile?.targets?.carbs    || 200}  color="#f39c12"  />
        <MacroRow label="Fat"      value={totals.fat}     max={profile?.targets?.fat      || 65}   color="#9b59b6"  />
      </div>

      {/* ── AI Analysis card ── */}
      {showAnalysis && (
        <div className="nb-card fade-in" style={{ border: `1.5px solid ${C.green}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="nb-card-title" style={{ margin: 0 }}>🤖 AI Meal Analysis</div>
            <button
              onClick={() => setShowAnalysis(false)}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}
            >
              ✕
            </button>
          </div>
          {aiLoading ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "12px 0" }}>
              Analysing your meals…
            </div>
          ) : (
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
              {aiAnalysis}
            </div>
          )}
        </div>
      )}

      {/* ── Loading state ── */}
      {dbLoading && (
        <div style={{ textAlign: "center", padding: "20px", color: C.muted, fontSize: 13 }}>
          Loading food log…
        </div>
      )}

      {/* ── Empty state ── */}
      {!dbLoading && logs.length === 0 && (
        <div style={{ textAlign: "center", padding: "28px 24px", color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🍽️</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>
            No food logged {isToday ? "yet today" : `on ${formatDisplayDate(selectedDate)}`}
          </div>
          {isToday && (
            <div style={{ fontSize: 13 }}>
              Tap <strong>+ Log Food</strong> above to start tracking your meals.
            </div>
          )}
        </div>
      )}

      {/* ── Add food panel (today only) ── */}
      {showAdd && isToday && (
        <div
          className="nb-card fade-in"
          style={{ border: `1.5px solid ${C.green}` }}
        >
          <div className="nb-card-title" style={{ marginBottom: 4 }}>
            Add Food Entry
          </div>

          {saveErr && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 8, padding: "10px 14px", marginBottom: 12,
              fontSize: 13, color: "#dc2626",
            }}>
              ⚠️ {saveErr}
            </div>
          )}

          <TabToggle active={activeTab} onChange={setActiveTab} />

          {activeTab === "manual" ? (
            <ManualForm
              onAdd={addLog}
              onCancel={() => setShowAdd(false)}
            />
          ) : (
            <ImageRecognitionForm
              onAdd={addLog}
              onCancel={() => setShowAdd(false)}
            />
          )}
        </div>
      )}

      {/* ── Log entries grouped by meal ── */}
      {MEAL_TIMES.map((mealType) => {
        const entries = logs.filter((l) => l.meal === mealType);
        if (!entries.length) return null;
        return (
          <div className="nb-card" key={mealType} style={{ marginBottom: 16 }}>
            <div className="nb-card-title">{mealType}</div>
            {entries.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex", alignItems: "center",
                  padding: "10px 0", borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    P:{e.protein}g · C:{e.carbs}g · F:{e.fat}g
                  </div>
                </div>
                <div style={{
                  fontFamily: "'Nunito',sans-serif", fontWeight: 900,
                  color: C.orange, marginRight: 12,
                }}>
                  {e.cals} kcal
                </div>
                {isToday && (
                  <button
                    style={{
                      background: "none", border: "none",
                      color: C.muted, cursor: "pointer", fontSize: 16,
                    }}
                    onClick={() => deleteLog(e.id)}
                  >
                    🗑
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      })}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}