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
      <div className="ingredient-cards">
        {ingredients.map((ing) => (
          <div key={ing.id} className="ingredient-card">
            <div className="card-header">
              <h3>{ing.name}</h3>
              <div className="card-actions">
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
            </div>

            <div className="card-body">
              {ing.types.length > 0 && (
                <div className="card-field">
                  <span className="field-label">Type</span>
                  <div className="tag-display">
                    {ing.types.map((t, i) => (
                      <span key={i} className="tag tag-type">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="card-stats">
                <div className="stat">
                  <span className="stat-label">Appetising</span>
                  <span className="stat-value">{ing.appetisingScore}/10</span>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${ing.appetisingScore * 10}%` }}
                    />
                  </div>
                </div>
                <div className="stat">
                  <span className="stat-label">Food Pt</span>
                  <span className="stat-value">{ing.foodPoint}</span>
                </div>
              </div>

              {ing.effects.length > 0 && (
                <div className="card-field">
                  <span className="field-label">Effects</span>
                  <div className="tag-display">
                    {ing.effects.map((e, i) => (
                      <span key={i} className="tag tag-effect">{e}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="card-footer">
                <span className="time-display">
                  {ing.time}
                </span>
                {ing.boost !== 1 && (
                  <span className="boost-display">
                    x{ing.boost} boost
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IngredientList
