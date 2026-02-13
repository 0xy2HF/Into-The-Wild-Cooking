import { useState, useMemo } from 'react'
import { typeTagStyle } from '../utils/typeColor'

function parseTime(t) {
  if (!t) return 0
  const parts = t.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || 0
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

function IngredientList({ ingredients, onEdit, onDelete }) {
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
    if (!sort.key) return ingredients
    const list = [...ingredients]
    const dir = sort.dir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      switch (sort.key) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'types':
          return dir * (a.types[0] || '').localeCompare(b.types[0] || '')
        case 'appetising':
          return dir * ((a.appetisingScore ? 1 : 0) - (b.appetisingScore ? 1 : 0))
        case 'foodPoint':
          return dir * (a.foodPoint - b.foodPoint)
        case 'effects':
          return dir * (a.effects[0] || '').localeCompare(b.effects[0] || '')
        case 'time':
          return dir * (parseTime(a.time) - parseTime(b.time))
        case 'boost':
          return dir * ((a.boost ?? 0) - (b.boost ?? 0))
        default:
          return 0
      }
    })
    return list
  }, [ingredients, sort])

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
              <SortTh label="Name" sortKey="name" sort={sort} onSort={handleSort} />
              <SortTh label="Types" sortKey="types" sort={sort} onSort={handleSort} />
              <SortTh label="Appetising" sortKey="appetising" sort={sort} onSort={handleSort} />
              <SortTh label="Food Pt" sortKey="foodPoint" sort={sort} onSort={handleSort} />
              <SortTh label="Effects" sortKey="effects" sort={sort} onSort={handleSort} />
              <SortTh label="Time" sortKey="time" sort={sort} onSort={handleSort} />
              <SortTh label="Boost" sortKey="boost" sort={sort} onSort={handleSort} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ing) => (
              <tr key={ing.id}>
                <td className="sheet-name">{ing.name}</td>
                <td>
                  <div className="tag-display">
                    {ing.types.map((t, i) => (
                      <span key={i} className="tag tag-type" style={typeTagStyle(t)}>{t}</span>
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
                    <span className="boost-display">
                      x{ing.boost} <span className="boost-target-label">{ing.boostTarget === 'effect' ? 'effect' : 'time'}</span>
                    </span>
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
