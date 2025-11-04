#!/bin/bash

# Data Pipeline Example
# Shows how to chain multiple tools with TOON for data processing

echo "=== Data Pipeline Workflow ==="

# Create sample data
cat << 'EOF' > sample-data.json
{
  "sales": [
    {"id": 1, "product": "Widget A", "amount": 150.00, "date": "2024-01-15", "region": "North"},
    {"id": 2, "product": "Widget B", "amount": 200.50, "date": "2024-01-15", "region": "South"},
    {"id": 3, "product": "Widget A", "amount": 175.25, "date": "2024-01-16", "region": "North"},
    {"id": 4, "product": "Widget C", "amount": 300.00, "date": "2024-01-16", "region": "East"},
    {"id": 5, "product": "Widget B", "amount": 225.75, "date": "2024-01-17", "region": "West"}
  ]
}
EOF

echo "📊 Sample sales data created"

# Pipeline 1: Filter and convert
echo ""
echo "🔍 Pipeline 1: Filter high-value sales (>$200) and convert to TOON"
jq '.sales | map(select(.amount > 200))' sample-data.json | \
  jq '{high_value_sales: .}' | \
  toon --stats

# Pipeline 2: Group by region and convert
echo ""
echo "📍 Pipeline 2: Group by region with summary stats"
jq '
  .sales |
  group_by(.region) |
  map({
    region: .[0].region,
    count: length,
    total: (map(.amount) | add),
    avg: ((map(.amount) | add) / length | round)
  })
' sample-data.json | \
  jq '{regional_summary: .}' | \
  toon --delimiter "\t" --stats

# Pipeline 3: Time series conversion
echo ""
echo "📅 Pipeline 3: Daily sales summary"
jq '
  .sales |
  group_by(.date) |
  map({
    date: .[0].date,
    transactions: length,
    revenue: (map(.amount) | add),
    products: (map(.product) | unique | length)
  })
' sample-data.json | \
  jq '{daily_summary: .}' | \
  toon --length-marker --stats

# Pipeline 4: Round-trip test
echo ""
echo "🔄 Pipeline 4: Round-trip fidelity test"
echo "Original → TOON → JSON → Compare"

# Convert to TOON
toon sample-data.json -o temp.toon

# Convert back to JSON
toon temp.toon -o temp.json

# Compare (should be identical)
if diff <(jq --sort-keys . sample-data.json) <(jq --sort-keys . temp.json) >/dev/null; then
  echo "✅ Round-trip successful - data integrity preserved"
else
  echo "❌ Round-trip failed - data differs"
fi

# Pipeline 5: Batch processing simulation
echo ""
echo "📦 Pipeline 5: Batch processing multiple datasets"

# Create multiple files
for i in {1..3}; do
  jq --arg batch "$i" '.sales | map(. + {batch: $batch})' sample-data.json > "batch_$i.json"
done

# Process all files
echo "Processing batches..."
for file in batch_*.json; do
  echo "  Processing $file..."
  jq '{batch_data: .}' "$file" | toon --delimiter "|" > "${file%.json}.toon"
done

# Combine results
echo "📋 Combined batch results:"
cat batch_*.toon

# Cleanup
rm -f sample-data.json temp.toon temp.json batch_*.json batch_*.toon

echo ""
echo "🎯 Key Pipeline Benefits:"
echo "   • Seamless integration with jq, curl, etc."
echo "   • Significant token savings for LLM input"
echo "   • Perfect data fidelity through round-trips"
echo "   • Flexible output formats for different use cases"
echo ""
echo "💡 Common pipeline patterns:"
echo "   API → jq filter → TOON → LLM"
echo "   CSV → jq transform → TOON → analysis"
echo "   Database export → processing → TOON → reporting"