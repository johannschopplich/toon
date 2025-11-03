import type { ResolvedEncodeOptions } from '../src/types'
import type { Fixtures, TestCase } from './types'
import arraysNested from '@toon-format/spec/tests/fixtures/encode/arrays-nested.json'
import arraysObjects from '@toon-format/spec/tests/fixtures/encode/arrays-objects.json'
import arraysPrimitive from '@toon-format/spec/tests/fixtures/encode/arrays-primitive.json'
import arraysTabular from '@toon-format/spec/tests/fixtures/encode/arrays-tabular.json'
import delimiters from '@toon-format/spec/tests/fixtures/encode/delimiters.json'
import normalization from '@toon-format/spec/tests/fixtures/encode/normalization.json'
import objects from '@toon-format/spec/tests/fixtures/encode/objects.json'
import options from '@toon-format/spec/tests/fixtures/encode/options.json'
import primitives from '@toon-format/spec/tests/fixtures/encode/primitives.json'
import whitespace from '@toon-format/spec/tests/fixtures/encode/whitespace.json'
import { describe, expect, it } from 'vitest'
import { decode, DEFAULT_DELIMITER, encode } from '../src/index'

const fixtureFiles = [
  primitives,
  objects,
  arraysPrimitive,
  arraysTabular,
  arraysNested,
  arraysObjects,
  delimiters,
  normalization,
  whitespace,
  options,
] as Fixtures[]

// Special test for round-trip fidelity (not in JSON fixtures)
describe('round-trip fidelity', () => {
  it('preserves precision for repeating decimals', () => {
    const value = 1 / 3
    const encodedValue = encode({ value })
    const decodedValue = decode(encodedValue)
    expect((decodedValue as Record<string, unknown>)?.value).toBe(value) // Round-trip fidelity
    expect(encodedValue).toContain('0.3333333333333333') // Default JS precision
  })
})

for (const fixtures of fixtureFiles) {
  describe(fixtures.description, () => {
    for (const test of fixtures.tests) {
      it(test.name, () => {
        const resolvedOptions = resolveEncodeOptions(test.options)

        if (test.shouldError) {
          expect(() => encode(test.input, resolvedOptions))
            .toThrow()
        }
        else {
          const result = encode(test.input, resolvedOptions)
          expect(result).toBe(test.expected)
        }
      })
    }
  })
}

function resolveEncodeOptions(options?: TestCase['options']): ResolvedEncodeOptions {
  return {
    indent: options?.indent ?? 2,
    delimiter: options?.delimiter ?? DEFAULT_DELIMITER,
    lengthMarker: options?.lengthMarker === '#' ? '#' : false,
  }
}
