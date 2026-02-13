import { useState, useMemo } from 'react'
import { typeTagStyle } from '../utils/typeColor'

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

function evaluateModifier(rule, selected) {
  const { perCount } = rule.result
  if (perCount === 'each_unappetising') {
    const count = selected.filter((i) => !i.appetisingScore).length
    if (count > 0) return { count, triggered: true }
  }
  if (perCount === 'threshold_ingredient') {
    const count = selected.filter((i) => i.name === rule.result.ingredient).length
    if (count > (rule.result.threshold || 2)) return { count: 1, triggered: true }
  }
  return { count: 0, triggered: false }
}

function evaluateRules(rules, selected) {
  const matchedRecipes = []
  const matchedModifiers = []
  for (const rule of rules) {
    if (rule.kind === 'modifier') {
      const { count, triggered } = evaluateModifier(rule, selected)
      if (triggered) {
        matchedModifiers.push({ ...rule, _count: count })
      }
    } else {
      const allMatch = rule.conditions.every((cond) =>
        evaluateCondition(cond, selected)
      )
      if (allMatch) {
        matchedRecipes.push(rule)
      }
    }
  }
  return { matchedRecipes, matchedModifiers }
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

function computeCraft(selected, matchedRecipes, matchedModifiers) {
  if (selected.length < 2) return null

  const totalFoodPoints = selected.reduce((sum, i) => sum + i.foodPoint, 0)
  const totalTime = selected.reduce(
    (sum, i) => sum + (i.time !== null ? parseTime(i.time) : 0),
    0
  )

  const timeBoost = selected.reduce(
    (prod, i) => prod * (i.boost !== null && i.boostTarget !== 'effect' ? i.boost : 1),
    1
  )

  const effectBoost = selected.reduce(
    (prod, i) => prod * (i.boost !== null && i.boostTarget === 'effect' ? i.boost : 1),
    1
  )

  const allEffectsRaw = [...new Set(selected.flatMap((i) => i.effects))]
  const effectLevel = effectBoost !== 1 ? Math.round(effectBoost * 10) / 10 : null
  const allEffects = allEffectsRaw.map((e) =>
    effectLevel && effectLevel !== 1 ? `${e} ${effectLevel}` : e
  )

  const boostMultiplier = timeBoost

  let ruleMultiplier = 1
  for (const rule of matchedRecipes) {
    ruleMultiplier *= rule.result.multiplier
  }

  let modifierMultiplier = 1
  let timeDivider = 1
  for (const mod of matchedModifiers) {
    modifierMultiplier *= Math.pow(mod.result.multiplier, mod._count)
    if (mod.result.timeDivider && mod.result.timeDivider > 1) {
      timeDivider *= mod.result.timeDivider
    }
  }

  const finalMultiplier = boostMultiplier * ruleMultiplier * modifierMultiplier
  const finalFoodPoints = Math.round(totalFoodPoints * finalMultiplier * 100) / 100
  const boostedTime = Math.round(totalTime * timeBoost)
  const finalTime = Math.round(boostedTime / timeDivider)

  const bestRecipe = matchedRecipes.length > 0
    ? matchedRecipes.reduce((best, r) =>
        r.result.multiplier > best.result.multiplier ? r : best
      )
    : null

  const timeModified = timeBoost !== 1 || timeDivider > 1

  return {
    totalFoodPoints,
    finalFoodPoints,
    totalTime: formatTime(totalTime),
    finalTime: timeModified ? formatTime(finalTime) : null,
    timeBoost: timeBoost !== 1 ? Math.round(timeBoost * 100) / 100 : null,
    timeDivider: timeDivider > 1 ? timeDivider : null,
    effects: allEffects,
    effectBoost: effectLevel,
    boostMultiplier: Math.round(boostMultiplier * 100) / 100,
    ruleMultiplier: Math.round(ruleMultiplier * 100) / 100,
    modifierMultiplier: Math.round(modifierMultiplier * 100) / 100,
    finalMultiplier: Math.round(finalMultiplier * 100) / 100,
    recipeName: bestRecipe?.result.recipeName || 'Suspicious Meal',
  }
}

function CraftingPanel({ ingredients, rules }) {
  const [slots, setSlots] = useState(Array(MAX_SLOTS).fill(null))

  const selected = slots.filter(Boolean)

  const { matchedRecipes, matchedModifiers } = useMemo(
    () => evaluateRules(rules, selected),
    [rules, selected]
  )

  const craft = useMemo(
    () => computeCraft(selected, matchedRecipes, matchedModifiers),
    [selected, matchedRecipes, matchedModifiers]
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
                    <span key={j} className="tag tag-type tag-small" style={typeTagStyle(t)}>{t}</span>
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
                <span className="craft-stat-value craft-stat-mono">
                  {craft.finalTime ? (
                    <>
                      <s>{craft.totalTime}</s> {craft.finalTime}
                      {craft.timeBoost && <span className="craft-time-detail"> x{craft.timeBoost}</span>}
                      {craft.timeDivider && <span className="craft-time-detail"> /{craft.timeDivider}</span>}
                    </>
                  ) : (
                    craft.totalTime
                  )}
                </span>
              </div>
              <div className="craft-stat">
                <span className="craft-stat-label">Rule Multiplier</span>
                <span className={`craft-stat-value ${craft.ruleMultiplier >= 1 ? 'craft-bonus' : 'craft-malus'}`}>
                  x{craft.ruleMultiplier}
                </span>
              </div>
              {craft.modifierMultiplier !== 1 && (
                <div className="craft-stat">
                  <span className="craft-stat-label">Modifier</span>
                  <span className={`craft-stat-value ${craft.modifierMultiplier >= 1 ? 'craft-bonus' : 'craft-malus'}`}>
                    x{craft.modifierMultiplier}
                  </span>
                </div>
              )}
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

            {matchedRecipes.length > 0 && (
              <div className="craft-matched-rules">
                <span className="craft-stat-label">Matched Rules</span>
                {matchedRecipes.map((r) => (
                  <div key={r.id} className="craft-matched-rule">
                    <span>{r.name}</span>
                    <span className={`multiplier-badge ${r.result.multiplier >= 1 ? 'multiplier-bonus' : 'multiplier-malus'}`}>
                      x{r.result.multiplier}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {matchedModifiers.length > 0 && (
              <div className="craft-matched-rules">
                <span className="craft-stat-label">Active Modifiers</span>
                {matchedModifiers.map((m) => (
                  <div key={m.id} className="craft-matched-rule">
                    <span>{m.name} ({m._count}x)</span>
                    <span className={`multiplier-badge ${m.result.multiplier >= 1 ? 'multiplier-bonus' : 'multiplier-malus'}`}>
                      x{m.result.multiplier}^{m._count} = x{Math.round(Math.pow(m.result.multiplier, m._count) * 100) / 100}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {matchedRecipes.length === 0 && (
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
