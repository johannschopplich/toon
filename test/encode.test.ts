import { describe, expect, it } from 'vitest'
import { decode, encode } from '../src/index'

describe('primitives', () => {
  it('encodes safe strings without quotes', () => {
    expect(encode('hello')).toBe('hello')
    expect(encode('Ada_99')).toBe('Ada_99')
  })

  it('quotes empty string', () => {
    expect(encode('')).toBe('""')
  })

  it('quotes strings that look like booleans or numbers', () => {
    expect(encode('true')).toBe('"true"')
    expect(encode('false')).toBe('"false"')
    expect(encode('null')).toBe('"null"')
    expect(encode('42')).toBe('"42"')
    expect(encode('-3.14')).toBe('"-3.14"')
    expect(encode('1e-6')).toBe('"1e-6"')
    expect(encode('05')).toBe('"05"')
  })

  it('escapes control characters in strings', () => {
    expect(encode('line1\nline2')).toBe('"line1\\nline2"')
    expect(encode('tab\there')).toBe('"tab\\there"')
    expect(encode('return\rcarriage')).toBe('"return\\rcarriage"')
    expect(encode('C:\\Users\\path')).toBe('"C:\\\\Users\\\\path"')
  })

  it('quotes strings with structural characters', () => {
    expect(encode('[3]: x,y')).toBe('"[3]: x,y"')
    expect(encode('- item')).toBe('"- item"')
    expect(encode('[test]')).toBe('"[test]"')
    expect(encode('{key}')).toBe('"{key}"')
  })

  it('handles Unicode and emoji', () => {
    expect(encode('café')).toBe('café')
    expect(encode('你好')).toBe('你好')
    expect(encode('🚀')).toBe('🚀')
    expect(encode('hello 👋 world')).toBe('hello 👋 world')
  })

  it('encodes numbers', () => {
    expect(encode(42)).toBe('42')
    expect(encode(3.14)).toBe('3.14')
    expect(encode(-7)).toBe('-7')
    expect(encode(0)).toBe('0')
  })

  it('handles special numeric values', () => {
    expect(encode(-0)).toBe('0')
    expect(encode(1e6)).toBe('1000000')
    expect(encode(1e-6)).toBe('0.000001')
    expect(encode(1e20)).toBe('100000000000000000000')
    expect(encode(Number.MAX_SAFE_INTEGER)).toBe('9007199254740991')
  })

  it('preserves precision for repeating decimals', () => {
    const value = 1 / 3
    const encodedValue = encode({ value })
    const decodedValue = decode(encodedValue)
    expect((decodedValue as Record<string, unknown>)?.value).toBe(value) // Round-trip fidelity
    expect(encodedValue).toContain('0.3333333333333333') // Default JS precision
  })

  it('encodes booleans', () => {
    expect(encode(true)).toBe('true')
    expect(encode(false)).toBe('false')
  })

  it('encodes null', () => {
    expect(encode(null)).toBe('null')
  })
})

describe('objects (simple)', () => {
  it('preserves key order in objects', () => {
    const obj = {
      id: 123,
      name: 'Ada',
      active: true,
    }
    expect(encode(obj)).toBe('id: 123\nname: Ada\nactive: true')
  })

  it('encodes null values in objects', () => {
    const obj = { id: 123, value: null }
    expect(encode(obj)).toBe('id: 123\nvalue: null')
  })

  it('encodes empty objects as empty string', () => {
    expect(encode({})).toBe('')
  })

  it('quotes string values with special characters', () => {
    expect(encode({ note: 'a:b' })).toBe('note: "a:b"')
    expect(encode({ note: 'a,b' })).toBe('note: "a,b"')
    expect(encode({ text: 'line1\nline2' })).toBe('text: "line1\\nline2"')
    expect(encode({ text: 'say "hello"' })).toBe('text: "say \\"hello\\""')
  })

  it('quotes string values with leading/trailing spaces', () => {
    expect(encode({ text: ' padded ' })).toBe('text: " padded "')
    expect(encode({ text: '  ' })).toBe('text: "  "')
  })

  it('quotes string values that look like booleans/numbers', () => {
    expect(encode({ v: 'true' })).toBe('v: "true"')
    expect(encode({ v: '42' })).toBe('v: "42"')
    expect(encode({ v: '-7.5' })).toBe('v: "-7.5"')
  })
})

describe('objects (keys)', () => {
  it('quotes keys with special characters', () => {
    expect(encode({ 'order:id': 7 })).toBe('"order:id": 7')
    expect(encode({ '[index]': 5 })).toBe('"[index]": 5')
    expect(encode({ '{key}': 5 })).toBe('"{key}": 5')
    expect(encode({ 'a,b': 1 })).toBe('"a,b": 1')
  })

  it('quotes keys with spaces or leading hyphens', () => {
    expect(encode({ 'full name': 'Ada' })).toBe('"full name": Ada')
    expect(encode({ '-lead': 1 })).toBe('"-lead": 1')
    expect(encode({ ' a ': 1 })).toBe('" a ": 1')
  })

  it('quotes numeric keys', () => {
    expect(encode({ 123: 'x' })).toBe('"123": x')
  })

  it('quotes empty string key', () => {
    expect(encode({ '': 1 })).toBe('"": 1')
  })

  it('escapes control characters in keys', () => {
    expect(encode({ 'line\nbreak': 1 })).toBe('"line\\nbreak": 1')
    expect(encode({ 'tab\there': 2 })).toBe('"tab\\there": 2')
  })

  it('escapes quotes in keys', () => {
    expect(encode({ 'he said "hi"': 1 })).toBe('"he said \\"hi\\"": 1')
  })
})

describe('nested objects', () => {
  it('encodes deeply nested objects', () => {
    const obj = {
      a: {
        b: {
          c: 'deep',
        },
      },
    }
    expect(encode(obj)).toBe('a:\n  b:\n    c: deep')
  })

  it('encodes empty nested object', () => {
    expect(encode({ user: {} })).toBe('user:')
  })
})

describe('arrays of primitives', () => {
  it('encodes string arrays inline', () => {
    const obj = { tags: ['reading', 'gaming'] }
    expect(encode(obj)).toBe('tags[2]: reading,gaming')
  })

  it('encodes number arrays inline', () => {
    const obj = { nums: [1, 2, 3] }
    expect(encode(obj)).toBe('nums[3]: 1,2,3')
  })

  it('encodes mixed primitive arrays inline', () => {
    const obj = { data: ['x', 'y', true, 10] }
    expect(encode(obj)).toBe('data[4]: x,y,true,10')
  })

  it('encodes empty arrays', () => {
    const obj = { items: [] }
    expect(encode(obj)).toBe('items[0]:')
  })

  it('handles empty string in arrays', () => {
    const obj = { items: [''] }
    expect(encode(obj)).toBe('items[1]: ""')
    const obj2 = { items: ['a', '', 'b'] }
    expect(encode(obj2)).toBe('items[3]: a,"",b')
  })

  it('handles whitespace-only strings in arrays', () => {
    const obj = { items: [' ', '  '] }
    expect(encode(obj)).toBe('items[2]: " ","  "')
  })

  it('quotes array strings with special characters', () => {
    const obj = { items: ['a', 'b,c', 'd:e'] }
    expect(encode(obj)).toBe('items[3]: a,"b,c","d:e"')
  })

  it('quotes strings that look like booleans/numbers in arrays', () => {
    const obj = { items: ['x', 'true', '42', '-3.14'] }
    expect(encode(obj)).toBe('items[4]: x,"true","42","-3.14"')
  })

  it('quotes strings with structural meanings in arrays', () => {
    const obj = { items: ['[5]', '- item', '{key}'] }
    expect(encode(obj)).toBe('items[3]: "[5]","- item","{key}"')
  })
})

describe('arrays of objects (tabular and list items)', () => {
  it('encodes arrays of similar objects in tabular format', () => {
    const obj = {
      items: [
        { sku: 'A1', qty: 2, price: 9.99 },
        { sku: 'B2', qty: 1, price: 14.5 },
      ],
    }
    expect(encode(obj)).toBe('items[2]{sku,qty,price}:\n  A1,2,9.99\n  B2,1,14.5')
  })

  it('handles null values in tabular format', () => {
    const obj = {
      items: [
        { id: 1, value: null },
        { id: 2, value: 'test' },
      ],
    }
    expect(encode(obj)).toBe('items[2]{id,value}:\n  1,null\n  2,test')
  })

  it('quotes strings containing delimiters in tabular rows', () => {
    const obj = {
      items: [
        { sku: 'A,1', desc: 'cool', qty: 2 },
        { sku: 'B2', desc: 'wip: test', qty: 1 },
      ],
    }
    expect(encode(obj)).toBe('items[2]{sku,desc,qty}:\n  "A,1",cool,2\n  B2,"wip: test",1')
  })

  it('quotes ambiguous strings in tabular rows', () => {
    const obj = {
      items: [
        { id: 1, status: 'true' },
        { id: 2, status: 'false' },
      ],
    }
    expect(encode(obj)).toBe('items[2]{id,status}:\n  1,"true"\n  2,"false"')
  })

  it('handles tabular arrays with keys needing quotes', () => {
    const obj = {
      items: [
        { 'order:id': 1, 'full name': 'Ada' },
        { 'order:id': 2, 'full name': 'Bob' },
      ],
    }
    expect(encode(obj)).toBe('items[2]{"order:id","full name"}:\n  1,Ada\n  2,Bob')
  })

  it('uses list format for objects with different fields', () => {
    const obj = {
      items: [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second', extra: true },
      ],
    }
    expect(encode(obj)).toBe(
      'items[2]:\n'
      + '  - id: 1\n'
      + '    name: First\n'
      + '  - id: 2\n'
      + '    name: Second\n'
      + '    extra: true',
    )
  })

  it('uses list format for objects with nested values', () => {
    const obj = {
      items: [
        { id: 1, nested: { x: 1 } },
      ],
    }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - id: 1\n'
      + '    nested:\n'
      + '      x: 1',
    )
  })

  it('preserves field order in list items', () => {
    const obj = { items: [{ nums: [1, 2, 3], name: 'test' }] }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - nums[3]: 1,2,3\n'
      + '    name: test',
    )
  })

  it('preserves field order when primitive appears first', () => {
    const obj = { items: [{ name: 'test', nums: [1, 2, 3] }] }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - name: test\n'
      + '    nums[3]: 1,2,3',
    )
  })

  it('uses list format for objects containing arrays of arrays', () => {
    const obj = {
      items: [
        { matrix: [[1, 2], [3, 4]], name: 'grid' },
      ],
    }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - matrix[2]:\n'
      + '    - [2]: 1,2\n'
      + '    - [2]: 3,4\n'
      + '    name: grid',
    )
  })

  it('uses tabular format for nested uniform object arrays', () => {
    const obj = {
      items: [
        { users: [{ id: 1, name: 'Ada' }, { id: 2, name: 'Bob' }], status: 'active' },
      ],
    }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - users[2]{id,name}:\n'
      + '    1,Ada\n'
      + '    2,Bob\n'
      + '    status: active',
    )
  })

  it('uses list format for nested object arrays with mismatched keys', () => {
    const obj = {
      items: [
        { users: [{ id: 1, name: 'Ada' }, { id: 2 }], status: 'active' },
      ],
    }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - users[2]:\n'
      + '    - id: 1\n'
      + '      name: Ada\n'
      + '    - id: 2\n'
      + '    status: active',
    )
  })

  it('uses list format for objects with multiple array fields', () => {
    const obj = { items: [{ nums: [1, 2], tags: ['a', 'b'], name: 'test' }] }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - nums[2]: 1,2\n'
      + '    tags[2]: a,b\n'
      + '    name: test',
    )
  })

  it('uses list format for objects with only array fields', () => {
    const obj = { items: [{ nums: [1, 2, 3], tags: ['a', 'b'] }] }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - nums[3]: 1,2,3\n'
      + '    tags[2]: a,b',
    )
  })

  it('handles objects with empty arrays in list format', () => {
    const obj = {
      items: [
        { name: 'test', data: [] },
      ],
    }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - name: test\n'
      + '    data[0]:',
    )
  })

  it('places first field of nested tabular arrays on hyphen line', () => {
    const obj = { items: [{ users: [{ id: 1 }, { id: 2 }], note: 'x' }] }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - users[2]{id}:\n'
      + '    1\n'
      + '    2\n'
      + '    note: x',
    )
  })

  it('places empty arrays on hyphen line when first', () => {
    const obj = { items: [{ data: [], name: 'x' }] }
    expect(encode(obj)).toBe(
      'items[1]:\n'
      + '  - data[0]:\n'
      + '    name: x',
    )
  })

  it('uses field order from first object for tabular headers', () => {
    const obj = {
      items: [
        { a: 1, b: 2, c: 3 },
        { c: 30, b: 20, a: 10 },
      ],
    }
    expect(encode(obj)).toBe('items[2]{a,b,c}:\n  1,2,3\n  10,20,30')
  })

  it('uses list format for one object with nested column', () => {
    const obj = {
      items: [
        { id: 1, data: 'string' },
        { id: 2, data: { nested: true } },
      ],
    }
    expect(encode(obj)).toBe(
      'items[2]:\n'
      + '  - id: 1\n'
      + '    data: string\n'
      + '  - id: 2\n'
      + '    data:\n'
      + '      nested: true',
    )
  })
})

describe('arrays of arrays (primitives only)', () => {
  it('encodes nested arrays of primitives', () => {
    const obj = {
      pairs: [['a', 'b'], ['c', 'd']],
    }
    expect(encode(obj)).toBe('pairs[2]:\n  - [2]: a,b\n  - [2]: c,d')
  })

  it('quotes strings containing delimiters in nested arrays', () => {
    const obj = {
      pairs: [['a', 'b'], ['c,d', 'e:f', 'true']],
    }
    expect(encode(obj)).toBe('pairs[2]:\n  - [2]: a,b\n  - [3]: "c,d","e:f","true"')
  })

  it('handles empty inner arrays', () => {
    const obj = {
      pairs: [[], []],
    }
    expect(encode(obj)).toBe('pairs[2]:\n  - [0]:\n  - [0]:')
  })

  it('handles mixed-length inner arrays', () => {
    const obj = {
      pairs: [[1], [2, 3]],
    }
    expect(encode(obj)).toBe('pairs[2]:\n  - [1]: 1\n  - [2]: 2,3')
  })
})

describe('root arrays', () => {
  it('encodes arrays of primitives at root level', () => {
    const arr = ['x', 'y', 'true', true, 10]
    expect(encode(arr)).toBe('[5]: x,y,"true",true,10')
  })

  it('encodes arrays of similar objects in tabular format', () => {
    const arr = [{ id: 1 }, { id: 2 }]
    expect(encode(arr)).toBe('[2]{id}:\n  1\n  2')
  })

  it('encodes arrays of different objects in list format', () => {
    const arr = [{ id: 1 }, { id: 2, name: 'Ada' }]
    expect(encode(arr)).toBe('[2]:\n  - id: 1\n  - id: 2\n    name: Ada')
  })

  it('encodes empty arrays at root level', () => {
    expect(encode([])).toBe('[0]:')
  })

  it('encodes arrays of arrays at root level', () => {
    const arr = [[1, 2], []]
    expect(encode(arr)).toBe('[2]:\n  - [2]: 1,2\n  - [0]:')
  })
})

describe('complex structures', () => {
  it('encodes objects with mixed arrays and nested objects', () => {
    const obj = {
      user: {
        id: 123,
        name: 'Ada',
        tags: ['reading', 'gaming'],
        active: true,
        prefs: [],
      },
    }
    expect(encode(obj)).toBe(
      'user:\n'
      + '  id: 123\n'
      + '  name: Ada\n'
      + '  tags[2]: reading,gaming\n'
      + '  active: true\n'
      + '  prefs[0]:',
    )
  })
})

describe('mixed arrays', () => {
  it('uses list format for arrays mixing primitives and objects', () => {
    const obj = {
      items: [1, { a: 1 }, 'text'],
    }
    expect(encode(obj)).toBe(
      'items[3]:\n'
      + '  - 1\n'
      + '  - a: 1\n'
      + '  - text',
    )
  })

  it('uses list format for arrays mixing objects and arrays', () => {
    const obj = {
      items: [{ a: 1 }, [1, 2]],
    }
    expect(encode(obj)).toBe(
      'items[2]:\n'
      + '  - a: 1\n'
      + '  - [2]: 1,2',
    )
  })
})

describe('whitespace and formatting invariants', () => {
  it('produces no trailing spaces at end of lines', () => {
    const obj = {
      user: {
        id: 123,
        name: 'Ada',
      },
      items: ['a', 'b'],
    }
    const result = encode(obj)
    const lines = result.split('\n')
    for (const line of lines) {
      expect(line).not.toMatch(/ $/)
    }
  })

  it('produces no trailing newline at end of output', () => {
    const obj = { id: 123 }
    const result = encode(obj)
    expect(result).not.toMatch(/\n$/)
  })
})

describe('non-JSON-serializable values', () => {
  it('converts BigInt to string', () => {
    expect(encode(BigInt(123))).toBe('123')
    expect(encode({ id: BigInt(456) })).toBe('id: 456')
  })

  it('converts Date to ISO string', () => {
    const date = new Date('2025-01-01T00:00:00.000Z')
    expect(encode(date)).toBe('"2025-01-01T00:00:00.000Z"')
    expect(encode({ created: date })).toBe('created: "2025-01-01T00:00:00.000Z"')
  })

  it('converts undefined to null', () => {
    expect(encode(undefined)).toBe('null')
    expect(encode({ value: undefined })).toBe('value: null')
  })

  it('converts non-finite numbers to null', () => {
    expect(encode(Infinity)).toBe('null')
    expect(encode(-Infinity)).toBe('null')
    expect(encode(Number.NaN)).toBe('null')
  })

  it('converts functions to null', () => {
    expect(encode(() => {})).toBe('null')
    expect(encode({ fn: () => {} })).toBe('fn: null')
  })

  it('converts symbols to null', () => {
    expect(encode(Symbol('test'))).toBe('null')
    expect(encode({ sym: Symbol('test') })).toBe('sym: null')
  })
})

describe('delimiter options', () => {
  describe('basic delimiter usage', () => {
    it.each([
      { delimiter: '\t' as const, name: 'tab', expected: 'reading\tgaming\tcoding' },
      { delimiter: '|' as const, name: 'pipe', expected: 'reading|gaming|coding' },
      { delimiter: ',' as const, name: 'comma', expected: 'reading,gaming,coding' },
    ])('encodes primitive arrays with $name', ({ delimiter, expected }) => {
      const obj = { tags: ['reading', 'gaming', 'coding'] }
      expect(encode(obj, { delimiter })).toBe(`tags[3${delimiter !== ',' ? delimiter : ''}]: ${expected}`)
    })

    it.each([
      { delimiter: '\t' as const, name: 'tab', expected: 'items[2\t]{sku\tqty\tprice}:\n  A1\t2\t9.99\n  B2\t1\t14.5' },
      { delimiter: '|' as const, name: 'pipe', expected: 'items[2|]{sku|qty|price}:\n  A1|2|9.99\n  B2|1|14.5' },
    ])('encodes tabular arrays with $name', ({ delimiter, expected }) => {
      const obj = {
        items: [
          { sku: 'A1', qty: 2, price: 9.99 },
          { sku: 'B2', qty: 1, price: 14.5 },
        ],
      }
      expect(encode(obj, { delimiter })).toBe(expected)
    })

    it.each([
      { delimiter: '\t' as const, name: 'tab', expected: 'pairs[2\t]:\n  - [2\t]: a\tb\n  - [2\t]: c\td' },
      { delimiter: '|' as const, name: 'pipe', expected: 'pairs[2|]:\n  - [2|]: a|b\n  - [2|]: c|d' },
    ])('encodes nested arrays with $name', ({ delimiter, expected }) => {
      const obj = { pairs: [['a', 'b'], ['c', 'd']] }
      expect(encode(obj, { delimiter })).toBe(expected)
    })

    it.each([
      { delimiter: '\t' as const, name: 'tab' },
      { delimiter: '|' as const, name: 'pipe' },
    ])('encodes root arrays with $name', ({ delimiter }) => {
      const arr = ['x', 'y', 'z']
      expect(encode(arr, { delimiter })).toBe(`[3${delimiter}]: x${delimiter}y${delimiter}z`)
    })

    it.each([
      { delimiter: '\t' as const, name: 'tab', expected: '[2\t]{id}:\n  1\n  2' },
      { delimiter: '|' as const, name: 'pipe', expected: '[2|]{id}:\n  1\n  2' },
    ])('encodes root arrays of objects with $name', ({ delimiter, expected }) => {
      const arr = [{ id: 1 }, { id: 2 }]
      expect(encode(arr, { delimiter })).toBe(expected)
    })
  })

  describe('delimiter-aware quoting', () => {
    it.each([
      { delimiter: '\t' as const, name: 'tab', char: '\t', input: ['a', 'b\tc', 'd'], expected: 'a\t"b\\tc"\td' },
      { delimiter: '|' as const, name: 'pipe', char: '|', input: ['a', 'b|c', 'd'], expected: 'a|"b|c"|d' },
    ])('quotes strings containing $name', ({ delimiter, input, expected }) => {
      expect(encode({ items: input }, { delimiter })).toBe(`items[${input.length}${delimiter}]: ${expected}`)
    })

    it.each([
      { delimiter: '\t' as const, name: 'tab', input: ['a,b', 'c,d'], expected: 'a,b\tc,d' },
      { delimiter: '|' as const, name: 'pipe', input: ['a,b', 'c,d'], expected: 'a,b|c,d' },
    ])('does not quote commas with $name', ({ delimiter, input, expected }) => {
      expect(encode({ items: input }, { delimiter })).toBe(`items[${input.length}${delimiter}]: ${expected}`)
    })

    it('quotes tabular values containing the delimiter', () => {
      const obj = {
        items: [
          { id: 1, note: 'a,b' },
          { id: 2, note: 'c,d' },
        ],
      }
      expect(encode(obj, { delimiter: ',' })).toBe('items[2]{id,note}:\n  1,"a,b"\n  2,"c,d"')
      expect(encode(obj, { delimiter: '\t' })).toBe('items[2\t]{id\tnote}:\n  1\ta,b\n  2\tc,d')
    })

    it('does not quote commas in object values with non-comma delimiter', () => {
      expect(encode({ note: 'a,b' }, { delimiter: '|' })).toBe('note: a,b')
      expect(encode({ note: 'a,b' }, { delimiter: '\t' })).toBe('note: a,b')
    })

    it('quotes nested array values containing the delimiter', () => {
      expect(encode({ pairs: [['a', 'b|c']] }, { delimiter: '|' })).toBe('pairs[1|]:\n  - [2|]: a|"b|c"')
      expect(encode({ pairs: [['a', 'b\tc']] }, { delimiter: '\t' })).toBe('pairs[1\t]:\n  - [2\t]: a\t"b\\tc"')
    })
  })

  describe('delimiter-independent quoting rules', () => {
    it('preserves ambiguity quoting regardless of delimiter', () => {
      const obj = { items: ['true', '42', '-3.14'] }
      expect(encode(obj, { delimiter: '|' })).toBe('items[3|]: "true"|"42"|"-3.14"')
      expect(encode(obj, { delimiter: '\t' })).toBe('items[3\t]: "true"\t"42"\t"-3.14"')
    })

    it('preserves structural quoting regardless of delimiter', () => {
      const obj = { items: ['[5]', '{key}', '- item'] }
      expect(encode(obj, { delimiter: '|' })).toBe('items[3|]: "[5]"|"{key}"|"- item"')
      expect(encode(obj, { delimiter: '\t' })).toBe('items[3\t]: "[5]"\t"{key}"\t"- item"')
    })

    it('quotes keys containing the delimiter', () => {
      expect(encode({ 'a|b': 1 }, { delimiter: '|' })).toBe('"a|b": 1')
      expect(encode({ 'a\tb': 1 }, { delimiter: '\t' })).toBe('"a\\tb": 1')
    })

    it('quotes tabular headers containing the delimiter', () => {
      const obj = { items: [{ 'a|b': 1 }, { 'a|b': 2 }] }
      expect(encode(obj, { delimiter: '|' })).toBe('items[2|]{"a|b"}:\n  1\n  2')
    })

    it('header uses the active delimiter', () => {
      const obj = { items: [{ a: 1, b: 2 }, { a: 3, b: 4 }] }
      expect(encode(obj, { delimiter: '|' })).toBe('items[2|]{a|b}:\n  1|2\n  3|4')
      expect(encode(obj, { delimiter: '\t' })).toBe('items[2\t]{a\tb}:\n  1\t2\n  3\t4')
    })
  })

  describe('formatting invariants with delimiters', () => {
    it.each([
      { delimiter: '\t' as const, name: 'tab' },
      { delimiter: '|' as const, name: 'pipe' },
    ])('produces no trailing spaces with $name', ({ delimiter }) => {
      const obj = {
        user: { id: 123, name: 'Ada' },
        items: ['a', 'b'],
      }
      const result = encode(obj, { delimiter })
      const lines = result.split('\n')
      for (const line of lines) {
        expect(line).not.toMatch(/ $/)
      }
    })

    it.each([
      { delimiter: '\t' as const, name: 'tab' },
      { delimiter: '|' as const, name: 'pipe' },
    ])('produces no trailing newline with $name', ({ delimiter }) => {
      const obj = { id: 123 }
      const result = encode(obj, { delimiter })
      expect(result).not.toMatch(/\n$/)
    })
  })
})

describe('length marker option', () => {
  it('adds length marker to primitive arrays', () => {
    const obj = { tags: ['reading', 'gaming', 'coding'] }
    expect(encode(obj, { lengthMarker: '#' })).toBe('tags[#3]: reading,gaming,coding')
  })

  it('handles empty arrays', () => {
    expect(encode({ items: [] }, { lengthMarker: '#' })).toBe('items[#0]:')
  })

  it('adds length marker to tabular arrays', () => {
    const obj = {
      items: [
        { sku: 'A1', qty: 2, price: 9.99 },
        { sku: 'B2', qty: 1, price: 14.5 },
      ],
    }
    expect(encode(obj, { lengthMarker: '#' })).toBe('items[#2]{sku,qty,price}:\n  A1,2,9.99\n  B2,1,14.5')
  })

  it('adds length marker to nested arrays', () => {
    const obj = { pairs: [['a', 'b'], ['c', 'd']] }
    expect(encode(obj, { lengthMarker: '#' })).toBe('pairs[#2]:\n  - [#2]: a,b\n  - [#2]: c,d')
  })

  it('works with delimiter option', () => {
    const obj = { tags: ['reading', 'gaming', 'coding'] }
    expect(encode(obj, { lengthMarker: '#', delimiter: '|' })).toBe('tags[#3|]: reading|gaming|coding')
  })

  it('default is false (no length marker)', () => {
    const obj = { tags: ['reading', 'gaming', 'coding'] }
    expect(encode(obj)).toBe('tags[3]: reading,gaming,coding')
  })
})
