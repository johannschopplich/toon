Benchmarks test LLM comprehension across different input formats using 201 data retrieval questions on 4 models.

<details>
<summary><strong>View Dataset Catalog</strong></summary>

#### Dataset Catalog

| Dataset | Rows | Structure | CSV Support | Eligibility |
| ------- | ---- | --------- | ----------- | ----------- |
| Uniform employee records | 100 | uniform | ✓ | 100% |
| E-commerce orders with nested structures | 50 | nested | ✗ | 33% |
| Time-series analytics data | 60 | uniform | ✓ | 100% |
| Top 100 GitHub repositories | 100 | uniform | ✓ | 100% |
| Semi-uniform event logs | 75 | semi-uniform | ✗ | 50% |
| Deeply nested configuration | 11 | deep | ✗ | 0% |

**Structure classes:**
- **uniform**: All objects have identical fields with primitive values
- **semi-uniform**: Mix of uniform and non-uniform structures
- **nested**: Objects with nested structures (nested objects or arrays)
- **deep**: Highly nested with minimal tabular eligibility

**CSV Support:** ✓ (supported), ✗ (not supported – would require lossy flattening)

**Eligibility:** Percentage of arrays that qualify for TOON's tabular format (uniform objects with primitive values)

</details>

#### Efficiency Ranking (Accuracy per 1K Tokens)

Each format's overall performance, balancing accuracy against token cost:

```
TOON           ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   15.6  │  68.7% acc  │  4,389 tokens
CSV            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   15.3  │  62.3% acc  │  4,080 tokens
JSON compact   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░   13.5  │  67.2% acc  │  4,982 tokens
YAML           ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░   11.2  │  66.7% acc  │  5,976 tokens
JSON           ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░    9.0  │  65.7% acc  │  7,260 tokens
XML            ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░    8.1  │  66.8% acc  │  8,251 tokens
```

TOON achieves **68.7%** accuracy (vs JSON's 65.7%) while using **39.5% fewer tokens**.

#### Per-Model Accuracy

Accuracy across 4 LLMs on 201 data retrieval questions:

```
gpt-5-nano
→ TOON           ██████████████████░░    88.6% (178/201)
  JSON compact   ██████████████████░░    88.1% (177/201)
  CSV            ██████████████████░░    88.0% (88/100)
  YAML           █████████████████░░░    84.6% (170/201)
  XML            ████████████████░░░░    81.6% (164/201)
  JSON           ████████████████░░░░    80.1% (161/201)

claude-haiku-4-5-20251001
  YAML           ██████████░░░░░░░░░░    52.2% (105/201)
→ TOON           ██████████░░░░░░░░░░    50.7% (102/201)
  JSON           ██████████░░░░░░░░░░    50.2% (101/201)
  JSON compact   ██████████░░░░░░░░░░    49.8% (100/201)
  XML            ██████████░░░░░░░░░░    49.3% (99/201)
  CSV            ████████░░░░░░░░░░░░    39.0% (39/100)

gemini-2.5-flash
  XML            █████████████████░░░    86.1% (173/201)
→ TOON           █████████████████░░░    84.1% (169/201)
  CSV            ████████████████░░░░    82.0% (82/100)
  JSON compact   ████████████████░░░░    81.1% (163/201)
  YAML           ████████████████░░░░    81.1% (163/201)
  JSON           ████████████████░░░░    81.1% (163/201)

grok-4-fast-non-reasoning
→ TOON           ██████████░░░░░░░░░░    51.2% (103/201)
  JSON           ██████████░░░░░░░░░░    51.2% (103/201)
  XML            ██████████░░░░░░░░░░    50.2% (101/201)
  JSON compact   ██████████░░░░░░░░░░    49.8% (100/201)
  YAML           ██████████░░░░░░░░░░    48.8% (98/201)
  CSV            ████████░░░░░░░░░░░░    40.0% (40/100)
```

**Key tradeoff:** TOON achieves **68.7% accuracy** (vs JSON's 65.7%) while using **39.5% fewer tokens** on these datasets.

<details>
<summary><strong>Performance by dataset and model</strong></summary>

#### Performance by Dataset

##### Uniform employee records

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 65.6% | 2,483 | 105/160 |
| `csv` | 62.5% | 2,337 | 100/160 |
| `json-compact` | 66.3% | 3,943 | 106/160 |
| `yaml` | 63.7% | 4,969 | 102/160 |
| `xml` | 67.5% | 7,314 | 108/160 |
| `json-pretty` | 62.5% | 6,347 | 100/160 |

##### E-commerce orders with nested structures

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 75.6% | 7,197 | 121/160 |
| `json-compact` | 70.6% | 6,784 | 113/160 |
| `yaml` | 71.9% | 8,334 | 115/160 |
| `json-pretty` | 68.8% | 10,700 | 110/160 |
| `xml` | 71.9% | 12,013 | 115/160 |

##### Time-series analytics data

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 63.8% | 1,391 | 74/116 |
| `toon` | 66.4% | 1,513 | 77/116 |
| `json-compact` | 61.2% | 2,339 | 71/116 |
| `yaml` | 65.5% | 2,936 | 76/116 |
| `json-pretty` | 64.7% | 3,663 | 75/116 |
| `xml` | 65.5% | 4,374 | 76/116 |

##### Top 100 GitHub repositories

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 63.7% | 8,745 | 79/124 |
| `csv` | 60.5% | 8,513 | 75/124 |
| `json-compact` | 56.5% | 11,455 | 70/124 |
| `yaml` | 53.2% | 13,129 | 66/124 |
| `json-pretty` | 53.2% | 15,145 | 66/124 |
| `xml` | 53.2% | 17,095 | 66/124 |

##### Semi-uniform event logs

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `json-compact` | 55.0% | 4,809 | 66/120 |
| `yaml` | 52.5% | 5,814 | 63/120 |
| `json-pretty` | 52.5% | 6,784 | 63/120 |
| `toon` | 45.8% | 5,764 | 55/120 |
| `xml` | 50.8% | 7,699 | 61/120 |

##### Deeply nested configuration

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `json-compact` | 91.9% | 564 | 114/124 |
| `toon` | 92.7% | 631 | 115/124 |
| `yaml` | 91.9% | 673 | 114/124 |
| `json-pretty` | 91.9% | 919 | 114/124 |
| `xml` | 89.5% | 1,008 | 111/124 |

#### Performance by Model

##### gpt-5-nano

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 88.6% | 178/201 |
| `json-compact` | 88.1% | 177/201 |
| `csv` | 88.0% | 88/100 |
| `yaml` | 84.6% | 170/201 |
| `xml` | 81.6% | 164/201 |
| `json-pretty` | 80.1% | 161/201 |

##### claude-haiku-4-5-20251001

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `yaml` | 52.2% | 105/201 |
| `toon` | 50.7% | 102/201 |
| `json-pretty` | 50.2% | 101/201 |
| `json-compact` | 49.8% | 100/201 |
| `xml` | 49.3% | 99/201 |
| `csv` | 39.0% | 39/100 |

##### gemini-2.5-flash

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `xml` | 86.1% | 173/201 |
| `toon` | 84.1% | 169/201 |
| `csv` | 82.0% | 82/100 |
| `json-compact` | 81.1% | 163/201 |
| `yaml` | 81.1% | 163/201 |
| `json-pretty` | 81.1% | 163/201 |

##### grok-4-fast-non-reasoning

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 51.2% | 103/201 |
| `json-pretty` | 51.2% | 103/201 |
| `xml` | 50.2% | 101/201 |
| `json-compact` | 49.8% | 100/201 |
| `yaml` | 48.8% | 98/201 |
| `csv` | 40.0% | 40/100 |

</details>

<details>
<summary><strong>How the benchmark works</strong></summary>

#### What's Being Measured

This benchmark tests **LLM comprehension and data retrieval accuracy** across different input formats. Each LLM receives formatted data and must answer questions about it (this does **not** test model's ability to generate TOON output).

#### Datasets Tested

Six datasets designed to test different structural patterns:

1. **Tabular** (100 employee records): Uniform objects with identical fields – optimal for TOON's tabular format.
2. **Nested** (50 e-commerce orders): Complex structures with nested customer objects and item arrays.
3. **Analytics** (60 days of metrics): Time-series data with dates and numeric values.
4. **GitHub** (100 repositories): Real-world data from top GitHub repos by stars.
5. **Event Logs** (75 logs): Semi-uniform data with ~50% flat logs and ~50% with nested error objects.
6. **Nested Config** (1 configuration): Deeply nested configuration with minimal tabular eligibility.

#### Question Types

201 questions are generated dynamically across three categories:

- **Field retrieval (36%)**: Direct value lookups or values that can be read straight off a record (including booleans and simple counts such as array lengths)
  - Example: "What is Alice's salary?" → `75000`
  - Example: "How many items are in order ORD-0042?" → `3`
  - Example: "What is the customer name for order ORD-0042?" → `John Doe`

- **Aggregation (37%)**: Dataset-level totals and averages plus single-condition filters (counts, sums, min/max comparisons)
  - Example: "How many employees work in Engineering?" → `17`
  - Example: "What is the total revenue across all orders?" → `45123.50`
  - Example: "How many employees have salary > 80000?" → `23`

- **Filtering (27%)**: Multi-condition queries requiring compound logic (AND constraints across fields)
  - Example: "How many employees in Sales have salary > 80000?" → `5`
  - Example: "How many active employees have more than 10 years of experience?" → `8`

#### Evaluation Process

1. **Format conversion**: Each dataset is converted to all 6 formats (TOON, JSON compact, XML, YAML, JSON, CSV).
2. **Query LLM**: Each model receives formatted data + question in a prompt and extracts the answer.
3. **Validate with LLM-as-judge**: `gpt-5-nano` validates if the answer is semantically correct (e.g., `50000` = `$50,000`, `Engineering` = `engineering`, `2025-01-01` = `January 1, 2025`).

#### Models & Configuration

- **Models tested**: `gpt-5-nano`, `claude-haiku-4-5-20251001`, `gemini-2.5-flash`, `grok-4-fast-non-reasoning`
- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding (GPT-5 tokenizer)
- **Temperature**: Not set (models use their defaults)
- **Total evaluations**: 201 questions × 6 formats × 4 models = 4,824 LLM calls

</details>
