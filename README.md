![TOON logo with step‑by‑step guide](./.github/og.png)

# Token-Oriented Object Notation (TOON)

AI is becoming cheaper and more accessible, but larger context windows allow for larger data inputs as well. **LLM tokens still cost money** – this is where TOON comes in.

**Token-Oriented Object Notation** is a compact, human-readable format designed for passing structured data to Large Language Models. It reduces token usage compared to JSON by:

- Removing redundant punctuation (braces/brackets, most quotes)
- Using indentation for structure
- Tabularizing arrays of objects
- Writing inline primitive arrays without spaces

> [!TIP]
> Wrap your JSON in `encode()` before sending it to LLMs and save ~1/2 of the token cost for structured data!

## Token Benchmarks

<!-- automd:file src="./docs/benchmarks.md" -->

| Example | JSON | TOON | Tokens Saved | Reduction |
| ------- | ---- | ---- | ------------ | --------- |
| 👤 Simple user object | 31 | 18 | 13 | **41.9%** |
| 🏷️ User with tags | 48 | 28 | 20 | **41.7%** |
| 📦 Small product catalog | 117 | 49 | 68 | **58.1%** |
| 👥 API response with users | 123 | 53 | 70 | **56.9%** |
| ⚙️ Nested configuration | 68 | 42 | 26 | **38.2%** |
| 🛒 E-commerce order | 163 | 94 | 69 | **42.3%** |
| 📊 Analytics data | 209 | 94 | 115 | **55.0%** |
| 📈 Large dataset (50 records) | 2159 | 762 | 1397 | **64.7%** |
| **Total** | **2918** | **1140** | **1778** | **60.9%** |

<details>
<summary><strong>View detailed results</strong></summary>

### 📦 Small product catalog

**Savings: 68 tokens (58.1% reduction)**

**JSON** (117 tokens):

```json
{
  "items": [
    {
      "sku": "A1",
      "name": "Widget",
      "qty": 2,
      "price": 9.99
    },
    {
      "sku": "B2",
      "name": "Gadget",
      "qty": 1,
      "price": 14.5
    },
    {
      "sku": "C3",
      "name": "Doohickey",
      "qty": 5,
      "price": 7.25
    }
  ]
}
```

**TOON** (49 tokens):

```
items[3]{sku,name,qty,price}:
  A1,Widget,2,9.99
  B2,Gadget,1,14.5
  C3,Doohickey,5,7.25
```

---

### 👥 API response with users

**Savings: 70 tokens (56.9% reduction)**

**JSON** (123 tokens):

```json
{
  "users": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "active": true
    },
    {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com",
      "active": true
    },
    {
      "id": 3,
      "name": "Charlie",
      "email": "charlie@example.com",
      "active": false
    }
  ],
  "total": 3,
  "page": 1
}
```

**TOON** (53 tokens):

```
users[3]{id,name,email,active}:
  1,Alice,alice@example.com,true
  2,Bob,bob@example.com,true
  3,Charlie,charlie@example.com,false
total: 3
page: 1
```

---

### 📊 Analytics data

**Savings: 115 tokens (55.0% reduction)**

**JSON** (209 tokens):

```json
{
  "metrics": [
    {
      "date": "2025-01-01",
      "views": 1234,
      "clicks": 89,
      "conversions": 12
    },
    {
      "date": "2025-01-02",
      "views": 2345,
      "clicks": 156,
      "conversions": 23
    },
    {
      "date": "2025-01-03",
      "views": 1890,
      "clicks": 123,
      "conversions": 18
    },
    {
      "date": "2025-01-04",
      "views": 3456,
      "clicks": 234,
      "conversions": 34
    },
    {
      "date": "2025-01-05",
      "views": 2789,
      "clicks": 178,
      "conversions": 27
    }
  ]
}
```

**TOON** (94 tokens):

```
metrics[5]{date,views,clicks,conversions}:
  2025-01-01,1234,89,12
  2025-01-02,2345,156,23
  2025-01-03,1890,123,18
  2025-01-04,3456,234,34
  2025-01-05,2789,178,27
```

</details>

<!-- /automd -->

> [!NOTE]
> Measured with [`gpt-tokenizer`](https://github.com/niieani/gpt-tokenizer) using `o200k_base` encoding (used by GPT-5 and other modern models). Savings will vary across models and tokenizers.

## Why TOON?

Standard JSON is verbose and token-expensive in LLM contexts:

```json
{
  "users": [
    { "id": 1, "name": "Alice", "role": "admin" },
    { "id": 2, "name": "Bob", "role": "user" }
  ]
}
```

TOON conveys the same information with **fewer tokens**:

```
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

## Key Features

- 💸 **Token-efficient:** typically 30–60% fewer tokens vs JSON on GPT-style tokenizers, based on real benchmarks
- 🎛️ **Deterministic, tokenizer-aware output:** minimal quoting and stable ordering keep payloads compact and reproducible
- 🧺 **Tabular arrays without repetition:** declare uniform keys once, then stream rows for dense datasets
- 📐 **Readable yet concise structure:** indentation replaces braces so nested data stays scannable without extra tokens
- 🔢 **LLM-friendly guardrails:** explicit lengths and field lists help models validate and reproduce structured responses

## Installation

```bash
# npm
npm install @byjohann/toon

# pnpm
pnpm add @byjohann/toon

# yarn
yarn add @byjohann/toon
```

## Quick Start

```ts
import { encode } from '@byjohann/toon'

const data = {
  user: {
    id: 123,
    name: 'Ada',
    tags: ['reading', 'gaming'],
    active: true,
    preferences: []
  }
}

console.log(encode(data))
```

Output:

```
user:
  id: 123
  name: Ada
  tags[2]: reading,gaming
  active: true
  preferences[0]:
```

## Canonical Formatting Rules

TOON formatting is deterministic and minimal:

- **Indentation**: 2 spaces per nesting level.
- **Lines**:
  - `key: value` for primitives (single space after colon).
  - `key:` for nested/empty objects (no trailing space on that line).
- **Arrays**:
  - Delimiter encoding: Comma delimiters are implicit in array headers (e.g., `tags[3]:`, `items[2]{id,name}:`). Tab and pipe delimiters are explicitly shown in array headers (e.g., `tags[3|]:`, `items[2	]{id	name}:`).
  - Primitive arrays inline: `key[N]: v1,v2` (comma) or `key[N<delim>]: v1<delim>v2` (tab/pipe).
  - Tabular arrays: `key[N]{f1,f2}: …` (comma) or `key[N<delim>]{f1<delim>f2}: …` (tab/pipe).
  - List items: two spaces, hyphen, space (`"  - …"`).
- **Whitespace invariants**:
  - No trailing spaces at end of any line.
  - No trailing newline at end of output.

## Format Overview

### Objects

Simple objects with primitive values:

```ts
encode({
  id: 123,
  name: 'Ada',
  active: true
})
```

```
id: 123
name: Ada
active: true
```

Nested objects:

```ts
encode({
  user: {
    id: 123,
    name: 'Ada'
  }
})
```

```
user:
  id: 123
  name: Ada
```

### Arrays

> [!TIP]
> TOON includes the array length in brackets (e.g., `items[3]`). When using comma delimiters (default), the delimiter is implicit. When using tab or pipe delimiters, the delimiter is explicitly shown in the header (e.g., `tags[2|]` or `[2	]`). This encoding helps LLMs identify the delimiter and track the number of elements, reducing errors when generating or validating structured output.

#### Primitive Arrays (Inline)

```ts
encode({
  tags: ['admin', 'ops', 'dev']
})
```

```
tags[3]: admin,ops,dev
```

#### Arrays of Objects (Tabular)

When all objects share the same primitive fields, TOON uses an efficient **tabular format**:

```ts
encode({
  items: [
    { sku: 'A1', qty: 2, price: 9.99 },
    { sku: 'B2', qty: 1, price: 14.5 }
  ]
})
```

```
items[2]{sku,qty,price}:
  A1,2,9.99
  B2,1,14.5
```

**Tabular formatting applies recursively:** nested arrays of objects (whether as object properties or inside list items) also use tabular format if they meet the same requirements.

```ts
encode({
  items: [
    {
      users: [
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Bob' }
      ],
      status: 'active'
    }
  ]
})
```

```
items[1]:
  - users[2]{id,name}:
    1,Ada
    2,Bob
    status: active
```

#### Mixed and Non-Uniform Arrays

Arrays that don't meet the tabular requirements use list format:

```
items[3]:
  - 1
  - a: 1
  - text
```

When objects appear in list format, the first field is placed on the hyphen line:

```
items[2]:
  - id: 1
    name: First
  - id: 2
    name: Second
    extra: true
```

> [!NOTE]
> **Nested array indentation:** When the first field of a list item is an array (primitive, tabular, or nested), its contents are indented two spaces under the header line, and subsequent fields of the same object appear at that same indentation level. This remains unambiguous because list items begin with `"- "`, tabular arrays declare a fixed row count in their header, and object fields contain `":"`.

#### Arrays of Arrays

When you have arrays containing primitive inner arrays:

```ts
encode({
  pairs: [
    [1, 2],
    [3, 4]
  ]
})
```

```
pairs[2]:
  - [2]: 1,2
  - [2]: 3,4
```

#### Empty Arrays and Objects

Empty containers have special representations:

```ts
encode({ items: [] }) // items[0]:
encode([]) // [0]:
encode({}) // (empty output)
encode({ config: {} }) // config:
```

### Quoting Rules

TOON quotes strings **only when necessary** to maximize token efficiency. Inner spaces are allowed; leading or trailing spaces force quotes. Unicode and emoji are safe unquoted.

> [!NOTE]
> When using alternative delimiters (tab or pipe), the quoting rules adapt automatically. Strings containing the active delimiter will be quoted, while other delimiters remain safe.

#### Keys

Keys are quoted when any of the following is true:

| Condition | Examples |
|---|---|
| Contains spaces, commas, colons, quotes, control chars | `"full name"`, `"a,b"`, `"order:id"`, `"tab\there"` |
| Contains brackets or braces | `"[index]"`, `"{key}"` |
| Leading hyphen | `"-lead"` |
| Numeric-only key | `"123"` |
| Empty key | `""` |

**Notes:**

- Quotes and control characters in keys are escaped (e.g., `"he said \"hi\""`, `"line\nbreak"`).

#### String Values

String values are quoted when any of the following is true:

| Condition | Examples |
|---|---|
| Empty string | `""` |
| Contains active delimiter, colon, quote, backslash, or control chars | `"a,b"` (comma), `"a\tb"` (tab), `"a\|b"` (pipe), `"a:b"`, `"say \"hi\""`, `"C:\\Users"`, `"line1\\nline2"` |
| Leading or trailing spaces | `" padded "`, `"  "` |
| Looks like boolean/number/null | `"true"`, `"false"`, `"null"`, `"42"`, `"-3.14"`, `"1e-6"`, `"05"` |
| Starts with `"- "` (list-like) | `"- item"` |
| Looks like structural token | `"[5]"`, `"{key}"`, `"[3]: x,y"` |

> [!IMPORTANT]
> **Delimiter-aware quoting:** Unquoted strings never contain `:` or the active delimiter. This makes TOON reliably parseable with simple heuristics: split key/value on first `: `, and split array values on the delimiter declared in the array header. When using tab or pipe delimiters, commas don't need quoting – only the active delimiter triggers quoting for both array values and object values.

#### Examples

```
note: "hello, world"
items[3]: foo,"true","- item"
hello 👋 world         // unquoted
" padded "             // quoted
value: null            // null value
name: ""               // empty string (quoted)
text: "line1\nline2"   // multi-line string (escaped)
```

### Tabular Format Requirements

For arrays of objects to use the efficient tabular format, all of the following must be true:

| Requirement | Detail |
|---|---|
| All elements are objects | No primitives in the array |
| Identical key sets | No missing or extra keys across rows |
| Primitive values only | No nested arrays or objects |
| Header delimiter | Comma is implicit in headers (`[N]{f1,f2}`); tab and pipe are explicit (`[N	]{f1	f2}`, `[N|]{f1|f2}`) |
| Header key order | Taken from the first object |
| Header key quoting | Same rules as object keys; keys containing the active delimiter must be quoted |
| Row value quoting | Same rules as string values; values containing the active delimiter must be quoted |

If any condition fails, TOON falls back to list format.

## Type Conversions

Some non-JSON types are automatically normalized for LLM-safe output:

| Input | Output |
|---|---|
| Number (finite) | Decimal form, no scientific notation; `-0` → `0` |
| Number (`NaN`, `±Infinity`) | `null` |
| `BigInt` | Decimal digits (no quotes) |
| `Date` | ISO string in quotes (e.g., `"2025-01-01T00:00:00.000Z"`) |
| `undefined` | `null` |
| `function` | `null` |
| `symbol` | `null` |

Number normalization examples:

```
-0    → 0
1e6   → 1000000
1e-6  → 0.000001
```

## API

### `encode(value: unknown, options?: EncodeOptions): string`

Converts any JSON-serializable value to TOON format.

**Parameters:**

- `value` – Any JSON-serializable value (object, array, primitive, or nested structure). Non-JSON-serializable values (functions, symbols, undefined, non-finite numbers) are converted to `null`. Dates are converted to ISO strings, and BigInts are emitted as decimal integers (no quotes).
- `options` – Optional encoding options:
  - `indent?: number` – Number of spaces per indentation level (default: `2`)
  - `delimiter?: ',' | '\t' | '|'` – Delimiter for array values and tabular rows (default: `','`)
  - `lengthMarker?: '#' | false` – Optional marker to prefix array lengths (default: `false`)

**Returns:**

A TOON-formatted string with no trailing newline or spaces.

**Example:**

```ts
import { encode } from '@byjohann/toon'

const items = [
  { sku: 'A1', qty: 2, price: 9.99 },
  { sku: 'B2', qty: 1, price: 14.5 }
]

console.log(encode({ items }))
```

**Output:**

```
items[2]{sku,qty,price}:
  A1,2,9.99
  B2,1,14.5
```

#### Delimiter Options

The `delimiter` option allows you to choose between comma (default), tab, or pipe delimiters for array values and tabular rows. Alternative delimiters can provide additional token savings in specific contexts.

##### Tab Delimiter (`\t`)

Using tab delimiters instead of commas can reduce token count further, especially for tabular data:

```ts
import { encode } from '@byjohann/toon'

const data = {
  items: [
    { sku: 'A1', name: 'Widget', qty: 2, price: 9.99 },
    { sku: 'B2', name: 'Gadget', qty: 1, price: 14.5 }
  ]
}

console.log(encode(data, { delimiter: '\t' }))
```

**Output:**

```
items[2	]{sku	name	qty	price}:
  A1	Widget	2	9.99
  B2	Gadget	1	14.5
```

**Benefits:**

- Tabs are single characters and often tokenize more efficiently than commas.
- Tabs rarely appear in natural text, reducing the need for quote-escaping.
- The delimiter is explicitly encoded in the array header, making it self-descriptive.

**Considerations:**

- Some terminals and editors may collapse or expand tabs visually.
- String values containing tabs will still require quoting.

##### Pipe Delimiter (`|`)

Pipe delimiters offer a middle ground between commas and tabs:

```ts
console.log(encode(data, { delimiter: '|' }))
```

**Output:**

```
items[2|]{sku|name|qty|price}:
  A1|Widget|2|9.99
  B2|Gadget|1|14.5
```

#### Length Marker Option

The `lengthMarker` option adds an optional hash (`#`) prefix to array lengths to emphasize that the bracketed value represents a count, not an index:

```ts
import { encode } from '@byjohann/toon'

const data = {
  tags: ['reading', 'gaming', 'coding'],
  items: [
    { sku: 'A1', qty: 2, price: 9.99 },
    { sku: 'B2', qty: 1, price: 14.5 },
  ],
}

console.log(encode(data, { lengthMarker: '#' }))
// tags[#3]: reading,gaming,coding
// items[#2]{sku,qty,price}:
//   A1,2,9.99
//   B2,1,14.5

// Works with custom delimiters
console.log(encode(data, { lengthMarker: '#', delimiter: '|' }))
// tags[#3|]: reading|gaming|coding
// items[#2|]{sku|qty|price}:
//   A1|2|9.99
//   B2|1|14.5
```

## Using TOON in LLM Prompts

When incorporating TOON into your LLM workflows:

- Wrap TOON data in a fenced code block in your prompt.
- Tell the model: "Do not add extra punctuation or spaces; follow the exact TOON format."
- When asking the model to generate TOON, specify the same rules (2-space indentation, no trailing spaces, quoting rules).

## Notes and Limitations

- **Token counts vary by tokenizer and model.** Benchmarks use a GPT-style tokenizer (cl100k/o200k); actual savings will differ with other models (e.g., SentencePiece).
- **TOON is designed for LLM contexts** where human readability and token efficiency matter. It's **not** a drop-in replacement for JSON in APIs or storage.
- **Tabular arrays** require all objects to have exactly the same keys with primitive values only. Arrays with mixed types (primitives + objects/arrays), non-uniform objects, or nested structures will use a more verbose list format.
- **Object key order** is preserved from the input. In tabular arrays, header order follows the first object's keys.
- **Arrays mixing primitives and objects/arrays** always use list form:
  ```
  items[2]:
    - a: 1
    - [2]: 1,2
  ```
- **Deterministic formatting:** 2-space indentation, stable key order, no trailing spaces/newline.

## Quick Reference

```
// Object
{ id: 1, name: 'Ada' }          → id: 1
                                  name: Ada

// Nested object
{ user: { id: 1 } }             → user:
                                    id: 1

// Primitive array (inline)
{ tags: ['foo', 'bar'] }        → tags[2]: foo,bar

// Tabular array (uniform objects)
{ items: [                      → items[2]{id,qty}:
  { id: 1, qty: 5 },                1,5
  { id: 2, qty: 3 }                 2,3
]}

// Mixed / non-uniform (list)
{ items: [1, { a: 1 }, 'x'] }   → items[3]:
                                    - 1
                                    - a: 1
                                    - x

// Array of arrays
{ pairs: [[1, 2], [3, 4]] }     → pairs[2]:
                                    - [2]: 1,2
                                    - [2]: 3,4

// Root array
['x', 'y']                      → [2]: x,y

// Empty containers
{}                              → (empty output)
{ items: [] }                   → items[0]:

// Special quoting
{ note: 'hello, world' }        → note: "hello, world"
{ items: ['true', true] }       → items[2]: "true",true
```

## License

[MIT](./LICENSE) License © 2025-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
