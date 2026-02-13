import { useState } from 'react'

function TagInput({ tags, onTagsChange, placeholder, suggestions }) {
  const [input, setInput] = useState('')

  const listId = suggestions?.length ? `tag-suggestions-${placeholder?.replace(/\s/g, '') || 'default'}` : undefined

  const availableSuggestions = suggestions?.filter((s) => !tags.includes(s)) || []

  const tryAddTag = (value) => {
    const trimmed = value.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed])
      setInput('')
      return true
    }
    return false
  }

  const handleChange = (e) => {
    const value = e.target.value
    if (availableSuggestions.includes(value)) {
      tryAddTag(value)
    } else {
      setInput(value)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      tryAddTag(input)
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onTagsChange(tags.slice(0, -1))
    }
  }

  const removeTag = (index) => {
    onTagsChange(tags.filter((_, i) => i !== index))
  }

  return (
    <div className="tag-input-container">
      <div className="tag-list">
        {tags.map((tag, index) => (
          <span key={index} className="tag">
            {tag}
            <button
              type="button"
              className="tag-remove"
              onClick={() => removeTag(index)}
            >
              x
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="tag-input"
          list={listId}
        />
        {listId && (
          <datalist id={listId}>
            {availableSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>
    </div>
  )
}

export default TagInput
