Benchmarks test LLM comprehension across different input formats using 204 data retrieval questions on 4 models.

<details>
<summary><strong>Show Dataset Catalog</strong></summary>

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
TOON           ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   17.2  │  75.5% acc  │  4,389 tokens
CSV            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░   16.6  │  67.8% acc  │  4,080 tokens
JSON compact   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░   14.7  │  73.3% acc  │  4,982 tokens
YAML           ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░   12.1  │  72.4% acc  │  5,976 tokens
JSON           ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░   10.0  │  72.4% acc  │  7,260 tokens
XML            ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░    8.4  │  69.0% acc  │  8,251 tokens
```

TOON achieves **75.5%** accuracy (vs JSON's 72.4%) while using **39.5% fewer tokens**.

#### Per-Model Accuracy

Accuracy across 4 LLMs on 204 data retrieval questions:

```
claude-haiku-4-5-20251001
→ TOON           ████████████░░░░░░░░    62.3% (127/204)
  JSON           ███████████░░░░░░░░░    56.9% (116/204)
  YAML           ███████████░░░░░░░░░    55.9% (114/204)
  JSON compact   ███████████░░░░░░░░░    54.9% (112/204)
  XML            ███████████░░░░░░░░░    54.9% (112/204)
  CSV            █████████░░░░░░░░░░░    47.1% (49/104)

gemini-2.5-flash
→ TOON           ██████████████████░░    91.2% (186/204)
  YAML           ██████████████████░░    89.7% (183/204)
  JSON compact   ██████████████████░░    87.7% (179/204)
  JSON           ██████████████████░░    87.7% (179/204)
  XML            █████████████████░░░    87.3% (178/204)
  CSV            █████████████████░░░    85.6% (89/104)

gpt-5-nano
  JSON compact   ███████████████████░    93.6% (191/204)
  CSV            ██████████████████░░    90.4% (94/104)
  JSON           ██████████████████░░    89.7% (183/204)
→ TOON           ██████████████████░░    89.2% (182/204)
  YAML           ██████████████████░░    89.2% (182/204)
  XML            ████████████████░░░░    81.4% (166/204)

grok-4-fast-non-reasoning
→ TOON           ████████████░░░░░░░░    59.3% (121/204)
  JSON compact   ███████████░░░░░░░░░    56.9% (116/204)
  JSON           ███████████░░░░░░░░░    55.4% (113/204)
  YAML           ███████████░░░░░░░░░    54.9% (112/204)
  XML            ██████████░░░░░░░░░░    52.5% (107/204)
  CSV            ██████████░░░░░░░░░░    48.1% (50/104)
```

**Key tradeoff:** TOON achieves **75.5% accuracy** (vs JSON's 72.4%) while using **39.5% fewer tokens** on these datasets.

<details>
<summary><strong>Performance by dataset, model, and question type</strong></summary>

#### Performance by Question Type

| Question Type | TOON | JSON compact | JSON | YAML | XML | CSV |
| ------------- | ---- | ---- | ---- | ---- | ---- | ---- |
| Field Retrieval | 100.0% | 98.9% | 99.6% | 99.3% | 98.5% | 100.0% |
| Aggregation | 56.3% | 52.4% | 53.2% | 53.2% | 47.2% | 40.5% |
| Filtering | 58.9% | 58.3% | 54.2% | 53.1% | 50.5% | 49.1% |
| Structure Awareness | 89.0% | 85.0% | 82.0% | 85.0% | 79.0% | 84.4% |

#### Performance by Dataset

##### Uniform employee records

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 70.7% | 2,337 | 116/164 |
| `toon` | 72.0% | 2,483 | 118/164 |
| `json-compact` | 71.3% | 3,943 | 117/164 |
| `yaml` | 70.1% | 4,969 | 115/164 |
| `json-pretty` | 72.6% | 6,347 | 119/164 |
| `xml` | 70.7% | 7,314 | 116/164 |

##### E-commerce orders with nested structures

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 83.5% | 7,197 | 137/164 |
| `json-compact` | 79.3% | 6,784 | 130/164 |
| `yaml` | 78.7% | 8,334 | 129/164 |
| `json-pretty` | 78.7% | 10,700 | 129/164 |
| `xml` | 73.8% | 12,013 | 121/164 |

##### Time-series analytics data

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 75.8% | 1,513 | 91/120 |
| `csv` | 72.5% | 1,391 | 87/120 |
| `json-compact` | 70.0% | 2,339 | 84/120 |
| `yaml` | 70.0% | 2,936 | 84/120 |
| `json-pretty` | 71.7% | 3,663 | 86/120 |
| `xml` | 71.7% | 4,374 | 86/120 |

##### Top 100 GitHub repositories

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 64.4% | 8,745 | 85/132 |
| `csv` | 59.8% | 8,513 | 79/132 |
| `json-compact` | 60.6% | 11,455 | 80/132 |
| `yaml` | 61.4% | 13,129 | 81/132 |
| `json-pretty` | 59.1% | 15,145 | 78/132 |
| `xml` | 51.5% | 17,095 | 68/132 |

##### Semi-uniform event logs

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `json-compact` | 67.5% | 4,809 | 81/120 |
| `yaml` | 63.3% | 5,814 | 76/120 |
| `toon` | 62.5% | 5,764 | 75/120 |
| `json-pretty` | 59.2% | 6,784 | 71/120 |
| `xml` | 55.0% | 7,699 | 66/120 |

##### Deeply nested configuration

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `json-compact` | 91.4% | 564 | 106/116 |
| `toon` | 94.8% | 631 | 110/116 |
| `yaml` | 91.4% | 673 | 106/116 |
| `json-pretty` | 93.1% | 919 | 108/116 |
| `xml` | 91.4% | 1,008 | 106/116 |

#### Performance by Model

##### claude-haiku-4-5-20251001

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 62.3% | 127/204 |
| `json-pretty` | 56.9% | 116/204 |
| `yaml` | 55.9% | 114/204 |
| `json-compact` | 54.9% | 112/204 |
| `xml` | 54.9% | 112/204 |
| `csv` | 47.1% | 49/104 |

##### gemini-2.5-flash

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 91.2% | 186/204 |
| `yaml` | 89.7% | 183/204 |
| `json-compact` | 87.7% | 179/204 |
| `json-pretty` | 87.7% | 179/204 |
| `xml` | 87.3% | 178/204 |
| `csv` | 85.6% | 89/104 |

##### gpt-5-nano

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `json-compact` | 93.6% | 191/204 |
| `csv` | 90.4% | 94/104 |
| `json-pretty` | 89.7% | 183/204 |
| `toon` | 89.2% | 182/204 |
| `yaml` | 89.2% | 182/204 |
| `xml` | 81.4% | 166/204 |

##### grok-4-fast-non-reasoning

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 59.3% | 121/204 |
| `json-compact` | 56.9% | 116/204 |
| `json-pretty` | 55.4% | 113/204 |
| `yaml` | 54.9% | 112/204 |
| `xml` | 52.5% | 107/204 |
| `csv` | 48.1% | 50/104 |

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

204 questions are generated dynamically across four categories:

- **Field retrieval (33%)**: Direct value lookups or values that can be read straight off a record (including booleans and simple counts such as array lengths)
  - Example: "What is Alice's salary?" → `75000`
  - Example: "How many items are in order ORD-0042?" → `3`
  - Example: "What is the customer name for order ORD-0042?" → `John Doe`

- **Aggregation (31%)**: Dataset-level totals and averages plus single-condition filters (counts, sums, min/max comparisons)
  - Example: "How many employees work in Engineering?" → `17`
  - Example: "What is the total revenue across all orders?" → `45123.50`
  - Example: "How many employees have salary > 80000?" → `23`

- **Filtering (24%)**: Multi-condition queries requiring compound logic (AND constraints across fields)
  - Example: "How many employees in Sales have salary > 80000?" → `5`
  - Example: "How many active employees have more than 10 years of experience?" → `8`

- **Structure awareness (12%)**: Tests format-native structural affordances (TOON's [N] count and {fields}, CSV's header row)
  - Example: "How many employees are in the dataset?" → `100`
  - Example: "List the field names for employees" → `id, name, email, department, salary, yearsExperience, active`
  - Example: "What is the department of the last employee?" → `Sales`

#### Evaluation Process

1. **Format conversion**: Each dataset is converted to all 6 formats (TOON, JSON compact, JSON, YAML, XML, CSV).
2. **Query LLM**: Each model receives formatted data + question in a prompt and extracts the answer.
3. **Validate with LLM-as-judge**: `gpt-5-nano` validates if the answer is semantically correct (e.g., `50000` = `$50,000`, `Engineering` = `engineering`, `2025-01-01` = `January 1, 2025`).

#### Models & Configuration

- **Models tested**: `claude-haiku-4-5-20251001`, `gemini-2.5-flash`, `gpt-5-nano`, `grok-4-fast-non-reasoning`
- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding (GPT-5 tokenizer)
- **Temperature**: Not set (models use their defaults)
- **Total evaluations**: 204 questions × 6 formats × 4 models = 4,896 LLM calls

</details>
