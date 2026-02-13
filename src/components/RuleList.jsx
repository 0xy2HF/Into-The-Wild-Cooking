import { useState, useMemo } from 'react'

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

function SortTh({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey
  const arrow = active ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''
  return (
    <th
      className="sheet-th-sort"
      onClick={() => onSort(sortKey)}
    >
      {label}{arrow}
    </th>
  )
}

function RuleList({ rules, onEdit, onDelete }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  const handleSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  const sorted = useMemo(() => {
    if (!sort.key) return rules
    const list = [...rules]
    const dir = sort.dir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      switch (sort.key) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'kind':
          return dir * (a.kind || 'recipe').localeCompare(b.kind || 'recipe')
        case 'recipe':
          return dir * (a.result.recipeName || '').localeCompare(b.result.recipeName || '')
        case 'multiplier':
          return dir * (a.result.multiplier - b.result.multiplier)
        default:
          return 0
      }
    })
    return list
  }, [rules, sort])

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
              <SortTh label="Rule" sortKey="name" sort={sort} onSort={handleSort} />
              <SortTh label="Kind" sortKey="kind" sort={sort} onSort={handleSort} />
              <th>Conditions</th>
              <SortTh label="Recipe" sortKey="recipe" sort={sort} onSort={handleSort} />
              <SortTh label="Multiplier" sortKey="multiplier" sort={sort} onSort={handleSort} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((rule) => (
              <tr key={rule.id}>
                <td className="sheet-name">{rule.name}</td>
                <td>
                  <span className={`kind-badge kind-badge-${rule.kind || 'recipe'}`}>
                    {rule.kind === 'modifier' ? 'Modifier' : 'Recipe'}
                  </span>
                </td>
                <td>
                  {rule.kind === 'modifier' ? (
                    <span className="tag tag-condition">
                      {formatModifierCondition(rule.result)}
                    </span>
                  ) : (
                    <div className="condition-tags">
                      {rule.conditions.map((cond, i) => (
                        <span key={i} className="tag tag-condition">
                          {formatCondition(cond)}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="sheet-name">
                  {rule.kind === 'modifier' ? (
                    <span className="sheet-none">--</span>
                  ) : (
                    rule.result.recipeName
                  )}
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
                    {rule.kind === 'modifier' && rule.result.perCount === 'each_unappetising' && '/each'}
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
