import { encode } from '../dist/index.js'
import { performance } from 'node:perf_hooks'

// --- Utility: Generate deeply nested + wide dataset ---
function generateBigNestedData(breadth = 8, depth = 5): any {
  const makeNode = (lvl: number): any => {
    if (lvl >= depth) {
      return {
        id: Math.floor(Math.random() * 10000),
        name: `User_${lvl}_${Math.random().toString(36).slice(2, 7)}`,
        age: Math.floor(Math.random() * 60) + 18,
        active: Math.random() > 0.5,
        balance: parseFloat((Math.random() * 10000).toFixed(2)),
      }
    }
    const obj: Record<string, any> = {}
    for (let i = 0; i < breadth; i++) {
      obj[`level${lvl}_node${i}`] = makeNode(lvl + 1)
    }
    return obj
  }
  return { root: makeNode(0) }
}

// --- Generate large data ---
console.log('Generating large nested JSON...')
const data = generateBigNestedData(8, 5) // 8 branches × 5 levels deep
console.log('Data generated. Example keys at root:', Object.keys(data.root).length)

// --- Encode without flatten ---
console.log('\n--- Encoding WITHOUT flatten ---')
const t1 = performance.now()
const encodedRaw = encode(data, { indent: 2, delimiter: ',' })
const t2 = performance.now()
console.log('✅ Done. Time:', (t2 - t1).toFixed(2), 'ms')

// --- Encode with flatten ---
console.log('\n--- Encoding WITH flatten ---')
const t3 = performance.now()
const encodedFlat = encode(data, { indent: 2, delimiter: ',', flatten: true })
const t4 = performance.now()
console.log('✅ Done. Time:', (t4 - t3).toFixed(2), 'ms')



console.log('\n===== Results =====')
console.log('Raw size:      ', encodedRaw.length, 'chars')
console.log('Flattened size:', encodedFlat.length, 'chars')

console.log('Speed overhead:',
  (((t4 - t3) - (t2 - t1)) / (t2 - t1) * 100).toFixed(2), '%'
)

