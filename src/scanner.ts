import type { Depth, ParsedLine } from './types'
import { SPACE } from './constants'

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
}

export function toParsedLines(source: string, indentSize: number): ParsedLine[] {
  if (!source.trim()) {
    return []
  }

  const lines = source.split('\n')
  const parsed: ParsedLine[] = []

  for (const raw of lines) {
    let indent = 0
    while (indent < raw.length && raw[indent] === SPACE) {
      indent++
    }

    const content = raw.slice(indent)
    const depth = computeDepthFromIndent(indent, indentSize)

    parsed.push({ raw, indent, content, depth })
  }

  return parsed
}

function computeDepthFromIndent(indentSpaces: number, indentSize: number): Depth {
  return Math.floor(indentSpaces / indentSize)
}
