#!/usr/bin/env node

/**
 * Arrays Example
 *
 * Shows how TOON handles different types of arrays:
 * - Primitive arrays (inline format)
 * - Uniform object arrays (tabular format)
 * - Mixed arrays (list format)
 */

import { encode } from '@toon-format/toon'

console.log('=== Arrays Example ===\n')

// 1. Primitive array (inline format)
console.log('1️⃣ Primitive Array (inline format):')
const tags = {
  tags: ['javascript', 'node.js', 'toon', 'llm']
}

console.log('Input:', JSON.stringify(tags))
console.log('TOON:', encode(tags))
console.log()

// 2. Uniform object array (tabular format - TOON's strength!)
console.log('2️⃣ Uniform Object Array (tabular format):')
const users = {
  users: [
    { id: 1, name: 'Alice', role: 'admin', active: true },
    { id: 2, name: 'Bob', role: 'user', active: true },
    { id: 3, name: 'Charlie', role: 'user', active: false }
  ]
}

console.log('Input JSON:')
console.log(JSON.stringify(users, null, 2))
console.log('\nTOON (tabular format):')
const usersToon = encode(users)
console.log(usersToon)

// Show the token efficiency
const usersJson = JSON.stringify(users)
console.log(`\n📊 Token efficiency:`)
console.log(`JSON: ${usersJson.length} chars`)
console.log(`TOON: ${usersToon.length} chars`)
console.log(`Saved: ${((usersJson.length - usersToon.length) / usersJson.length * 100).toFixed(1)}%`)

// 3. Mixed array (list format)
console.log('\n3️⃣ Mixed Array (list format):')
const mixed = {
  items: [
    'simple string',
    42,
    { name: 'object', value: 123 },
    ['nested', 'array'],
    true
  ]
}

console.log('Input:', JSON.stringify(mixed, null, 2))
console.log('\nTOON (list format):')
console.log(encode(mixed))

// 4. Array of arrays
console.log('\n4️⃣ Array of Arrays:')
const coordinates = {
  points: [
    [10, 20],
    [30, 40],
    [50, 60]
  ]
}

console.log('Input:', JSON.stringify(coordinates))
console.log('TOON:', encode(coordinates))

// 5. Empty arrays
console.log('\n5️⃣ Empty Arrays:')
const empty = {
  emptyArray: [],
  users: []
}

console.log('Input:', JSON.stringify(empty))
console.log('TOON:', encode(empty))

console.log('\n✨ Key takeaway: TOON excels with uniform object arrays!')
console.log('The more uniform your data, the better the token savings.')