import { useState } from 'react'

const CONDITION_TYPES = [
  { value: 'has_ingredient', label: 'Contains ingredient' },
  { value: 'has_type', label: 'Contains type' },
  { value: 'more_unappetising', label: 'More un-appetising than appetising' },
  { value: 'all_unappetising', label: 'All un-appetising' },
]

function emptyCondition() {
  return { type: 'has_ingredient', value: '', count: 1 }
}

function emptyRule() {
  return {
    id: '',
    name: '',
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
    if (!rule.name.trim() || !rule.result.recipeName.trim()) return

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
          placeholder="e.g. Risotto Rule"
        />
      </div>

      <div className="rule-conditions">
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
      </div>

      <div className="rule-result">
        <label className="rule-section-label">Result</label>
        <div className="form-row">
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
          <div className="form-group">
            <label>Multiplier</label>
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
