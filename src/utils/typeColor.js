const TYPE_HUES = {}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export function getTypeHue(type) {
  if (TYPE_HUES[type] === undefined) {
    TYPE_HUES[type] = hashString(type) % 360
  }
  return TYPE_HUES[type]
}

export function typeTagStyle(type) {
  const hue = getTypeHue(type)
  return {
    background: `hsla(${hue}, 70%, 50%, 0.15)`,
    borderColor: `hsla(${hue}, 70%, 50%, 0.35)`,
    color: `hsl(${hue}, 80%, 75%)`,
  }
}
