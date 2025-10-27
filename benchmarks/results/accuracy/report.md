### Retrieval Accuracy

Tested across **2 LLMs** with data retrieval tasks:

```
gpt-5-nano
  toon         ███████████████████░  97.5% (155/159)
  markdown-kv  ███████████████████░  95.6% (152/159)
  yaml         ███████████████████░  94.3% (150/159)
  json         ███████████████████░  93.7% (149/159)
  csv          ███████████████████░  93.7% (149/159)

claude-haiku-4-5
  markdown-kv  ███████████████░░░░░  76.7% (122/159)
  toon         ███████████████░░░░░  75.5% (120/159)
  json         ███████████████░░░░░  75.5% (120/159)
  csv          ███████████████░░░░░  75.5% (120/159)
  yaml         ███████████████░░░░░  74.8% (119/159)
```

**Tradeoff:** TOON achieves 86.5% accuracy (vs JSON's 84.6%) while using 46.3% fewer tokens.

<details>
<summary><strong>View detailed breakdown by dataset and model</strong></summary>

#### Performance by Dataset

##### Uniform employee records (TOON optimal format)

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 86.2% | 2.483 | 100/116 |
| `csv` | 80.2% | 2.337 | 93/116 |
| `yaml` | 82.8% | 4.969 | 96/116 |
| `markdown-kv` | 84.5% | 6.270 | 98/116 |
| `json` | 84.5% | 6.347 | 98/116 |

##### E-commerce orders with nested structures

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `toon` | 90.9% | 5.967 | 80/88 |
| `csv` | 90.9% | 6.735 | 80/88 |
| `yaml` | 89.8% | 7.328 | 79/88 |
| `markdown-kv` | 90.9% | 9.110 | 80/88 |
| `json` | 89.8% | 9.694 | 79/88 |

##### Time-series analytics data

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 87.9% | 1.393 | 51/58 |
| `toon` | 86.2% | 1.515 | 50/58 |
| `yaml` | 86.2% | 2.938 | 50/58 |
| `json` | 87.9% | 3.665 | 51/58 |
| `markdown-kv` | 86.2% | 3.779 | 50/58 |

##### Top 100 GitHub repositories

| Format | Accuracy | Tokens | Correct/Total |
| ------ | -------- | ------ | ------------- |
| `csv` | 80.4% | 8.513 | 45/56 |
| `toon` | 80.4% | 8.745 | 45/56 |
| `yaml` | 78.6% | 13.129 | 44/56 |
| `markdown-kv` | 82.1% | 15.436 | 46/56 |
| `json` | 73.2% | 15.145 | 41/56 |

#### Performance by Model

##### gpt-5-nano

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `toon` | 97.5% | 155/159 |
| `markdown-kv` | 95.6% | 152/159 |
| `yaml` | 94.3% | 150/159 |
| `json` | 93.7% | 149/159 |
| `csv` | 93.7% | 149/159 |

##### claude-haiku-4-5

| Format | Accuracy | Correct/Total |
| ------ | -------- | ------------- |
| `markdown-kv` | 76.7% | 122/159 |
| `toon` | 75.5% | 120/159 |
| `json` | 75.5% | 120/159 |
| `csv` | 75.5% | 120/159 |
| `yaml` | 74.8% | 119/159 |

#### Methodology

- **Semantic validation**: LLM-as-judge validates responses semantically (not exact string matching).
- **Token counting**: Using `gpt-tokenizer` with `o200k_base` encoding.
- **Question types**: Field retrieval, aggregation, and filtering tasks.
- **Real data**: Faker.js-generated datasets + GitHub repositories.

</details>
