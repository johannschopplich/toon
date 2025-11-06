
## Mixed-Structure Track

Datasets with nested or semi-uniform structures. CSV excluded as it cannot properly represent these structures.

```
🛒 E-commerce orders with nested structures [eligibility: 33%] 
toon                  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░    58,528 tokens
  vs JSON (−37.9%)               94,207
  vs JSON compact (+0.9%)        57,979
  vs YAML (−17.8%)               71,223
  vs XML (−45.2%)               106,720

🧾 Semi-uniform event logs [eligibility: 50%]                  
toon                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░   154,419 tokens
  vs JSON (−15.0%)              181,592
  vs JSON compact (+19.9%)      128,836
  vs YAML (−0.9%)               155,749
  vs XML (−25.1%)               206,271

🧩 Deeply nested configuration [eligibility: 0%]               
toon                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░       630 tokens
  vs JSON (−31.4%)                  918
  vs JSON compact (+11.9%)          563
  vs YAML (−6.4%)                   673
  vs XML (−37.4%)                 1,007

─────────────────────────────────────────────────────────────────────────────────
Total                                                               
toon                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░   213,577 tokens
  vs JSON (−22.8%)              276,717
  vs JSON compact (+14.0%)      187,378
  vs YAML (−6.2%)               227,645
  vs XML (−32.0%)               313,998
```

## Flat-Only Track

Datasets with flat tabular structures where CSV is applicable.

```
👥 Uniform employee records (TOON optimal format) [eligibility: 100%]
csv                   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░    46,968 tokens
toon                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    49,841 tokens   (+5.8% vs CSV)
  vs JSON (−60.7%)              126,886
  vs JSON compact (−36.8%)       78,882
  vs YAML (−50.0%)               99,743
  vs XML (−66.0%)               146,465

📈 Time-series analytics data [eligibility: 100%]              
csv                   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░     8,382 tokens
toon                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     9,114 tokens   (+8.0% vs CSV)
  vs JSON (−59.0%)               22,244
  vs JSON compact (−35.9%)       14,210
  vs YAML (−49.0%)               17,857
  vs XML (−65.8%)                26,615

⭐ Top 100 GitHub repositories [eligibility: 100%]             
csv                   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░     8,513 tokens
toon                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     8,745 tokens   (+2.7% vs CSV)
  vs JSON (−42.3%)               15,145
  vs JSON compact (−23.7%)       11,455
  vs YAML (−33.4%)               13,129
  vs XML (−48.8%)                17,095

─────────────────────────────────────────────────────────────────────────────────
Total                                                               
csv                   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░    63,863 tokens
toon                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    67,700 tokens   (+5.7% vs CSV)
  vs JSON (−58.8%)              164,275
  vs JSON compact (−35.2%)      104,547
  vs YAML (−48.2%)              130,729
  vs XML (−64.4%)               190,175
```


<details>
<summary><strong>View detailed examples</strong></summary>

#### 📈 Time-series analytics data

**Savings:** 13,130 tokens (59.0% reduction vs JSON)

**JSON** (22,244 tokens):

```json
{
  "metrics": [
    {
      "date": "2025-01-01",
      "views": 4324,
      "clicks": 146,
      "conversions": 21,
      "revenue": 3834.57,
      "bounceRate": 0.4
    },
    {
      "date": "2025-01-02",
      "views": 6248,
      "clicks": 407,
      "conversions": 22,
      "revenue": 2936.12,
      "bounceRate": 0.62
    },
    {
      "date": "2025-01-03",
      "views": 7382,
      "clicks": 270,
      "conversions": 24,
      "revenue": 6825.19,
      "bounceRate": 0.7
    },
    {
      "date": "2025-01-04",
      "views": 4586,
      "clicks": 267,
      "conversions": 24,
      "revenue": 2391.11,
      "bounceRate": 0.64
    },
    {
      "date": "2025-01-05",
      "views": 6171,
      "clicks": 227,
      "conversions": 12,
      "revenue": 3430.1,
      "bounceRate": 0.39
    }
  ]
}
```

**TOON** (9,114 tokens):

```
metrics[5]{date,views,clicks,conversions,revenue,bounceRate}:
  2025-01-01,4324,146,21,3834.57,0.4
  2025-01-02,6248,407,22,2936.12,0.62
  2025-01-03,7382,270,24,6825.19,0.7
  2025-01-04,4586,267,24,2391.11,0.64
  2025-01-05,6171,227,12,3430.1,0.39
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
