### Retrieval Accuracy

Accuracy across **3 LLMs** on **154 data retrieval questions**:

```
gpt-5-nano
  toon         ███████████████████░  96.1% (148/154)
  csv          ██████████████████░░  90.3% (139/154)
  yaml         ██████████████████░░  89.0% (137/154)
  json         ██████████████████░░  87.7% (135/154)
  xml          █████████████████░░░  83.8% (129/154)

gemini-2.5-flash
  xml          ██████████████████░░  90.3% (139/154)
  csv          ██████████████████░░  89.0% (137/154)
  toon         █████████████████░░░  87.0% (134/154)
  json         ████████████████░░░░  79.2% (122/154)
  yaml         ███████████████░░░░░  76.0% (117/154)

claude-haiku-4-5-20251001
  json         ██████████░░░░░░░░░░  48.7% (75/154)
  toon         ██████████░░░░░░░░░░  48.1% (74/154)
  xml          █████████░░░░░░░░░░░  47.4% (73/154)
  yaml         █████████░░░░░░░░░░░  47.4% (73/154)
  csv          █████████░░░░░░░░░░░  45.5% (70/154)
```

**Advantage:** TOON achieves **77.1% accuracy** (vs JSON's 71.9%) while using **46.3% fewer tokens**.

<details>
<summary><strong>Performance by dataset and model</strong></summary>

#### Performance by Dataset

##### Uniform employee records (TOON optimal format)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 74.7% | 2,337 | 112/150 |
| `toon` | 76.7% | 2,483 | 115/150 |
| `yaml` | 70.7% | 4,969 | 106/150 |
| `xml` | 77.3% | 7,314 | 116/150 |
| `json` | 69.3% | 6,347 | 104/150 |

##### E-commerce orders with nested structures

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 80.0% | 5,967 | 96/120 |
| `csv` | 75.8% | 6,735 | 91/120 |
| `yaml` | 74.2% | 7,328 | 89/120 |
| `json` | 79.2% | 9,694 | 95/120 |
| `xml` | 78.3% | 10,992 | 94/120 |

##### Time-series analytics data

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 75.5% | 1,393 | 77/102 |
| `toon` | 76.5% | 1,515 | 78/102 |
| `yaml` | 74.5% | 2,938 | 76/102 |
| `json` | 76.5% | 3,665 | 78/102 |
| `xml` | 74.5% | 4,376 | 76/102 |

##### Top 100 GitHub repositories

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 74.4% | 8,745 | 67/90 |
| `csv` | 73.3% | 8,513 | 66/90 |
| `yaml` | 62.2% | 13,129 | 56/90 |
| `json` | 61.1% | 15,145 | 55/90 |
| `xml` | 61.1% | 17,095 | 55/90 |

#### Performance by Model

##### gpt-5-nano

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 96.1% | 148/154 |
| `csv` | 90.3% | 139/154 |
| `yaml` | 89.0% | 137/154 |
| `json` | 87.7% | 135/154 |
| `xml` | 83.8% | 129/154 |

##### gemini-2.5-flash

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `xml` | 90.3% | 139/154 |
| `csv` | 89.0% | 137/154 |
| `toon` | 87.0% | 134/154 |
| `json` | 79.2% | 122/154 |
| `yaml` | 76.0% | 117/154 |

##### claude-haiku-4-5-20251001

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `json` | 48.7% | 75/154 |
| `toon` | 48.1% | 74/154 |
| `xml` | 47.4% | 73/154 |
| `yaml` | 47.4% | 73/154 |
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

- **Models tested**: `claude-haiku-4-5-20251001`, `gemini-2.5-flash`, `gpt-5-nano`
- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding (GPT-5 tokenizer)
- **Temperature**: 0 (for non-reasoning models)
- **Total evaluations**: 154 questions × 5 formats × 3 models = 2,310 LLM calls

</details>
