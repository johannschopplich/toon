#!/usr/bin/env node

/**
 * API Response Example
 *
 * Shows how to convert typical API responses to TOON format for LLM input.
 * This is one of TOON's strongest use cases - uniform arrays of objects.
 */

import { encode } from '@toon-format/toon'

// Simulate a typical REST API response
const apiResponse = {
  users: [
    {
      id: 1001,
      username: 'alice_johnson',
      email: 'alice@company.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      role: 'admin',
      department: 'Engineering',
      active: true,
      lastLogin: '2024-01-15T09:30:00Z',
      permissions: ['read', 'write', 'admin']
    },
    {
      id: 1002,
      username: 'bob_smith',
      email: 'bob@company.com',
      firstName: 'Bob',
      lastName: 'Smith',
      role: 'developer',
      department: 'Engineering',
      active: true,
      lastLogin: '2024-01-15T08:45:00Z',
      permissions: ['read', 'write']
    },
    {
      id: 1003,
      username: 'carol_white',
      email: 'carol@company.com',
      firstName: 'Carol',
      lastName: 'White',
      role: 'designer',
      department: 'Design',
      active: false,
      lastLogin: '2024-01-10T16:20:00Z',
      permissions: ['read']
    }
  ],
  pagination: {
    page: 1,
    limit: 50,
    total: 3,
    hasNext: false
  },
  meta: {
    requestId: 'req_123456789',
    timestamp: '2024-01-15T10:00:00Z',
    version: 'v1.2.3'
  }
}

console.log('=== API Response to TOON Example ===\\n')

console.log('📡 Original API Response (JSON):')
console.log(JSON.stringify(apiResponse, null, 2))

console.log('\\n🎯 TOON Format:')
const toonFormat = encode(apiResponse)
console.log(toonFormat)

// Show token efficiency
const jsonCompact = JSON.stringify(apiResponse)
const jsonFormatted = JSON.stringify(apiResponse, null, 2)

console.log('\\n📊 Token Efficiency Comparison:')
console.log(`JSON (formatted): ${jsonFormatted.length} characters`)
console.log(`JSON (compact):   ${jsonCompact.length} characters`)
console.log(`TOON:             ${toonFormat.length} characters`)

const savings = ((jsonCompact.length - toonFormat.length) / jsonCompact.length * 100).toFixed(1)
console.log(`\\n💰 Space saved: ${savings}% vs compact JSON`)

console.log('\\n✨ Why TOON works great here:')
console.log('• Users array has uniform structure (same fields)')
console.log('• Repeated field names in JSON become header once in TOON')
console.log('• Nested arrays (permissions) are handled efficiently')
console.log('• Mixed data types (strings, numbers, booleans) work seamlessly')

console.log('\\n🤖 LLM Benefits:')
console.log('• Clearer data structure with explicit field names')
console.log('• Array length is explicit: users[3]')
console.log('• Fewer tokens = lower API costs')
console.log('• Easier for models to parse tabular data')

// Example with different delimiters for even better efficiency
console.log('\\n⚡ With tab delimiter (often even more efficient):')
const tabDelimited = encode(apiResponse, { delimiter: '\\t' })
console.log('Length:', tabDelimited.length, 'characters')
console.log('Additional savings:', ((toonFormat.length - tabDelimited.length) / toonFormat.length * 100).toFixed(1) + '%')

console.log('\\n💡 Pro tip: Use TOON when sending user lists, product catalogs,')
console.log('   analytics data, or any uniform object arrays to LLMs!')