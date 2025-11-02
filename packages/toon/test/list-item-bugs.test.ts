import { describe, expect, it } from 'vitest'
import { decode } from '../src/index'

describe('List item edge cases', () => {
  it('should handle empty list items (just hyphen without space)', () => {
    const toon = `test:
  items[3]:
    - first
    - second
    -`

    const result = decode(toon, { strict: false })

    expect(result.test.items).toHaveLength(3)
    expect(result.test.items[0]).toBe('first')
    expect(result.test.items[1]).toBe('second')
    expect(result.test.items[2]).toEqual({})
  })

  it('should handle list items with nested objects', () => {
    const toon = `schemas:
  kafka_topic:
    type: object
    allOf[2]:
      - "$ref": #/components/schemas/kafka_topic_base
      - properties:
          state:
            type: string
            enum[4]: active,configuring,deleting,unknown
  kafka_topic_config:
    type: object
    properties:
      cleanup_policy:
        type: string`

    const result = decode(toon, { strict: false })

    expect(result.schemas.kafka_topic).toBeDefined()
    expect(result.schemas.kafka_topic.allOf).toHaveLength(2)
    expect(result.schemas.kafka_topic.allOf[0]).toEqual({
      '$ref': '#/components/schemas/kafka_topic_base'
    })
    expect(result.schemas.kafka_topic.allOf[1]).toEqual({
      properties: {
        state: {
          type: 'string',
          enum: ['active', 'configuring', 'deleting', 'unknown']
        }
      }
    })

    // Should continue decoding after the allOf array
    expect(result.schemas.kafka_topic_config).toBeDefined()
    expect(result.schemas.kafka_topic_config.properties.cleanup_policy).toEqual({
      type: 'string'
    })
  })

  it('should handle multi-field list item objects with nested values', () => {
    const toon = `root:
  items[2]:
    - name: Item 1
      value: 100
      nested:
        field: test
        deep:
          level: 3
    - name: Item 2
      value: 200
  after_array: should see this`

    const result = decode(toon, { strict: false })

    expect(result.root.items).toHaveLength(2)
    expect(result.root.items[0]).toEqual({
      name: 'Item 1',
      value: 100,
      nested: {
        field: 'test',
        deep: {
          level: 3
        }
      }
    })
    expect(result.root.items[1]).toEqual({
      name: 'Item 2',
      value: 200
    })
    expect(result.root.after_array).toBe('should see this')
  })

  it('should handle anyOf with empty item in the middle', () => {
    const toon = `page_links:
  type: object
  properties:
    pages:
      anyOf[3]:
        - "$ref": #/components/schemas/forward_links
        - "$ref": #/components/schemas/backward_links
        -`

    const result = decode(toon, { strict: false })

    expect(result.page_links.properties.pages.anyOf).toHaveLength(3)
    expect(result.page_links.properties.pages.anyOf[0]).toEqual({
      '$ref': '#/components/schemas/forward_links'
    })
    expect(result.page_links.properties.pages.anyOf[1]).toEqual({
      '$ref': '#/components/schemas/backward_links'
    })
    expect(result.page_links.properties.pages.anyOf[2]).toEqual({})
  })

  it('should handle oneOf with list item objects containing nested properties', () => {
    const toon = `schema:
  oneOf[2]:
    - type: object
      properties:
        name:
          type: string
        nested:
          type: object
          properties:
            field:
              type: number
    - type: string
  after_oneof: test`

    const result = decode(toon, { strict: false })

    expect(result.schema.oneOf).toHaveLength(2)
    expect(result.schema.oneOf[0]).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        nested: {
          type: 'object',
          properties: {
            field: {
              type: 'number'
            }
          }
        }
      }
    })
    expect(result.schema.oneOf[1]).toEqual({
      type: 'string'
    })
    expect(result.schema.after_oneof).toBe('test')
  })
})
