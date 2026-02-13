function IngredientList({ ingredients, onEdit, onDelete }) {
  if (ingredients.length === 0) {
    return (
      <div className="ingredient-list-empty">
        <p>No ingredients yet. Add your first one!</p>
      </div>
    )
  }

  return (
    <div className="ingredient-list">
      <h2>Ingredients ({ingredients.length})</h2>
      <div className="sheet-wrapper">
        <table className="sheet">
          <thead>
            <tr>
              <th>Name</th>
              <th>Types</th>
              <th>Appetising</th>
              <th>Food Pt</th>
              <th>Effects</th>
              <th>Time</th>
              <th>Boost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => (
              <tr key={ing.id}>
                <td className="sheet-name">{ing.name}</td>
                <td>
                  <div className="tag-display">
                    {ing.types.map((t, i) => (
                      <span key={i} className="tag tag-type">{t}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`stat-badge ${ing.appetisingScore ? 'stat-badge-yes' : 'stat-badge-no'}`}>
                    {ing.appetisingScore ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="sheet-number">{ing.foodPoint}</td>
                <td>
                  <div className="tag-display">
                    {ing.effects.map((e, i) => (
                      <span key={i} className="tag tag-effect">{e}</span>
                    ))}
                  </div>
                </td>
                <td className="sheet-mono">
                  {ing.time !== null ? ing.time : <span className="sheet-none">None</span>}
                </td>
                <td>
                  {ing.boost === null ? (
                    <span className="sheet-none">None</span>
                  ) : ing.boost !== 1 ? (
                    <span className="boost-display">x{ing.boost}</span>
                  ) : null}
                </td>
                <td>
                  <div className="sheet-actions">
                    <button
                      className="btn-icon"
                      onClick={() => onEdit(ing)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => onDelete(ing.id)}
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

export default IngredientList
