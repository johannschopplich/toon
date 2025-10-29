import type { Depth, ParsedLine } from '../types'
import { SPACE, TAB } from '../constants'

export class LineCursor {
  private lines: ParsedLine[]
  private index: number

  constructor(lines: ParsedLine[]) {
    this.lines = lines
    this.index = 0
  }

  peek(): ParsedLine | undefined {
    return this.lines[this.index]
  }

  next(): ParsedLine | undefined {
    return this.lines[this.index++]
  }

  current(): ParsedLine | undefined {
    return this.index > 0 ? this.lines[this.index - 1] : undefined
  }

  advance(): void {
    this.index++
  }

  atEnd(): boolean {
    return this.index >= this.lines.length
  }

  get length(): number {
    return this.lines.length
  }

  peekAtDepth(targetDepth: Depth): ParsedLine | undefined {
    const line = this.peek()
    if (!line || line.depth < targetDepth) {
      return undefined
    }
    if (line.depth === targetDepth) {
      return line
    }
    return undefined
  }

  hasMoreAtDepth(targetDepth: Depth): boolean {
    return this.peekAtDepth(targetDepth) !== undefined
  }
}

export function toParsedLines(source: string, indentSize: number, strict: boolean): ParsedLine[] {
  if (!source.trim()) {
    return []
  }

  const lines = source.split('\n')
  const parsed: ParsedLine[] = []

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!
    let indent = 0
    while (indent < raw.length && raw[indent] === SPACE) {
      indent++
    }

    const content = raw.slice(indent)

    // Skip empty lines or lines with only whitespace
    if (!content.trim()) {
      continue
    }

    const depth = computeDepthFromIndent(indent, indentSize)

    // Strict mode validation
    if (strict) {
      // Find the full leading whitespace region (spaces and tabs)
      let wsEnd = 0
      while (wsEnd < raw.length && (raw[wsEnd] === SPACE || raw[wsEnd] === TAB)) {
        wsEnd++
      }

      // Check for tabs in leading whitespace (before actual content)
      if (raw.slice(0, wsEnd).includes(TAB)) {
        throw new SyntaxError(`Line ${i + 1}: Tabs are not allowed in indentation in strict mode`)
      }

      // Check for exact multiples of indentSize
      if (indent > 0 && indent % indentSize !== 0) {
        throw new SyntaxError(`Line ${i + 1}: Indentation must be exact multiple of ${indentSize}, but found ${indent} spaces`)
      }
    }

    parsed.push({ raw, indent, content, depth })
  }

  return parsed
}

function computeDepthFromIndent(indentSpaces: number, indentSize: number): Depth {
  return Math.floor(indentSpaces / indentSize)
}
