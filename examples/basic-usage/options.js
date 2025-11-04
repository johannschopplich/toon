#!/usr/bin/env node

/**
 * Options Example
 *
 * Demonstrates different encoding options:
 * - Delimiters (comma, tab, pipe)
 * - Indentation
 * - Length markers
 */

import { encode } from '@toon-format/toon'

console.log('=== TOON Options Example ===\n')

const sampleData = {
  products: [
    { sku: 'A001', name: 'Widget Pro', price: 29.99, inStock: true },
    { sku: 'B002', name: 'Gadget Max', price: 49.50, inStock: false },
    { sku: 'C003', name: 'Tool Kit', price: 89.99, inStock: true }
  ],
  metadata: {
    total: 3,
    updated: '2024-01-15T10:00:00Z'
  }
}

console.log('📄 Sample data:')
console.log(JSON.stringify(sampleData, null, 2))

// 1. Default options (comma delimiter, 2-space indent)
console.log('\n1️⃣ Default options:')
console.log(encode(sampleData))

// 2. Tab delimiter (often more token-efficient)
console.log('\n2️⃣ Tab delimiter:')
console.log(encode(sampleData, { delimiter: '\t' }))

// 3. Pipe delimiter
console.log('\n3️⃣ Pipe delimiter:')
console.log(encode(sampleData, { delimiter: '|' }))

// 4. Different indentation
console.log('\n4️⃣ 4-space indentation:')
console.log(encode(sampleData, { indent: 4 }))

// 5. Length markers
console.log('\n5️⃣ With length markers (#):')
console.log(encode(sampleData, { lengthMarker: '#' }))

// 6. Combined options
console.log('\n6️⃣ Tab delimiter + length markers:')
console.log(encode(sampleData, {
  delimiter: '\t',
  lengthMarker: '#'
}))

// 7. Compare token efficiency of different delimiters
console.log('\n📊 Delimiter comparison:')
const commaVersion = encode(sampleData)
const tabVersion = encode(sampleData, { delimiter: '\t' })
const pipeVersion = encode(sampleData, { delimiter: '|' })

console.log(`Comma:  ${commaVersion.length} chars`)
console.log(`Tab:    ${tabVersion.length} chars`)
console.log(`Pipe:   ${pipeVersion.length} chars`)

const shortest = Math.min(commaVersion.length, tabVersion.length, pipeVersion.length)
const bestDelimiter = shortest === commaVersion.length ? 'comma' :
                     shortest === tabVersion.length ? 'tab' : 'pipe'

console.log(`\n🏆 Most efficient: ${bestDelimiter} delimiter`)

console.log('\n💡 Tips:')
console.log('- Tab delimiters often save the most tokens')
console.log('- Length markers help LLMs track array sizes')
console.log('- Choose delimiter based on your data content')
console.log('- Avoid delimiters that appear in your string values')