Benchmarks test LLM comprehension across different input formats using 154 data retrieval questions on 4 models.

#### Efficiency Ranking (Accuracy per 1K Tokens)

Each format's overall performance, balancing accuracy against token cost:

```
toon           ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   15.0  │  70.1% acc  │  4,678 tokens
csv            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░   14.3  │  67.7% acc  │  4,745 tokens
json-compact   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░   11.0  │  65.3% acc  │  5,925 tokens
yaml           ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░    9.4  │  66.7% acc  │  7,091 tokens
json-pretty    ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░    7.5  │  65.4% acc  │  8,713 tokens
xml            ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░    6.8  │  67.2% acc  │  9,944 tokens
```

TOON achieves **70.1%** accuracy (vs JSON's 65.4%) while using **46.3% fewer tokens**.

#### Per-Model Accuracy

Accuracy across **4 LLMs** on 154 data retrieval questions:

```
gpt-5-nano
→ TOON           ███████████████████░    96.1% (148/154)
  CSV            ██████████████████░░    91.6% (141/154)
  YAML           ██████████████████░░    91.6% (141/154)
  JSON compact   ██████████████████░░    91.6% (141/154)
  XML            █████████████████░░░    87.0% (134/154)
  JSON           █████████████████░░░    86.4% (133/154)

claude-haiku-4-5-20251001
  JSON           ██████████░░░░░░░░░░    50.0% (77/154)
  YAML           ██████████░░░░░░░░░░    49.4% (76/154)
→ TOON           ██████████░░░░░░░░░░    48.7% (75/154)
  XML            ██████████░░░░░░░░░░    48.1% (74/154)
  CSV            █████████░░░░░░░░░░░    47.4% (73/154)
  JSON compact   █████████░░░░░░░░░░░    44.2% (68/154)

gemini-2.5-flash
  CSV            ██████████████████░░    87.7% (135/154)
  XML            ██████████████████░░    87.7% (135/154)
→ TOON           █████████████████░░░    86.4% (133/154)
  YAML           ████████████████░░░░    79.9% (123/154)
  JSON compact   ████████████████░░░░    79.9% (123/154)
  JSON           ███████████████░░░░░    76.6% (118/154)

grok-4-fast-non-reasoning
→ TOON           ██████████░░░░░░░░░░    49.4% (76/154)
  JSON           ██████████░░░░░░░░░░    48.7% (75/154)
  XML            █████████░░░░░░░░░░░    46.1% (71/154)
  YAML           █████████░░░░░░░░░░░    46.1% (71/154)
  JSON compact   █████████░░░░░░░░░░░    45.5% (70/154)
  CSV            █████████░░░░░░░░░░░    44.2% (68/154)
```

**Key tradeoff:** TOON achieves **70.1% accuracy** (vs JSON's 65.4%) while using **46.3% fewer tokens** on these datasets.

<details>
<summary><strong>Performance by dataset and model</strong></summary>

#### Performance by Dataset

##### Uniform employee records (TOON optimal format)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 65.5% | 2,337 | 131/200 |
| `toon` | 67.5% | 2,483 | 135/200 |
| `json-compact` | 65.5% | 3,943 | 131/200 |
| `yaml` | 68.5% | 4,969 | 137/200 |
| `xml` | 69.5% | 7,314 | 139/200 |
| `json-pretty` | 64.5% | 6,347 | 129/200 |

##### E-commerce orders with nested structures

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 78.8% | 5,967 | 126/160 |
| `csv` | 76.3% | 6,735 | 122/160 |
| `json-compact` | 70.6% | 5,962 | 113/160 |
| `yaml` | 72.5% | 7,328 | 116/160 |
| `json-pretty` | 76.9% | 9,694 | 123/160 |
| `xml` | 73.1% | 10,992 | 117/160 |

##### Time-series analytics data

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 68.4% | 1,515 | 93/136 |
| `csv` | 65.4% | 1,393 | 89/136 |
| `json-compact` | 64.7% | 2,341 | 88/136 |
| `yaml` | 66.2% | 2,938 | 90/136 |
| `json-pretty` | 64.7% | 3,665 | 88/136 |
| `xml` | 66.9% | 4,376 | 91/136 |

##### Top 100 GitHub repositories

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 65.0% | 8,745 | 78/120 |
| `csv` | 62.5% | 8,513 | 75/120 |
| `json-compact` | 58.3% | 11,455 | 70/120 |
| `yaml` | 56.7% | 13,129 | 68/120 |
| `xml` | 55.8% | 17,095 | 67/120 |
| `json-pretty` | 52.5% | 15,145 | 63/120 |

#### Performance by Model

##### gpt-5-nano

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 96.1% | 148/154 |
| `csv` | 91.6% | 141/154 |
| `yaml` | 91.6% | 141/154 |
| `json-compact` | 91.6% | 141/154 |
| `xml` | 87.0% | 134/154 |
| `json-pretty` | 86.4% | 133/154 |

##### claude-haiku-4-5-20251001

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `json-pretty` | 50.0% | 77/154 |
| `yaml` | 49.4% | 76/154 |
| `toon` | 48.7% | 75/154 |
| `xml` | 48.1% | 74/154 |
| `csv` | 47.4% | 73/154 |
| `json-compact` | 44.2% | 68/154 |

##### gemini-2.5-flash

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `csv` | 87.7% | 135/154 |
| `xml` | 87.7% | 135/154 |
| `toon` | 86.4% | 133/154 |
| `yaml` | 79.9% | 123/154 |
| `json-compact` | 79.9% | 123/154 |
| `json-pretty` | 76.6% | 118/154 |

##### grok-4-fast-non-reasoning

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 49.4% | 76/154 |
| `json-pretty` | 48.7% | 75/154 |
| `xml` | 46.1% | 71/154 |
| `yaml` | 46.1% | 71/154 |
| `json-compact` | 45.5% | 70/154 |
| `csv` | 44.2% | 68/154 |

</details>

<details>
<summary><strong>How the benchmark works</strong></summary>

#### What's Being Measured

This benchmark tests **LLM comprehension and data retrieval accuracy** across different input formats. Each LLM receives formatted data and must answer questions about it (this does **not** test model's ability to generate TOON output).

#### Datasets Tested

Four datasets designed to test different structural patterns (all contain arrays of uniform objects, TOON's optimal format):

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

1. **Format conversion**: Each dataset is converted to all 6 formats (TOON, CSV, XML, YAML, JSON, JSON compact).
2. **Query LLM**: Each model receives formatted data + question in a prompt and extracts the answer.
3. **Validate with LLM-as-judge**: `gpt-5-nano` validates if the answer is semantically correct (e.g., `50000` = `$50,000`, `Engineering` = `engineering`, `2025-01-01` = `January 1, 2025`).

#### Models & Configuration

- **Models tested**: `gpt-5-nano`, `claude-haiku-4-5-20251001`, `gemini-2.5-flash`, `grok-4-fast-non-reasoning`
- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding (GPT-5 tokenizer)
- **Temperature**: Not set (models use their defaults)
- **Total evaluations**: 154 questions × 6 formats × 4 models = 3,696 LLM calls

</details>
