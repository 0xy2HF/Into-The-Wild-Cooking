const CONDITION_LABELS = {
  has_ingredient: 'Has',
  has_type: 'Has type',
  more_unappetising: 'More un-appetising than appetising',
  all_unappetising: 'All un-appetising',
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
              <th>Rule</th>
              <th>Conditions</th>
              <th>Recipe</th>
              <th>Multiplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="sheet-name">{rule.name}</td>
                <td>
                  <div className="condition-tags">
                    {rule.conditions.map((cond, i) => (
                      <span key={i} className="tag tag-condition">
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
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RuleList
