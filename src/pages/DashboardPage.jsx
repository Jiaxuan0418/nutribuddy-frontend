// src/pages/DashboardPage.jsx — Weekly analytics dashboard + Progress Tracker

import { useState, useEffect } from "react";
import { C } from "../theme";

const API_URL = "https://JxChan-nutribuddy-backend.hf.space/api";
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_META = {
  on_track:       { color: C.green,   icon: "✅", label: "On Track" },
  ahead:          { color: C.green,   icon: "🚀", label: "Ahead of Goal" },
  behind_on_loss: { color: "#f59e0b", icon: "⚠️",  label: "Behind on Loss" },
  behind_on_gain: { color: "#f59e0b", icon: "⚠️",  label: "Behind on Gain" },
};

// Build a 7-day scaffold (last 7 days) so empty days show as 0
function buildWeekScaffold() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
  }
  return days;
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return DAYS_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

const CHART_TYPES = [
  { id: "bar",  label: "Bar",  icon: "▬" },
  { id: "line", label: "Line", icon: "╱" },
  { id: "dot",  label: "Dot",  icon: "●" },
];

// ── Radial progress ring ──────────────────────────────────────────────────────
function Ring({ value, max, color, size = 80, stroke = 8 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(value / (max || 1), 1);
  const dash = pct * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.greenLight} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray .6s ease" }} />
    </svg>
  );
}

function MacroCard({ icon, label, current, target, unit, color }) {
  const pct = Math.min(Math.round((current / (target || 1)) * 100), 100);
  return (
    <div className="nb-card" style={{ margin: 0, textAlign: "center", padding: "20px 16px" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <Ring value={current} max={target} color={color} />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
        </div>
      </div>
      <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 22, fontWeight: 900, color, marginTop: 8 }}>
        {Math.round(current)}<span style={{ fontSize: 13, fontWeight: 700 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>of {target}{unit}</div>
      <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginTop: 4 }}>{label}</div>
      <div style={{ marginTop: 8, background: "#eaf5ee", borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99, background: color,
          width: `${pct}%`, transition: "width .6s ease",
        }} />
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{pct}% of daily target</div>
    </div>
  );
}

// ── Chart renderers ───────────────────────────────────────────────────────────
function BarChart({ data, labels, target, highlightColor, baseColor }) {
  const max = Math.max(...data, target, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130 }}>
      {data.map((val, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 700 }}>{Math.round(val) || ""}</div>
          <div style={{
            width: "100%", borderRadius: "6px 6px 0 0", minHeight: 4,
            height: `${(val / max) * 90}px`,
            background: val >= target ? highlightColor : baseColor,
            transition: "height .5s ease",
          }} />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 700 }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, labels, target, highlightColor }) {
  const W = 560, H = 110, PAD = 20;
  const minV = Math.min(...data);
  const maxV = Math.max(...data, target, minV + 1);
  const xs = labels.map((_, i) => PAD + (i / (labels.length - 1)) * (W - PAD * 2));
  const ys = data.map(v => H - PAD - ((v - minV) / (maxV - minV + 1)) * (H - PAD * 2));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const targetY = H - PAD - ((target - minV) / (maxV - minV + 1)) * (H - PAD * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 130, overflow: "visible" }}>
      <line x1={PAD} y1={targetY} x2={W-PAD} y2={targetY}
        stroke={C.green} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.5} />
      <path d={`${path} L${xs[xs.length-1]},${H} L${xs[0]},${H} Z`}
        fill={highlightColor} opacity={0.25} />
      <path d={path} fill="none" stroke={highlightColor} strokeWidth={2.5}
        strokeLinejoin="round" strokeLinecap="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r={5} fill={highlightColor} stroke="#fff" strokeWidth={2} />
          <text x={x} y={ys[i]-10} textAnchor="middle" fontSize={10} fill={C.muted} fontWeight={700}>
            {Math.round(data[i]) || ""}
          </text>
          <text x={x} y={H-2} textAnchor="middle" fontSize={10} fill={C.muted} fontWeight={700}>
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DotChart({ data, labels, target, highlightColor }) {
  const dotMax = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130 }}>
      {data.map((val, i) => {
        const pct = val / dotMax;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 700 }}>{Math.round(val) || ""}</div>
            <div style={{
              width: `${28 + pct * 18}px`, height: `${28 + pct * 18}px`,
              borderRadius: "50%",
              background: val >= target ? highlightColor : C.greenLight,
              border: `3px solid ${val >= target ? highlightColor : C.border}`,
              transition: "all .4s ease",
            }} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6, fontWeight: 700 }}>{labels[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage({ profile, user }) {
  const [chartType,    setChartType]    = useState("bar");
  const [activeMetric, setActiveMetric] = useState("calories");
  const [weeklyData,   setWeeklyData]   = useState(null);
  const [loading,      setLoading]      = useState(true);

  // Progress Tracker state
  const [weight,      setWeight]      = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [history,     setHistory]     = useState([]);
  const [checkLoading, setCheckLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const [checkErr,    setCheckErr]    = useState("");

  const targets = profile?.targets ?? { calories: 2000, protein: 150, carbs: 200, fat: 65 };

  // Fetch progress history
  useEffect(() => {
    if (!user?.id) { setHistLoading(false); return; }
    fetchProgressHistory();
  }, [user?.id]);

  async function fetchProgressHistory() {
    setHistLoading(true);
    try {
      const res  = await fetch(`${API_URL}/progress/history/${user.id}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch { /* ignore */ }
    setHistLoading(false);
  }

  async function submitCheckIn() {
    if (!weight || isNaN(+weight) || +weight < 20 || +weight > 300) {
      setCheckErr("Please enter a valid weight (20–300 kg)."); return;
    }
    setCheckErr("");
    setCheckLoading(true);
    try {
      const res  = await fetch(`${API_URL}/progress/check-in`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: user.id, current_weight_kg: +weight }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check-in failed.");
      setCheckResult(data);
      await fetchProgressHistory();
    } catch (e) {
      setCheckErr(e.message);
    }
    setCheckLoading(false);
  }

  // Fetch real weekly data from DB
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_URL}/food/log/weekly/${user.id}`);
        const data = await res.json();
        // Map to 7-day scaffold so all days appear even with no data
        const scaffold = buildWeekScaffold();
        const byDate   = {};
        (data.weekly || []).forEach(row => { byDate[row.date] = row; });

        const filled = scaffold.map(date => ({
          date,
          label:    dayLabel(date),
          calories: byDate[date]?.calories || 0,
          protein:  byDate[date]?.protein  || 0,
          carbs:    byDate[date]?.carbs    || 0,
          fat:      byDate[date]?.fat      || 0,
        }));
        setWeeklyData(filled);
      } catch (_) {
        // Fallback: 7 empty days
        const scaffold = buildWeekScaffold();
        setWeeklyData(scaffold.map(date => ({
          date, label: dayLabel(date),
          calories: 0, protein: 0, carbs: 0, fat: 0,
        })));
      }
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading || !weeklyData) {
    return (
      <div className="fade-in">
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Dashboard 📊</h1>
        <p style={{ color: C.muted }}>Loading your nutrition data…</p>
      </div>
    );
  }

  const labels       = weeklyData.map(d => d.label);
  const calorieData  = weeklyData.map(d => d.calories);
  const proteinData  = weeklyData.map(d => d.protein);
  const carbsData    = weeklyData.map(d => d.carbs);
  const fatData      = weeklyData.map(d => d.fat);

  // Today = last item in scaffold
  const today        = weeklyData[weeklyData.length - 1];
  const avgCalories  = Math.round(calorieData.reduce((a, b) => a + b, 0) / 7);
  const avgProtein   = Math.round(proteinData.reduce((a, b) => a + b, 0) / 7);
  const avgCarbs     = Math.round(carbsData.reduce((a, b) => a + b, 0) / 7);
  const avgFat       = Math.round(fatData.reduce((a, b) => a + b, 0) / 7);
  const daysOnTarget = calorieData.filter(c => c >= targets.calories * 0.8 && c > 0).length;

  const METRICS = [
    { id: "calories", label: "Calories", data: calorieData, target: targets.calories, color: C.orange,  unit: "kcal" },
    { id: "protein",  label: "Protein",  data: proteinData, target: targets.protein,  color: "#7c3aed", unit: "g"    },
    { id: "carbs",    label: "Carbs",    data: carbsData,   target: targets.carbs,    color: "#0ea5e9", unit: "g"    },
    { id: "fat",      label: "Fat",      data: fatData,     target: targets.fat,      color: C.green,   unit: "g"    },
  ];

  const metric = METRICS.find(m => m.id === activeMetric);

  const STATS = [
    { label: "Avg Daily Calories", value: avgCalories.toLocaleString(), unit: "kcal/day",    icon: "🔥", color: C.orange   },
    { label: "Avg Protein",        value: avgProtein,                   unit: "g/day",       icon: "💪", color: "#7c3aed"  },
    { label: "Days on Target",     value: `${daysOnTarget} / 7`,        unit: "this week",   icon: "✅", color: C.green    },
    { label: "Avg Carbs",          value: avgCarbs,                     unit: "g/day",       icon: "🍞", color: "#0ea5e9"  },
    { label: "Avg Fat",            value: avgFat,                       unit: "g/day",       icon: "🥑", color: C.green    },
    { label: "Today's Calories",   value: Math.round(today.calories),   unit: "kcal logged", icon: "📅", color: C.orange   },
  ];

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Dashboard 📊</h1>
      <p style={{ color: C.muted, marginBottom: 28 }}>Your weekly nutrition at a glance</p>

      {/* ── Today's Macro Rings ── */}
      <div className="nb-card">
        <div className="nb-card-title">Today's Nutrition</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          <MacroCard icon="🔥" label="Calories" current={today.calories} target={targets.calories} unit=" kcal" color={C.orange}  />
          <MacroCard icon="💪" label="Protein"  current={today.protein}  target={targets.protein}  unit="g"    color="#7c3aed" />
          <MacroCard icon="🍞" label="Carbs"    current={today.carbs}    target={targets.carbs}    unit="g"    color="#0ea5e9" />
          <MacroCard icon="🥑" label="Fat"      current={today.fat}      target={targets.fat}      unit="g"    color={C.green} />
        </div>
      </div>

      {/* ── Weekly Chart ── */}
      <div className="nb-card">
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <div className="nb-card-title" style={{ margin: 0, flex: 1 }}>Weekly Trend</div>
          <div style={{ display: "flex", gap: 6 }}>
            {METRICS.map(m => (
              <button key={m.id} onClick={() => setActiveMetric(m.id)}
                style={{
                  padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                  border: `1.5px solid ${activeMetric === m.id ? m.color : C.border}`,
                  background: activeMetric === m.id ? m.color : "#fff",
                  color: activeMetric === m.id ? "#fff" : C.muted,
                  cursor: "pointer", transition: "all .18s",
                }}
              >{m.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", background: "#f0f0f0", borderRadius: 10, padding: 3, gap: 2 }}>
            {CHART_TYPES.map(ct => (
              <button key={ct.id} onClick={() => setChartType(ct.id)}
                style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                  background: chartType === ct.id ? metric.color : "transparent",
                  color: chartType === ct.id ? "#fff" : C.muted,
                  border: "none", cursor: "pointer", transition: "all .18s",
                }}
              >{ct.icon} {ct.label}</button>
            ))}
          </div>
        </div>

        {chartType === "bar"  && <BarChart  data={metric.data} labels={labels} target={metric.target} highlightColor={metric.color} baseColor={C.greenLight} />}
        {chartType === "line" && <LineChart data={metric.data} labels={labels} target={metric.target} highlightColor={metric.color} />}
        {chartType === "dot"  && <DotChart  data={metric.data} labels={labels} target={metric.target} highlightColor={metric.color} />}

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: metric.color }} />
          <span style={{ fontSize: 12, color: C.muted }}>On / above target</span>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: C.greenLight, marginLeft: 12, border: `1px solid ${C.border}` }} />
          <span style={{ fontSize: 12, color: C.muted }}>Below target</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>
            Target: <b style={{ color: metric.color }}>{metric.target} {metric.unit}/day</b>
          </span>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {STATS.map((s) => (
          <div className="nb-card" key={s.label} style={{ margin: 0, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 26, fontWeight: 900, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginTop: 2 }}>{s.unit}</div>
            <div style={{ fontSize: 12, color: C.text, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Progress Tracker ── */}
      <div style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 20, marginBottom: 4 }}>Progress Tracker 📈</h2>
        <p style={{ color: C.muted, marginBottom: 20, fontSize: 14 }}>
          Log your weight weekly — NutriBuddy will adjust your targets dynamically.
        </p>

        {/* Current stats */}
        {profile && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Current Weight", value: `${profile.weight ?? "—"} kg` },
              { label: "Goal",           value: profile.goal === "lose" ? "Lose Weight" : profile.goal === "gain" ? "Gain Weight" : "Maintain" },
              { label: "Daily Target",   value: `${profile.targets?.calories ?? "—"} kcal` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "#fff", border: `1.5px solid ${C.border}`,
                borderRadius: 14, padding: "14px 18px",
              }}>
                <p style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Check-in form */}
        <div className="nb-card">
          <div className="nb-card-title">Weekly Check-In ⚖️</div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div className="nb-form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="nb-label">Today's Weight (kg)</label>
              <input className="nb-input" type="number" step="0.1" placeholder="e.g. 73.2"
                value={weight} onChange={(e) => setWeight(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitCheckIn()} />
            </div>
            <button className="btn-green" onClick={submitCheckIn} disabled={checkLoading}
              style={{ padding: "11px 24px", whiteSpace: "nowrap" }}>
              {checkLoading ? "Checking..." : "Log Weight"}
            </button>
          </div>
          {checkErr && <p style={{ color: C.danger, fontSize: 13, marginTop: 10 }}>{checkErr}</p>}
        </div>

        {/* Check-in result */}
        {checkResult && (() => {
          const meta = STATUS_META[checkResult.progress?.status] || STATUS_META.on_track;
          return (
            <div className="nb-card" style={{ border: `2px solid ${meta.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{meta.icon}</span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: meta.color }}>{meta.label}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>Week {checkResult.weeks_elapsed}</p>
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.text, marginBottom: 12 }}>{checkResult.progress?.message}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[
                  { label: "Actual Change",    value: `${checkResult.progress?.actual_change_kg >= 0 ? "+" : ""}${checkResult.progress?.actual_change_kg} kg` },
                  { label: "Expected Change",  value: `${checkResult.progress?.expected_change_kg >= 0 ? "+" : ""}${checkResult.progress?.expected_change_kg} kg` },
                  { label: "New Daily Target", value: `${checkResult.new_daily_target} kcal` },
                  { label: "Adjustment",       value: checkResult.progress?.calorie_adjustment ? `${checkResult.progress.calorie_adjustment > 0 ? "+" : ""}${checkResult.progress.calorie_adjustment} kcal/day` : "No change" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px" }}>
                    <p style={{ fontSize: 11, color: C.muted }}>{label}</p>
                    <p style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{value}</p>
                  </div>
                ))}
              </div>
              {checkResult.goal_rationale && (
                <div style={{ background: C.greenLight, borderRadius: 10, padding: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 4 }}>📐 Calculation Rationale</p>
                  <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>{checkResult.goal_rationale}</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* History */}
        <div className="nb-card">
          <div className="nb-card-title">Check-In History</div>
          {history.length >= 2 && (() => {
            const chartH = 80, chartW = 320;
            const maxW  = Math.max(...history.map(h => h.weight_kg), +(profile?.weight || 80));
            const minW  = Math.min(...history.map(h => h.weight_kg), +(profile?.weight || 60));
            const range = maxW - minW || 1;
            return (
              <div style={{ marginBottom: 20, overflowX: "auto" }}>
                <svg width={chartW} height={chartH + 20} style={{ display: "block" }}>
                  <polyline
                    points={history.slice().reverse().map((h, i) => {
                      const x = (i / (history.length - 1)) * (chartW - 20) + 10;
                      const y = chartH - ((h.weight_kg - minW) / range) * (chartH - 10) + 5;
                      return `${x},${y}`;
                    }).join(" ")}
                    fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                  {history.slice().reverse().map((h, i) => {
                    const x = (i / (history.length - 1)) * (chartW - 20) + 10;
                    const y = chartH - ((h.weight_kg - minW) / range) * (chartH - 10) + 5;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="4" fill={C.green} />
                        <text x={x} y={chartH + 16} textAnchor="middle" fontSize="9" fill={C.muted}>
                          {h.date?.slice(5)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()}
          {histLoading && <p style={{ color: C.muted, fontSize: 13 }}>Loading history…</p>}
          {!histLoading && history.length === 0 && (
            <p style={{ color: C.muted, fontSize: 13 }}>No check-ins yet. Log your weight above!</p>
          )}
          {history.map((h) => {
            const m = STATUS_META[h.status] || STATUS_META.on_track;
            return (
              <div key={h.date} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: `1px solid ${C.border}`,
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{h.weight_kg} kg</span>
                  <span style={{ fontSize: 12, color: C.muted, marginLeft: 10 }}>{h.date}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {h.calorie_adjustment !== 0 && (
                    <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
                      {h.calorie_adjustment > 0 ? "+" : ""}{h.calorie_adjustment} kcal/day
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: m.color, fontWeight: 700 }}>
                    {m.icon} {m.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
