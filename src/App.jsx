import { useState, useEffect } from 'react'
import IngredientForm from './components/IngredientForm'
import IngredientList from './components/IngredientList'
import RuleBuilder from './components/RuleBuilder'
import RuleList from './components/RuleList'
import CraftingPanel from './components/CraftingPanel'
import initialIngredients from './data/ingredients.json'
import initialRules from './data/rules.json'
import './App.css'

const STORAGE_KEY = 'wild-cooking-ingredients'
const RULES_STORAGE_KEY = 'wild-cooking-rules'
const INGREDIENTS_VERSION_KEY = 'wild-cooking-ingredients-version'
const RULES_VERSION_KEY = 'wild-cooking-rules-version'
const INIT_KEY = 'wild-cooking-initialized'

const expectedVersion = String(initialIngredients.version) + '-' + String(initialRules.version)
if (localStorage.getItem(INIT_KEY) !== expectedVersion) {
  localStorage.setItem(INIT_KEY, expectedVersion)
  location.reload()
}

function loadIngredients() {
  const stored = localStorage.getItem(STORAGE_KEY)
  const localVersion = Number(localStorage.getItem(INGREDIENTS_VERSION_KEY) || 0)
  if (stored && localVersion >= initialIngredients.version) {
    return JSON.parse(stored)
  }
  localStorage.setItem(INGREDIENTS_VERSION_KEY, String(initialIngredients.version))
  return initialIngredients.data
}

function saveIngredients(ingredients) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients))
}

function loadRules() {
  const stored = localStorage.getItem(RULES_STORAGE_KEY)
  const localVersion = Number(localStorage.getItem(RULES_VERSION_KEY) || 0)
  if (stored && localVersion >= initialRules.version) {
    return JSON.parse(stored)
  }
  localStorage.setItem(RULES_VERSION_KEY, String(initialRules.version))
  return initialRules.data
}

function saveRules(rules) {
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules))
}


function decompressData(base64) {
  const binString = atob(base64)
  const bytes = Uint8Array.from(binString, (c) => c.codePointAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

function getSharedIngredients() {
  const params = new URLSearchParams(window.location.search)
  const shared = params.get('shared')
  if (shared) {
    try {
      const data = decompressData(shared)
      if (Array.isArray(data)) return data
    } catch {
      // invalid shared data
    }
  }
  return null
}

function App() {
  const [ingredients, setIngredients] = useState(loadIngredients)
  const [editingIngredient, setEditingIngredient] = useState(null)
  const [sharedIngredients, setSharedIngredients] = useState(getSharedIngredients)

  const [tab, setTab] = useState('ingredients')
  const [rules, setRules] = useState(loadRules)
  const [editingRule, setEditingRule] = useState(null)

  useEffect(() => {
    saveIngredients(ingredients)
  }, [ingredients])

  useEffect(() => {
    saveRules(rules)
  }, [rules])

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

  const handleSaveRule = (rule) => {
    setRules((prev) => {
      const exists = prev.find((r) => r.id === rule.id)
      if (exists) {
        return prev.map((r) => (r.id === rule.id ? rule : r))
      }
      if (rule.kind !== 'modifier' && !rule.priority) {
        const maxPrio = prev
          .filter((r) => r.kind !== 'modifier')
          .reduce((max, r) => Math.max(max, r.priority || 0), 0)
        rule = { ...rule, priority: maxPrio + 1 }
      }
      return [...prev, rule]
    })
    setEditingRule(null)
  }

  const handleDeleteRule = (id) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const handleReorderRules = (reorderedRecipes) => {
    setRules((prev) => {
      const modifiers = prev.filter((r) => r.kind === 'modifier')
      return [...reorderedRecipes, ...modifiers]
    })
  }

  const handleEditRule = (rule) => {
    setEditingRule(rule)
  }


  const handleMergeShared = () => {
    if (!sharedIngredients) return
    const existingIds = new Set(ingredients.map((i) => i.id))
    const newOnes = sharedIngredients.filter((i) => !existingIds.has(i.id))
    setIngredients((prev) => [...prev, ...newOnes])
    setSharedIngredients(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const handleReplaceWithShared = () => {
    if (!sharedIngredients) return
    setIngredients(sharedIngredients)
    setSharedIngredients(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const handleDismissShared = () => {
    setSharedIngredients(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const handleExport = () => {
    const isRules = tab === 'rules'
    const data = isRules ? rules : ingredients
    const versionKey = isRules ? RULES_VERSION_KEY : INGREDIENTS_VERSION_KEY
    const currentVersion = Number(localStorage.getItem(versionKey) || 0)
    const newVersion = currentVersion + 1
    localStorage.setItem(versionKey, String(newVersion))
    const exportData = { version: newVersion, data }
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-')
    const prefix = isRules ? 'rules' : 'ingredients'
    const filename = `${prefix}-${timestamp}.json`
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const imported = JSON.parse(event.target.result)
      let items
      let version
      if (Array.isArray(imported)) {
        items = imported
        version = null
      } else if (imported && Array.isArray(imported.data)) {
        items = imported.data
        version = imported.version
      } else {
        return
      }
      const isRules = tab === 'rules'
      if (isRules) {
        setRules(items)
      } else {
        setIngredients(items)
      }
      if (version != null) {
        const versionKey = isRules ? RULES_VERSION_KEY : INGREDIENTS_VERSION_KEY
        localStorage.setItem(versionKey, String(version))
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
            Export {tab === 'rules' ? 'Rules' : 'Ingredients'}
          </button>
          <label className="btn-secondary import-btn">
            Import {tab === 'rules' ? 'Rules' : 'Ingredients'}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              hidden
            />
          </label>
        </div>
      </header>

      {sharedIngredients && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <h3>Ingrédients partagés reçus</h3>
            <p>{sharedIngredients.length} ingrédient{sharedIngredients.length > 1 ? 's' : ''} dans ce partage</p>
            <div className="share-modal-actions">
              <button className="btn-primary" onClick={handleMergeShared}>
                Fusionner
              </button>
              <button className="btn-secondary" onClick={handleReplaceWithShared}>
                Tout remplacer
              </button>
              <button className="btn-secondary" onClick={handleDismissShared}>
                Ignorer
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="tab-bar">
        <button
          className={`tab ${tab === 'ingredients' ? 'tab-active' : ''}`}
          onClick={() => setTab('ingredients')}
        >
          Ingredients
        </button>
        <button
          className={`tab ${tab === 'rules' ? 'tab-active' : ''}`}
          onClick={() => setTab('rules')}
        >
          Rules
        </button>
        <button
          className={`tab ${tab === 'craft' ? 'tab-active' : ''}`}
          onClick={() => setTab('craft')}
        >
          Craft
        </button>
      </nav>

      {tab === 'ingredients' && (
        <main className="app-main">
          <aside className="sidebar">
            <IngredientForm
              key={editingIngredient?.id || 'new'}
              onAdd={handleAdd}
              editingIngredient={editingIngredient}
              onUpdate={handleUpdate}
              onCancelEdit={() => setEditingIngredient(null)}
              ingredients={ingredients}
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
      )}

      {tab === 'rules' && (
        <main className="app-main">
          <aside className="sidebar">
            <RuleBuilder
              key={editingRule?.id || 'new'}
              onSave={handleSaveRule}
              editingRule={editingRule}
              onCancelEdit={() => setEditingRule(null)}
              ingredients={ingredients}
            />
          </aside>
          <section className="content">
            <RuleList
              rules={rules}
              onEdit={handleEditRule}
              onDelete={handleDeleteRule}
              onReorder={handleReorderRules}
            />
          </section>
        </main>
      )}

      {tab === 'craft' && (
        <main className="app-main-full">
          <CraftingPanel ingredients={ingredients} rules={rules} />
        </main>
      )}
    </div>
  )
}

export default App
