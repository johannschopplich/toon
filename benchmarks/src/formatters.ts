/**
 * Format converters for TOON benchmarks
 *
 * Converts data to different formats:
 * - JSON
 * - TOON
 * - CSV
 * - Markdown key-value
 * - YAML
 */

import { stringify as stringifyCSV } from 'csv-stringify/sync'
import { stringify as stringifyYAML } from 'yaml'
import { encode as encodeToon } from '../../src/index'

export const formatters = {
  'json': (data: unknown): string => JSON.stringify(data, undefined, 2),
  'toon': (data: unknown): string => encodeToon(data),
  'csv': (data: unknown): string => toCSV(data),
  'markdown-kv': (data: unknown): string => toMarkdownKV(data),
  'yaml': (data: unknown): string => stringifyYAML(data),
}

function toCSV(data: unknown): string {
  const sections: string[] = []

  // Handle top-level object with arrays
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0) {
        sections.push(`# ${key}`)
        sections.push(stringifyCSV(value, { header: true }))
      }
    }
    return sections.join('\n').trim()
  }

  // Root-level array
  if (Array.isArray(data) && data.length > 0) {
    return stringifyCSV(data, { header: true }).trim()
  }

  return ''
}

function toMarkdownKV(data: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent)
  const lines: string[] = []

  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        Object.entries(item).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            lines.push(`${spaces}**${key}**:`)
            lines.push(toMarkdownKV(value, indent + 1))
          }
          else {
            lines.push(`${spaces}**${key}**: ${value}`)
          }
        })
        if (i < data.length - 1)
          lines.push('')
      }
      else {
        lines.push(`${spaces}- ${item}`)
      }
    })
  }
  else if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        lines.push(`${spaces}**${key}**:`)
        lines.push(toMarkdownKV(value, indent + 1))
      }
      else if (typeof value === 'object' && value !== null) {
        lines.push(`${spaces}**${key}**:`)
        lines.push(toMarkdownKV(value, indent + 1))
      }
      else {
        lines.push(`${spaces}**${key}**: ${value}`)
      }
    })
  }
  else {
    lines.push(`${spaces}${data}`)
  }

  return lines.join('\n')
}
