#!/usr/bin/env node

/**
 * Simple Object Example
 *
 * This example shows basic TOON encoding and decoding with simple objects.
 */

import { encode, decode } from '@toon-format/toon'

console.log('=== Simple Object Example ===\n')

// 1. Basic object
const user = {
  id: 123,
  name: 'Alice Johnson',
  email: 'alice@example.com',
  active: true,
  age: 28
}

console.log('📄 Original JSON:')
console.log(JSON.stringify(user, null, 2))

console.log('\n🎯 TOON encoded:')
const toonData = encode(user)
console.log(toonData)

console.log('\n🔄 Decoded back to JavaScript:')
const decoded = decode(toonData)
console.log(decoded)

console.log('\n✅ Round-trip successful:', JSON.stringify(user) === JSON.stringify(decoded))

// 2. Nested object
console.log('\n=== Nested Object ===\n')

const profile = {
  user: {
    id: 456,
    name: 'Bob Smith',
    preferences: {
      theme: 'dark',
      notifications: true
    }
  },
  lastLogin: '2024-01-15T10:30:00Z'
}

console.log('📄 Original JSON:')
console.log(JSON.stringify(profile, null, 2))

console.log('\n🎯 TOON encoded:')
const nestedToon = encode(profile)
console.log(nestedToon)

// 3. Token comparison (approximate)
const jsonStr = JSON.stringify(profile, null, 2)
const jsonCompact = JSON.stringify(profile)

console.log('\n📊 Approximate sizes:')
console.log(`JSON (formatted): ${jsonStr.length} characters`)
console.log(`JSON (compact):   ${jsonCompact.length} characters`)
console.log(`TOON:             ${nestedToon.length} characters`)
console.log(`Space saved:      ${((jsonCompact.length - nestedToon.length) / jsonCompact.length * 100).toFixed(1)}%`)