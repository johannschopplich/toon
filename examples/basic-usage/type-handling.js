#!/usr/bin/env node

/**
 * Type Handling Example
 *
 * Shows how TOON handles different JavaScript types and edge cases.
 */

import { encode, decode } from '@toon-format/toon'

console.log('=== Type Handling Example ===\n')

// 1. Basic types
console.log('1️⃣ Basic Types:')
const basicTypes = {
  string: 'hello world',
  number: 42,
  boolean: true,
  nullValue: null
}

console.log('Input:', JSON.stringify(basicTypes))
console.log('TOON:', encode(basicTypes))
console.log()

// 2. Special numbers
console.log('2️⃣ Special Numbers:')
const specialNumbers = {
  zero: 0,
  negative: -42,
  decimal: 3.14159,
  scientific: 1e6,
  infinity: Infinity,      // becomes null
  negInfinity: -Infinity,  // becomes null
  notANumber: NaN          // becomes null
}

console.log('Input:', JSON.stringify(specialNumbers))
console.log('TOON:', encode(specialNumbers))
console.log('Note: Infinity and NaN become null for LLM safety')
console.log()

// 3. Strings requiring quotes
console.log('3️⃣ String Quoting Rules:')
const stringTypes = {
  simple: 'hello',
  withSpaces: 'hello world',
  leadingSpace: ' padded',
  trailingSpace: 'padded ',
  withComma: 'hello, world',
  withColon: 'key: value',
  looksLikeNumber: '42',
  looksLikeBoolean: 'true',
  empty: '',
  unicode: 'Hello 👋 世界',
  withQuotes: 'say "hello"'
}

console.log('TOON output:')
console.log(encode(stringTypes))
console.log('\n💡 Quoting rules:')
console.log('- Simple strings: no quotes needed')
console.log('- Leading/trailing spaces: quoted')
console.log('- Contains delimiter/colon: quoted')
console.log('- Looks like number/boolean: quoted')
console.log('- Unicode/emoji: safe unquoted')
console.log()

// 4. Dates and special objects
console.log('4️⃣ Dates and Special Objects:')
const dateExample = {
  created: new Date('2024-01-15T10:30:00Z'),
  modified: new Date(),
  bigNumber: BigInt(9007199254740991),
  tooBigNumber: BigInt('9007199254740992'),
  undefinedValue: undefined,  // becomes null
  functionValue: () => 'test' // becomes null
}

console.log('TOON output:')
console.log(encode(dateExample))
console.log('\n💡 Type conversions:')
console.log('- Date → ISO string (quoted)')
console.log('- BigInt → number (if safe) or quoted string')
console.log('- undefined/function → null')
console.log()

// 5. Round-trip fidelity test
console.log('5️⃣ Round-trip Test:')
const testData = {
  id: 123,
  name: 'Test User',
  score: 98.5,
  active: true,
  tags: ['admin', 'verified'],
  metadata: null
}

const encoded = encode(testData)
const decoded = decode(encoded)
const isIdentical = JSON.stringify(testData) === JSON.stringify(decoded)

console.log('Original:', JSON.stringify(testData))
console.log('Encoded:', encoded)
console.log('Decoded:', JSON.stringify(decoded))
console.log('✅ Round-trip successful:', isIdentical)

console.log('\n🎯 Key Points:')
console.log('- TOON preserves all JSON-compatible types')
console.log('- Non-JSON types are safely converted')
console.log('- Quoting is minimal but unambiguous')
console.log('- Perfect round-trip fidelity for valid data')