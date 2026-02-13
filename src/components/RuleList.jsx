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

function RuleList({ rules, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const [filterKind, setFilterKind] = useState('')

  const filtered = useMemo(() => {
    let list = rules
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.result.recipeName && r.result.recipeName.toLowerCase().includes(q))
      )
    }
    if (filterKind) {
      list = list.filter((r) => (r.kind || 'recipe') === filterKind)
    }
    return list
  }, [rules, search, filterKind])

  if (rules.length === 0) {
    return (
      <div className="ingredient-list-empty">
        <p>No rules yet. Create your first one!</p>
      </div>
    )
  }

  return (
    <div className="ingredient-list">
      <h2>Rules ({filtered.length}{filtered.length !== rules.length ? `/${rules.length}` : ''})</h2>

      <div className="table-filters">
        <input
          type="text"
          className="filter-search"
          placeholder="Search name or recipe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value)}
        >
          <option value="">All kinds</option>
          <option value="recipe">Recipe</option>
          <option value="modifier">Modifier</option>
        </select>
        {(search || filterKind) && (
          <button
            className="btn-icon"
            onClick={() => { setSearch(''); setFilterKind('') }}
            title="Clear filters"
          >
            ✕
          </button>
        )}
      </div>

      <div className="sheet-wrapper">
        <table className="sheet">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Kind</th>
              <th>Conditions</th>
              <th>Recipe</th>
              <th>Multiplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rule) => (
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
