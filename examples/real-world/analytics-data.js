#!/usr/bin/env node

/**
 * Analytics Data Example
 *
 * Demonstrates TOON with time-series data, metrics, and analytics.
 * Shows how TOON excels with uniform numerical data.
 */

import { encode } from '@toon-format/toon'

// Generate sample analytics data
function generateAnalyticsData(days = 30) {
  const data = []
  const startDate = new Date('2024-01-01')

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    data.push({
      date: date.toISOString().split('T')[0],
      pageViews: Math.floor(Math.random() * 10000) + 5000,
      uniqueVisitors: Math.floor(Math.random() * 3000) + 2000,
      bounceRate: +(Math.random() * 0.4 + 0.3).toFixed(3),
      avgSessionDuration: Math.floor(Math.random() * 300) + 120,
      conversions: Math.floor(Math.random() * 50) + 10,
      revenue: +(Math.random() * 5000 + 1000).toFixed(2)
    })
  }

  return data
}

const analyticsData = {
  website: 'example.com',
  period: {
    start: '2024-01-01',
    end: '2024-01-30',
    days: 30
  },
  metrics: generateAnalyticsData(30),
  summary: {
    totalPageViews: 225000,
    avgBounceRate: 0.42,
    totalRevenue: 89500.50,
    topPages: [
      { path: '/home', views: 45000 },
      { path: '/products', views: 32000 },
      { path: '/about', views: 18000 }
    ]
  }
}

console.log('=== Analytics Data Example ===\\n')

console.log('📊 Sample Analytics Data (first 3 days):')
console.log(JSON.stringify({
  ...analyticsData,
  metrics: analyticsData.metrics.slice(0, 3)
}, null, 2))

console.log('\\n🎯 Full Dataset in TOON Format:')
const toonAnalytics = encode(analyticsData)
console.log(toonAnalytics)

// Compare with JSON
const jsonCompact = JSON.stringify(analyticsData)
const jsonFormatted = JSON.stringify(analyticsData, null, 2)

console.log('\\n📊 Size Comparison:')
console.log(`JSON (formatted): ${jsonFormatted.length} characters`)
console.log(`JSON (compact):   ${jsonCompact.length} characters`)
console.log(`TOON:             ${toonAnalytics.length} characters`)

const savings = ((jsonCompact.length - toonAnalytics.length) / jsonCompact.length * 100).toFixed(1)
console.log(`\\n💰 Space saved: ${savings}% vs compact JSON`)

// Demonstrate with different delimiters
console.log('\\n⚡ Delimiter Comparison:')
const commaDelim = encode(analyticsData)
const tabDelim = encode(analyticsData, { delimiter: '\\t' })
const pipeDelim = encode(analyticsData, { delimiter: '|' })

console.log(`Comma: ${commaDelim.length} chars`)
console.log(`Tab:   ${tabDelim.length} chars`)
console.log(`Pipe:  ${pipeDelim.length} chars`)

console.log('\\n✨ Why TOON excels with analytics:')
console.log('• Time-series data is perfectly uniform')
console.log('• Numerical data compresses well in tabular format')
console.log('• Date strings benefit from reduced repetition')
console.log('• Easy for LLMs to understand trends and patterns')

console.log('\\n🤖 LLM Use Cases:')
console.log('• "Analyze traffic trends over the past 30 days"')
console.log('• "Find correlation between bounce rate and conversions"')
console.log('• "Identify days with unusual patterns"')
console.log('• "Generate insights about user behavior"')

console.log('\\n💡 Pro tip: TOON is perfect for any time-series data:')
console.log('   stock prices, sensor readings, user activity, etc.')