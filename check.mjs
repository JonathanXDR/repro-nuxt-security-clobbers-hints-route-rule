// Proof script: reads the resolved Nitro route rules from the built output
// and shows that nuxt-security dropped the user-declared keys (csurf, robots)
// from routeRules['/__nuxt_hints/**'].
import { readFileSync } from 'node:fs'

const nitro = readFileSync('.output/server/chunks/nitro/nitro.mjs', 'utf8')
const i = nitro.indexOf('"/__nuxt_hints/**"')
if (i === -1) {
  console.error('FAIL: could not find /__nuxt_hints/** rule in built nitro output')
  process.exit(1)
}

// Extract the resolved rule object (balanced braces after the key).
const start = nitro.indexOf('{', i)
let depth = 0
let end = start
for (let p = start; p < nitro.length; p++) {
  const c = nitro[p]
  if (c === '{') depth++
  else if (c === '}') {
    depth--
    if (depth === 0) {
      end = p + 1
      break
    }
  }
}
const rule = nitro.slice(start, end)

console.log('nuxt.config.ts declared: routeRules["/__nuxt_hints/**"] = { csurf: false, robots: false }')
console.log('')
console.log('Resolved routeRules["/__nuxt_hints/**"] in the built output:')
console.log(rule)
console.log('')

const hasCsurf = /"csurf"/.test(rule)
const hasRobots = /"robots"/.test(rule)

if (!hasCsurf && !hasRobots) {
  console.log('BUG REPRODUCED: user-declared "csurf" and "robots" keys were dropped.')
  console.log('nuxt-security assigned (instead of merged) this route rule at module setup.')
  process.exit(0)
}
console.log('Bug NOT reproduced: user keys survived.')
process.exit(1)
