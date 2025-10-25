| Example | JSON | TOON | Tokens Saved | Reduction |
| ------- | ---- | ---- | ------------ | --------- |
| 👤 Simple user object | 31 | 18 | 13 | **41.9%** |
| 🏷️ User with tags | 48 | 28 | 20 | **41.7%** |
| 📦 Small product catalog | 117 | 49 | 68 | **58.1%** |
| 👥 API response with users | 123 | 53 | 70 | **56.9%** |
| ⚙️ Nested configuration | 68 | 42 | 26 | **38.2%** |
| 🛒 E-commerce order | 163 | 94 | 69 | **42.3%** |
| 📊 Analytics data | 209 | 94 | 115 | **55.0%** |
| 📈 Large dataset (50 records) | 2159 | 762 | 1397 | **64.7%** |
| **Total** | **2918** | **1140** | **1778** | **60.9%** |

<details>
<summary><strong>View detailed results</strong></summary>

### 📦 Small product catalog

**Savings: 68 tokens (58.1% reduction)**

**JSON** (117 tokens):

```json
{
  "items": [
    {
      "sku": "A1",
      "name": "Widget",
      "qty": 2,
      "price": 9.99
    },
    {
      "sku": "B2",
      "name": "Gadget",
      "qty": 1,
      "price": 14.5
    },
    {
      "sku": "C3",
      "name": "Doohickey",
      "qty": 5,
      "price": 7.25
    }
  ]
}
```

**TOON** (49 tokens):

```
items[3]{sku,name,qty,price}:
  A1,Widget,2,9.99
  B2,Gadget,1,14.5
  C3,Doohickey,5,7.25
```

---

### 👥 API response with users

**Savings: 70 tokens (56.9% reduction)**

**JSON** (123 tokens):

```json
{
  "users": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "active": true
    },
    {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com",
      "active": true
    },
    {
      "id": 3,
      "name": "Charlie",
      "email": "charlie@example.com",
      "active": false
    }
  ],
  "total": 3,
  "page": 1
}
```

**TOON** (53 tokens):

```
users[3]{id,name,email,active}:
  1,Alice,alice@example.com,true
  2,Bob,bob@example.com,true
  3,Charlie,charlie@example.com,false
total: 3
page: 1
```

---

### 📊 Analytics data

**Savings: 115 tokens (55.0% reduction)**

**JSON** (209 tokens):

```json
{
  "metrics": [
    {
      "date": "2025-01-01",
      "views": 1234,
      "clicks": 89,
      "conversions": 12
    },
    {
      "date": "2025-01-02",
      "views": 2345,
      "clicks": 156,
      "conversions": 23
    },
    {
      "date": "2025-01-03",
      "views": 1890,
      "clicks": 123,
      "conversions": 18
    },
    {
      "date": "2025-01-04",
      "views": 3456,
      "clicks": 234,
      "conversions": 34
    },
    {
      "date": "2025-01-05",
      "views": 2789,
      "clicks": 178,
      "conversions": 27
    }
  ]
}
```

**TOON** (94 tokens):

```
metrics[5]{date,views,clicks,conversions}:
  2025-01-01,1234,89,12
  2025-01-02,2345,156,23
  2025-01-03,1890,123,18
  2025-01-04,3456,234,34
  2025-01-05,2789,178,27
```

</details>
