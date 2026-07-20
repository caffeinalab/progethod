import { readFileSync } from 'node:fs'

let parsed = {}
try {
  const content = readFileSync('.env', 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    parsed[key] = value
  }
} catch { /* no .env file */ }

console.log(
  Object.keys(parsed)
    .reduce((acc, key) => {
      return `${acc} ${key}="${parsed[key]}"`
    }, '--kv=PROGETHOD_PROJECTS --binding'),
)
