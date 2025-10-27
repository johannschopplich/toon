### Token Efficiency

```
⭐ GitHub Repositories       ██████████████░░░░░░░░░░░   8,745 tokens  (JSON: 15,145)  💰 42.3% saved
📈 Daily Analytics           ██████████░░░░░░░░░░░░░░░   3,630 tokens  (JSON:  9,023)  💰 59.8% saved
👥 API Response              ██████████████░░░░░░░░░░░   2,597 tokens  (JSON:  4,589)  💰 43.4% saved
🛒 E-Commerce Order          ████████████████░░░░░░░░░     164 tokens  (JSON:    256)  💰 35.9% saved
```

**Total:** 15,136 tokens (TOON) vs 29,013 tokens (JSON) → 47.8% savings

<details>
<summary><strong>View detailed examples</strong></summary>

#### ⭐ GitHub Repositories

**Configuration:** Top 100 GitHub repositories with stars, forks, and metadata

**Savings:** 6,400 tokens (42.3% reduction)

**JSON** (15,145 tokens):

```json
{
  "repositories": [
    {
      "id": 28457823,
      "name": "freeCodeCamp",
      "repo": "freeCodeCamp/freeCodeCamp",
      "description": "freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming,...",
      "createdAt": "2014-12-24T17:49:19Z",
      "updatedAt": "2025-10-27T07:40:58Z",
      "pushedAt": "2025-10-26T11:31:08Z",
      "stars": 430828,
      "watchers": 8582,
      "forks": 42136,
      "defaultBranch": "main"
    },
    {
      "id": 132750724,
      "name": "build-your-own-x",
      "repo": "codecrafters-io/build-your-own-x",
      "description": "Master programming by recreating your favorite technologies from scratch.",
      "createdAt": "2018-05-09T12:03:18Z",
      "updatedAt": "2025-10-27T07:43:25Z",
      "pushedAt": "2025-10-10T18:45:01Z",
      "stars": 430102,
      "watchers": 6322,
      "forks": 40388,
      "defaultBranch": "master"
    },
    {
      "id": 21737465,
      "name": "awesome",
      "repo": "sindresorhus/awesome",
      "description": "😎 Awesome lists about all kinds of interesting topics",
      "createdAt": "2014-07-11T13:42:37Z",
      "updatedAt": "2025-10-27T07:44:27Z",
      "pushedAt": "2025-10-23T17:26:53Z",
      "stars": 409760,
      "watchers": 8016,
      "forks": 32015,
      "defaultBranch": "main"
    }
  ]
}
```

**TOON** (8,745 tokens):

```
repositories[3]{id,name,repo,description,createdAt,updatedAt,pushedAt,stars,watchers,forks,defaultBranch}:
  28457823,freeCodeCamp,freeCodeCamp/freeCodeCamp,"freeCodeCamp.org's open-source codebase and curriculum. Learn math, programming,...","2014-12-24T17:49:19Z","2025-10-27T07:40:58Z","2025-10-26T11:31:08Z",430828,8582,42136,main
  132750724,build-your-own-x,codecrafters-io/build-your-own-x,Master programming by recreating your favorite technologies from scratch.,"2018-05-09T12:03:18Z","2025-10-27T07:43:25Z","2025-10-10T18:45:01Z",430102,6322,40388,master
  21737465,awesome,sindresorhus/awesome,😎 Awesome lists about all kinds of interesting topics,"2014-07-11T13:42:37Z","2025-10-27T07:44:27Z","2025-10-23T17:26:53Z",409760,8016,32015,main
```

---

#### 📈 Daily Analytics

**Configuration:** 180 days of web metrics (views, clicks, conversions, revenue)

**Savings:** 5,393 tokens (59.8% reduction)

**JSON** (9,023 tokens):

```json
{
  "metrics": [
    {
      "date": "2024-12-31",
      "views": 1953,
      "clicks": 224,
      "conversions": 60,
      "revenue": 409.79
    },
    {
      "date": "2025-01-01",
      "views": 2981,
      "clicks": 242,
      "conversions": 109,
      "revenue": 467.73
    },
    {
      "date": "2025-01-02",
      "views": 3842,
      "clicks": 100,
      "conversions": 15,
      "revenue": 569.44
    },
    {
      "date": "2025-01-03",
      "views": 4083,
      "clicks": 161,
      "conversions": 73,
      "revenue": 444.75
    },
    {
      "date": "2025-01-04",
      "views": 5382,
      "clicks": 257,
      "conversions": 63,
      "revenue": 457.28
    }
  ]
}
```

**TOON** (3,630 tokens):

```
metrics[5]{date,views,clicks,conversions,revenue}:
  2024-12-31,1953,224,60,409.79
  2025-01-01,2981,242,109,467.73
  2025-01-02,3842,100,15,569.44
  2025-01-03,4083,161,73,444.75
  2025-01-04,5382,257,63,457.28
```

</details>
