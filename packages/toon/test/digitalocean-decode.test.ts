import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decode, encode } from '../src/index'

describe('digitalOcean OpenAPI encode/decode test', () => {
  it('should preserve all schemas when encoding and decoding', () => {
    // Read the JSON file
    const jsonPath = join(__dirname, 'fixtures', 'digitalocean-api.json')

    // Skip test if fixture doesn't exist (large file, not committed to repo)
    if (!existsSync(jsonPath)) {
      console.log('Skipping test: digitalocean-api.json fixture not found')
      console.log('Download from: https://api-spec.do.co/DigitalOcean-public.v2.yaml')
      return
    }

    const jsonContent = readFileSync(jsonPath, 'utf-8')
    const original = JSON.parse(jsonContent)

    // Get original schema count
    const originalSchemaCount = Object.keys(original.components.schemas).length
    console.log('Original JSON schemas:', originalSchemaCount)

    // Encode to TOON
    const toonContent = encode(original)
    console.log('TOON content length:', toonContent.length)
    console.log('TOON line count:', toonContent.split('\n').length)

    // Save TOON for inspection
    writeFileSync(join(__dirname, 'fixtures', 'digitalocean-encoded.toon'), toonContent, 'utf-8')
    console.log('Saved encoded TOON to fixtures/digitalocean-encoded.toon')

    // Decode back
    let decoded
    try {
      decoded = decode(toonContent, { strict: false })
    }
    catch (error) {
      console.error('Decode error:', error)
      throw error
    }

    // Check schemas exist
    expect(decoded.components).toBeDefined()
    expect(decoded.components.schemas).toBeDefined()

    // Get decoded schema count
    const decodedSchemaCount = Object.keys(decoded.components.schemas).length
    console.log('Decoded schemas count:', decodedSchemaCount)
    console.log('First 20 decoded schemas:', Object.keys(decoded.components.schemas).slice(0, 20))

    // Check for droplet schemas
    console.log('Has droplet_single_create:', !!decoded.components.schemas.droplet_single_create)
    console.log('Has droplet_multi_create:', !!decoded.components.schemas.droplet_multi_create)
    console.log('Has droplet_create:', !!decoded.components.schemas.droplet_create)

    expect(decoded.components.schemas.droplet_single_create).toBeDefined()
    expect(decoded.components.schemas.droplet_multi_create).toBeDefined()
    expect(decoded.components.schemas.droplet_create).toBeDefined()

    // Should have the same number of schemas as original
    expect(decodedSchemaCount).toBe(originalSchemaCount)
  })
})
