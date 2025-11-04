# Real-World Examples

Practical TOON usage scenarios with real data structures.

## Examples

- **[api-response.js](./api-response.js)** - Converting API responses for LLM input
- **[csv-alternative.js](./csv-alternative.js)** - Using TOON as a more efficient CSV
- **[analytics-data.js](./analytics-data.js)** - Time-series and metrics data
- **[user-management.js](./user-management.js)** - User profiles and permissions
- **[e-commerce.js](./e-commerce.js)** - Product catalogs and orders

## Token Savings

These examples demonstrate real-world token savings compared to JSON:

| Use Case | JSON Tokens | TOON Tokens | Savings |
|----------|-------------|-------------|---------|
| API Response (100 users) | ~2,400 | ~1,200 | 50% |
| Analytics (30 days) | ~1,800 | ~900 | 50% |
| Product Catalog (50 items) | ~3,200 | ~1,600 | 50% |

*Token counts are approximate and vary by tokenizer*

## Running Examples

```bash
# Install dependencies
npm install @toon-format/toon

# Run any example
node api-response.js
node analytics-data.js
```