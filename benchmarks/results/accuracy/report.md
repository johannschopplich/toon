### Retrieval Accuracy

Tested across **3 LLMs** with data retrieval tasks:

```
gpt-5-nano
  toon         ████████████████████  99.4% (158/159)
  yaml         ███████████████████░  95.0% (151/159)
  csv          ██████████████████░░  92.5% (147/159)
  json         ██████████████████░░  92.5% (147/159)
  xml          ██████████████████░░  91.2% (145/159)

claude-haiku-4-5
  toon         ███████████████░░░░░  75.5% (120/159)
  xml          ███████████████░░░░░  75.5% (120/159)
  csv          ███████████████░░░░░  75.5% (120/159)
  json         ███████████████░░░░░  75.5% (120/159)
  yaml         ███████████████░░░░░  74.2% (118/159)

gemini-2.5-flash
  xml          ██████████████████░░  91.8% (146/159)
  csv          █████████████████░░░  86.2% (137/159)
  toon         █████████████████░░░  84.9% (135/159)
  json         ████████████████░░░░  81.8% (130/159)
  yaml         ████████████████░░░░  78.6% (125/159)
```

**Advantage:** TOON achieves **86.6% accuracy** (vs JSON's 83.2%) while using **46.3% fewer tokens**.

<details>
<summary><strong>Performance by dataset and model</strong></summary>

#### Performance by Dataset

##### Uniform employee records (TOON optimal format)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 87.4% | 2.483 | 152/174 |
| `csv` | 82.8% | 2.337 | 144/174 |
| `yaml` | 83.9% | 4.969 | 146/174 |
| `json` | 83.9% | 6.347 | 146/174 |
| `xml` | 88.5% | 7.314 | 154/174 |

##### E-commerce orders with nested structures

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 90.9% | 5.967 | 120/132 |
| `csv` | 93.9% | 6.735 | 124/132 |
| `yaml` | 87.1% | 7.328 | 115/132 |
| `json` | 87.9% | 9.694 | 116/132 |
| `xml` | 93.2% | 10.992 | 123/132 |

##### Time-series analytics data

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 89.7% | 1.393 | 78/87 |
| `toon` | 88.5% | 1.515 | 77/87 |
| `yaml` | 83.9% | 2.938 | 73/87 |
| `json` | 88.5% | 3.665 | 77/87 |
| `xml` | 85.1% | 4.376 | 74/87 |

##### Top 100 GitHub repositories

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 76.2% | 8.745 | 64/84 |
| `csv` | 69.0% | 8.513 | 58/84 |
| `yaml` | 71.4% | 13.129 | 60/84 |
| `json` | 69.0% | 15.145 | 58/84 |
| `xml` | 71.4% | 17.095 | 60/84 |

#### Performance by Model

##### gpt-5-nano

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 99.4% | 158/159 |
| `yaml` | 95.0% | 151/159 |
| `csv` | 92.5% | 147/159 |
| `json` | 92.5% | 147/159 |
| `xml` | 91.2% | 145/159 |

##### claude-haiku-4-5

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 75.5% | 120/159 |
| `xml` | 75.5% | 120/159 |
| `csv` | 75.5% | 120/159 |
| `json` | 75.5% | 120/159 |
| `yaml` | 74.2% | 118/159 |

##### gemini-2.5-flash

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `xml` | 91.8% | 146/159 |
| `csv` | 86.2% | 137/159 |
| `toon` | 84.9% | 135/159 |
| `json` | 81.8% | 130/159 |
| `yaml` | 78.6% | 125/159 |

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

~160 questions are generated dynamically across three categories:

- **Field retrieval (50%)**: Direct value lookups
  - Example: "What is Alice's salary?" → `75000`
  - Example: "What is the customer name for order ORD-0042?" → `John Doe`

- **Aggregation (25%)**: Counting and summation tasks
  - Example: "How many employees work in Engineering?" → `17`
  - Example: "What is the total revenue across all orders?" → `45123.50`

- **Filtering (25%)**: Conditional queries
  - Example: "How many employees in Sales have salary > 80000?" → `5`
  - Example: "How many orders have total > 400?" → `12`

#### Evaluation Process

1. **Format conversion:** Each dataset is converted to all 5 formats (TOON, JSON, YAML, CSV, XML).
2. **Query LLM**: Each model receives formatted data + question in a prompt and extracts the answer.
4. **Validate with LLM-as-judge**: `gpt-5-nano` validates if the answer is semantically correct (e.g., `50000` = `$50,000`, `Engineering` = `engineering`, `2025-01-01` = `January 1, 2025`).

#### Models & Configuration

- **Models tested**: `gpt-5-nano`, `claude-haiku-4-5`, `gemini-2.5-flash`
- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding (GPT-5 tokenizer)
- **Temperature**: 0 (for non-reasoning models)
- **Total evaluations**: 159 questions × 5 formats × 3 models = 2,385 LLM calls

</details>
