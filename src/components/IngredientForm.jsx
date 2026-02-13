import { useState } from 'react'
import TagInput from './TagInput'

const emptyIngredient = {
  name: '',
  types: [],
  appetisingScore: false,
  foodPoint: 0,
  effects: [],
  time: '00:00:30',
  boost: 1.0,
  boostTarget: 'time',
}

function IngredientForm({ onAdd, editingIngredient, onUpdate, onCancelEdit, ingredients }) {
  const [ingredient, setIngredient] = useState(editingIngredient || emptyIngredient)

  const allTypes = [...new Set(ingredients.flatMap((i) => i.types))].sort()
  const allEffects = [...new Set(ingredients.flatMap((i) => i.effects))].sort()

  const handleChange = (field, value) => {
    setIngredient((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!ingredient.name.trim()) return

    if (editingIngredient) {
      onUpdate({ ...ingredient })
      onCancelEdit()
    } else {
      onAdd({
        ...ingredient,
        id: crypto.randomUUID(),
      })
    }
    setIngredient(emptyIngredient)
  }

  const isEditing = !!editingIngredient

  return (
    <form className="ingredient-form" onSubmit={handleSubmit}>
      <h2>{isEditing ? 'Edit Ingredient' : 'Add Ingredient'}</h2>

      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={ingredient.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ingredient name"
          required
        />
      </div>

      <div className="form-group">
        <label>Type</label>
        <TagInput
          tags={ingredient.types}
          onTagsChange={(tags) => handleChange('types', tags)}
          placeholder="Add a type and press Enter"
          suggestions={allTypes}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="appetisingScore" className="checkbox-label">
            <input
              id="appetisingScore"
              type="checkbox"
              checked={ingredient.appetisingScore}
              onChange={(e) => handleChange('appetisingScore', e.target.checked)}
            />
            Appetising
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="foodPoint">Food Point</label>
          <input
            id="foodPoint"
            type="number"
            min="0"
            value={ingredient.foodPoint}
            onChange={(e) => handleChange('foodPoint', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Effect</label>
        <TagInput
          tags={ingredient.effects}
          onTagsChange={(tags) => handleChange('effects', tags)}
          placeholder="Add an effect and press Enter"
          suggestions={allEffects}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="time">Time</label>
          <label className="checkbox-label checkbox-label-small">
            <input
              type="checkbox"
              checked={ingredient.time === null}
              onChange={(e) =>
                handleChange('time', e.target.checked ? null : '00:00:30')
              }
            />
            None
          </label>
          {ingredient.time !== null && (
            <input
              id="time"
              type="text"
              value={ingredient.time}
              onChange={(e) => handleChange('time', e.target.value)}
              placeholder="00:00:30"
              pattern="\d{2}:\d{2}:\d{2}"
              title="Format: HH:MM:SS"
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="boost">
            Boost {ingredient.boost !== null ? `(x${ingredient.boost})` : ''}
          </label>
          <label className="checkbox-label checkbox-label-small">
            <input
              type="checkbox"
              checked={ingredient.boost === null}
              onChange={(e) =>
                handleChange('boost', e.target.checked ? null : 1.0)
              }
            />
            None
          </label>
          {ingredient.boost !== null && (
            <>
              <div className="boost-target-toggle">
                <button
                  type="button"
                  className={`kind-btn ${ingredient.boostTarget !== 'effect' ? 'kind-btn-active' : ''}`}
                  onClick={() => handleChange('boostTarget', 'time')}
                >
                  Time
                </button>
                <button
                  type="button"
                  className={`kind-btn ${ingredient.boostTarget === 'effect' ? 'kind-btn-active' : ''}`}
                  onClick={() => handleChange('boostTarget', 'effect')}
                >
                  Effect
                </button>
              </div>
              <input
                id="boost"
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={ingredient.boost}
                onChange={(e) => handleChange('boost', Number(e.target.value))}
              />
            </>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {isEditing ? 'Update' : 'Add Ingredient'}
        </button>
        {isEditing && (
          <button type="button" className="btn-secondary" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default IngredientForm
