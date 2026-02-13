import { useState, useMemo } from 'react'

const MAX_SLOTS = 5

function evaluateCondition(cond, selected) {
  if (cond.type === 'has_ingredient') {
    const count = selected.filter((i) => i.name === cond.value).length
    return count >= (cond.count || 1)
  }
  if (cond.type === 'has_type') {
    const count = selected.filter((i) => i.types.includes(cond.value)).length
    return count >= (cond.count || 1)
  }
  if (cond.type === 'more_unappetising') {
    const app = selected.filter((i) => i.appetisingScore).length
    const unapp = selected.filter((i) => !i.appetisingScore).length
    return unapp > app
  }
  if (cond.type === 'all_unappetising') {
    return selected.length > 0 && selected.every((i) => !i.appetisingScore)
  }
  return false
}

function evaluateRules(rules, selected) {
  const matched = []
  for (const rule of rules) {
    const allMatch = rule.conditions.every((cond) =>
      evaluateCondition(cond, selected)
    )
    if (allMatch) {
      matched.push(rule)
    }
  }
  return matched
}

function parseTime(timeStr) {
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || 0
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function computeCraft(selected, matchedRules) {
  if (selected.length < 2) return null

  const totalFoodPoints = selected.reduce((sum, i) => sum + i.foodPoint, 0)
  const totalTime = selected.reduce((sum, i) => sum + parseTime(i.time), 0)

  const allEffects = [...new Set(selected.flatMap((i) => i.effects))]

  const boostMultiplier = selected.reduce((prod, i) => prod * i.boost, 1)

  let ruleMultiplier = 1
  for (const rule of matchedRules) {
    ruleMultiplier *= rule.result.multiplier
  }

  const finalMultiplier = boostMultiplier * ruleMultiplier
  const finalFoodPoints = Math.round(totalFoodPoints * finalMultiplier * 100) / 100

  const bestRecipe = matchedRules.length > 0
    ? matchedRules.reduce((best, r) =>
        r.result.multiplier > best.result.multiplier ? r : best
      )
    : null

  return {
    totalFoodPoints,
    finalFoodPoints,
    totalTime: formatTime(totalTime),
    effects: allEffects,
    boostMultiplier: Math.round(boostMultiplier * 100) / 100,
    ruleMultiplier: Math.round(ruleMultiplier * 100) / 100,
    finalMultiplier: Math.round(finalMultiplier * 100) / 100,
    recipeName: bestRecipe?.result.recipeName || 'Suspicious Meal',
  }
}

function CraftingPanel({ ingredients, rules }) {
  const [slots, setSlots] = useState(Array(MAX_SLOTS).fill(null))

  const selected = slots.filter(Boolean)

  const matchedRules = useMemo(
    () => evaluateRules(rules, selected),
    [rules, selected]
  )

  const craft = useMemo(
    () => computeCraft(selected, matchedRules),
    [selected, matchedRules]
  )

  const setSlot = (index, ingredientId) => {
    setSlots((prev) => {
      const next = [...prev]
      next[index] = ingredientId
        ? ingredients.find((i) => i.id === ingredientId) || null
        : null
      return next
    })
  }

  const clearAll = () => setSlots(Array(MAX_SLOTS).fill(null))

  return (
    <div className="crafting-panel">
      <div className="craft-slots">
        <h2>Craft</h2>
        <div className="slots-grid">
          {slots.map((slot, i) => (
            <div key={i} className={`craft-slot ${slot ? 'craft-slot-filled' : ''}`}>
              <span className="slot-number">{i + 1}</span>
              <select
                value={slot?.id || ''}
                onChange={(e) => setSlot(i, e.target.value)}
              >
                <option value="">Empty</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
              {slot && (
                <div className="slot-info">
                  <span className="slot-fp">{slot.foodPoint} fp</span>
                  {slot.types.map((t, j) => (
                    <span key={j} className="tag tag-type tag-small">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {selected.length > 0 && (
          <button className="btn-secondary craft-clear" onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>

      <div className="craft-result-panel">
        <h2>Result</h2>
        {!craft && (
          <p className="craft-hint">Select at least 2 ingredients to craft.</p>
        )}

        {craft && (
          <div className="craft-result">
            <div className="craft-recipe-name">{craft.recipeName}</div>

            <div className="craft-stats">
              <div className="craft-stat">
                <span className="craft-stat-label">Food Points</span>
                <span className="craft-stat-value">{craft.totalFoodPoints}</span>
              </div>
              <div className="craft-stat">
                <span className="craft-stat-label">Final Food Points</span>
                <span className="craft-stat-value craft-stat-final">{craft.finalFoodPoints}</span>
              </div>
              <div className="craft-stat">
                <span className="craft-stat-label">Time</span>
                <span className="craft-stat-value craft-stat-mono">{craft.totalTime}</span>
              </div>
              <div className="craft-stat">
                <span className="craft-stat-label">Boost</span>
                <span className="craft-stat-value">x{craft.boostMultiplier}</span>
              </div>
              <div className="craft-stat">
                <span className="craft-stat-label">Rule Multiplier</span>
                <span className={`craft-stat-value ${craft.ruleMultiplier >= 1 ? 'craft-bonus' : 'craft-malus'}`}>
                  x{craft.ruleMultiplier}
                </span>
              </div>
              <div className="craft-stat">
                <span className="craft-stat-label">Total Multiplier</span>
                <span className={`craft-stat-value ${craft.finalMultiplier >= 1 ? 'craft-bonus' : 'craft-malus'}`}>
                  x{craft.finalMultiplier}
                </span>
              </div>
            </div>

            {craft.effects.length > 0 && (
              <div className="craft-effects">
                <span className="craft-stat-label">Effects</span>
                <div className="tag-display">
                  {craft.effects.map((e, i) => (
                    <span key={i} className="tag tag-effect">{e}</span>
                  ))}
                </div>
              </div>
            )}

            {matchedRules.length > 0 && (
              <div className="craft-matched-rules">
                <span className="craft-stat-label">Matched Rules</span>
                {matchedRules.map((r) => (
                  <div key={r.id} className="craft-matched-rule">
                    <span>{r.name}</span>
                    <span className={`multiplier-badge ${r.result.multiplier >= 1 ? 'multiplier-bonus' : 'multiplier-malus'}`}>
                      x{r.result.multiplier}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {matchedRules.length === 0 && (
              <div className="craft-no-rules">
                No rules matched — defaulting to "Suspicious Meal"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CraftingPanel
