import { describe, expect, it } from 'vitest'
import { Readable } from 'node:stream'
import { decodeStream, encodeStream } from '../src/stream'
import type { JsonValue } from '../src/types'

describe('Streaming API', () => {
  describe('encodeStream', () => {
    it('should encode a stream of JSON values to TOON format', async () => {
      const inputData: JsonValue[] = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        'hello world',
        [1, 2, 3]
      ]

      const inputStream = Readable.from(inputData)
      const encodeTransform = encodeStream()

      const chunks: string[] = []

      await new Promise<void>((resolve, reject) => {
        inputStream
          .pipe(encodeTransform)
          .on('data', (chunk: Buffer) => {
            chunks.push(chunk.toString())
          })
          .on('end', resolve)
          .on('error', reject)
      })

      const result = chunks.join('')
      expect(result).toContain('name: Alice')
      expect(result).toContain('age: 30')
      expect(result).toContain('name: Bob')
      expect(result).toContain('age: 25')
      expect(result).toContain('hello world')
      expect(result).toContain('- 1')
      expect(result).toContain('- 2')
      expect(result).toContain('- 3')
    })

    it('should handle encoding options', async () => {
      const inputData: JsonValue[] = [
        { data: { nested: { value: 42 } } }
      ]

      const inputStream = Readable.from(inputData)
      const encodeTransform = encodeStream({ keyFolding: 'safe', indent: 4 })

      const chunks: string[] = []

      await new Promise<void>((resolve, reject) => {
        inputStream
          .pipe(encodeTransform)
          .on('data', (chunk: Buffer) => {
            chunks.push(chunk.toString())
          })
          .on('end', resolve)
          .on('error', reject)
      })

      const result = chunks.join('')
      expect(result).toContain('data.nested.value: 42')
    })
  })

  describe('decodeStream', () => {
    it('should decode a stream of TOON strings to JSON values', async () => {
      const toonData = `name: Alice
age: 30
---
name: Bob
age: 25
---
hello world
---
- 1
- 2
- 3
`

      const inputStream = Readable.from([toonData])
      const decodeTransform = decodeStream()

      const results: JsonValue[] = []

      await new Promise<void>((resolve, reject) => {
        inputStream
          .pipe(decodeTransform)
          .on('data', (obj: JsonValue) => {
            results.push(obj)
          })
          .on('end', resolve)
          .on('error', reject)
      })

      expect(results).toHaveLength(4)
      expect(results[0]).toEqual({ name: 'Alice', age: 30 })
      expect(results[1]).toEqual({ name: 'Bob', age: 25 })
      expect(results[2]).toBe('hello world')
      expect(results[3]).toEqual([1, 2, 3])
    })

    it('should handle decoding options', async () => {
      const toonData = `data.nested.value: 42
`

      const inputStream = Readable.from([toonData])
      const decodeTransform = decodeStream({ expandPaths: 'safe' })

      const results: JsonValue[] = []

      await new Promise<void>((resolve, reject) => {
        inputStream
          .pipe(decodeTransform)
          .on('data', (obj: JsonValue) => {
            results.push(obj)
          })
          .on('end', resolve)
          .on('error', reject)
      })

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({ data: { nested: { value: 42 } } })
    })
  })

  describe('round-trip streaming', () => {
    it('should maintain data integrity through encode/decode stream cycle', async () => {
      const originalData: JsonValue[] = [
        { user: { name: 'Alice', age: 30, hobbies: ['reading', 'coding'] } },
        { products: [{ id: 1, name: 'Widget', price: 19.99 }, { id: 2, name: 'Gadget', price: 29.99 }] },
        'Simple string',
        42,
        true
      ]

      // Encode stream
      const inputStream = Readable.from(originalData)
      const encodeTransform = encodeStream({ keyFolding: 'safe' })

      let encodedData = ''
      await new Promise<void>((resolve, reject) => {
        inputStream
          .pipe(encodeTransform)
          .on('data', (chunk: Buffer) => {
            encodedData += chunk.toString()
          })
          .on('end', resolve)
          .on('error', reject)
      })

      // Decode stream
      const decodeInputStream = Readable.from([encodedData])
      const decodeTransform = decodeStream({ expandPaths: 'safe' })

      const decodedResults: JsonValue[] = []
      await new Promise<void>((resolve, reject) => {
        decodeInputStream
          .pipe(decodeTransform)
          .on('data', (obj: JsonValue) => {
            decodedResults.push(obj)
          })
          .on('end', resolve)
          .on('error', reject)
      })

      expect(decodedResults).toEqual(originalData)
    })
  })
})
