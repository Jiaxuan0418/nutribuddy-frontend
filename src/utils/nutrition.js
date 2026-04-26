// src/utils/nutrition.js  (IMPROVED)
// BMR / TDEE / Macro helpers + SMART goal calculator

const KCAL_PER_KG  = 7700;
const MIN_CALORIES = 1200;

export function calcBMR(weight, height, age, gender) {
  // Mifflin-St Jeor
  const s = gender === "male" ? 5 : -161;
  return 10 * weight + 6.25 * height - 5 * age + s;
}

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

export function calcMacros(tdee, goal) {
  if (goal === "lose") tdee = Math.max(tdee - 500, MIN_CALORIES);
  if (goal === "gain") tdee = tdee + 300;
  return {
    calories: Math.round(tdee),
    protein:  Math.round((tdee * 0.3) / 4),
    carbs:    Math.round((tdee * 0.4) / 4),
    fat:      Math.round((tdee * 0.3) / 9),
  };
}

/**
 * SMART Goal Calculator
 * Formula:
 *   weightDelta    = targetWeight - currentWeight
 *   weeklyChange   = clamp(weightDelta / weeks, -0.9, +0.9)
 *   dailyDelta     = weeklyChange * 7700 / 7
 *   dailyTarget    = max(TDEE + dailyDelta, 1200)
 */
export function calcSmartGoal(tdee, goalType, targetWeight, currentWeight, weeks = 8) {
  let weeklyChange = 0;

  if (goalType === "lose") {
    if (targetWeight && currentWeight) {
      const delta = targetWeight - currentWeight;  // negative
      weeklyChange = Math.max(delta / weeks, -0.9);
    } else {
      weeklyChange = -0.5;
    }
  } else if (goalType === "gain") {
    if (targetWeight && currentWeight) {
      const delta = targetWeight - currentWeight;  // positive
      weeklyChange = Math.min(delta / weeks, 0.9);
    } else {
      weeklyChange = 0.3;
    }
  }

  const dailyDelta  = (weeklyChange * KCAL_PER_KG) / 7;
  const dailyTarget = Math.max(Math.round(tdee + dailyDelta), MIN_CALORIES);

  const protein = Math.round((dailyTarget * 0.30) / 4);
  const carbs   = Math.round((dailyTarget * 0.40) / 4);
  const fat     = Math.round((dailyTarget * 0.30) / 9);

  // Build label
  let label;
  if (goalType === "maintain") {
    label = "Maintain Current Weight";
  } else if (targetWeight && currentWeight) {
    const absDelta = Math.abs(targetWeight - currentWeight).toFixed(1);
    label = `${goalType === "lose" ? "Lose" : "Gain"} ${absDelta} kg in ${weeks} weeks`;
  } else {
    label = goalType === "lose" ? "Gradual Weight Loss" : "Lean Muscle Gain";
  }

  const rationale =
    `TDEE = ${Math.round(tdee)} kcal/day. ` +
    `Weekly change = ${weeklyChange >= 0 ? "+" : ""}${weeklyChange.toFixed(2)} kg/week ` +
    `(≈ ${Math.abs(Math.round(dailyDelta))} kcal/day ${dailyDelta < 0 ? "deficit" : "surplus"}). ` +
    `Daily target = ${dailyTarget} kcal (safety floor: ${MIN_CALORIES} kcal).`;

  return {
    label,
    rationale,
    weeklyChangKg: weeklyChange,
    dailyDelta:    Math.round(dailyDelta),
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
