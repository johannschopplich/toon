import type { Depth } from '../types'
import { LIST_ITEM_PREFIX } from '../constants'

export class LineWriter {
  private readonly lines: string[] = []
  private readonly indentationString: string

  constructor(indentSize: number) {
    this.indentationString = ' '.repeat(indentSize)
  }

  push(depth: Depth, content: string): void {
    const indent = this.indentationString.repeat(depth)
    this.lines.push(indent + content)
  }

  pushListItem(depth: Depth, content: string): void {
    this.push(depth, `${LIST_ITEM_PREFIX}${content}`)
  }

  toString(): string {
    return this.lines.join('\n')
  }
}
