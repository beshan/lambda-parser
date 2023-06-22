import { EventType } from '../constants'
import * as utils from '../utils'

import type { XpgExpression, XpgExpressionRaw, XpgRule } from './types'
import type { ILexer, IParser, ParserEvent } from '../types'

export const COLON = /:/
export const EXCLAMATION = /!/
export const AMPERSAND = /&/

export const settings = {
  listener,
  skip: /\s*/
}

function listener(this: IParser, event: ParserEvent): unknown {
  if (event.type === EventType.RuleSucceeded) {
    const { name, data } = event.data
    if (name === 'combinator') return formatCombinator(data as string, this.lexer)
    if (name === 'expression') return formatExpression(data as XpgExpressionRaw)
    if (name === 'grammar') return formatGrammar(data as XpgRule[])
  }

  return undefined
}

function formatGrammar(grammar: XpgRule[]): XpgRule[] {
  const result = []
  for (let i = 0; i < grammar.length; i++) {
    const rule = grammar[i] as XpgRule
    // Is not a comment
    if (rule.name) result.push(rule)
  }

  return utils.object.trim(result, [undefined, null, '', false, '{}', '[]'])
}

function formatExpression({ first, rest }: XpgExpressionRaw): XpgExpression[] {
  const result: XpgExpression[] = [first]
  if (rest) {
    const combinator = (rest[0] as XpgExpression).combinator as string
    ;(result[0] as XpgExpression).combinator = combinator
    for (let i = 0; i < rest.length; i++) {
      const expr = rest[i] as XpgExpression
      delete expr.combinator
      result.push(expr)
    }
  }
  return result
}

function formatCombinator(val: string, lexer: ILexer): string {
  // Since the skip method has already consumed the sequence combinator (blank space),
  // the sequence combinator matches the immediate input character as the sequence combinator which is wrong and should be reverted
  if (val !== '/') {
    lexer.jump(-1)
    return ''
  }

  return val
}
