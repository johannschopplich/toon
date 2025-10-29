![TOON logo with step‑by‑step guide](./.github/og.png)

# Token-Oriented Object Notation (TOON)

**Token-Oriented Object Notation** is a compact, human-readable format designed for passing structured data to Large Language Models with significantly reduced token usage. It's intended for LLM input, not output.

TOON's sweet spot is **uniform complex objects** – multiple fields per row, same structure across items. It borrows YAML's indentation-based structure for nested objects and CSV's tabular format for uniform data rows, then optimizes both for token efficiency in LLM contexts.

## Why TOON?

AI is becoming cheaper and more accessible, but larger context windows allow for larger data inputs as well. **LLM tokens still cost money** – and standard JSON is verbose and token-expensive:

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

<details>
<summary>Another reason</summary>

[![xkcd: Standards](https://imgs.xkcd.com/comics/standards_2x.png)](https://xkcd.com/927/)

</details>

## Key Features

- 💸 **Token-efficient:** typically 30–60% fewer tokens than JSON
- 🤿 **LLM-friendly guardrails:** explicit lengths and field lists help models validate output
- 🍱 **Minimal syntax:** removes redundant punctuation (braces, brackets, most quotes)
- 📐 **Indentation-based structure:** replaces braces with whitespace for better readability
- 🧺 **Tabular arrays:** declare keys once, then stream rows without repetition

## Benchmarks

<!-- automd:file src="./benchmarks/results/token-efficiency.md" -->

### Token Efficiency

```
⭐ GitHub Repositories       ██████████████░░░░░░░░░░░   8,745 tokens
                             vs JSON: 15,145  💰 42.3% saved
                             vs XML:  17,095  💰 48.8% saved

📈 Daily Analytics           ██████████░░░░░░░░░░░░░░░   4,507 tokens
                             vs JSON: 10,977  💰 58.9% saved
                             vs XML:  13,128  💰 65.7% saved

🛒 E-Commerce Order          ████████████████░░░░░░░░░     166 tokens
                             vs JSON:    257  💰 35.4% saved
                             vs XML:     271  💰 38.7% saved

─────────────────────────────────────────────────────────────────────
Total                        ████████████░░░░░░░░░░░░░  13,418 tokens
                             vs JSON: 26,379  💰 49.1% saved
                             vs XML:  30,494  💰 56.0% saved
```

<details>
<summary><strong>View detailed examples</strong></summary>

#### ⭐ GitHub Repositories

**Configuration:** Top 100 GitHub repositories with stars, forks, and metadata

**Savings:** 6,400 tokens (42.3% reduction vs JSON)

**JSON** (15,145 tokens):

```json
{
  "repositories": [
    {
      "id": 28457823,
      "name": "freeCodeCamp",
      "repo": "freeCodeCamp/freeCodeCamp",
      "description": "freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming,…",
      "createdAt": "2014-12-24T17:49:19Z",
      "updatedAt": "2025-10-28T11:58:08Z",
      "pushedAt": "2025-10-28T10:17:16Z",
      "stars": 430886,
      "watchers": 8583,
      "forks": 42146,
      "defaultBranch": "main"
    },
    {
      "id": 132750724,
      "name": "build-your-own-x",
      "repo": "codecrafters-io/build-your-own-x",
      "description": "Master programming by recreating your favorite technologies from scratch.",
      "createdAt": "2018-05-09T12:03:18Z",
      "updatedAt": "2025-10-28T12:37:11Z",
      "pushedAt": "2025-10-10T18:45:01Z",
      "stars": 430877,
      "watchers": 6332,
      "forks": 40453,
      "defaultBranch": "master"
    },
    {
      "id": 21737465,
      "name": "awesome",
      "repo": "sindresorhus/awesome",
      "description": "😎 Awesome lists about all kinds of interesting topics",
      "createdAt": "2014-07-11T13:42:37Z",
      "updatedAt": "2025-10-28T12:40:21Z",
      "pushedAt": "2025-10-27T17:57:31Z",
      "stars": 410052,
      "watchers": 8017,
      "forks": 32029,
      "defaultBranch": "main"
    }
  ]
}
```

**TOON** (8,745 tokens):

```
repositories[3]{id,name,repo,description,createdAt,updatedAt,pushedAt,stars,watchers,forks,defaultBranch}:
  28457823,freeCodeCamp,freeCodeCamp/freeCodeCamp,"freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming,…","2014-12-24T17:49:19Z","2025-10-28T11:58:08Z","2025-10-28T10:17:16Z",430886,8583,42146,main
  132750724,build-your-own-x,codecrafters-io/build-your-own-x,Master programming by recreating your favorite technologies from scratch.,"2018-05-09T12:03:18Z","2025-10-28T12:37:11Z","2025-10-10T18:45:01Z",430877,6332,40453,master
  21737465,awesome,sindresorhus/awesome,😎 Awesome lists about all kinds of interesting topics,"2014-07-11T13:42:37Z","2025-10-28T12:40:21Z","2025-10-27T17:57:31Z",410052,8017,32029,main
```

---

#### 📈 Daily Analytics

**Configuration:** 180 days of web metrics (views, clicks, conversions, revenue)

**Savings:** 6,470 tokens (58.9% reduction vs JSON)

**JSON** (10,977 tokens):

```json
{
  "metrics": [
    {
      "date": "2025-01-01",
      "views": 6890,
      "clicks": 401,
      "conversions": 23,
      "revenue": 6015.59,
      "bounceRate": 0.63
    },
    {
      "date": "2025-01-02",
      "views": 6940,
      "clicks": 323,
      "conversions": 37,
      "revenue": 9086.44,
      "bounceRate": 0.36
    },
    {
      "date": "2025-01-03",
      "views": 4390,
      "clicks": 346,
      "conversions": 26,
      "revenue": 6360.75,
      "bounceRate": 0.48
    },
    {
      "date": "2025-01-04",
      "views": 3429,
      "clicks": 231,
      "conversions": 13,
      "revenue": 2360.96,
      "bounceRate": 0.65
    },
    {
      "date": "2025-01-05",
      "views": 5804,
      "clicks": 186,
      "conversions": 22,
      "revenue": 2535.96,
      "bounceRate": 0.37
    }
  ]
}
```

**TOON** (4,507 tokens):

```
metrics[5]{date,views,clicks,conversions,revenue,bounceRate}:
  2025-01-01,6890,401,23,6015.59,0.63
  2025-01-02,6940,323,37,9086.44,0.36
  2025-01-03,4390,346,26,6360.75,0.48
  2025-01-04,3429,231,13,2360.96,0.65
  2025-01-05,5804,186,22,2535.96,0.37
```

</details>

<!-- /automd -->

> [!NOTE]
> Measured with [`gpt-tokenizer`](https://github.com/niieani/gpt-tokenizer) using `o200k_base` encoding (used by GPT-5 and other modern models). Savings will vary across models and tokenizers.

<!-- automd:file src="./benchmarks/results/retrieval-accuracy.md" -->

### Retrieval Accuracy

Accuracy across **4 LLMs** on 154 data retrieval questions:

```
gpt-5-nano
→ toon         ███████████████████░  96.1% (148/154)
  csv          ██████████████████░░  90.3% (139/154)
  yaml         ██████████████████░░  89.0% (137/154)
  json         ██████████████████░░  87.7% (135/154)
  xml          █████████████████░░░  83.8% (129/154)

claude-haiku-4-5-20251001
  yaml         ██████████░░░░░░░░░░  49.4% (76/154)
→ toon         ██████████░░░░░░░░░░  48.1% (74/154)
  csv          ██████████░░░░░░░░░░  48.1% (74/154)
  json         █████████░░░░░░░░░░░  47.4% (73/154)
  xml          █████████░░░░░░░░░░░  46.8% (72/154)

gemini-2.5-flash
  csv          ██████████████████░░  87.7% (135/154)
  xml          █████████████████░░░  85.1% (131/154)
→ toon         █████████████████░░░  83.8% (129/154)
  json         ████████████████░░░░  78.6% (121/154)
  yaml         ███████████████░░░░░  76.6% (118/154)

grok-4-fast-non-reasoning
→ toon         ██████████░░░░░░░░░░  48.7% (75/154)
  json         ██████████░░░░░░░░░░  48.1% (74/154)
  xml          █████████░░░░░░░░░░░  47.4% (73/154)
  yaml         █████████░░░░░░░░░░░  46.8% (72/154)
  csv          █████████░░░░░░░░░░░  45.5% (70/154)
```

**Advantage:** TOON achieves **69.2% accuracy** (vs JSON's 65.4%) while using **46.3% fewer tokens**.

<details>
<summary><strong>Performance by dataset and model</strong></summary>

#### Performance by Dataset

##### Uniform employee records (TOON optimal format)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 67.0% | 2,337 | 134/200 |
| `toon` | 66.5% | 2,483 | 133/200 |
| `yaml` | 65.5% | 4,969 | 131/200 |
| `json` | 63.5% | 6,347 | 127/200 |
| `xml` | 66.5% | 7,314 | 133/200 |

##### E-commerce orders with nested structures

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 78.8% | 5,967 | 126/160 |
| `csv` | 71.9% | 6,735 | 115/160 |
| `yaml` | 71.9% | 7,328 | 115/160 |
| `json` | 73.1% | 9,694 | 117/160 |
| `xml` | 73.8% | 10,992 | 118/160 |

##### Time-series analytics data

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 67.6% | 1,393 | 92/136 |
| `toon` | 67.6% | 1,515 | 92/136 |
| `yaml` | 64.7% | 2,938 | 88/136 |
| `json` | 68.4% | 3,665 | 93/136 |
| `xml` | 66.2% | 4,376 | 90/136 |

##### Top 100 GitHub repositories

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 64.2% | 8,513 | 77/120 |
| `toon` | 62.5% | 8,745 | 75/120 |
| `yaml` | 57.5% | 13,129 | 69/120 |
| `json` | 55.0% | 15,145 | 66/120 |
| `xml` | 53.3% | 17,095 | 64/120 |

#### Performance by Model

##### gpt-5-nano

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 96.1% | 148/154 |
| `csv` | 90.3% | 139/154 |
| `yaml` | 89.0% | 137/154 |
| `json` | 87.7% | 135/154 |
| `xml` | 83.8% | 129/154 |

##### claude-haiku-4-5-20251001

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `yaml` | 49.4% | 76/154 |
| `toon` | 48.1% | 74/154 |
| `csv` | 48.1% | 74/154 |
| `json` | 47.4% | 73/154 |
| `xml` | 46.8% | 72/154 |

##### gemini-2.5-flash

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `csv` | 87.7% | 135/154 |
| `xml` | 85.1% | 131/154 |
| `toon` | 83.8% | 129/154 |
| `json` | 78.6% | 121/154 |
| `yaml` | 76.6% | 118/154 |

##### grok-4-fast-non-reasoning

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 48.7% | 75/154 |
| `json` | 48.1% | 74/154 |
| `xml` | 47.4% | 73/154 |
| `yaml` | 46.8% | 72/154 |
| `csv` | 45.5% | 70/154 |

</details>

<details>
<summary><strong>How the benchmark works</strong></summary>

#### What's Being Measured

This benchmark tests **LLM comprehension and data retrieval accuracy** across different input formats. Each LLM receives formatted data and must answer questions about it (this does **not** test model's ability to generate TOON output).

#### Datasets Tested

Four datasets designed to test different structural patterns:

1. **Tabular** (100 employee records): Uniform objects with identical fields – optimal for TOON's tabular format.
2. **Nested** (50 e-commerce orders): Complex structures with nested customer objects and item arrays.
3. **Analytics** (60 days of metrics): Time-series data with dates and numeric values.
4. **GitHub** (100 repositories): Real-world data from top GitHub repos by stars.

#### Question Types

154 questions are generated dynamically across three categories:

- **Field retrieval (40%)**: Direct value lookups or values that can be read straight off a record (including booleans and simple counts such as array lengths)
  - Example: "What is Alice's salary?" → `75000`
  - Example: "How many items are in order ORD-0042?" → `3`
  - Example: "What is the customer name for order ORD-0042?" → `John Doe`

- **Aggregation (32%)**: Dataset-level totals and averages plus single-condition filters (counts, sums, min/max comparisons)
  - Example: "How many employees work in Engineering?" → `17`
  - Example: "What is the total revenue across all orders?" → `45123.50`
  - Example: "How many employees have salary > 80000?" → `23`

- **Filtering (28%)**: Multi-condition queries requiring compound logic (AND constraints across fields)
  - Example: "How many employees in Sales have salary > 80000?" → `5`
  - Example: "How many active employees have more than 10 years of experience?" → `8`

#### Evaluation Process

1. **Format conversion:** Each dataset is converted to all 5 formats (TOON, CSV, XML, JSON, YAML).
2. **Query LLM**: Each model receives formatted data + question in a prompt and extracts the answer.
3. **Validate with LLM-as-judge**: `gpt-5-nano` validates if the answer is semantically correct (e.g., `50000` = `$50,000`, `Engineering` = `engineering`, `2025-01-01` = `January 1, 2025`).

#### Models & Configuration

- **Models tested**: `gpt-5-nano`, `claude-haiku-4-5-20251001`, `gemini-2.5-flash`, `grok-4-fast-non-reasoning`
- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding (GPT-5 tokenizer)
- **Temperature**: Not set (models use their defaults)
- **Total evaluations**: 154 questions × 5 formats × 4 models = 3,080 LLM calls

</details>

<!-- /automd -->

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

TOON quotes strings **only when necessary** to maximize token efficiency:

- Inner spaces are allowed; leading or trailing spaces force quotes.
- Unicode and emoji are safe unquoted.
- Quotes and control characters are escaped with backslash.

> [!NOTE]
> When using alternative delimiters (tab or pipe), the quoting rules adapt automatically. Strings containing the active delimiter will be quoted, while other delimiters remain safe.

#### Object Keys and Field Names

Keys are unquoted if they match the identifier pattern: start with a letter or underscore, followed by letters, digits, underscores, or dots (e.g., `id`, `userName`, `user_name`, `user.name`, `_private`). All other keys must be quoted (e.g., `"user name"`, `"order-id"`, `"123"`, `"order:id"`, `""`).

#### String Values

String values are quoted when any of the following is true:

| Condition | Examples |
|---|---|
| Empty string | `""` |
| Leading or trailing spaces | `" padded "`, `"  "` |
| Contains active delimiter, colon, quote, backslash, or control chars | `"a,b"` (comma), `"a\tb"` (tab), `"a\|b"` (pipe), `"a:b"`, `"say \"hi\""`, `"C:\\Users"`, `"line1\\nline2"` |
| Looks like boolean/number/null | `"true"`, `"false"`, `"null"`, `"42"`, `"-3.14"`, `"1e-6"`, `"05"` |
| Starts with `"- "` (list-like) | `"- item"` |
| Looks like structural token | `"[5]"`, `"{key}"`, `"[3]: x,y"` |

**Examples of unquoted strings:** Unicode and emoji are safe (`hello 👋 world`), as are strings with inner spaces (`hello world`).

> [!IMPORTANT]
> **Delimiter-aware quoting:** Unquoted strings never contain `:` or the active delimiter. This makes TOON reliably parseable with simple heuristics: split key/value on first `: `, and split array values on the delimiter declared in the array header. When using tab or pipe delimiters, commas don't need quoting – only the active delimiter triggers quoting for both array values and object values.

## Type Conversions

Some non-JSON types are automatically normalized for LLM-safe output:

| Input | Output |
|---|---|
| Number (finite) | Decimal form, no scientific notation (e.g., `-0` → `0`, `1e6` → `1000000`) |
| Number (`NaN`, `±Infinity`) | `null` |
| `BigInt` | Decimal digits (no quotes) |
| `Date` | ISO string in quotes (e.g., `"2025-01-01T00:00:00.000Z"`) |
| `undefined` | `null` |
| `function` | `null` |
| `symbol` | `null` |

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

encode({ items })
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
const data = {
  items: [
    { sku: 'A1', name: 'Widget', qty: 2, price: 9.99 },
    { sku: 'B2', name: 'Gadget', qty: 1, price: 14.5 }
  ]
}

encode(data, { delimiter: '\t' })
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
encode(data, { delimiter: '|' })
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
const data = {
  tags: ['reading', 'gaming', 'coding'],
  items: [
    { sku: 'A1', qty: 2, price: 9.99 },
    { sku: 'B2', qty: 1, price: 14.5 },
  ],
}

encode(data, { lengthMarker: '#' })
// tags[#3]: reading,gaming,coding
// items[#2]{sku,qty,price}:
//   A1,2,9.99
//   B2,1,14.5

// Works with custom delimiters
encode(data, { lengthMarker: '#', delimiter: '|' })
// tags[#3|]: reading|gaming|coding
// items[#2|]{sku|qty|price}:
//   A1|2|9.99
//   B2|1|14.5
```

## Notes and Limitations

- Format familiarity matters as much as token count. TOON's tabular format requires arrays of objects with identical keys and primitive values only – when this doesn't hold (due to mixed types, non-uniform objects, or nested structures), TOON switches to list format where JSON can be cheaper at scale.
  - **TOON** is best for uniform complex (but not deeply nested) objects, especially large arrays of such objects.
  - **JSON** is best for non-uniform data and deeply nested structures.
- **Token counts vary by tokenizer and model.** Benchmarks use a GPT-style tokenizer (cl100k/o200k); actual savings will differ with other models (e.g., [SentencePiece](https://github.com/google/sentencepiece)).
- **TOON is designed for LLM input** where human readability and token efficiency matter. It's **not** a drop-in replacement for JSON in APIs or storage.

## Using TOON in LLM Prompts

TOON works best when you show the format instead of describing it. The structure is self-documenting – models parse it naturally once they see the pattern.

### Sending TOON to LLMs (Input)

Wrap your encoded data in a fenced code block (label it \`\`\`toon for clarity). The indentation and headers are usually enough – models treat it like familiar YAML or CSV. The explicit length markers (`[N]`) and field headers (`{field1,field2}`) help the model track structure, especially for large tables.

### Generating TOON from LLMs (Output)

For output, be more explicit. When you want the model to **generate** TOON:

- **Show the expected header** (`users[N]{id,name,role}:`). The model fills rows instead of repeating keys, reducing generation errors.
- **State the rules**: 2-space indent, no trailing spaces, `[N]` matches row count.

Here's a prompt that works for both reading and generating:

```
Data is in TOON format (2-space indent, arrays show length and fields).

\`\`\`toon
users[3]{id,name,role,lastLogin}:
  1,Alice,admin,2025-01-15T10:30:00Z
  2,Bob,user,2025-01-14T15:22:00Z
  3,Charlie,user,2025-01-13T09:45:00Z
\`\`\`

Task: Return only users with role "user" as TOON. Use the same header. Set [N] to match the row count. Output only the code block.
```

> [!TIP]
> For large uniform tables, use `encode(data, { delimiter: '\t' })` and tell the model "fields are tab-separated." Tabs often tokenize better than commas and reduce the need for quote-escaping.

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

## Ports in Other Languages

- **Elixir**: [toon_ex](https://github.com/kentaro/toon_ex)
- **PHP**: [toon-php](https://github.com/HelgeSverre/toon-php)
- **Python**: [pytoon](https://github.com/bpradana/pytoon)
  - [python-toon](https://github.com/xaviviro/python-toon)
  - [toon-python](https://gitlab.com/KanTakahiro/toon-python)
- **Ruby**: [toon-ruby](https://github.com/andrepcg/toon-ruby)
- **Java**: [JToon](https://github.com/felipestanzani/JToon)
- **.NET**: [toon.NET](https://github.com/ghost1face/toon.NET)
- **Swift**: [TOONEncoder](https://github.com/mattt/TOONEncoder)
- **Go** [gotoon](https://github.com/alpkeskin/gotoon)

## License

[MIT](./LICENSE) License © 2025-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
