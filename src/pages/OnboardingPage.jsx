// src/pages/OnboardingPage.jsx  (IMPROVED — Issue 1 fix)
// 4-step onboarding: Basic Info → Medical/Allergies → Preferences → SMART Goal
// Changes:
//  - Step 0 now collects optional body measurements (waist, neck, hip) for Navy body fat formula
//  - "More" pills are collapsed by default; expand on click (same style as other pills)
//  - Body fat is calculated with Navy method if measurements provided, else BMI fallback
//  - A popup dialog asks user to confirm if they want to fill in measurements

import { useState } from "react";
import { C } from "../theme";
import { Logo } from "../components/shared";
import { calcBMR, calcTDEE, calcMacros, calcSmartGoal } from "../utils/nutrition";

const API_URL = "https://jxchan-nutribuddy.hf.space/api";

const PREFERENCES  = ["Vegetarian", "Vegan", "Halal", "Keto", "Low-carb", "High-protein", "Mediterranean"];
const ALLERGIES    = ["Nuts", "Dairy", "Gluten", "Eggs", "Shellfish", "Soy", "Fish"];
const CONDITIONS   = ["Diabetes", "Hypertension", "High Cholesterol", "Kidney Disease", "Celiac", "Gout"];

const STEP_LABELS = ["Basic Info", "Health", "Preferences", "Your Goal"];

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  return weight / ((height / 100) ** 2);
}

function getHealthyWeightRange(height) {
  const h = height / 100;
  return { min: +(18.5 * h * h).toFixed(1), max: +(24.9 * h * h).toFixed(1) };
}

// Navy body fat formula
function calcBodyFatNavy(gender, heightCm, waistCm, neckCm, hipCm) {
  if (!heightCm || !waistCm || !neckCm) return null;
  const h = +heightCm, w = +waistCm, n = +neckCm;
  if (gender === "male") {
    if (w <= n) return null;
    return 86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
  } else {
    if (!hipCm) return null;
    const hip = +hipCm;
    if ((w + hip - n) <= 0) return null;
    return 163.205 * Math.log10(w + hip - n) - 97.684 * Math.log10(h) - 78.387;
  }
}

// BMI-based body fat fallback (Deurenberg formula)
function calcBodyFatBMI(bmi, age, gender) {
  if (!bmi || !age) return null;
  if (gender === "male")   return 1.20 * bmi + 0.23 * age - 16.2;
  return 1.20 * bmi + 0.23 * age - 5.4;
}

function getBodyFatCategory(bf, gender) {
  if (gender === "male") {
    if (bf < 6)  return { label: "Essential fat", color: "#3b82f6" };
    if (bf < 14) return { label: "Athletic",      color: C.green   };
    if (bf < 18) return { label: "Fitness",       color: C.green   };
    if (bf < 25) return { label: "Average",       color: C.orange  };
    return         { label: "Obese",              color: C.danger  };
  } else {
    if (bf < 14) return { label: "Essential fat", color: "#3b82f6" };
    if (bf < 21) return { label: "Athletic",      color: C.green   };
    if (bf < 25) return { label: "Fitness",       color: C.green   };
    if (bf < 32) return { label: "Average",       color: C.orange  };
    return         { label: "Obese",              color: C.danger  };
  }
}

function validateTargetWeight(targetWeight, currentWeight, heightCm, goalType, medicalConditions) {
  if (!targetWeight || !heightCm) return null;
  const tw = +targetWeight, cw = +currentWeight;
  const { min, max } = getHealthyWeightRange(+heightCm);
  const bmi = calcBMI(tw, +heightCm);
  const hasMedical = medicalConditions && medicalConditions.length > 0;
  const warnings = [];
  if (bmi < 18.5) warnings.push(`A target weight of ${tw} kg gives a BMI of ${bmi.toFixed(1)}, which is underweight (BMI < 18.5). The healthy range for your height is ${min}–${max} kg.`);
  else if (bmi > 30) warnings.push(`A target weight of ${tw} kg gives a BMI of ${bmi.toFixed(1)}, which is in the obese range. A safer target would be ${min}–${max} kg.`);
  if (hasMedical && goalType === "lose" && cw - tw > 15) warnings.push(`Losing more than 15 kg is a significant goal, especially with your reported medical condition(s). Please consult a healthcare professional before starting.`);
  if (goalType === "lose" && tw >= cw) warnings.push(`Your target weight (${tw} kg) is higher than your current weight (${cw} kg). Please set a lower target to lose weight.`);
  if (goalType === "gain" && tw <= cw) warnings.push(`Your target weight (${tw} kg) is lower than your current weight (${cw} kg). Please set a higher target to gain weight.`);
  return warnings.length > 0 ? warnings.join(" ") : null;
}

export default function OnboardingPage({ user, onComplete }) {
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  // Body measurement confirmation dialog
  const [showMeasureDialog, setShowMeasureDialog] = useState(false);
  const [showMeasureFields, setShowMeasureFields] = useState(false);

  // "More" expansion state for each step
  const [showMoreConditions,  setShowMoreConditions]  = useState(false);
  const [showMoreAllergies,   setShowMoreAllergies]   = useState(false);
  const [showMorePreferences, setShowMorePreferences] = useState(false);

  const [otherCondition, setOtherCondition]   = useState("");
  const [otherAllergy, setOtherAllergy]       = useState("");
  const [otherPreference, setOtherPreference] = useState("");

  const [info, setInfo] = useState({
    age: "", weight: "", height: "", gender: "female",
    activity: "moderate", goal: "maintain",
    target_weight: "", goal_weeks: 8,
    preferences: [], allergies: [], medical_conditions: [],
    // body measurements (optional)
    waist: "", neck: "", hip: "",
  });

  function toggle(key, val) {
    const cur = info[key];
    setInfo({ ...info, [key]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] });
  }

  function addOther(key, value, setter) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!info[key].includes(trimmed)) setInfo({ ...info, [key]: [...info[key], trimmed] });
    setter("");
  }

  function handleContinue() {
    if (step === 0) {
      if (!info.age || !info.weight || !info.height) { setErr("Please fill in your age, weight, and height."); return; }
      if (+info.age < 1  || +info.age > 120)          { setErr("Please enter a valid age.");    return; }
      if (+info.weight < 20 || +info.weight > 300)    { setErr("Please enter a valid weight."); return; }
      if (+info.height < 50 || +info.height > 300)    { setErr("Please enter a valid height."); return; }
    }
    setErr("");
    setStep(step + 1);
  }

  async function finish() {
    if (info.goal !== "maintain" && info.target_weight) {
      const warn = validateTargetWeight(info.target_weight, info.weight, info.height, info.goal, info.medical_conditions);
      if (warn) { setErr(warn); return; }
    }

    const bmr   = calcBMR(+info.weight, +info.height, +info.age, info.gender);
    const tdee  = calcTDEE(bmr, info.activity);
    const smart = calcSmartGoal(tdee, info.goal, +info.target_weight || null, +info.weight, +info.goal_weeks);

    // Calculate body fat
    let body_fat_pct = null;
    let body_fat_method = null;
    const navyBF = (showMeasureFields && info.waist && info.neck)
      ? calcBodyFatNavy(info.gender, info.height, info.waist, info.neck, info.hip)
      : null;
    if (navyBF !== null && navyBF > 0) {
      body_fat_pct    = Math.round(navyBF * 10) / 10;
      body_fat_method = "navy";
    } else {
      const bmi = calcBMI(+info.weight, +info.height);
      const bmiBF = calcBodyFatBMI(bmi, +info.age, info.gender);
      if (bmiBF !== null) {
        body_fat_pct    = Math.round(bmiBF * 10) / 10;
        body_fat_method = "bmi";
      }
    }

    const payload = {
      user_id:            user.id,
      age:                +info.age,
      gender:             info.gender,
      weight:             +info.weight,
      height:             +info.height,
      activity:           info.activity,
      goal:               info.goal,
      target_weight:      +info.target_weight || null,
      goal_weeks:         +info.goal_weeks,
      preferences:        info.preferences,
      allergies:          info.allergies,
      medical_conditions: info.medical_conditions,
      bmr:                Math.round(bmr),
      tdee,
      targets:            smart.targets,
      body_fat_pct,
      body_fat_method,
      waist_cm:           showMeasureFields ? (+info.waist  || null) : null,
      neck_cm:            showMeasureFields ? (+info.neck   || null) : null,
      hip_cm:             showMeasureFields ? (+info.hip    || null) : null,
    };

    try {
      setLoading(true);
      setErr("");
      const res  = await fetch(`${API_URL}/onboarding/save`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile.");
      onComplete({
        ...info, age: +info.age, weight: +info.weight, height: +info.height,
        bmr: Math.round(bmr), tdee,
        targets:            data.targets || smart.targets,
        medical_conditions: info.medical_conditions,
        body_fat_pct,
        body_fat_method,
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Sub-components ──────────────────────────────────────────────────────────

  function TogglePill({ value, selected, color, bgColor, onClick }) {
    return (
      <div onClick={onClick} style={{
        padding: "8px 16px", borderRadius: 99,
        border: `1.5px solid ${selected ? color : C.border}`,
        background: selected ? bgColor : "#fff",
        color: selected ? color : C.muted,
        fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .18s",
      }}>
        {value}
      </div>
    );
  }

  // "More" pill — same style as other pills, acts as expand toggle
  function MorePill({ expanded, onToggle, color }) {
    return (
      <div onClick={onToggle} style={{
        padding: "8px 16px", borderRadius: 99,
        border: `1.5px solid ${expanded ? color : C.border}`,
        background: expanded ? "#fff3cd" : "#fff",
        color: expanded ? "#92400e" : C.muted,
        fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .18s",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {expanded ? "▲ Less" : "▼ More"}
      </div>
    );
  }

  function OtherInput({ value, onChange, onAdd, placeholder, color }) {
    return (
      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
        <input
          className="nb-input"
          style={{ flex: 1, padding: "7px 12px", fontSize: 13 }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <button type="button" onClick={onAdd} style={{
          padding: "7px 14px", borderRadius: 99, border: `1.5px solid ${color}`,
          background: color, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          + Add
        </button>
      </div>
    );
  }

  function BodyFatPreview() {
    if (!info.weight || !info.height || !info.age) return null;

    let bf = null, method = null;
    const navyBF = (showMeasureFields && info.waist && info.neck)
      ? calcBodyFatNavy(info.gender, info.height, info.waist, info.neck, info.hip)
      : null;

    if (navyBF !== null && navyBF > 0) {
      bf = navyBF; method = "Navy formula (circumference measurements)";
    } else {
      const bmi = calcBMI(+info.weight, +info.height);
      const bmiBF = calcBodyFatBMI(bmi, +info.age, info.gender);
      if (bmiBF !== null) { bf = bmiBF; method = "BMI estimation (Deurenberg)"; }
    }

    if (!bf || bf < 0) return null;
    const cat = getBodyFatCategory(bf, info.gender);
    return (
      <div style={{ background: C.greenLight, borderRadius: 10, padding: "8px 12px", marginTop: 8 }}>
        <p style={{ fontSize: 12, margin: 0, color: cat.color }}>
          Estimated Body Fat: <b>{bf.toFixed(1)}%</b> — <b>{cat.label}</b>
          <span style={{ color: C.muted, fontWeight: 400 }}> (via {method})</span>
        </p>
      </div>
    );
  }

  function SmartGoalPreview() {
    if (!info.weight || !info.height || !info.age) {
      return <p style={{ fontSize: 13, color: C.muted }}>Fill basic info in Step 1 to see your goal.</p>;
    }
    const bmr   = calcBMR(+info.weight, +info.height, +info.age, info.gender);
    const tdee  = calcTDEE(bmr, info.activity);
    const smart = calcSmartGoal(tdee, info.goal, +info.target_weight || null, +info.weight, +info.goal_weeks);
    return (
      <div>
        <p style={{ fontWeight: 700, fontSize: 14, color: C.green, marginBottom: 6 }}>🎯 {smart.label}</p>
        <p style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
          Daily target: <b>{smart.targets.calories} kcal</b><br />
          Protein: <b>{smart.targets.protein}g</b> · Carbs: <b>{smart.targets.carbs}g</b> · Fat: <b>{smart.targets.fat}g</b>
        </p>
        <div style={{ marginTop: 12, background: "#fff", borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>📖 What do these numbers mean?</p>
          <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.7, margin: 0 }}>
            <b>BMR ({Math.round(bmr)} kcal)</b> — the minimum calories your body burns at rest.<br />
            <b>TDEE ({tdee} kcal)</b> — total calories burned per day including your activity level.<br />
            <b>Your daily target ({smart.targets.calories} kcal)</b> is your TDEE adjusted
            {smart.dailyDelta < 0
              ? ` with a ${Math.abs(smart.dailyDelta)} kcal deficit to help you lose weight safely.`
              : smart.dailyDelta > 0
              ? ` with a ${smart.dailyDelta} kcal surplus to support muscle gain.`
              : " to maintain your current weight."}
          </p>
        </div>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>📐 {smart.rationale}</p>
      </div>
    );
  }

  const targetWeightWarning = (info.goal !== "maintain" && info.target_weight && info.height && info.weight)
    ? validateTargetWeight(info.target_weight, info.weight, info.height, info.goal, info.medical_conditions)
    : null;

  // ── Body Measurement Confirmation Dialog ────────────────────────────────────
  function MeasureDialog() {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: 28, maxWidth: 400, width: "90%",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}>
          <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>📏</div>
          <h3 style={{ textAlign: "center", marginBottom: 8 }}>Improve Your Results</h3>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>
            Providing your body measurements (waist, neck{info.gender === "female" ? ", and hip" : ""}) allows
            us to use the <b>US Navy body fat formula</b>, which is significantly more accurate
            (±3–4% error) than the BMI estimation method.
          </p>
          <div style={{ background: C.greenLight, borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: C.green, fontWeight: 700, margin: 0 }}>
              ✅ Recommended — takes only a minute with a soft measuring tape
            </p>
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
            ⚠️ If you choose to skip, your body fat will be estimated using the BMI formula, which may
            be less accurate for muscular or athletic body types.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setShowMeasureFields(true); setShowMeasureDialog(false); }}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                background: C.green, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
              }}
            >
              📏 Yes, I'll measure
            </button>
            <button
              onClick={() => { setShowMeasureFields(false); setShowMeasureDialog(false); }}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 12,
                border: `1.5px solid ${C.border}`, background: "#fff",
                color: C.muted, fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="onboard-wrap">
      {showMeasureDialog && <MeasureDialog />}

      <div className="onboard-card fade-in">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 8 }}><Logo size={36} /></div>
        <h2 style={{ textAlign: "center", marginBottom: 4 }}>Welcome, {user.name.split(" ")[0]}! 👋</h2>
        <p style={{ textAlign: "center", color: C.muted, fontSize: 14, marginBottom: 20 }}>
          Let's personalise your experience
        </p>

        {/* Step indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24 }}>
          {STEP_LABELS.map((label, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i === step ? C.green : i < step ? C.greenLight : C.border,
                color: i === step ? "#fff" : i < step ? C.green : C.muted,
                border: `2px solid ${i === step ? C.green : i < step ? C.green : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800,
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: i === step ? C.green : C.muted, fontWeight: i === step ? 700 : 400 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Step 0: Basic Info ── */}
        {step === 0 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: 20 }}>Basic Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="nb-form-group">
                <label className="nb-label">Age</label>
                <input className="nb-input" type="number" placeholder="e.g. 25"
                  value={info.age} onChange={(e) => setInfo({ ...info, age: e.target.value })} />
              </div>
              <div className="nb-form-group">
                <label className="nb-label">Gender</label>
                <select className="nb-select" value={info.gender}
                  onChange={(e) => setInfo({ ...info, gender: e.target.value })}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
              <div className="nb-form-group">
                <label className="nb-label">Weight (kg)</label>
                <input className="nb-input" type="number" placeholder="e.g. 60"
                  value={info.weight} onChange={(e) => setInfo({ ...info, weight: e.target.value })} />
              </div>
              <div className="nb-form-group">
                <label className="nb-label">Height (cm)</label>
                <input className="nb-input" type="number" placeholder="e.g. 165"
                  value={info.height} onChange={(e) => setInfo({ ...info, height: e.target.value })} />
              </div>
            </div>

            {/* Live BMI hint */}
            {info.weight && info.height && (() => {
              const bmi = calcBMI(+info.weight, +info.height);
              if (!bmi) return null;
              const { min, max } = getHealthyWeightRange(+info.height);
              const category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
              const catColor  = bmi >= 18.5 && bmi < 25 ? C.green : C.orange;
              return (
                <div style={{ background: C.greenLight, borderRadius: 10, padding: "8px 12px", marginBottom: 8, marginTop: -4 }}>
                  <p style={{ fontSize: 12, color: catColor, margin: 0 }}>
                    BMI: <b>{bmi.toFixed(1)}</b> — <b>{category}</b> &nbsp;|&nbsp; Healthy range for your height: <b>{min}–{max} kg</b>
                  </p>
                </div>
              );
            })()}

            {/* Body fat section */}
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <label className="nb-label" style={{ marginBottom: 2 }}>Body Measurements (optional)</label>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                    For more accurate body fat % using the US Navy formula
                  </p>
                </div>
                {!showMeasureFields && (
                  <button
                    type="button"
                    onClick={() => setShowMeasureDialog(true)}
                    style={{
                      padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${C.green}`, background: C.greenLight,
                      color: C.green, cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    + Add measurements
                  </button>
                )}
                {showMeasureFields && (
                  <button
                    type="button"
                    onClick={() => { setShowMeasureFields(false); setInfo({ ...info, waist: "", neck: "", hip: "" }); }}
                    style={{
                      padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${C.border}`, background: "#fff",
                      color: C.muted, cursor: "pointer",
                    }}
                  >
                    × Remove
                  </button>
                )}
              </div>

              {showMeasureFields && (
                <div className="fade-in">
                  <div style={{ background: "#f0f9f4", borderRadius: 12, padding: 14, marginBottom: 8 }}>
                    <p style={{ fontSize: 12, color: C.green, fontWeight: 700, margin: "0 0 8px" }}>
                      📏 Measure at these spots with a soft tape (in cm):
                    </p>
                    <ul style={{ fontSize: 12, color: C.muted, margin: 0, paddingLeft: 16, lineHeight: 2 }}>
                      <li><b>Waist</b> — at belly button level</li>
                      <li><b>Neck</b> — just below the larynx (Adam's apple)</li>
                      {info.gender === "female" && <li><b>Hip</b> — at the widest point</li>}
                    </ul>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: info.gender === "female" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12 }}>
                    <div className="nb-form-group">
                      <label className="nb-label">Waist (cm)</label>
                      <input className="nb-input" type="number" placeholder="e.g. 80"
                        value={info.waist} onChange={(e) => setInfo({ ...info, waist: e.target.value })} />
                    </div>
                    <div className="nb-form-group">
                      <label className="nb-label">Neck (cm)</label>
                      <input className="nb-input" type="number" placeholder="e.g. 36"
                        value={info.neck} onChange={(e) => setInfo({ ...info, neck: e.target.value })} />
                    </div>
                    {info.gender === "female" && (
                      <div className="nb-form-group">
                        <label className="nb-label">Hip (cm)</label>
                        <input className="nb-input" type="number" placeholder="e.g. 95"
                          value={info.hip} onChange={(e) => setInfo({ ...info, hip: e.target.value })} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <BodyFatPreview />
            </div>

            <div className="nb-form-group">
              <label className="nb-label">Activity Level</label>
              <select className="nb-select" value={info.activity}
                onChange={(e) => setInfo({ ...info, activity: e.target.value })}>
                <option value="sedentary">Sedentary (little/no exercise)</option>
                <option value="light">Light (1–3 days/week)</option>
                <option value="moderate">Moderate (3–5 days/week)</option>
                <option value="active">Active (6–7 days/week)</option>
                <option value="very_active">Very Active (physical job)</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Step 1: Health Conditions & Allergies ── */}
        {step === 1 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: 8 }}>Health &amp; Allergies</h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
              This helps us give safer, clinical-aware recommendations.
            </p>

            <label className="nb-label" style={{ marginBottom: 8, display: "block" }}>
              Medical Conditions (select all that apply)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              {CONDITIONS.map((c) => (
                <TogglePill key={c} value={c}
                  selected={info.medical_conditions.includes(c)}
                  color="#8b5cf6" bgColor="#f5f3ff"
                  onClick={() => toggle("medical_conditions", c)} />
              ))}
              {/* Custom-added shown as pills */}
              {info.medical_conditions.filter(c => !CONDITIONS.includes(c)).map((c) => (
                <TogglePill key={c} value={c} selected={true}
                  color="#8b5cf6" bgColor="#f5f3ff"
                  onClick={() => toggle("medical_conditions", c)} />
              ))}
              <MorePill expanded={showMoreConditions} onToggle={() => setShowMoreConditions(v => !v)} color="#8b5cf6" />
            </div>
            {/* "More" expands to reveal the OtherInput */}
            {showMoreConditions && (
              <div className="fade-in">
                <OtherInput
                  value={otherCondition}
                  onChange={setOtherCondition}
                  onAdd={() => addOther("medical_conditions", otherCondition, setOtherCondition)}
                  placeholder="Type a condition and press Enter or + Add"
                  color="#8b5cf6"
                />
              </div>
            )}

            <label className="nb-label" style={{ marginBottom: 8, marginTop: 20, display: "block" }}>
              Food Allergies
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              {ALLERGIES.map((a) => (
                <TogglePill key={a} value={a}
                  selected={info.allergies.includes(a)}
                  color={C.danger} bgColor="#fef0f0"
                  onClick={() => toggle("allergies", a)} />
              ))}
              {info.allergies.filter(a => !ALLERGIES.includes(a)).map((a) => (
                <TogglePill key={a} value={a} selected={true}
                  color={C.danger} bgColor="#fef0f0"
                  onClick={() => toggle("allergies", a)} />
              ))}
              <MorePill expanded={showMoreAllergies} onToggle={() => setShowMoreAllergies(v => !v)} color={C.danger} />
            </div>
            {showMoreAllergies && (
              <div className="fade-in">
                <OtherInput
                  value={otherAllergy}
                  onChange={setOtherAllergy}
                  onAdd={() => addOther("allergies", otherAllergy, setOtherAllergy)}
                  placeholder="Type an allergy and press Enter or + Add"
                  color={C.danger}
                />
              </div>
            )}

            {(info.medical_conditions.length > 0 || info.allergies.length > 0) && (
              <div style={{ marginTop: 16, background: "#f5f3ff", borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 700 }}>🏥 Constraint engine activated</p>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  {info.medical_conditions.length > 0 && `Clinical rules applied for: ${info.medical_conditions.join(", ")}. `}
                  {info.allergies.length > 0 && `Foods containing ${info.allergies.join(", ")} will be excluded.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Dietary Preferences ── */}
        {step === 2 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: 8 }}>Dietary Preferences</h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Select all that apply</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              {PREFERENCES.map((p) => (
                <TogglePill key={p} value={p}
                  selected={info.preferences.includes(p)}
                  color={C.green} bgColor={C.greenLight}
                  onClick={() => toggle("preferences", p)} />
              ))}
              {info.preferences.filter(p => !PREFERENCES.includes(p)).map((p) => (
                <TogglePill key={p} value={p} selected={true}
                  color={C.green} bgColor={C.greenLight}
                  onClick={() => toggle("preferences", p)} />
              ))}
              <MorePill expanded={showMorePreferences} onToggle={() => setShowMorePreferences(v => !v)} color={C.green} />
            </div>
            {showMorePreferences && (
              <div className="fade-in">
                <OtherInput
                  value={otherPreference}
                  onChange={setOtherPreference}
                  onAdd={() => addOther("preferences", otherPreference, setOtherPreference)}
                  placeholder="e.g. Paleo, Dairy-free — press Enter or + Add"
                  color={C.green}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: SMART Goal ── */}
        {step === 3 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: 8 }}>Set Your Goal</h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
              We'll convert this into a specific, measurable daily target.
            </p>

            <div className="nb-form-group">
              <label className="nb-label">Goal</label>
              <select className="nb-select" value={info.goal}
                onChange={(e) => setInfo({ ...info, goal: e.target.value })}>
                <option value="lose">Lose Weight</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Build Muscle / Gain Weight</option>
              </select>
            </div>

            {info.goal !== "maintain" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="nb-form-group">
                  <label className="nb-label">Target Weight (kg)</label>
                  {info.height && (
                    <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 4px" }}>
                      Healthy range: <b>{getHealthyWeightRange(+info.height).min}–{getHealthyWeightRange(+info.height).max} kg</b>
                    </p>
                  )}
                  <input className="nb-input" type="number" placeholder="e.g. 55"
                    value={info.target_weight}
                    onChange={(e) => setInfo({ ...info, target_weight: e.target.value })} />
                  {targetWeightWarning && (
                    <div style={{ marginTop: 6, background: "#fff7ed", border: "1px solid #f97316", borderRadius: 8, padding: "8px 12px" }}>
                      <p style={{ fontSize: 11, color: "#c2410c", margin: 0, lineHeight: 1.6 }}>⚠️ {targetWeightWarning}</p>
                    </div>
                  )}
                </div>
                <div className="nb-form-group">
                  <label className="nb-label">Duration (weeks)</label>
                  <select className="nb-select" value={info.goal_weeks}
                    onChange={(e) => setInfo({ ...info, goal_weeks: +e.target.value })}>
                    {[4, 6, 8, 10, 12, 16, 20, 24].map((w) => (
                      <option key={w} value={w}>{w} weeks</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div style={{ marginTop: 20, background: C.greenLight, borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 10 }}>📊 Your SMART Goal Preview</p>
              <SmartGoalPreview />
            </div>
          </div>
        )}

        {/* Error */}
        {err && (
          <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ color: C.danger, fontSize: 13, margin: 0 }}>⚠️ {err}</p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          {step > 0
            ? <button className="btn-outline" onClick={() => { setErr(""); setStep(step - 1); }}>← Back</button>
            : <div />}
          {step < 3
            ? <button className="btn-green" onClick={handleContinue}>Continue →</button>
            : <button className="btn-green" onClick={finish} disabled={loading}>
                {loading ? "Saving..." : "Start My Journey 🎉"}
              </button>}
        </div>

      </div>
    </div>
  );
}
