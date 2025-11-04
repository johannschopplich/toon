#!/usr/bin/env node

/**
 * E-commerce Example
 *
 * Product catalogs, orders, and inventory - classic TOON use cases
 * with uniform object structures.
 */

import { encode } from '@toon-format/toon'

const ecommerceData = {
  products: [
    {
      id: 'PROD-001',
      name: 'Wireless Bluetooth Headphones',
      category: 'Electronics',
      price: 99.99,
      originalPrice: 129.99,
      inStock: true,
      quantity: 45,
      rating: 4.5,
      reviews: 128,
      tags: ['wireless', 'bluetooth', 'audio']
    },
    {
      id: 'PROD-002',
      name: 'Organic Cotton T-Shirt',
      category: 'Clothing',
      price: 24.99,
      originalPrice: 24.99,
      inStock: true,
      quantity: 200,
      rating: 4.2,
      reviews: 89,
      tags: ['organic', 'cotton', 'casual']
    },
    {
      id: 'PROD-003',
      name: 'Stainless Steel Water Bottle',
      category: 'Home & Garden',
      price: 19.99,
      originalPrice: 29.99,
      inStock: false,
      quantity: 0,
      rating: 4.8,
      reviews: 234,
      tags: ['stainless', 'eco-friendly', 'insulated']
    }
  ],
  orders: [
    {
      orderId: 'ORD-2024-001',
      customerId: 'CUST-789',
      customerEmail: 'john@example.com',
      orderDate: '2024-01-15T10:30:00Z',
      status: 'shipped',
      total: 149.97,
      itemCount: 2,
      shippingCost: 9.99
    },
    {
      orderId: 'ORD-2024-002',
      customerId: 'CUST-456',
      customerEmail: 'sarah@example.com',
      orderDate: '2024-01-15T14:22:00Z',
      status: 'processing',
      total: 74.98,
      itemCount: 3,
      shippingCost: 0.00
    }
  ],
  inventory: {
    lastUpdated: '2024-01-15T15:00:00Z',
    totalProducts: 3,
    inStockProducts: 2,
    lowStockThreshold: 10,
    categories: ['Electronics', 'Clothing', 'Home & Garden']
  }
}

console.log('=== E-commerce Data Example ===\\n')

console.log('🛍️ Sample E-commerce Data:')
console.log(JSON.stringify(ecommerceData, null, 2))

console.log('\\n🎯 TOON Format:')
const toonEcommerce = encode(ecommerceData)
console.log(toonEcommerce)

// Size comparison
const jsonCompact = JSON.stringify(ecommerceData)
const jsonFormatted = JSON.stringify(ecommerceData, null, 2)

console.log('\\n📊 Size Comparison:')
console.log(`JSON (formatted): ${jsonFormatted.length} characters`)
console.log(`JSON (compact):   ${jsonCompact.length} characters`)
console.log(`TOON:             ${toonEcommerce.length} characters`)

const savings = ((jsonCompact.length - toonEcommerce.length) / jsonCompact.length * 100).toFixed(1)
console.log(`\\n💰 Space saved: ${savings}% vs compact JSON`)

// Show just the products in different formats
console.log('\\n🏷️ Products Only - Format Comparison:')
const productsOnly = { products: ecommerceData.products }

console.log('\\nJSON:')
console.log(JSON.stringify(productsOnly, null, 2))

console.log('\\nTOON:')
console.log(encode(productsOnly))

console.log('\\nTOON with tab delimiter:')
console.log(encode(productsOnly, { delimiter: '\\t' }))

console.log('\\n✨ E-commerce Benefits:')
console.log('• Product catalogs are perfectly uniform')
console.log('• Order data follows consistent patterns')
console.log('• Price and inventory data compresses well')
console.log('• Tags/categories handled efficiently as arrays')

console.log('\\n🤖 LLM Use Cases:')
console.log('• "Find products under $30 in the Electronics category"')
console.log('• "Which products are out of stock?"')
console.log('• "Calculate total revenue from recent orders"')
console.log('• "Recommend products based on ratings and reviews"')
console.log('• "Analyze inventory levels and suggest restocking"')

console.log('\\n💡 Perfect for:')
console.log('• Product recommendation engines')
console.log('• Inventory management queries')
console.log('• Sales analytics and reporting')
console.log('• Customer order analysis')
console.log('• Price optimization studies')