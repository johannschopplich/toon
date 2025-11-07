#### Mixed-Structure Track

Datasets with nested or semi-uniform structures. CSV excluded as it cannot properly represent these structures.

```
🛒 E-commerce orders with nested structures  ┊  Tabular: 33%
   │
   TOON                █████████████░░░░░░░    72,743 tokens
   ├─ vs JSON          (−33.1%)               108,731 tokens
   ├─ vs JSON compact  (+5.5%)                 68,936 tokens
   ├─ vs YAML          (−14.1%)                84,724 tokens
   └─ vs XML           (−40.5%)               122,313 tokens

🧾 Semi-uniform event logs  ┊  Tabular: 50%
   │
   TOON                █████████████████░░░   153,223 tokens
   ├─ vs JSON          (−15.0%)               180,196 tokens
   ├─ vs JSON compact  (+19.9%)               127,740 tokens
   ├─ vs YAML          (−0.8%)                154,514 tokens
   └─ vs XML           (−25.2%)               204,800 tokens

🧩 Deeply nested configuration  ┊  Tabular: 0%
   │
   TOON                ██████████████░░░░░░       631 tokens
   ├─ vs JSON          (−31.3%)                   919 tokens
   ├─ vs JSON compact  (+11.9%)                   564 tokens
   ├─ vs YAML          (−6.2%)                    673 tokens
   └─ vs XML           (−37.4%)                 1,008 tokens

──────────────────────────────────── Total ────────────────────────────────────
   TOON                ████████████████░░░░   226,597 tokens
   ├─ vs JSON          (−21.8%)               289,846 tokens
   ├─ vs JSON compact  (+14.9%)               197,240 tokens
   ├─ vs YAML          (−5.5%)                239,911 tokens
   └─ vs XML           (−30.9%)               328,121 tokens
```

#### Flat-Only Track

Datasets with flat tabular structures where CSV is applicable.

```
👥 Uniform employee records  ┊  Tabular: 100%
   │
   CSV                 ███████████████████░    46,956 tokens
   TOON                ████████████████████    49,827 tokens   (+6.1% vs CSV)
   ├─ vs JSON          (−60.7%)               126,854 tokens
   ├─ vs JSON compact  (−36.8%)                78,850 tokens
   ├─ vs YAML          (−50.0%)                99,701 tokens
   └─ vs XML           (−66.0%)               146,440 tokens

📈 Time-series analytics data  ┊  Tabular: 100%
   │
   CSV                 ██████████████████░░     8,396 tokens
   TOON                ████████████████████     9,128 tokens   (+8.7% vs CSV)
   ├─ vs JSON          (−59.0%)                22,258 tokens
   ├─ vs JSON compact  (−35.8%)                14,224 tokens
   ├─ vs YAML          (−48.9%)                17,871 tokens
   └─ vs XML           (−65.7%)                26,629 tokens

⭐ Top 100 GitHub repositories  ┊  Tabular: 100%
   │
   CSV                 ███████████████████░     8,513 tokens
   TOON                ████████████████████     8,745 tokens   (+2.7% vs CSV)
   ├─ vs JSON          (−42.3%)                15,145 tokens
   ├─ vs JSON compact  (−23.7%)                11,455 tokens
   ├─ vs YAML          (−33.4%)                13,129 tokens
   └─ vs XML           (−48.8%)                17,095 tokens

──────────────────────────────────── Total ────────────────────────────────────
   CSV                 ███████████████████░    63,865 tokens
   TOON                ████████████████████    67,700 tokens   (+6.0% vs CSV)
   ├─ vs JSON          (−58.8%)               164,257 tokens
   ├─ vs JSON compact  (−35.2%)               104,529 tokens
   ├─ vs YAML          (−48.2%)               130,701 tokens
   └─ vs XML           (−64.4%)               190,164 tokens
```

<details>
<summary><strong>Show detailed examples</strong></summary>

#### 📈 Time-series analytics data

**Savings:** 13,130 tokens (59.0% reduction vs JSON)

**JSON** (22,258 tokens):

```json
{
  "metrics": [
    {
      "date": "2025-01-01",
      "views": 7708,
      "clicks": 595,
      "conversions": 69,
      "revenue": 15369.93,
      "bounceRate": 0.35
    },
    {
      "date": "2025-01-02",
      "views": 5894,
      "clicks": 381,
      "conversions": 21,
      "revenue": 2112.12,
      "bounceRate": 0.3
    },
    {
      "date": "2025-01-03",
      "views": 6835,
      "clicks": 422,
      "conversions": 35,
      "revenue": 4525.73,
      "bounceRate": 0.5
    },
    {
      "date": "2025-01-04",
      "views": 5325,
      "clicks": 305,
      "conversions": 22,
      "revenue": 2445.3,
      "bounceRate": 0.44
    },
    {
      "date": "2025-01-05",
      "views": 2974,
      "clicks": 61,
      "conversions": 6,
      "revenue": 956.57,
      "bounceRate": 0.47
    }
  ]
}
```

**TOON** (9,128 tokens):

```
metrics[5]{date,views,clicks,conversions,revenue,bounceRate}:
  2025-01-01,7708,595,69,15369.93,0.35
  2025-01-02,5894,381,21,2112.12,0.3
  2025-01-03,6835,422,35,4525.73,0.5
  2025-01-04,5325,305,22,2445.3,0.44
  2025-01-05,2974,61,6,956.57,0.47
```

---

#### ⭐ Top 100 GitHub repositories

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

</details>
