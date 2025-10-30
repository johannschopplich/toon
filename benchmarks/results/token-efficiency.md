### Token Efficiency

```
⭐ GitHub Repositories       ██████████████░░░░░░░░░░░    8,745 tokens
                             vs JSON (-42.3%)            15,145
                             vs JSON compact (-23.7%)    11,455
                             vs YAML (-33.4%)            13,129
                             vs XML (-48.8%)             17,095

📈 Daily Analytics           ██████████░░░░░░░░░░░░░░░    4,507 tokens
                             vs JSON (-58.9%)            10,977
                             vs JSON compact (-35.7%)     7,013
                             vs YAML (-48.8%)             8,810
                             vs XML (-65.7%)             13,128

🛒 E-Commerce Order          ████████████████░░░░░░░░░      166 tokens
                             vs JSON (-35.4%)               257
                             vs JSON compact (-2.9%)        171
                             vs YAML (-15.7%)               197
                             vs XML (-38.7%)                271

─────────────────────────────────────────────────────────────────────
Total                        ██████████████░░░░░░░░░░░   13,418 tokens
                             vs JSON (-49.1%)            26,379
                             vs JSON compact (-28.0%)    18,639
                             vs YAML (-39.4%)            22,136
                             vs XML (-56.0%)             30,494
```

<details>
<summary><strong>View detailed examples</strong></summary>

#### ⭐ GitHub Repositories

**Configuration:** Top 100 GitHub repositories with stars, forks, and metadata

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

---

#### 📈 Daily Analytics

**Configuration:** 180 days of web metrics (views, clicks, conversions, revenue)

**Savings:** 6,470 tokens (58.9% reduction vs JSON)

**JSON** (10,977 tokens):

```json
{
  "metrics": [
    {
      "date": "2025-01-01",
      "views": 6890,
      "clicks": 401,
      "conversions": 23,
      "revenue": 6015.59,
      "bounceRate": 0.63
    },
    {
      "date": "2025-01-02",
      "views": 6940,
      "clicks": 323,
      "conversions": 37,
      "revenue": 9086.44,
      "bounceRate": 0.36
    },
    {
      "date": "2025-01-03",
      "views": 4390,
      "clicks": 346,
      "conversions": 26,
      "revenue": 6360.75,
      "bounceRate": 0.48
    },
    {
      "date": "2025-01-04",
      "views": 3429,
      "clicks": 231,
      "conversions": 13,
      "revenue": 2360.96,
      "bounceRate": 0.65
    },
    {
      "date": "2025-01-05",
      "views": 5804,
      "clicks": 186,
      "conversions": 22,
      "revenue": 2535.96,
      "bounceRate": 0.37
    }
  ]
}
```

**TOON** (4,507 tokens):

```
metrics[5]{date,views,clicks,conversions,revenue,bounceRate}:
  2025-01-01,6890,401,23,6015.59,0.63
  2025-01-02,6940,323,37,9086.44,0.36
  2025-01-03,4390,346,26,6360.75,0.48
  2025-01-04,3429,231,13,2360.96,0.65
  2025-01-05,5804,186,22,2535.96,0.37
```

</details>
