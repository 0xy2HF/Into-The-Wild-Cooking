import { useState } from 'react'

const CONDITION_TYPES = [
  { value: 'has_ingredient', label: 'Contains ingredient' },
  { value: 'has_type', label: 'Contains type' },
  { value: 'more_unappetising', label: 'More un-appetising than appetising' },
  { value: 'all_unappetising', label: 'All un-appetising' },
]

const MODIFIER_MODES = [
  { value: 'each_unappetising', label: 'Each un-appetising ingredient' },
  { value: 'threshold_ingredient', label: 'If too many of ingredient' },
]

function emptyCondition() {
  return { type: 'has_ingredient', value: '', count: 1 }
}

function emptyRule() {
  return {
    id: '',
    name: '',
    kind: 'recipe',
    conditions: [emptyCondition()],
    result: { recipeName: '', multiplier: 1 },
  }
}

function RuleBuilder({ onSave, editingRule, onCancelEdit, ingredients }) {
  const [rule, setRule] = useState(editingRule || emptyRule())

  const isEditing = !!editingRule

  const allTypes = [...new Set(ingredients.flatMap((i) => i.types))].sort()
  const allNames = [...new Set(ingredients.map((i) => i.name))].sort()

  const updateCondition = (index, field, value) => {
    setRule((prev) => {
      const conditions = [...prev.conditions]
      conditions[index] = { ...conditions[index], [field]: value }
      return { ...prev, conditions }
    })
  }

  const addCondition = () => {
    setRule((prev) => ({
      ...prev,
      conditions: [...prev.conditions, emptyCondition()],
    }))
  }

  const removeCondition = (index) => {
    setRule((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!rule.name.trim()) return
    if (rule.kind === 'recipe' && !rule.result.recipeName.trim()) return
    if (rule.kind === 'modifier' && !rule.result.perCount) return
    if (rule.kind === 'modifier' && rule.result.perCount === 'threshold_ingredient' && !rule.result.ingredient?.trim()) return

    const saved = {
      ...rule,
      id: rule.id || crypto.randomUUID(),
    }
    onSave(saved)
    setRule(emptyRule())
  }

  const handleCancel = () => {
    setRule(emptyRule())
    onCancelEdit?.()
  }

  const needsValue = (type) =>
    type === 'has_ingredient' || type === 'has_type'

  const needsCount = (type) =>
    type === 'has_ingredient' || type === 'has_type'

  return (
    <form className="rule-builder" onSubmit={handleSubmit}>
      <h2>{isEditing ? 'Edit Rule' : 'New Rule'}</h2>

      <div className="form-group">
        <label>Rule Name</label>
        <input
          type="text"
          value={rule.name}
          onChange={(e) => setRule((p) => ({ ...p, name: e.target.value }))}
          placeholder={rule.kind === 'recipe' ? 'e.g. Risotto Rule' : 'e.g. Un-appetising Malus'}
        />
      </div>

      <div className="form-group">
        <label>Kind</label>
        <div className="kind-toggle">
          <button
            type="button"
            className={`kind-btn ${rule.kind === 'recipe' ? 'kind-btn-active' : ''}`}
            onClick={() =>
              setRule((p) => ({
                ...p,
                kind: 'recipe',
                result: { ...p.result, perCount: undefined },
              }))
            }
          >
            Recipe
          </button>
          <button
            type="button"
            className={`kind-btn ${rule.kind === 'modifier' ? 'kind-btn-active' : ''}`}
            onClick={() =>
              setRule((p) => ({
                ...p,
                kind: 'modifier',
                conditions: [],
                result: { ...p.result, recipeName: '', perCount: 'each_unappetising' },
              }))
            }
          >
            Modifier
          </button>
        </div>
      </div>

      {rule.kind === 'recipe' && <div className="rule-conditions">
        <label className="rule-section-label">Conditions (AND)</label>
        {rule.conditions.map((cond, i) => (
          <div key={i} className="condition-row">
            {i > 0 && <span className="condition-and">AND</span>}
            <div className="condition-fields">
              <select
                value={cond.type}
                onChange={(e) => updateCondition(i, 'type', e.target.value)}
              >
                {CONDITION_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>

              {needsValue(cond.type) && (
                <>
                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) => updateCondition(i, 'value', e.target.value)}
                    placeholder={
                      cond.type === 'has_ingredient'
                        ? 'Ingredient name'
                        : 'Type name (e.g. Meat)'
                    }
                    list={
                      cond.type === 'has_ingredient'
                        ? 'ingredient-names'
                        : 'ingredient-types'
                    }
                  />
                  <datalist id="ingredient-names">
                    {allNames.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                  <datalist id="ingredient-types">
                    {allTypes.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </>
              )}

              {needsCount(cond.type) && (
                <div className="condition-count">
                  <span>min</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={cond.count}
                    onChange={(e) =>
                      updateCondition(i, 'count', Number(e.target.value))
                    }
                  />
                </div>
              )}

              {rule.conditions.length > 1 && (
                <button
                  type="button"
                  className="btn-icon btn-danger"
                  onClick={() => removeCondition(i)}
                  title="Remove condition"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn-add-condition"
          onClick={addCondition}
        >
          + Add condition
        </button>
      </div>}

      {rule.kind === 'modifier' && (
        <div className="rule-modifier-section">
          <label className="rule-section-label">Mode</label>
          <select
            value={rule.result.perCount || 'each_unappetising'}
            onChange={(e) =>
              setRule((p) => ({
                ...p,
                result: {
                  ...p.result,
                  perCount: e.target.value,
                  threshold: e.target.value === 'threshold_ingredient' ? (p.result.threshold || 2) : undefined,
                  ingredient: e.target.value === 'threshold_ingredient' ? (p.result.ingredient || '') : undefined,
                  timeDivider: e.target.value === 'threshold_ingredient' ? (p.result.timeDivider || 1) : undefined,
                },
              }))
            }
          >
            {MODIFIER_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {rule.result.perCount === 'threshold_ingredient' && (
            <div className="modifier-threshold-fields">
              <div className="form-row">
                <div className="form-group">
                  <label>Ingredient</label>
                  <input
                    type="text"
                    value={rule.result.ingredient || ''}
                    onChange={(e) =>
                      setRule((p) => ({
                        ...p,
                        result: { ...p.result, ingredient: e.target.value },
                      }))
                    }
                    placeholder="e.g. Salt"
                    list="modifier-ingredient-names"
                  />
                  <datalist id="modifier-ingredient-names">
                    {allNames.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Threshold (more than)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={rule.result.threshold || 2}
                    onChange={(e) =>
                      setRule((p) => ({
                        ...p,
                        result: { ...p.result, threshold: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Time divider</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={rule.result.timeDivider || 1}
                  onChange={(e) =>
                    setRule((p) => ({
                      ...p,
                      result: { ...p.result, timeDivider: Number(e.target.value) },
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rule-result">
        <label className="rule-section-label">Result</label>
        <div className="form-row">
          {rule.kind === 'recipe' && (
            <div className="form-group">
              <label>Recipe Name</label>
              <input
                type="text"
                value={rule.result.recipeName}
                onChange={(e) =>
                  setRule((p) => ({
                    ...p,
                    result: { ...p.result, recipeName: e.target.value },
                  }))
                }
                placeholder="e.g. Risotto"
              />
            </div>
          )}
          <div className="form-group">
            <label>
              Multiplier {rule.kind === 'modifier' ? '(applied per match)' : ''}
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={rule.result.multiplier}
              onChange={(e) =>
                setRule((p) => ({
                  ...p,
                  result: { ...p.result, multiplier: Number(e.target.value) },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn-primary" type="submit">
          {isEditing ? 'Update Rule' : 'Save Rule'}
        </button>
        {isEditing && (
          <button
            className="btn-secondary"
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default RuleBuilder
