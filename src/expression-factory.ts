import type {
  Callback,
  CallbackRule,
  IndividualRuleDefinitionEntry,
  RegExpRule,
  Rule,
  RuleBase,
  RuleDefinitionEntry,
  SequenceRule
} from './types'

import * as util from './utils'
import { ErrorMessage, Combinator } from './constants'

export default class ExpressionFactory {
  static compile(
    name: string,
    entries: RuleDefinitionEntry[],
    skip?: RegExp,
    combinator: Combinator = Combinator.Sequence
  ): RuleBase {
    entries = this.mergeRegExpEntries(entries, combinator, skip)

    if (entries.length === 1) combinator = Combinator.Sequence

    let result: RuleBase
    if (combinator === Combinator.Sequence)
      result = {
        length: 0,
        isSequence: true,
        name
      }
    else if (combinator === Combinator.OrderedChoice)
      result = {
        length: 0,
        isChoice: true,
        combinator: '/',
        isOrderedChoice: true,
        name
      }
    else throw new Error(ErrorMessage.UnknownCombinator)

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i] as Rule

      let expr

      if (combinator === Combinator.Sequence && entry instanceof Array)
        throw new Error(util.string.format(ErrorMessage.ArrayInSequenceRuleDefinitionEntry, name, i))

      expr =
        combinator === Combinator.Sequence
          ? this.compileSequenceEntry(entry)
          : (expr = this.compileChoiceEntry(name, entry, skip))

      result[result.length] = expr
      result.length++
    }

    const last = util.map.last(result) as Rule
    // last.isLast = true
    result[result.length - 1] = {
      ...last,
      isLast: true
    }
    // Expression is an unnamed regexp
    if (result.length === 1 && last.isRegExp && !last.name) {
      // When there is only one sub expression and it's unnamed, it should be returned as a rule
      if (last.isRegExp) {
        const expr: RegExpRule = {
          0: last[0] as RegExp,
          length: 1,
          isRegExp: true,
          name: name
        }
        return expr as RuleBase
      } else {
        const expr: CallbackRule = {
          0: last[0] as Callback,
          length: 1,
          isCallback: true,
          name
        }
        return expr as RuleBase
      }
    }

    return result
  }

  static compileSequenceEntry(entry: IndividualRuleDefinitionEntry): Rule {
    if (entry instanceof RegExp) {
      const expr: RegExpRule = {
        0: entry,
        length: 1,
        isRegExp: true
      }
      return expr
    }

    if (entry instanceof Function) {
      const expr: CallbackRule = {
        0: entry,
        length: 1,
        isCallback: true
      }
      return expr
    }

    return { ...entry }
  }

  static compileChoiceEntry(name: string, entry: RuleDefinitionEntry, skip?: RegExp): Rule {
    if (entry instanceof Array) {
      const group = this.compile(name, entry, skip)
      const rule: RuleBase = {
        ...group,
        isLast: true
      }
      return rule as Rule
    }

    if (entry instanceof RegExp) {
      const rule: RegExpRule = {
        ...(this.compileSequenceEntry(entry) as RegExpRule),
        name,
        isLast: true
      }

      return rule
    }

    const sub = entry instanceof Function ? (this.compileSequenceEntry(entry) as CallbackRule) : entry

    const rule: SequenceRule = {
      0: {
        ...sub,
        isLast: true
      },
      length: 1,
      isSequence: true,
      name,
      isLast: true
    }

    return rule
  }

  private static mergeRegExpEntries(
    entries: RuleDefinitionEntry[],
    combinator: Combinator,
    skip: RegExp | undefined
  ): RuleDefinitionEntry[] {
    if (entries.filter(e => e instanceof RegExp).length === 1) {
      if (entries.length === 1 || combinator === Combinator.Sequence) return entries
      // Moving the regexp rule to the beginning of the entries when the combinator is choice
      const index = entries.findIndex(e => e instanceof RegExp)
      util.array.unshiftWith(entries, index)
    }

    const merged: RuleDefinitionEntry[] = []
    // Merging regex sub expressions
    if (combinator === Combinator.Sequence) {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i] as RuleDefinitionEntry
        const last = util.array.last(merged)
        if (entry instanceof RegExp && last instanceof RegExp)
          merged[merged.length - 1] = new RegExp(
            (merged.length === 1 ? `(${last.source})` : last.source) +
              (skip?.source ? `(${skip?.source})` : '') +
              `(${entry.source})`
          )
        else merged.push(entry)
      }
    } else {
      let pattern = ''
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i] as RuleDefinitionEntry
        if (!(entry instanceof RegExp)) merged.push(entry)
        else pattern += `${pattern ? '|' : ''}(${entry.source})`
      }
      if (pattern) merged.unshift(new RegExp(pattern))
    }

    return merged
  }

  static mergeQuantifiers(first?: string, second?: string): string | undefined {
    if (!second) return first
    if (!first) return second

    const quantifiers = [first, second]
    if (quantifiers.includes('*')) return '*'
    if (quantifiers.includes('+') && quantifiers.includes('?')) return '*'

    // first === second === '?'
    return first
  }

  static applyModifiersToRegExpRule(
    rule: RegExpRule,
    { quantifier, assertion }: { assertion: string | undefined; quantifier: string | undefined }
  ): void {
    if (quantifier) rule[0] = new RegExp(`(${(rule[0] as RegExp).source})${quantifier}`)
    if (assertion) rule[0] = new RegExp(`(${assertion}(${(rule[0] as RegExp).source}))`)
  }
}
