/* eslint-disable test/prefer-lowercase-title */
import { describe, expect, it } from 'vitest'
import { decode, encode } from '../src/index'

describe('JavaScript-specific type normalization', () => {
  describe('BigInt normalization', () => {
    it('converts BigInt within safe integer range to number', () => {
      const result = encode(BigInt(123))
      expect(result).toBe('123')
    })

    it('converts BigInt at MAX_SAFE_INTEGER boundary to number', () => {
      const result = encode(BigInt(Number.MAX_SAFE_INTEGER))
      expect(result).toBe('9007199254740991')
    })

    it('converts BigInt beyond safe integer range to quoted string', () => {
      const result = encode(BigInt('9007199254740992'))
      expect(result).toBe('"9007199254740992"')
    })

    it('converts large BigInt to quoted decimal string', () => {
      const result = encode(BigInt('12345678901234567890'))
      expect(result).toBe('"12345678901234567890"')
    })
  })

  describe('Date normalization', () => {
    it('converts Date to ISO 8601 quoted string', () => {
      const result = encode(new Date('2025-01-01T00:00:00.000Z'))
      expect(result).toBe('"2025-01-01T00:00:00.000Z"')
    })

    it('converts Date with milliseconds to ISO quoted string', () => {
      const result = encode(new Date('2025-11-05T12:34:56.789Z'))
      expect(result).toBe('"2025-11-05T12:34:56.789Z"')
    })
  })

  describe('Set normalization', () => {
    it('converts Set to array', () => {
      const input = new Set(['a', 'b', 'c'])
      const encoded = encode(input)
      const decoded = decode(encoded)
      expect(decoded).toEqual(['a', 'b', 'c'])
    })

    it('converts empty Set to empty array', () => {
      const result = encode(new Set())
      expect(result).toBe('[0]:')
    })
  })

  describe('Map normalization', () => {
    it('converts Map to object', () => {
      const input = new Map([['key1', 'value1'], ['key2', 'value2']])
      const encoded = encode(input)
      const decoded = decode(encoded)
      expect(decoded).toEqual({ key1: 'value1', key2: 'value2' })
    })

    it('converts empty Map to empty object', () => {
      const input = new Map()
      const result = encode(input)
      expect(result).toBe('')
    })

    it('converts Map with numeric keys to object with quoted string keys', () => {
      const input = new Map([[1, 'one'], [2, 'two']])
      const result = encode(input)
      expect(result).toBe('"1": one\n"2": two')
    })
  })

  describe('undefined, function, and Symbol normalization', () => {
    it('converts undefined to null', () => {
      const result = encode(undefined)
      expect(result).toBe('null')
    })

    it('converts function to null', () => {
      const result = encode(() => {})
      expect(result).toBe('null')
    })

    it('converts Symbol to null', () => {
      const result = encode(Symbol('test'))
      expect(result).toBe('null')
    })
  })

  describe('NaN and Infinity normalization', () => {
    it('converts NaN to null', () => {
      const result = encode(Number.NaN)
      expect(result).toBe('null')
    })

    it('converts Infinity to null', () => {
      const result = encode(Number.POSITIVE_INFINITY)
      expect(result).toBe('null')
    })

    it('converts negative Infinity to null', () => {
      const result = encode(Number.NEGATIVE_INFINITY)
      expect(result).toBe('null')
    })
  })

  describe('negative zero normalization', () => {
    it('normalizes -0 to 0', () => {
      const result = encode(-0)
      expect(result).toBe('0')
    })
  })
})
