### Retrieval Accuracy

Tested across **2 LLMs** with data retrieval tasks:

```
gpt-4o-mini          ██████████████░░░░░░ 72.3% accuracy
claude-haiku-4-5     ███████████████░░░░░ 76.7% accuracy
```

**TOON achieves 73.9% accuracy (vs JSON's 73.6%) while using 46.3% fewer tokens.**

| Format | Accuracy | Average Tokens |
| ------ | -------- | -------------- |
| `toon` | 73.9% | 4.678 |
| `json` | 73.6% | 8.713 |
| `markdown-kv` | 73.6% | 8.649 |
| `csv` | 72.3% | 4.745 |
| `yaml` | 71.7% | 7.091 |

<details>
<summary><strong>View detailed breakdown by dataset and model</strong></summary>

#### Performance by Dataset

##### Uniform employee records (TOON optimal format)

| Format | Accuracy | Tokens | Correct/Total |
|--------|----------|--------|---------------|
| `toon` | 72.4% | 2.483 | 84/116 |
| `csv` | 69.0% | 2.337 | 80/116 |
| `yaml` | 68.1% | 4.969 | 79/116 |
| `markdown-kv` | 68.1% | 6.270 | 79/116 |
| `json` | 68.1% | 6.347 | 79/116 |

##### E-commerce orders with nested structures

| Format | Accuracy | Tokens | Correct/Total |
|--------|----------|--------|---------------|
| `toon` | 84.1% | 5.967 | 74/88 |
| `csv` | 83.0% | 6.735 | 73/88 |
| `yaml` | 81.8% | 7.328 | 72/88 |
| `markdown-kv` | 86.4% | 9.110 | 76/88 |
| `json` | 84.1% | 9.694 | 74/88 |

##### Time-series analytics data

| Format | Accuracy | Tokens | Correct/Total |
|--------|----------|--------|---------------|
| `csv` | 72.4% | 1.393 | 42/58 |
| `toon` | 70.7% | 1.515 | 41/58 |
| `yaml` | 72.4% | 2.938 | 42/58 |
| `json` | 74.1% | 3.665 | 43/58 |
| `markdown-kv` | 70.7% | 3.779 | 41/58 |

##### Popular GitHub repositories

| Format | Accuracy | Tokens | Correct/Total |
|--------|----------|--------|---------------|
| `toon` | 64.3% | 8.745 | 36/56 |
| `csv` | 62.5% | 8.513 | 35/56 |
| `json` | 67.9% | 15.145 | 38/56 |
| `markdown-kv` | 67.9% | 15.436 | 38/56 |
| `yaml` | 62.5% | 13.129 | 35/56 |


#### Performance by Model

##### gpt-4o-mini

| Format | Accuracy | Correct/Total |
|--------|----------|---------------|
| `toon` | 72.3% | 115/159 |
| `json` | 71.7% | 114/159 |
| `markdown-kv` | 70.4% | 112/159 |
| `csv` | 69.2% | 110/159 |
| `yaml` | 68.6% | 109/159 |

##### claude-haiku-4-5

| Format | Accuracy | Correct/Total |
|--------|----------|---------------|
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
