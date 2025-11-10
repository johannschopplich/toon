import type { Fixtures } from './types'
import arraysNested from '@toon-format/spec/tests/fixtures/decode/arrays-nested.json'
import arraysPrimitive from '@toon-format/spec/tests/fixtures/decode/arrays-primitive.json'
import arraysTabular from '@toon-format/spec/tests/fixtures/decode/arrays-tabular.json'
import blankLines from '@toon-format/spec/tests/fixtures/decode/blank-lines.json'
import delimiters from '@toon-format/spec/tests/fixtures/decode/delimiters.json'
import indentationErrors from '@toon-format/spec/tests/fixtures/decode/indentation-errors.json'
import numbers from '@toon-format/spec/tests/fixtures/decode/numbers.json'
import objects from '@toon-format/spec/tests/fixtures/decode/objects.json'
import pathExpansion from '@toon-format/spec/tests/fixtures/decode/path-expansion.json'
import primitives from '@toon-format/spec/tests/fixtures/decode/primitives.json'
import rootForm from '@toon-format/spec/tests/fixtures/decode/root-form.json'
import validationErrors from '@toon-format/spec/tests/fixtures/decode/validation-errors.json'
import whitespace from '@toon-format/spec/tests/fixtures/decode/whitespace.json'
import { describe, expect, it } from 'vitest'
import { decode } from '../src/index'

const fixtureFiles = [
  primitives,
  numbers,
  objects,
  arraysPrimitive,
  arraysTabular,
  arraysNested,
  pathExpansion,
  delimiters,
  whitespace,
  rootForm,
  validationErrors,
  indentationErrors,
  blankLines,
] as Fixtures[]

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
