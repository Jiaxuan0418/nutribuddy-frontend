// src/pages/DashboardPage.jsx — Weekly analytics dashboard + Progress Tracker

import { useState, useEffect } from "react";
import { C } from "../theme";

const API_URL = "https://jxchan-nutribuddy.hf.space/api";
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

// ── Dual-axis chart helpers ───────────────────────────────────────────────────
// Calories (kcal) are ~10-20x larger than Protein/Carbs/Fat (g).
// Fix: normalise every series independently to its own max so all lines/bars
// fill the chart area proportionally. Y-axis ticks show actual values per series.

function normSeries(series) {
  return series.map(s => {
    const ownMax = Math.max(...s.data, s.target, 1);
    return { ...s, norm: s.data.map(v => v / ownMax), ownMax };
  });
}

// ── Multi-series Bar ──────────────────────────────────────────────────────────
function MultiBarChart({ series, labels }) {
  const ns    = normSeries(series);
  const H     = 110;
  const multi = ns.length > 1;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: multi ? 4 : 8, height: H + 32 }}>
      {labels.map((lbl, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: H }}>
            {ns.map((s, si) => {
              const h       = Math.max(s.norm[i] * H, s.data[i] > 0 ? 4 : 0);
              const onTrack = s.data[i] >= s.target;
              return (
                <div key={si}
                  title={`${s.label}: ${Math.round(s.data[i])} ${s.unit} (target ${s.target})`}
                  style={{
                    width: multi ? Math.max(8, Math.floor(44 / ns.length)) : "100%",
                    minWidth: 6, height: h,
                    borderRadius: "4px 4px 0 0",
                    background: onTrack ? s.color : s.color + "55",
                    border: onTrack ? "none" : `1.5px solid ${s.color}`,
                    transition: "height .5s ease",
                    boxSizing: "border-box", position: "relative",
                  }}
                >
                  {!multi && s.data[i] > 0 && (
                    <div style={{
                      position: "absolute", top: -18, left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 10, fontWeight: 700, color: C.muted, whiteSpace: "nowrap",
                    }}>{Math.round(s.data[i])}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 5, fontWeight: 700 }}>{lbl}</div>
        </div>
      ))}
    </div>
  );
}

// ── Multi-series Line (dual Y-axis) ──────────────────────────────────────────
function MultiLineChart({ series, labels }) {
  const W = 560, H = 130, LPAD = 40, RPAD = 38, TPAD = 16, BPAD = 22;
  const ns    = normSeries(series);
  const multi = ns.length > 1;

  const xs = labels.map((_, i) =>
    labels.length > 1
      ? LPAD + (i / (labels.length - 1)) * (W - LPAD - RPAD)
      : (W + LPAD - RPAD) / 2
  );
  const toY = n => TPAD + (1 - n) * (H - TPAD - BPAD);

  // Left axis = Calories (first selected); Right axis = macros (g)
  const leftS   = ns[0];
  const rightNS = multi ? ns.slice(1) : [];
  const rightMax = rightNS.length ? Math.max(...rightNS.map(s => s.ownMax)) : 0;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 200, overflow: "visible" }}>
      {/* grid */}
      {ticks.map((n, i) => (
        <line key={i} x1={LPAD} y1={toY(n)} x2={W - RPAD} y2={toY(n)}
          stroke="#e5e7eb" strokeWidth={1} />
      ))}

      {/* left Y-axis ticks (first series) */}
      {ticks.map((n, i) => (
        <text key={i} x={LPAD - 6} y={toY(n) + 4}
          textAnchor="end" fontSize={9} fill={leftS.color} fontWeight={700}>
          {Math.round(n * leftS.ownMax)}
        </text>
      ))}
      <text x={LPAD - 6} y={TPAD - 5} textAnchor="end" fontSize={8} fill={leftS.color} fontWeight={700}>
        {leftS.unit}
      </text>

      {/* right Y-axis ticks (remaining series, normalised to rightMax) */}
      {multi && ticks.map((n, i) => (
        <text key={i} x={W - RPAD + 6} y={toY(n) + 4}
          textAnchor="start" fontSize={9} fill={rightNS[0].color} fontWeight={700}>
          {Math.round(n * rightMax)}
        </text>
      ))}
      {multi && (
        <text x={W - RPAD + 6} y={TPAD - 5} textAnchor="start" fontSize={8}
          fill={rightNS[0].color} fontWeight={700}>g</text>
      )}

      {/* series */}
      {ns.map((s, si) => {
        const ys   = s.norm.map(n => toY(n));
        const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
        const tY   = toY(s.target / s.ownMax);
        return (
          <g key={si}>
            <line x1={LPAD} y1={tY} x2={W - RPAD} y2={tY}
              stroke={s.color} strokeWidth={1.2} strokeDasharray="5 4" opacity={0.4} />
            <path d={`${path} L${xs[xs.length-1]},${toY(0)} L${xs[0]},${toY(0)} Z`}
              fill={s.color} opacity={multi ? 0.06 : 0.14} />
            <path d={path} fill="none" stroke={s.color} strokeWidth={2.5}
              strokeLinejoin="round" strokeLinecap="round" />
            {xs.map((x, i) => (
              <g key={i}>
                <circle cx={x} cy={ys[i]} r={4} fill={s.color} stroke="#fff" strokeWidth={1.5} />
                {!multi && s.data[i] > 0 && (
                  <text x={x} y={ys[i] - 8} textAnchor="middle"
                    fontSize={10} fill={s.color} fontWeight={700}>
                    {Math.round(s.data[i])}
                  </text>
                )}
              </g>
            ))}
          </g>
        );
      })}

      {/* X labels */}
      {xs.map((x, i) => (
        <text key={i} x={x} y={H - 4} textAnchor="middle"
          fontSize={10} fill={C.muted} fontWeight={700}>{labels[i]}</text>
      ))}
    </svg>
  );
}

// ── Multi-series Dot ──────────────────────────────────────────────────────────
function MultiDotChart({ series, labels }) {
  const ns    = normSeries(series);
  const multi = ns.length > 1;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 170 }}>
      {labels.map((lbl, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", marginBottom: 4 }}>
            {ns.map((s, si) => {
              const size    = 14 + s.norm[i] * 30;
              const onTrack = s.data[i] >= s.target;
              return (
                <div key={si}
                  title={`${s.label}: ${Math.round(s.data[i])} ${s.unit} (target ${s.target})`}
                  style={{
                    width: size, height: size, borderRadius: "50%",
                    background: onTrack ? s.color : "transparent",
                    border: `2.5px solid ${s.color}`,
                    transition: "all .4s ease", flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
          {!multi && ns[0]?.data[i] > 0 && (
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 2 }}>
              {Math.round(ns[0].data[i])}
            </div>
          )}
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{lbl}</div>
        </div>
      ))}
    </div>
  );
}


// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage({ profile, user }) {
  const [chartType,     setChartType]     = useState("bar");
  const [activeMetrics, setActiveMetrics] = useState(new Set(["calories"]));
  const [weeklyData,    setWeeklyData]    = useState(null);
  const [loading,       setLoading]       = useState(true);

  function toggleMetric(id) {
    setActiveMetrics(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // always keep at least one
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

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

  const metric = METRICS.find(m => m.id === [...activeMetrics][0]);
  const activeSeries = METRICS.filter(m => activeMetrics.has(m.id));

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

          {/* Multi-select metric toggles */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {METRICS.map(m => {
              const active = activeMetrics.has(m.id);
              return (
                <button key={m.id} onClick={() => toggleMetric(m.id)}
                  title={active && activeMetrics.size === 1 ? "At least one metric must be selected" : ""}
                  style={{
                    padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    border: `1.5px solid ${active ? m.color : C.border}`,
                    background: active ? m.color : "#fff",
                    color: active ? "#fff" : C.muted,
                    cursor: "pointer", transition: "all .18s",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  {active && <span style={{ fontSize: 9, opacity: .85 }}>✓</span>}
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Chart type switcher — uses colour of first active metric */}
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

        {chartType === "bar"  && <MultiBarChart  series={activeSeries} labels={labels} />}
        {chartType === "line" && <MultiLineChart series={activeSeries} labels={labels} />}
        {chartType === "dot"  && <MultiDotChart  series={activeSeries} labels={labels} />}

        {/* Legend */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {activeSeries.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color }} />
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
                {s.label}
                <span style={{ color: s.color, marginLeft: 4 }}>
                  (target: {s.target} {s.unit}/day)
                </span>
              </span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: "#555" }} />
              <span style={{ fontSize: 12, color: C.muted }}>On / above target</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: "#55555544", border: "1px solid #ccc" }} />
              <span style={{ fontSize: 12, color: C.muted }}>Below target</span>
            </div>
          </div>
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
