// src/utils/nutrition.js
// BMR / TDEE / Macro helpers + SMART goal calculator

const KCAL_PER_KG  = 7700;
const MIN_CALORIES = 1200;

// ─── BMR (Mifflin-St Jeor) ───────────────────────────────────────────────────
// Fixed value: depends only on weight, height, age, gender.
// Does NOT change with goal / target_weight / weeks.
export function calcBMR(weight, height, age, gender) {
  const s = gender === "male" ? 5 : -161;
  return 10 * weight + 6.25 * height - 5 * age + s;
}

// ─── TDEE ────────────────────────────────────────────────────────────────────
// Fixed value: BMR × activity factor.
// Does NOT change with goal / target_weight / weeks.
export function calcTDEE(bmr, activity) {
  const factors = {
    sedentary:   1.2,
    light:       1.375,
    moderate:    1.55,
    active:      1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * (factors[activity] || 1.55));
}

// ─── Simple macro split (used for "maintain" goal shortcut) ──────────────────
// NOTE: tdee is NOT mutated here. The caller decides the calorie target.
export function calcMacros(calorieTarget) {
  return {
    calories: Math.round(calorieTarget),
    protein:  Math.round((calorieTarget * 0.3) / 4),
    carbs:    Math.round((calorieTarget * 0.4) / 4),
    fat:      Math.round((calorieTarget * 0.3) / 9),
  };
}

// ─── SMART Goal Calculator ───────────────────────────────────────────────────
// BMR and TDEE remain FIXED (calculated from body stats + activity).
// Only dailyTarget (daily calorie intake) changes based on goal.
//
// Formula:
//   weightDelta  = targetWeight - currentWeight
//   weeklyChange = clamp(weightDelta / weeks, -0.9, +0.9)  kg/week
//   dailyDelta   = weeklyChange × 7700 / 7                 kcal/day
//   dailyTarget  = max(TDEE + dailyDelta, 1200)            kcal/day  ← this changes
//   TDEE                                                   kcal/day  ← this is FIXED
export function calcSmartGoal(tdee, goalType, targetWeight, currentWeight, weeks = 8) {
  let weeklyChange = 0;

  if (goalType === "lose") {
    if (targetWeight && currentWeight) {
      const delta = targetWeight - currentWeight; // negative
      weeklyChange = Math.max(delta / weeks, -0.9);
    } else {
      weeklyChange = -0.5;
    }
  } else if (goalType === "gain") {
    if (targetWeight && currentWeight) {
      const delta = targetWeight - currentWeight; // positive
      weeklyChange = Math.min(delta / weeks, 0.9);
    } else {
      weeklyChange = 0.3;
    }
  }
  // goalType === "maintain": weeklyChange stays 0, dailyTarget === tdee

  const dailyDelta  = (weeklyChange * KCAL_PER_KG) / 7;
  const dailyTarget = Math.max(Math.round(tdee + dailyDelta), MIN_CALORIES);

  const protein = Math.round((dailyTarget * 0.30) / 4);
  const carbs   = Math.round((dailyTarget * 0.40) / 4);
  const fat     = Math.round((dailyTarget * 0.30) / 9);

  // Human-readable label
  let label;
  if (goalType === "maintain") {
    label = "Maintain Current Weight";
  } else if (targetWeight && currentWeight) {
    const absDelta = Math.abs(targetWeight - currentWeight).toFixed(1);
    label = `${goalType === "lose" ? "Lose" : "Gain"} ${absDelta} kg in ${weeks} weeks`;
  } else {
    label = goalType === "lose" ? "Gradual Weight Loss" : "Lean Muscle Gain";
  }

  // Rationale — clearly separates TDEE (fixed) from dailyTarget (dynamic)
  const rationale =
    `Your BMR and TDEE (${Math.round(tdee)} kcal/day) are fixed — they depend only on your body stats and activity level. ` +
    `Weekly change target: ${weeklyChange >= 0 ? "+" : ""}${weeklyChange.toFixed(2)} kg/week ` +
    `≈ ${Math.abs(Math.round(dailyDelta))} kcal/day ${dailyDelta < 0 ? "deficit" : dailyDelta > 0 ? "surplus" : "(no change)"}. ` +
    `Daily intake target = ${dailyTarget} kcal (safety floor: ${MIN_CALORIES} kcal).`;

  return {
    label,
    rationale,
    weeklyChangeKg: weeklyChange,   // fixed typo: was "weeklyChangKg"
    dailyDelta:     Math.round(dailyDelta),
    targets: {
      calories: dailyTarget,
      protein,
      carbs,
      fat,
    },
  };
}

/**
 * Deterministic single-food calculator (mirrors backend engine)
 * Returns per-portion nutrient values with formula string.
 */
export function calcPortionNutrients(per100g, portionG) {
  const factor = portionG / 100;
  const result = {};
  const formulaParts = [];

  for (const [key, val] of Object.entries(per100g)) {
    const calculated = Math.round(val * factor * 10) / 10;
    result[key] = calculated;
    formulaParts.push(`${key}: ${val}/100g × ${portionG}g = ${calculated}`);
  }

  return {
    nutrients:   result,
    formula:     formulaParts.join(" | "),
    formulaNote: "Nutrient = nutrient_per_100g × portion_g / 100",
  };
}
