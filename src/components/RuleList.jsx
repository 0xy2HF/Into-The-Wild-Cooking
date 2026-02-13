import { useState, useMemo, useRef } from 'react'

const CONDITION_LABELS = {
  has_ingredient: 'Has',
  has_type: 'Has type',
  more_unappetising: 'More un-appetising than appetising',
  all_unappetising: 'All un-appetising',
}

function formatModifierCondition(result) {
  if (result.perCount === 'each_unappetising') return 'per un-appetising'
  if (result.perCount === 'threshold_ingredient')
    return `${result.threshold || 2}+ "${result.ingredient}"`
  return result.perCount
}

function formatCondition(cond) {
  if (cond.type === 'has_ingredient') {
    return cond.count > 1
      ? `${cond.count}+ "${cond.value}"`
      : `"${cond.value}"`
  }
  if (cond.type === 'has_type') {
    return cond.count > 1
      ? `${cond.count}+ #${cond.value}`
      : `#${cond.value}`
  }
  return CONDITION_LABELS[cond.type] || cond.type
}

function RuleList({ rules, onEdit, onDelete, onReorder }) {
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const dragRef = useRef(null)

  const recipes = useMemo(
    () =>
      [...rules]
        .filter((r) => r.kind !== 'modifier')
        .sort((a, b) => (a.priority || Infinity) - (b.priority || Infinity)),
    [rules]
  )

  const modifiers = useMemo(
    () => rules.filter((r) => r.kind === 'modifier'),
    [rules]
  )

  const handleDragStart = (e, ruleId) => {
    setDragId(ruleId)
    dragRef.current = ruleId
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, ruleId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (ruleId !== overId) {
      setOverId(ruleId)
    }
  }

  const handleDragLeave = () => {
    setOverId(null)
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    const sourceId = dragRef.current
    if (!sourceId || sourceId === targetId) {
      setDragId(null)
      setOverId(null)
      return
    }

    const sourceIdx = recipes.findIndex((r) => r.id === sourceId)
    const targetIdx = recipes.findIndex((r) => r.id === targetId)
    if (sourceIdx === -1 || targetIdx === -1) {
      setDragId(null)
      setOverId(null)
      return
    }

    const reordered = [...recipes]
    const [moved] = reordered.splice(sourceIdx, 1)
    reordered.splice(targetIdx, 0, moved)

    const updated = reordered.map((r, i) => ({ ...r, priority: i + 1 }))
    onReorder(updated)

    setDragId(null)
    setOverId(null)
  }

  const handleDragEnd = () => {
    setDragId(null)
    setOverId(null)
  }

  if (rules.length === 0) {
    return (
      <div className="ingredient-list-empty">
        <p>No rules yet. Create your first one!</p>
      </div>
    )
  }

  return (
    <div className="ingredient-list">
      <h2>Rules ({rules.length})</h2>

      <div className="sheet-wrapper">
        <table className="sheet">
          <thead>
            <tr>
              <th style={{ width: '2rem' }}></th>
              <th>Rule</th>
              <th>Kind</th>
              <th>Conditions</th>
              <th>Recipe</th>
              <th>Multiplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((rule, i) => (
              <tr
                key={rule.id}
                draggable
                onDragStart={(e) => handleDragStart(e, rule.id)}
                onDragOver={(e) => handleDragOver(e, rule.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, rule.id)}
                onDragEnd={handleDragEnd}
                className={
                  dragId === rule.id
                    ? 'drag-row-dragging'
                    : overId === rule.id
                      ? 'drag-row-over'
                      : ''
                }
              >
                <td className="drag-handle" title="Drag to reorder priority">
                  <span className="drag-grip">{i + 1}</span>
                </td>
                <td className="sheet-name">{rule.name}</td>
                <td>
                  <span className={`kind-badge kind-badge-${rule.kind || 'recipe'}`}>
                    Recipe
                  </span>
                </td>
                <td>
                  <div className="condition-tags">
                    {rule.conditions.map((cond, j) => (
                      <span key={j} className="tag tag-condition">
                        {formatCondition(cond)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="sheet-name">{rule.result.recipeName}</td>
                <td>
                  <span
                    className={`multiplier-badge ${
                      rule.result.multiplier >= 1
                        ? 'multiplier-bonus'
                        : 'multiplier-malus'
                    }`}
                  >
                    x{rule.result.multiplier}
                  </span>
                </td>
                <td>
                  <div className="sheet-actions">
                    <button
                      className="btn-icon"
                      onClick={() => onEdit(rule)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => onDelete(rule.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {modifiers.map((rule) => (
              <tr key={rule.id}>
                <td></td>
                <td className="sheet-name">{rule.name}</td>
                <td>
                  <span className="kind-badge kind-badge-modifier">
                    Modifier
                  </span>
                </td>
                <td>
                  <span className="tag tag-condition">
                    {formatModifierCondition(rule.result)}
                  </span>
                </td>
                <td className="sheet-name">
                  <span className="sheet-none">--</span>
                </td>
                <td>
                  <span
                    className={`multiplier-badge ${
                      rule.result.multiplier >= 1
                        ? 'multiplier-bonus'
                        : 'multiplier-malus'
                    }`}
                  >
                    x{rule.result.multiplier}
                    {rule.result.perCount === 'each_unappetising' && '/each'}
                  </span>
                  {rule.result.timeDivider > 1 && (
                    <span className="multiplier-badge multiplier-malus" style={{ marginLeft: '0.25rem' }}>
                      time /{rule.result.timeDivider}
                    </span>
                  )}
                </td>
                <td>
                  <div className="sheet-actions">
                    <button
                      className="btn-icon"
                      onClick={() => onEdit(rule)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => onDelete(rule.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RuleList
