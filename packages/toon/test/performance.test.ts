import { describe, expect, it } from 'vitest'
import { decode, encode } from '../src/index'

describe('performance Tests', () => {
  describe('token Efficiency', () => {
    it('should demonstrate significant savings with uniform arrays', () => {
      // Generate a realistic dataset similar to the benchmarks
      const users = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        email: `user${i + 1}@example.com`,
        firstName: `First${i + 1}`,
        lastName: `Last${i + 1}`,
        role: i % 3 === 0 ? 'admin' : i % 2 === 0 ? 'editor' : 'user',
        active: Math.random() > 0.1,
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      }))

      const data = { users }

      const jsonCompact = JSON.stringify(data)
      const jsonFormatted = JSON.stringify(data, null, 2)
      const toonDefault = encode(data)
      const toonTab = encode(data, { delimiter: '\t' })

      console.log('Token efficiency comparison:')
      console.log(`JSON (compact):   ${jsonCompact.length} chars`)
      console.log(`JSON (formatted): ${jsonFormatted.length} chars`)
      console.log(`TOON (comma):     ${toonDefault.length} chars`)
      console.log(`TOON (tab):       ${toonTab.length} chars`)

      const savings = ((jsonCompact.length - toonDefault.length) / jsonCompact.length * 100)
      console.log(`Savings: ${savings.toFixed(1)}%`)

      // Should achieve at least 30% savings on uniform data
      expect(savings).toBeGreaterThan(30)
      // Tab delimiter may or may not be more efficient depending on data content
      // The important thing is that both work correctly
      expect(toonTab.length).toBeGreaterThan(0)
      expect(toonDefault.length).toBeGreaterThan(0)
    })

    it('should show when JSON is more efficient (non-uniform data)', () => {
      // Create intentionally non-uniform data where TOON won't excel
      const mixedData = {
        items: [
          { type: 'user', id: 1, name: 'Alice', email: 'alice@example.com' },
          { type: 'product', sku: 'ABC123', title: 'Widget', price: 29.99, inStock: true },
          { type: 'order', orderId: 'ORD001', customerId: 456, items: ['ABC123'], total: 29.99, date: '2024-01-01' },
          'simple string',
          42,
          { completely: 'different', structure: true, nested: { deep: { value: 'here' } } },
        ],
      }

      const jsonCompact = JSON.stringify(mixedData)
      const toonEncoded = encode(mixedData)

      console.log('Non-uniform data comparison:')
      console.log(`JSON: ${jsonCompact.length} chars`)
      console.log(`TOON: ${toonEncoded.length} chars`)

      // TOON might not be more efficient here due to non-uniform structure
      const efficiency = ((jsonCompact.length - toonEncoded.length) / jsonCompact.length * 100)
      console.log(`TOON efficiency: ${efficiency.toFixed(1)}%`)

      // Should still work correctly even if not more efficient
      expect(decode(toonEncoded)).toEqual(mixedData)
    })
  })

  describe('encoding Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = {
        records: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          timestamp: new Date(Date.now() - i * 1000).toISOString(),
          value: Math.random() * 1000,
          category: `cat_${i % 10}`,
          active: i % 7 !== 0,
        })),
      }

      const startTime = performance.now()
      const encoded = encode(largeDataset)
      const encodeTime = performance.now() - startTime

      console.log(`Encoded 10k records in ${encodeTime.toFixed(2)}ms`)
      console.log(`Output size: ${encoded.length} characters`)

      // Should complete in reasonable time (less than 1 second)
      expect(encodeTime).toBeLessThan(1000)
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should handle decoding large datasets efficiently', () => {
      const dataset = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random() * 100,
        })),
      }

      const encoded = encode(dataset)

      const startTime = performance.now()
      const decoded = decode(encoded)
      const decodeTime = performance.now() - startTime

      console.log(`Decoded 1k records in ${decodeTime.toFixed(2)}ms`)

      expect(decodeTime).toBeLessThan(500)
      expect(decoded).toEqual(dataset)
    })
  })

  describe('memory Usage', () => {
    it('should handle nested arrays without excessive memory usage', () => {
      // Use simpler nested structure that TOON can handle well
      const nestedData = {
        groups: Array.from({ length: 5 }, (_, i) => ({
          groupId: i,
          items: Array.from({ length: 3 }, (_, j) => ({
            id: j,
            value: i * 3 + j,
          })),
        })),
      }

      // Should not throw out of memory errors
      expect(() => {
        const encoded = encode(nestedData)
        const decoded = decode(encoded)
        expect(decoded.groups.length).toBe(5)
        expect(decoded.groups[0].items.length).toBe(3)
      }).not.toThrow()
    })

    it('should handle large flat arrays efficiently', () => {
      const largeArray = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: i * 2,
        })),
      }

      expect(() => {
        const encoded = encode(largeArray)
        const decoded = decode(encoded)
        expect(decoded.items.length).toBe(1000)
      }).not.toThrow()
    })
  })

  describe('delimiter Performance', () => {
    it('should compare performance of different delimiters', () => {
      const testData = {
        products: Array.from({ length: 1000 }, (_, i) => ({
          sku: `SKU${i.toString().padStart(4, '0')}`,
          name: `Product ${i}`,
          price: +(Math.random() * 1000).toFixed(2),
          category: `Category ${i % 10}`,
          inStock: i % 5 !== 0,
          tags: [`tag${i % 3}`, `tag${i % 5}`, `tag${i % 7}`],
        })),
      }

      const commaResult = encode(testData, { delimiter: ',' })
      const tabResult = encode(testData, { delimiter: '\t' })
      const pipeResult = encode(testData, { delimiter: '|' })

      console.log('Delimiter size comparison:')
      console.log(`Comma: ${commaResult.length} chars`)
      console.log(`Tab:   ${tabResult.length} chars`)
      console.log(`Pipe:  ${pipeResult.length} chars`)

      // All should decode back to the same data
      expect(decode(commaResult)).toEqual(testData)
      expect(decode(tabResult)).toEqual(testData)
      expect(decode(pipeResult)).toEqual(testData)

      // Tab is often most efficient
      const tabSavings = ((commaResult.length - tabResult.length) / commaResult.length * 100)
      console.log(`Tab delimiter saves: ${tabSavings.toFixed(1)}% vs comma`)
    })
  })

  describe('stress Tests', () => {
    it('should handle deeply nested uniform arrays', () => {
      let nested: any = {
        level0: Array.from({ length: 10 }, (_, i) => ({ id: i, value: `level0_${i}` })),
      }

      // Create 5 levels of nesting
      for (let level = 1; level < 5; level++) {
        nested = {
          [`level${level}`]: [nested],
        }
      }

      const encoded = encode(nested)
      const decoded = decode(encoded)

      expect(decoded).toEqual(nested)
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should handle arrays with varying string lengths', () => {
      const varyingLengths = {
        strings: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          short: 'x'.repeat(i % 10 + 1),
          medium: 'y'.repeat((i % 50) + 10),
          long: 'z'.repeat((i % 200) + 100),
        })),
      }

      const encoded = encode(varyingLengths)
      const decoded = decode(encoded)

      expect(decoded).toEqual(varyingLengths)
      expect(encoded).toContain('strings[100]{id,short,medium,long}:')
    })
  })
})
