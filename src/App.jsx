import { useState, useEffect } from 'react'
import IngredientForm from './components/IngredientForm'
import IngredientList from './components/IngredientList'
import initialIngredients from './data/ingredients.json'
import './App.css'

const STORAGE_KEY = 'wild-cooking-ingredients'

function loadIngredients() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return initialIngredients
}

function saveIngredients(ingredients) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients))
}

function App() {
  const [ingredients, setIngredients] = useState(loadIngredients)
  const [editingIngredient, setEditingIngredient] = useState(null)

  useEffect(() => {
    saveIngredients(ingredients)
  }, [ingredients])

  const handleAdd = (ingredient) => {
    setIngredients((prev) => [...prev, ingredient])
  }

  const handleUpdate = (updated) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === updated.id ? updated : ing))
    )
    setEditingIngredient(null)
  }

  const handleDelete = (id) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id))
  }

  const handleEdit = (ingredient) => {
    setEditingIngredient(ingredient)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(ingredients, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ingredients.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const imported = JSON.parse(event.target.result)
      if (Array.isArray(imported)) {
        setIngredients(imported)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Into The Wild Cooking</h1>
        <p className="subtitle">Food Crafting Ingredient Manager</p>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExport}>
            Export JSON
          </button>
          <label className="btn-secondary import-btn">
            Import JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              hidden
            />
          </label>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <IngredientForm
            key={editingIngredient?.id || 'new'}
            onAdd={handleAdd}
            editingIngredient={editingIngredient}
            onUpdate={handleUpdate}
            onCancelEdit={() => setEditingIngredient(null)}
          />
        </aside>
        <section className="content">
          <IngredientList
            ingredients={ingredients}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>
      </main>
    </div>
  )
}

export default App
