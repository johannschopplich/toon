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

1. **Format conversion**: Each dataset is converted to all 5 formats (TOON, CSV, XML, JSON, YAML).
2. **Query LLM**: Each model receives formatted data + question in a prompt and extracts the answer.
3. **Validate with LLM-as-judge**: `gpt-5-nano` validates if the answer is semantically correct (e.g., `50000` = `$50,000`, `Engineering` = `engineering`, `2025-01-01` = `January 1, 2025`).

#### Models & Configuration

- **Models tested**: `gpt-5-nano`, `claude-haiku-4-5-20251001`, `gemini-2.5-flash`, `grok-4-fast-non-reasoning`
- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding (GPT-5 tokenizer)
- **Temperature**: Not set (models use their defaults)
- **Total evaluations**: 154 questions × 5 formats × 4 models = 3,080 LLM calls

</details>
