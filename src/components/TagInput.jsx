import { useState } from 'react'

function TagInput({ tags, onTagsChange, placeholder }) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed])
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
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
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="tag-input"
        />
      </div>
      <button type="button" className="tag-add-btn" onClick={addTag}>
        +
      </button>
    </div>
  )
}

export default TagInput
