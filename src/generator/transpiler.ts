import { RunTimeEnv } from '../constants'
import * as utils from '../utils'
import { AMPERSAND, COLON, EXCLAMATION } from './parser_ext'

import type { TranspilerSettings, XpgExpression, XpgGroup, XpgRule } from './types'

export default class Transpiler {
  constructor(private settings: TranspilerSettings) {}

  ruleset: { [key: string]: string } = {}

  transpile(grammar: XpgRule[]): string[] {
    this.ruleset = {}

    const transpiledRules = grammar.reverse().map(i => this.transpileRules(i))

    const result = [
      `import { c, r, Parser } from '${this.settings.rte === RunTimeEnv.Deno ? 'npm:' : ''}lambda-parser'`,
      "import type { RuleDefinitionEntry } from 'lambda-parser/src/types'",
      ...transpiledRules,
      `const parser = new Parser(${utils.array.last(grammar).name}, {${
        this.ruleset['SCRIPT'] ? ' ...SCRIPT.settings ' : ''
      }})`,
      'export default parser'
    ]

    return result
  }

  private transpileRules(rule: XpgRule): string {
    let result
    let transpiledExpression
    if (rule.name === 'SCRIPT') {
      transpiledExpression = rule.expression[0]?.symbol as string
      result = `import * as SCRIPT from ${transpiledExpression}`
    } else {
      transpiledExpression = this.transpileExpression([
        { group: { name: rule.assignment.match(COLON) ? rule.name : '', expression: rule.expression } }
      ])
      result = `const ${rule.name} = ${transpiledExpression}`
    }

    this.ruleset[rule.name] = transpiledExpression
    return result
  }

  private transpileExpression(expression: XpgExpression[]): string {
    const result = []

    for (let i = 0; i < expression.length; i++) {
      const sub = expression[i] as XpgExpression
      let assertion = sub.assertion ?? ''
      if (assertion.match(EXCLAMATION)) assertion = '?!'
      else if (assertion.match(AMPERSAND)) assertion = '?='
      const quantifier = sub.quantifier ?? ''
      const noncapture = sub.noncapture

      const name = sub.group?.name ?? ''

      const expr = sub.symbol
        ? this.transpileSymbol(sub.symbol)
        : this.transpileExpression((sub.group as XpgGroup).expression as XpgExpression[])

      if (!name && !quantifier && !assertion && !noncapture) result.push(expr)
      else {
        const transpiled = []
        if (name) {
          transpiled.push([`r(${expr})`])
          if (quantifier) transpiled.push(`.quantify('${quantifier}')`)
          if (noncapture) transpiled.push(`.capture(false)`)
          if (assertion) transpiled.push(`.assert('${assertion}')`)
          else transpiled.push(`.as('${name}')`)
        } else {
          transpiled.push([`c([${expr}]`])
          if (quantifier || assertion || noncapture !== undefined) {
            transpiled.push(', { ')
            const modifiers = []
            if (quantifier) modifiers.push(`quantifier: '${quantifier}'`)
            if (assertion) modifiers.push(`assertion: '${assertion}'`)
            if (noncapture) modifiers.push(`capture: false`)
            transpiled.push(modifiers.join(', '), ' }')
          }
          transpiled.push(')')
        }
        result.push(transpiled.join(''))
      }
    }

    if (result.length === 1) return result[0] as string
    const combinator = (expression[0] as XpgExpression).combinator
    if (combinator) return `c([${result.join(', ')}], { combinator: '${combinator}' })`
    const skip = this.ruleset['SCRIPT'] ? 'SCRIPT.settings.skip' : undefined
    if (skip) return `c([${result.join(', ')}], { skip: ${skip} })`
    return `c([${result.join(', ')}])`
  }

  private transpileSymbol(symbol: string): string {
    if (symbol.startsWith('SCRIPT.')) return symbol
    else
      return (
        this.toRegExp(symbol) ?? (this.ruleset[symbol] !== undefined ? symbol : `(): RuleDefinitionEntry => ${symbol}`)
      )
  }

  toRegExp(str: string): string | undefined {
    let isRegExp = false
    if (str.startsWith("r'")) {
      isRegExp = true
      str = str.slice(2, str.length - 1)
    } else if (str.startsWith("'")) {
      str = str.slice(1, str.length - 1)
    } else return

    str = str.replace(/''/g, "'")
    str = (isRegExp ? new RegExp(str) : utils.string.toRegExp(str)).source
    return `/${str}/`
  }
}
