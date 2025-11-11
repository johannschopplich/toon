import { describe, expect, it } from 'vitest'
import { validateJson, validateToon } from '../src/validation'
import type { Schema } from '../src/types'

describe('Schema Validation', () => {
  describe('validateJson', () => {
    it('should validate a valid object', () => {
      const schema: Schema = {
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 }
        }
      }

      const data = { name: 'Alice', age: 30 }
      const result = validateJson(data, schema)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const schema: Schema = {
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      }

      const data = { name: 'Alice' }
      const result = validateJson(data, schema)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        path: '',
        message: 'Missing required field: age'
      })
    })

    it('should validate nested objects', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              age: { type: 'number' }
            }
          }
        }
      }

      const data = { user: { name: 'Alice', age: 30 } }
      const result = validateJson(data, schema)

      expect(result.valid).toBe(true)
    })

    it('should validate arrays', () => {
      const schema: Schema = {
        type: 'array',
        items: { type: 'number' }
      }

      const data = [1, 2, 3]
      const result = validateJson(data, schema)

      expect(result.valid).toBe(true)
    })

    it('should validate string constraints', () => {
      const schema: Schema = {
        type: 'string',
        minLength: 2,
        maxLength: 10,
        pattern: '^[A-Z]'
      }

      expect(validateJson('Hello', schema).valid).toBe(true)
      expect(validateJson('H', schema).valid).toBe(false) // too short
      expect(validateJson('hello', schema).valid).toBe(false) // doesn't match pattern
    })

    it('should validate number constraints', () => {
      const schema: Schema = {
        type: 'number',
        minimum: 0,
        maximum: 100
      }

      expect(validateJson(50, schema).valid).toBe(true)
      expect(validateJson(-5, schema).valid).toBe(false)
      expect(validateJson(150, schema).valid).toBe(false)
    })

    it('should validate enum values', () => {
      const schema: Schema = {
        type: 'string',
        enum: ['red', 'green', 'blue']
      }

      expect(validateJson('red', schema).valid).toBe(true)
      expect(validateJson('yellow', schema).valid).toBe(false)
    })

    it('should detect type mismatches', () => {
      const schema: Schema = {
        type: 'number'
      }

      const result = validateJson('not a number', schema)

      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain("Expected type 'number'")
    })
  })

  describe('validateToon', () => {
    it('should validate TOON data against schema', () => {
      const schema: Schema = {
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      }

      const toonData = 'name: Alice\nage: 30\n'
      const result = validateToon(toonData, schema)

      expect(result.valid).toBe(true)
    })

    it('should detect validation errors in TOON data', () => {
      const schema: Schema = {
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 18 }
        }
      }

      const toonData = 'name: Alice\nage: 16\n'
      const result = validateToon(toonData, schema)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.message.includes('minimum'))).toBe(true)
    })

    it('should handle schema validation for TOON data', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          count: { type: 'number', minimum: 0 }
        }
      }

      const toonData = 'count: 5\n'
      const result = validateToon(toonData, schema)

      expect(result.valid).toBe(true)
    })
  })

  describe('complex validation scenarios', () => {
    it('should validate complex nested structures', () => {
      const schema: Schema = {
        type: 'object',
        required: ['users'],
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'number' },
                name: { type: 'string', minLength: 1 },
                email: { type: 'string', pattern: '.+@.+' }
              }
            }
          },
          metadata: {
            type: 'object',
            properties: {
              version: { type: 'string' },
              count: { type: 'number', minimum: 0 }
            }
          }
        }
      }

      const data = {
        users: [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' }
        ],
        metadata: {
          version: '1.0',
          count: 2
        }
      }

      const result = validateJson(data, schema)
      expect(result.valid).toBe(true)
    })

    it('should provide detailed error paths', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              profile: {
                type: 'object',
                properties: {
                  age: { type: 'number', minimum: 0 }
                }
              }
            }
          }
        }
      }

      const data = {
        user: {
          profile: {
            age: -5
          }
        }
      }

      const result = validateJson(data, schema)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]!.path).toBe('user.profile.age')
    })
  })
})
