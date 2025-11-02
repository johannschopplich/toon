import type { Fixtures } from './types'
import arraysNested from '@toon-format/spec/tests/fixtures/decode/arrays-nested.json'
import arraysPrimitive from '@toon-format/spec/tests/fixtures/decode/arrays-primitive.json'
import arraysTabular from '@toon-format/spec/tests/fixtures/decode/arrays-tabular.json'
import blankLines from '@toon-format/spec/tests/fixtures/decode/blank-lines.json'
import delimiters from '@toon-format/spec/tests/fixtures/decode/delimiters.json'
import indentationErrors from '@toon-format/spec/tests/fixtures/decode/indentation-errors.json'
import objects from '@toon-format/spec/tests/fixtures/decode/objects.json'
import primitives from '@toon-format/spec/tests/fixtures/decode/primitives.json'
import validationErrors from '@toon-format/spec/tests/fixtures/decode/validation-errors.json'
import { describe, expect, it } from 'vitest'
import { decode } from '../src/index'

const fixtureFiles = [
  primitives,
  objects,
  arraysPrimitive,
  arraysTabular,
  arraysNested,
  delimiters,
  validationErrors,
  indentationErrors,
  blankLines,
] as Fixtures[]

// Run all fixture-based tests
for (const fixtures of fixtureFiles) {
  describe(fixtures.description, () => {
    for (const test of fixtures.tests) {
      it(test.name, () => {
        if (test.shouldError) {
          expect(() => decode(test.input as string, test.options))
            .toThrow()
        }
        else {
          const result = decode(test.input as string, test.options)
          expect(result).toEqual(test.expected)
        }
      })
    }
  })
}

// Additional tests for quoted key + array syntax fix
describe('quoted keys with array syntax', () => {
  it('should parse quoted key followed by array header', () => {
    const input = `"x-codeSamples"[1]{lang,label,source}:
  Go,Go,"example code"`

    const result = decode(input)
    expect(result).toEqual({
      'x-codeSamples': [
        {
          lang: 'Go',
          label: 'Go',
          source: 'example code',
        },
      ],
    })
  })

  it('should parse quoted key with special characters and array syntax', () => {
    const input = `"my-key"[2]:
  - value1
  - value2`

    const result = decode(input)
    expect(result).toEqual({
      'my-key': ['value1', 'value2'],
    })
  })

  it('should handle empty arrays with quoted keys', () => {
    const input = `security[1]:
  - APIToken[0]:`

    const result = decode(input, { strict: false })
    expect(result).toEqual({
      security: [{ APIToken: [] }],
    })
  })
})
