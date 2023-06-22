import type { ILexer } from './types'

export default class Lexer implements ILexer {
  input = ''
  position = 0
  lines: string[] = []

  get isEof(): boolean {
    return this.position >= this.input.length
  }

  get unscannedInput(): string {
    return this.input.slice(this.position)
  }

  get scannedInput(): string {
    return this.input.slice(0, this.position)
  }

  get nextLexeme(): string | undefined {
    return this.getNextNthLexeme(0)
  }

  init(input: string): void {
    this.input = input
    this.position = 0
    this.lines = input.match(/^.*$/gm) as string[]
  }

  getNextNthLexeme(index: number): string | undefined {
    let match
    const lastPosition = this.position
    for (let i = 0; i <= index; i++) {
      const pattern = new RegExp(/[^\s]+/)
      match = this.scan(pattern)
      this.scan(/\s*/)
    }
    this.position = lastPosition
    return match
  }

  scan(pattern: RegExp): string | undefined {
    const match = this.unscannedInput.match(pattern)
    if (match !== null) {
      this.position += match[0].length
      return match[0]
    }
    return
  }

  replace(pattern: RegExp, replacement: string): void {
    pattern = new RegExp(`^(${pattern.source})`)
    const leftStr = this.unscannedInput.replace(pattern, replacement)
    this.input = this.input.substr(0, this.position) + leftStr
  }

  lookahead(pattern: RegExp): string | undefined {
    const match = this.unscannedInput.match(new RegExp(`^(${pattern.source})`))
    if (match !== null) return match[0]
    else return undefined
  }

  lookback(pattern: RegExp): string | undefined {
    const match = this.scannedInput.match(new RegExp(`(${pattern.source})$`))
    if (match !== null) return match[0]
    else return undefined
  }

  jump(length: number): void {
    this.position += length
  }
}
