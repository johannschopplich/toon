#!/bin/bash

# API Integration Example
# Shows how to fetch API data and convert it to TOON format

echo "=== API Integration Workflow ==="

# 1. Fetch data from a JSON API
echo "📡 Fetching user data from API..."
curl -s "https://jsonplaceholder.typicode.com/users" > users.json

echo "✅ Fetched $(jq length users.json) users"

# 2. Convert to TOON with stats
echo "🎯 Converting to TOON format..."
toon users.json --stats -o users.toon

# 3. Show the difference
echo ""
echo "📄 Original JSON (first 10 lines):"
head -10 users.json

echo ""
echo "🎯 TOON format:"
cat users.toon

# 4. Extract specific data with jq and convert
echo ""
echo "🔍 Extracting just names and emails..."
jq '[.[] | {name: .name, email: .email, username: .username}]' users.json | toon --stats

# 5. Use tab delimiter for better efficiency
echo ""
echo "⚡ With tab delimiter:"
jq '[.[] | {name: .name, email: .email, company: .company.name}]' users.json | toon --delimiter "\t" --stats

# 6. Cleanup
rm -f users.json users.toon

echo ""
echo "💡 This workflow is perfect for:"
echo "   • API response processing"
echo "   • Data preparation for LLMs"
echo "   • Token cost optimization"
echo "   • Automated data pipelines"