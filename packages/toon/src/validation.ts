import type { JsonValue, Schema, ValidationError, ValidationResult } from './types'
import { decode } from './index.js'

/**
 * Validates JSON data against a schema.
 *
 * @param data - The JSON data to validate
 * @param schema - The schema to validate against
 * @returns Validation result with any errors found
 *
 * @example
 * ```ts
 * const schema = {
 *   type: 'object',
 *   required: ['name', 'age'],
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number', minimum: 0 }
 *   }
 * }
 *
 * const result = validateJson({ name: 'Alice', age: 30 }, schema)
 * if (!result.valid) {
 *   console.log('Validation errors:', result.errors)
 * }
 * ```
 */
export function validateJson(data: any, schema: Schema): ValidationResult {
  const errors: ValidationError[] = []
  validateValue(data, schema, '', errors)
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validates TOON string data against a schema by first decoding it.
 *
 * @param toonString - The TOON formatted string to validate
 * @param schema - The schema to validate against
 * @returns Validation result with any errors found
 *
 * @example
 * ```ts
 * const schema = {
 *   type: 'object',
 *   required: ['name', 'age'],
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number', minimum: 0 }
 *   }
 * }
 *
 * const toonData = 'name: Alice\nage: 30\n'
 * const result = validateToon(toonData, schema)
 * if (!result.valid) {
 *   console.log('Validation errors:', result.errors)
 * }
 * ```
 */
export function validateToon(toonString: string, schema: Schema): ValidationResult {
  try {
    const data = decode(toonString)
    return validateJson(data, schema)
  } catch (error) {
    return {
      valid: false,
      errors: [{
        path: '',
        message: `Failed to decode TOON: ${error instanceof Error ? error.message : String(error)}`
      }]
    }
  }
}

function validateValue(value: any, schema: Schema, path: string, errors: ValidationError[]): void {
  // Check type
  if (!validateType(value, schema.type)) {
    errors.push({
      path,
      message: `Expected type '${schema.type}', but got '${getType(value)}'`
    })
    return // Don't continue validating if type is wrong
  }

  // Check enum values
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({
      path,
      message: `Value must be one of: ${schema.enum.join(', ')}`
    })
  }

  // Type-specific validations
  switch (schema.type) {
    case 'string':
      validateString(value, schema, path, errors)
      break
    case 'number':
      validateNumber(value, schema, path, errors)
      break
    case 'object':
      validateObject(value, schema, path, errors)
      break
    case 'array':
      validateArray(value, schema, path, errors)
      break
  }
}

function validateType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'null':
      return value === null
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value)
    case 'array':
      return Array.isArray(value)
    default:
      return false
  }
}

function getType(value: any): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function validateString(value: string, schema: Schema, path: string, errors: ValidationError[]): void {
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push({
      path,
      message: `String length ${value.length} is less than minimum ${schema.minLength}`
    })
  }

  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push({
      path,
      message: `String length ${value.length} is greater than maximum ${schema.maxLength}`
    })
  }

  if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
    errors.push({
      path,
      message: `String does not match pattern: ${schema.pattern}`
    })
  }
}

function validateNumber(value: number, schema: Schema, path: string, errors: ValidationError[]): void {
  if (schema.minimum !== undefined && value < schema.minimum) {
    errors.push({
      path,
      message: `Number ${value} is less than minimum ${schema.minimum}`
    })
  }

  if (schema.maximum !== undefined && value > schema.maximum) {
    errors.push({
      path,
      message: `Number ${value} is greater than maximum ${schema.maximum}`
    })
  }
}

function validateObject(value: Record<string, any>, schema: Schema, path: string, errors: ValidationError[]): void {
  // Check required fields
  if (schema.required) {
    for (const requiredField of schema.required) {
      if (!(requiredField in value)) {
        errors.push({
          path,
          message: `Missing required field: ${requiredField}`
        })
      }
    }
  }

  // Validate properties
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const propPath = path ? `${path}.${propName}` : propName
      if (propName in value) {
        validateValue(value[propName], propSchema, propPath, errors)
      }
    }
  }
}

function validateArray(value: any[], schema: Schema, path: string, errors: ValidationError[]): void {
  // Validate each item
  if (schema.items) {
    for (let i = 0; i < value.length; i++) {
      const itemPath = `${path}[${i}]`
      validateValue(value[i], schema.items, itemPath, errors)
    }
  }
}
