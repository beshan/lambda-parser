import Transpiler from './transpiler'

import type Parser from '../parser'
import type { TranspilerSettings, XpgRule } from './types'

import parser from './parser'

export default class XpgParser {
  public parser: Parser

  constructor() {
    this.parser = parser
  }

  parse(input: string): XpgRule[] {
    return this.parser.parse(input) as XpgRule[]
  }

  transpile(input: string, settings: TranspilerSettings = {}): string[] {
    const xpgRules = this.parse(input)
    const transpiler = new Transpiler(settings)
    return transpiler.transpile(xpgRules)
  }
}
