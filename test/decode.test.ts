import { describe, expect, it } from 'vitest'
import { decode } from '../src/index'

describe('primitives', () => {
  it('decodes safe unquoted strings', () => {
    expect(decode('hello')).toBe('hello')
    expect(decode('Ada_99')).toBe('Ada_99')
  })

  it('decodes quoted strings and unescapes control characters', () => {
    expect(decode('""')).toBe('')
    expect(decode('"line1\\nline2"')).toBe('line1\nline2')
    expect(decode('"tab\\there"')).toBe('tab\there')
    expect(decode('"return\\rcarriage"')).toBe('return\rcarriage')
    expect(decode('"C:\\\\Users\\\\path"')).toBe('C:\\Users\\path')
    expect(decode('"say \\"hello\\""')).toBe('say "hello"')
  })

  it('decodes unicode and emoji', () => {
    expect(decode('café')).toBe('café')
    expect(decode('你好')).toBe('你好')
    expect(decode('🚀')).toBe('🚀')
    expect(decode('hello 👋 world')).toBe('hello 👋 world')
  })

  it('decodes numbers, booleans and null', () => {
    expect(decode('42')).toBe(42)
    expect(decode('3.14')).toBe(3.14)
    expect(decode('-7')).toBe(-7)
    expect(decode('true')).toBe(true)
    expect(decode('false')).toBe(false)
    expect(decode('null')).toBe(null)
  })

  it('treats unquoted invalid numeric formats as strings', () => {
    expect(decode('05')).toBe('05')
    expect(decode('007')).toBe('007')
    expect(decode('0123')).toBe('0123')
    expect(decode('a: 05')).toEqual({ a: '05' })
    expect(decode('nums[3]: 05,007,0123')).toEqual({ nums: ['05', '007', '0123'] })
  })

  it('respects ambiguity quoting (quoted primitives remain strings)', () => {
    expect(decode('"true"')).toBe('true')
    expect(decode('"false"')).toBe('false')
    expect(decode('"null"')).toBe('null')
    expect(decode('"42"')).toBe('42')
    expect(decode('"-3.14"')).toBe('-3.14')
    expect(decode('"1e-6"')).toBe('1e-6')
    expect(decode('"05"')).toBe('05')
  })
})

describe('objects (simple)', () => {
  it('parses objects with primitive values', () => {
    const toon = 'id: 123\nname: Ada\nactive: true'
    expect(decode(toon)).toEqual({ id: 123, name: 'Ada', active: true })
  })

  it('parses null values in objects', () => {
    const toon = 'id: 123\nvalue: null'
    expect(decode(toon)).toEqual({ id: 123, value: null })
  })

  it('parses empty nested object header', () => {
    expect(decode('user:')).toEqual({ user: {} })
  })

  it('parses quoted object values with special characters and escapes', () => {
    expect(decode('note: "a:b"')).toEqual({ note: 'a:b' })
    expect(decode('note: "a,b"')).toEqual({ note: 'a,b' })
    expect(decode('text: "line1\\nline2"')).toEqual({ text: 'line1\nline2' })
    expect(decode('text: "say \\"hello\\""')).toEqual({ text: 'say "hello"' })
    expect(decode('text: " padded "')).toEqual({ text: ' padded ' })
    expect(decode('text: "  "')).toEqual({ text: '  ' })
    expect(decode('v: "true"')).toEqual({ v: 'true' })
    expect(decode('v: "42"')).toEqual({ v: '42' })
    expect(decode('v: "-7.5"')).toEqual({ v: '-7.5' })
  })
})

describe('objects (keys)', () => {
  it('parses quoted keys with special characters and escapes', () => {
    expect(decode('"order:id": 7')).toEqual({ 'order:id': 7 })
    expect(decode('"[index]": 5')).toEqual({ '[index]': 5 })
    expect(decode('"{key}": 5')).toEqual({ '{key}': 5 })
    expect(decode('"a,b": 1')).toEqual({ 'a,b': 1 })
    expect(decode('"full name": Ada')).toEqual({ 'full name': 'Ada' })
    expect(decode('"-lead": 1')).toEqual({ '-lead': 1 })
    expect(decode('" a ": 1')).toEqual({ ' a ': 1 })
    expect(decode('"123": x')).toEqual({ 123: 'x' })
    expect(decode('"": 1')).toEqual({ '': 1 })
  })

  it('parses dotted keys as identifiers', () => {
    expect(decode('user.name: Ada')).toEqual({ 'user.name': 'Ada' })
    expect(decode('_private: 1')).toEqual({ _private: 1 })
    expect(decode('user_name: 1')).toEqual({ user_name: 1 })
  })

  it('unescapes control characters and quotes in keys', () => {
    expect(decode('"line\\nbreak": 1')).toEqual({ 'line\nbreak': 1 })
    expect(decode('"tab\\there": 2')).toEqual({ 'tab\there': 2 })
    expect(decode('"he said \\"hi\\"": 1')).toEqual({ 'he said "hi"': 1 })
  })
})

describe('nested objects', () => {
  it('parses deeply nested objects with indentation', () => {
    const toon = 'a:\n  b:\n    c: deep'
    expect(decode(toon)).toEqual({ a: { b: { c: 'deep' } } })
  })
})

describe('arrays of primitives', () => {
  it('parses string arrays inline', () => {
    const toon = 'tags[3]: reading,gaming,coding'
    expect(decode(toon)).toEqual({ tags: ['reading', 'gaming', 'coding'] })
  })

  it('parses number arrays inline', () => {
    const toon = 'nums[3]: 1,2,3'
    expect(decode(toon)).toEqual({ nums: [1, 2, 3] })
  })

  it('parses mixed primitive arrays inline', () => {
    const toon = 'data[4]: x,y,true,10'
    expect(decode(toon)).toEqual({ data: ['x', 'y', true, 10] })
  })

  it('parses empty arrays', () => {
    expect(decode('items[0]:')).toEqual({ items: [] })
  })

  it('parses quoted strings in arrays including empty and whitespace-only', () => {
    expect(decode('items[1]: ""')).toEqual({ items: [''] })
    expect(decode('items[3]: a,"",b')).toEqual({ items: ['a', '', 'b'] })
    expect(decode('items[2]: " ","  "')).toEqual({ items: [' ', '  '] })
  })

  it('parses strings with delimiters and structural tokens in arrays', () => {
    expect(decode('items[3]: a,"b,c","d:e"')).toEqual({ items: ['a', 'b,c', 'd:e'] })
    expect(decode('items[4]: x,"true","42","-3.14"')).toEqual({ items: ['x', 'true', '42', '-3.14'] })
    expect(decode('items[3]: "[5]","- item","{key}"')).toEqual({ items: ['[5]', '- item', '{key}'] })
  })
})

describe('arrays of objects (tabular and list items)', () => {
  it('parses tabular arrays of uniform objects', () => {
    const toon = 'items[2]{sku,qty,price}:\n  A1,2,9.99\n  B2,1,14.5'
    expect(decode(toon)).toEqual({
      items: [
        { sku: 'A1', qty: 2, price: 9.99 },
        { sku: 'B2', qty: 1, price: 14.5 },
      ],
    })
  })

  it('parses nulls and quoted values in tabular rows', () => {
    const toon = 'items[2]{id,value}:\n  1,null\n  2,"test"'
    expect(decode(toon)).toEqual({
      items: [
        { id: 1, value: null },
        { id: 2, value: 'test' },
      ],
    })
  })

  it('parses quoted header keys in tabular arrays', () => {
    const toon = 'items[2]{"order:id","full name"}:\n  1,Ada\n  2,Bob'
    expect(decode(toon)).toEqual({
      items: [
        { 'order:id': 1, 'full name': 'Ada' },
        { 'order:id': 2, 'full name': 'Bob' },
      ],
    })
  })

  it('parses list arrays for non-uniform objects', () => {
    const toon
      = 'items[2]:\n'
        + '  - id: 1\n'
        + '    name: First\n'
        + '  - id: 2\n'
        + '    name: Second\n'
        + '    extra: true'
    expect(decode(toon)).toEqual({
      items: [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second', extra: true },
      ],
    })
  })

  it('parses objects with nested values inside list items', () => {
    const toon
      = 'items[1]:\n'
        + '  - id: 1\n'
        + '    nested:\n'
        + '      x: 1'
    expect(decode(toon)).toEqual({
      items: [{ id: 1, nested: { x: 1 } }],
    })
  })

  it('parses nested tabular arrays as first field on hyphen line', () => {
    const toon
      = 'items[1]:\n'
        + '  - users[2]{id,name}:\n'
        + '    1,Ada\n'
        + '    2,Bob\n'
        + '    status: active'
    expect(decode(toon)).toEqual({
      items: [
        {
          users: [
            { id: 1, name: 'Ada' },
            { id: 2, name: 'Bob' },
          ],
          status: 'active',
        },
      ],
    })
  })

  it('parses objects containing arrays (including empty arrays) in list format', () => {
    const toon
      = 'items[1]:\n'
        + '  - name: test\n'
        + '    data[0]:'
    expect(decode(toon)).toEqual({
      items: [{ name: 'test', data: [] }],
    })
  })

  it('parses arrays of arrays within objects', () => {
    const toon
      = 'items[1]:\n'
        + '  - matrix[2]:\n'
        + '    - [2]: 1,2\n'
        + '    - [2]: 3,4\n'
        + '    name: grid'
    expect(decode(toon)).toEqual({
      items: [{ matrix: [[1, 2], [3, 4]], name: 'grid' }],
    })
  })
})

describe('arrays of arrays (primitives only)', () => {
  it('parses nested arrays of primitives', () => {
    const toon = 'pairs[2]:\n  - [2]: a,b\n  - [2]: c,d'
    expect(decode(toon)).toEqual({ pairs: [['a', 'b'], ['c', 'd']] })
  })

  it('parses quoted strings and mixed lengths in nested arrays', () => {
    const toon = 'pairs[2]:\n  - [2]: a,b\n  - [3]: "c,d","e:f","true"'
    expect(decode(toon)).toEqual({ pairs: [['a', 'b'], ['c,d', 'e:f', 'true']] })
  })

  it('parses empty inner arrays', () => {
    const toon = 'pairs[2]:\n  - [0]:\n  - [0]:'
    expect(decode(toon)).toEqual({ pairs: [[], []] })
  })

  it('parses mixed-length inner arrays', () => {
    const toon = 'pairs[2]:\n  - [1]: 1\n  - [2]: 2,3'
    expect(decode(toon)).toEqual({ pairs: [[1], [2, 3]] })
  })
})

describe('root arrays', () => {
  it('parses root arrays of primitives (inline)', () => {
    const toon = '[5]: x,y,"true",true,10'
    expect(decode(toon)).toEqual(['x', 'y', 'true', true, 10])
  })

  it('parses root arrays of uniform objects in tabular format', () => {
    const toon = '[2]{id}:\n  1\n  2'
    expect(decode(toon)).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('parses root arrays of non-uniform objects in list format', () => {
    const toon = '[2]:\n  - id: 1\n  - id: 2\n    name: Ada'
    expect(decode(toon)).toEqual([{ id: 1 }, { id: 2, name: 'Ada' }])
  })

  it('parses empty root arrays', () => {
    expect(decode('[0]:')).toEqual([])
  })

  it('parses root arrays of arrays', () => {
    const toon = '[2]:\n  - [2]: 1,2\n  - [0]:'
    expect(decode(toon)).toEqual([[1, 2], []])
  })
})

describe('complex structures', () => {
  it('parses mixed objects with arrays and nested objects', () => {
    const toon
      = 'user:\n'
        + '  id: 123\n'
        + '  name: Ada\n'
        + '  tags[2]: reading,gaming\n'
        + '  active: true\n'
        + '  prefs[0]:'
    expect(decode(toon)).toEqual({
      user: {
        id: 123,
        name: 'Ada',
        tags: ['reading', 'gaming'],
        active: true,
        prefs: [],
      },
    })
  })
})

describe('mixed arrays', () => {
  it('parses arrays mixing primitives, objects and strings (list format)', () => {
    const toon
      = 'items[3]:\n'
        + '  - 1\n'
        + '  - a: 1\n'
        + '  - text'
    expect(decode(toon)).toEqual({ items: [1, { a: 1 }, 'text'] })
  })

  it('parses arrays mixing objects and arrays', () => {
    const toon
      = 'items[2]:\n'
        + '  - a: 1\n'
        + '  - [2]: 1,2'
    expect(decode(toon)).toEqual({ items: [{ a: 1 }, [1, 2]] })
  })
})

describe('delimiter options', () => {
  describe('basic delimiter usage', () => {
    it.each([
      { delimiter: '\t' as const, name: 'tab', header: '[3\t]', joined: 'reading\tgaming\tcoding' },
      { delimiter: '|' as const, name: 'pipe', header: '[3|]', joined: 'reading|gaming|coding' },
      { delimiter: ',' as const, name: 'comma', header: '[3]', joined: 'reading,gaming,coding' },
    ])('parses primitive arrays with $name delimiter', ({ header, joined }) => {
      const toon = `tags${header}: ${joined}`
      expect(decode(toon)).toEqual({ tags: ['reading', 'gaming', 'coding'] })
    })

    it.each([
      { delimiter: '\t' as const, name: 'tab', header: '[2\t]{sku\tqty\tprice}', rows: ['A1\t2\t9.99', 'B2\t1\t14.5'] },
      { delimiter: '|' as const, name: 'pipe', header: '[2|]{sku|qty|price}', rows: ['A1|2|9.99', 'B2|1|14.5'] },
    ])('parses tabular arrays with $name delimiter', ({ header, rows }) => {
      const toon = `items${header}:\n  ${rows[0]}\n  ${rows[1]}`
      expect(decode(toon)).toEqual({
        items: [
          { sku: 'A1', qty: 2, price: 9.99 },
          { sku: 'B2', qty: 1, price: 14.5 },
        ],
      })
    })

    it.each([
      { header: '[2\t]', inner: '[2\t]', a: 'a\tb', b: 'c\td' },
      { header: '[2|]', inner: '[2|]', a: 'a|b', b: 'c|d' },
    ])('parses nested arrays with custom delimiters', ({ header, inner, a, b }) => {
      const toon = `pairs${header}:\n  - ${inner}: ${a}\n  - ${inner}: ${b}`
      expect(decode(toon)).toEqual({ pairs: [['a', 'b'], ['c', 'd']] })
    })

    it.each([
      { parent: '[1\t]', nested: '[3]', values: 'a,b,c' },
      { parent: '[1|]', nested: '[3]', values: 'a,b,c' },
    ])('nested arrays inside list items default to comma delimiter', ({ parent, nested, values }) => {
      const toon = `items${parent}:\n  - tags${nested}: ${values}`
      expect(decode(toon)).toEqual({ items: [{ tags: ['a', 'b', 'c'] }] })
    })

    it.each([
      { header: '[3\t]', joined: 'x\ty\tz' },
      { header: '[3|]', joined: 'x|y|z' },
    ])('parses root arrays of primitives with custom delimiters', ({ header, joined }) => {
      const toon = `${header}: ${joined}`
      expect(decode(toon)).toEqual(['x', 'y', 'z'])
    })

    it.each([
      { header: '[2\t]{id}', rows: ['1', '2'] },
      { header: '[2|]{id}', rows: ['1', '2'] },
    ])('parses root arrays of objects with custom delimiters', ({ header, rows }) => {
      const toon = `${header}:\n  ${rows[0]}\n  ${rows[1]}`
      expect(decode(toon)).toEqual([{ id: 1 }, { id: 2 }])
    })
  })

  describe('delimiter-aware quoting', () => {
    it.each([
      { header: '[3\t]', joined: 'a\t"b\\tc"\td', expected: ['a', 'b\tc', 'd'] },
      { header: '[3|]', joined: 'a|"b|c"|d', expected: ['a', 'b|c', 'd'] },
    ])('parses values containing the active delimiter when quoted', ({ header, joined, expected }) => {
      const toon = `items${header}: ${joined}`
      expect(decode(toon)).toEqual({ items: expected })
    })

    it.each([
      { header: '[2\t]', joined: 'a,b\tc,d' },
      { header: '[2|]', joined: 'a,b|c,d' },
    ])('does not split on commas when using non-comma delimiter', ({ header, joined }) => {
      const toon = `items${header}: ${joined}`
      expect(decode(toon)).toEqual({ items: ['a,b', 'c,d'] })
    })

    it('parses tabular values containing the active delimiter correctly', () => {
      const comma = 'items[2]{id,note}:\n  1,"a,b"\n  2,"c,d"'
      expect(decode(comma)).toEqual({ items: [{ id: 1, note: 'a,b' }, { id: 2, note: 'c,d' }] })

      const tab = 'items[2\t]{id\tnote}:\n  1\ta,b\n  2\tc,d'
      expect(decode(tab)).toEqual({ items: [{ id: 1, note: 'a,b' }, { id: 2, note: 'c,d' }] })
    })

    it('does not require quoting commas in object values when using non-comma delimiter elsewhere', () => {
      expect(decode('note: a,b')).toEqual({ note: 'a,b' })
    })

    it('parses nested array values containing the active delimiter', () => {
      expect(decode('pairs[1|]:\n  - [2|]: a|"b|c"')).toEqual({ pairs: [['a', 'b|c']] })
      expect(decode('pairs[1\t]:\n  - [2\t]: a\t"b\\tc"')).toEqual({ pairs: [['a', 'b\tc']] })
    })
  })

  describe('delimiter-independent quoting rules', () => {
    it('preserves quoted ambiguity regardless of delimiter', () => {
      expect(decode('items[3|]: "true"|"42"|"-3.14"')).toEqual({ items: ['true', '42', '-3.14'] })
      expect(decode('items[3\t]: "true"\t"42"\t"-3.14"')).toEqual({ items: ['true', '42', '-3.14'] })
    })

    it('parses structural-looking strings when quoted', () => {
      expect(decode('items[3|]: "[5]"|"{key}"|"- item"')).toEqual({ items: ['[5]', '{key}', '- item'] })
      expect(decode('items[3\t]: "[5]"\t"{key}"\t"- item"')).toEqual({ items: ['[5]', '{key}', '- item'] })
    })

    it('parses tabular headers with keys containing the active delimiter', () => {
      const toon = 'items[2|]{"a|b"}:\n  1\n  2'
      expect(decode(toon)).toEqual({ items: [{ 'a|b': 1 }, { 'a|b': 2 }] })
    })
  })
})

describe('length marker option', () => {
  it('accepts length marker on primitive arrays', () => {
    expect(decode('tags[#3]: reading,gaming,coding')).toEqual({ tags: ['reading', 'gaming', 'coding'] })
  })

  it('accepts length marker on empty arrays', () => {
    expect(decode('items[#0]:')).toEqual({ items: [] })
  })

  it('accepts length marker on tabular arrays', () => {
    const toon = 'items[#2]{sku,qty,price}:\n  A1,2,9.99\n  B2,1,14.5'
    expect(decode(toon)).toEqual({
      items: [
        { sku: 'A1', qty: 2, price: 9.99 },
        { sku: 'B2', qty: 1, price: 14.5 },
      ],
    })
  })

  it('accepts length marker on nested arrays', () => {
    const toon = 'pairs[#2]:\n  - [#2]: a,b\n  - [#2]: c,d'
    expect(decode(toon)).toEqual({ pairs: [['a', 'b'], ['c', 'd']] })
  })

  it('works with custom delimiters and length marker', () => {
    expect(decode('tags[#3|]: reading|gaming|coding')).toEqual({ tags: ['reading', 'gaming', 'coding'] })
  })
})

describe('validation and error handling', () => {
  describe('length and structure errors', () => {
    it('throws on array length mismatch (inline primitives)', () => {
      const toon = 'tags[2]: a,b,c'
      expect(() => decode(toon)).toThrow()
    })

    it('throws on array length mismatch (list format)', () => {
      const toon = 'items[1]:\n  - 1\n  - 2'
      expect(() => decode(toon)).toThrow()
    })

    it('throws when tabular row value count does not match header field count', () => {
      const toon = 'items[2]{id,name}:\n  1,Ada\n  2'
      expect(() => decode(toon)).toThrow()
    })

    it('throws when tabular row count does not match header length', () => {
      const toon = '[1]{id}:\n  1\n  2'
      expect(() => decode(toon)).toThrow()
    })

    it('throws on invalid escape sequences', () => {
      expect(() => decode('"a\\x"')).toThrow()
      expect(() => decode('"unterminated')).toThrow()
    })

    it('throws on missing colon in key-value context', () => {
      expect(() => decode('a:\n  user')).toThrow()
    })

    it('throws on delimiter mismatch', () => {
      const toon = 'items[2\t]{a\tb}:\n  1,2\n  3,4'
      expect(() => decode(toon)).toThrow()
    })
  })

  describe('strict mode: indentation validation', () => {
    describe('non-multiple indentation errors', () => {
      it('throws when object field has non-multiple indentation', () => {
        const toon = 'a:\n   b: 1' // 3 spaces with indent=2
        expect(() => decode(toon)).toThrow(/indentation/i)
        expect(() => decode(toon)).toThrow(/exact multiple/i)
      })

      it('throws when list item has non-multiple indentation', () => {
        const toon = 'items[2]:\n   - id: 1\n   - id: 2' // 3 spaces
        expect(() => decode(toon)).toThrow(/indentation/i)
      })

      it('throws with custom indent size when non-multiple', () => {
        const toon = 'a:\n   b: 1' // 3 spaces with indent=4
        expect(() => decode(toon, { indent: 4 })).toThrow(/exact multiple of 4/i)
      })

      it('accepts correct indentation with custom indent size', () => {
        const toon = 'a:\n    b: 1' // 4 spaces with indent=4
        expect(decode(toon, { indent: 4 })).toEqual({ a: { b: 1 } })
      })
    })

    describe('tab character errors', () => {
      it('throws when tab character used in indentation', () => {
        const toon = 'a:\n\tb: 1'
        expect(() => decode(toon)).toThrow(/tab/i)
      })

      it('throws when mixed tabs and spaces in indentation', () => {
        const toon = 'a:\n \tb: 1' // space + tab
        expect(() => decode(toon)).toThrow(/tab/i)
      })

      it('throws when tab at start of line', () => {
        const toon = '\ta: 1'
        expect(() => decode(toon)).toThrow(/tab/i)
      })
    })

    describe('tabs in quoted strings are allowed', () => {
      it('accepts tabs in quoted string values', () => {
        const toon = 'text: "hello\tworld"'
        expect(decode(toon)).toEqual({ text: 'hello\tworld' })
      })

      it('accepts tabs in quoted keys', () => {
        const toon = '"key\ttab": value'
        expect(decode(toon)).toEqual({ 'key\ttab': 'value' })
      })

      it('accepts tabs in quoted array elements', () => {
        const toon = 'items[2]: "a\tb","c\td"'
        expect(decode(toon)).toEqual({ items: ['a\tb', 'c\td'] })
      })
    })

    describe('non-strict mode', () => {
      it('accepts non-multiple indentation when strict=false', () => {
        const toon = 'a:\n   b: 1' // 3 spaces with indent=2
        expect(decode(toon, { strict: false })).toEqual({ a: { b: 1 } })
      })

      it('accepts tab indentation when strict=false', () => {
        const toon = 'a:\n\tb: 1'
        // Tabs are ignored in indentation counting, so depth=0, "b: 1" at root
        expect(decode(toon, { strict: false })).toEqual({ a: {}, b: 1 })
      })

      it('accepts deeply nested non-multiples when strict=false', () => {
        const toon = 'a:\n   b:\n     c: 1' // 3 and 5 spaces
        expect(decode(toon, { strict: false })).toEqual({ a: { b: { c: 1 } } })
      })
    })

    describe('edge cases', () => {
      it('empty lines do not trigger validation errors', () => {
        const toon = 'a: 1\n\nb: 2'
        expect(decode(toon)).toEqual({ a: 1, b: 2 })
      })

      it('root-level content (0 indentation) is always valid', () => {
        const toon = 'a: 1\nb: 2\nc: 3'
        expect(decode(toon)).toEqual({ a: 1, b: 2, c: 3 })
      })

      it('lines with only spaces are not validated if empty', () => {
        const toon = 'a: 1\n   \nb: 2'
        expect(decode(toon)).toEqual({ a: 1, b: 2 })
      })
    })
  })

  describe('strict mode: blank lines in arrays', () => {
    describe('errors on blank lines inside arrays', () => {
      it('throws on blank line inside list array', () => {
        const teon = 'items[3]:\n  - a\n\n  - b\n  - c'
        expect(() => decode(teon)).toThrow(/blank line/i)
        expect(() => decode(teon)).toThrow(/list array/i)
      })

      it('throws on blank line inside tabular array', () => {
        const teon = 'items[2]{id}:\n  1\n\n  2'
        expect(() => decode(teon)).toThrow(/blank line/i)
        expect(() => decode(teon)).toThrow(/tabular array/i)
      })

      it('throws on multiple blank lines inside array', () => {
        const teon = 'items[2]:\n  - a\n\n\n  - b'
        expect(() => decode(teon)).toThrow(/blank line/i)
      })

      it('throws on blank line with spaces inside array', () => {
        const teon = 'items[2]:\n  - a\n  \n  - b'
        expect(() => decode(teon)).toThrow(/blank line/i)
      })

      it('throws on blank line in nested list array', () => {
        const teon = 'outer[2]:\n  - inner[2]:\n    - a\n\n    - b\n  - x'
        expect(() => decode(teon)).toThrow(/blank line/i)
      })
    })

    describe('accepts blank lines outside arrays', () => {
      it('accepts blank line between root-level fields', () => {
        const teon = 'a: 1\n\nb: 2'
        expect(decode(teon)).toEqual({ a: 1, b: 2 })
      })

      it('accepts trailing newline at end of file', () => {
        const teon = 'a: 1\n'
        expect(decode(teon)).toEqual({ a: 1 })
      })

      it('accepts multiple trailing newlines', () => {
        const teon = 'a: 1\n\n\n'
        expect(decode(teon)).toEqual({ a: 1 })
      })

      it('accepts blank line after array ends', () => {
        const teon = 'items[1]:\n  - a\n\nb: 2'
        expect(decode(teon)).toEqual({ items: ['a'], b: 2 })
      })

      it('accepts blank line between nested object fields', () => {
        const teon = 'a:\n  b: 1\n\n  c: 2'
        expect(decode(teon)).toEqual({ a: { b: 1, c: 2 } })
      })
    })

    describe('non-strict mode: ignores blank lines', () => {
      it('ignores blank lines inside list array', () => {
        const teon = 'items[3]:\n  - a\n\n  - b\n  - c'
        expect(decode(teon, { strict: false })).toEqual({ items: ['a', 'b', 'c'] })
      })

      it('ignores blank lines inside tabular array', () => {
        const teon = 'items[2]{id,name}:\n  1,Alice\n\n  2,Bob'
        expect(decode(teon, { strict: false })).toEqual({
          items: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        })
      })

      it('ignores multiple blank lines in arrays', () => {
        const teon = 'items[2]:\n  - a\n\n\n  - b'
        expect(decode(teon, { strict: false })).toEqual({ items: ['a', 'b'] })
      })
    })
  })
})
