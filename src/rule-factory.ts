import { ErrorMessage, Assertion, Combinator, Quantifier } from './constants'
import ExpressionFactory from './expression-factory'
import type {
  Callback,
  CallbackRule,
  IndividualRuleDefinitionEntry,
  IRuleFactory,
  RegExpRule,
  Rule,
  RuleBase,
  RuleDefinitionEntry
} from './types'

export default class RuleFactory implements IRuleFactory {
  entries: RuleDefinitionEntry[]
  isSequence = true
  isOrderedChoice = false
  isNonCapture = false
  combinator?: Combinator
  quantifier?: Quantifier
  assertion?: Assertion
  skipPattern?: RegExp
  debuggerEnabled = false

  constructor(...entries: RuleDefinitionEntry[]) {
    this.entries = entries
    return this
  }

  static clone(
    entries: IndividualRuleDefinitionEntry[],
    {
      name,
      quantifier,
      combinator,
      assertion,
      capture,
      skip,
      debug
    }: Partial<{
      name: string
      quantifier: string
      combinator: string
      assertion: string
      capture: false
      skip: RegExp | undefined
      debug: boolean
    }> = {}
  ): Rule | RegExp | Callback {
    const r = (...args: RuleDefinitionEntry[]): RuleFactory => new RuleFactory(...args)

    const factory = r(...entries)

    if (quantifier) factory.quantify(quantifier)
    if (combinator) factory.combine(combinator)
    if (capture === false) factory.capture(false)
    if (skip !== undefined) factory.skip(skip)
    if (debug) factory.debug()

    const rule = (assertion ? factory.assert(assertion) : factory.as(name ?? '')) as RuleBase
    if (!rule.name) delete rule.name

    if ((rule.isRegExp || rule.isCallback) && !rule.name && capture !== false) {
      if (rule.isRegExp) return new RegExp((rule as RegExpRule)[0] as RegExp)
      return (rule as CallbackRule)[0] as Callback
    }

    return rule as Rule
  }

  combine(combinator: string): RuleFactory {
    if (![Combinator.OrderedChoice, Combinator.Sequence].includes(combinator as Combinator))
      throw new Error(ErrorMessage.UnknownCombinator)

    this.combinator = combinator as Combinator
    return this
  }

  quantify(quantifier: string): RuleFactory {
    if (![Quantifier.Optional, Quantifier.ZeroOrMore, Quantifier.OneOrMany].includes(quantifier as Quantifier))
      throw new Error(ErrorMessage.UnknownQuantifier)

    this.quantifier = quantifier as Quantifier
    return this
  }

  assert(assertion: string): Rule {
    if (![Assertion.Lookahead, Assertion.NegativeLookahead].includes(assertion as Assertion))
      throw new Error(ErrorMessage.UnknownAssertion)

    this.assertion = assertion as Assertion
    const rule = this.as('')
    delete rule.name
    return rule
  }

  capture(value: false): RuleFactory {
    this.isNonCapture = !value
    return this
  }

  skip(pattern: RegExp): RuleFactory {
    this.skipPattern = pattern
    return this
  }

  debug(): RuleFactory {
    this.debuggerEnabled = true
    return this
  }

  as(name: string): Rule {
    const expression = ExpressionFactory.compile(name, this.entries, this.skipPattern, this.combinator)

    const rule: RuleBase = expression as RuleBase
    if (this.quantifier) rule.quantifier = this.quantifier
    if (this.assertion) rule.assertion = this.assertion
    if (this.combinator) rule.combinator = this.combinator
    if (this.debuggerEnabled) rule.debuggerEnabled = true
    if (this.skipPattern && !rule.isRegExp) {
      rule.skipPattern = this.skipPattern
    }
    if (this.isNonCapture) rule.isNonCapture = true

    this.optimize(rule as Rule)

    const firstSubRule = rule[0] as Rule
    if (rule.isRegExp || (rule.length === 1 && firstSubRule.isRegExp)) {
      ExpressionFactory.applyModifiersToRegExpRule((rule.isRegExp ? rule : firstSubRule) as RegExpRule, {
        quantifier: rule.quantifier,
        assertion: rule.assertion
      })

      RuleFactory.resetModifiers(rule as Rule)
      if (firstSubRule.isRegExp) rule.isSequence = true
      return rule as Rule
    }

    if (rule.quantifier) {
      switch (rule.quantifier) {
        case Quantifier.Optional:
          rule.isOptional = true
          break
        case Quantifier.ZeroOrMore:
          rule.isClosure = true
          rule.isKleeneClosure = true
          break
        case Quantifier.OneOrMany:
          rule.isClosure = true
          rule.isPositiveClosure = true
      }
    }

    if (rule.assertion) {
      rule.isAssertion = true
      switch (rule.assertion) {
        case Assertion.Lookahead:
          rule.isLookaheadAssertion = true
          break
        case Assertion.NegativeLookahead:
          rule.isNegativeLookaheadAssertion = true
      }
    }

    if (rule.combinator) {
      switch (rule.combinator) {
        case Combinator.OrderedChoice:
          rule.isChoice = true
          rule.isOrderedChoice = true
          break
      }
    }

    return rule as Rule
  }

  private optimize(rule: Rule): void {
    const firstSubRule = rule[0] as Rule
    if (
      rule.length > 1 ||
      rule.isRegExp ||
      (rule[0] as Rule).isCallback ||
      (firstSubRule.name && rule.name) ||
      // sub.combinator !== this.combinator ||
      rule.isChoice ||
      firstSubRule.isNonCapture === false ||
      (rule.skipPattern && firstSubRule.skipPattern && rule.skipPattern !== firstSubRule.skipPattern)
    )
      return

    const quantifier = ExpressionFactory.mergeQuantifiers(this.quantifier, firstSubRule.quantifier)
    const assertion = this.assertion ?? firstSubRule.assertion
    const combinator = rule.combinator === '/' || firstSubRule.combinator === '/' ? '/' : undefined
    RuleFactory.resetModifiers(rule)
    RuleFactory.resetModifiers(firstSubRule)
    delete (rule[0] as Rule).isLast
    delete rule[0]

    const name = rule.name || firstSubRule.name
    Object.assign(rule, {
      ...firstSubRule,
      name,
      quantifier,
      assertion,
      combinator,
      skipPattern: rule.skipPattern ?? firstSubRule.skipPattern
    })

    if (combinator === Combinator.OrderedChoice) {
      for (let i = 0; i < rule.length; i++) {
        // The original subrule shouldn't be changed because
        // it's may be referenced in other rules as well
        rule[i] = Object.assign({}, rule[i], { name }) as Rule
      }
    }
  }

  private static resetModifiers(rule: Rule): void {
    this.resetAssertion(rule)
    this.resetQuantifier(rule)
    this.resetCombinator(rule)
  }

  private static resetAssertion(rule: Rule): void {
    delete rule.isLookaheadAssertion
    delete rule.isNegativeLookaheadAssertion
    delete rule.isAssertion
    delete rule.assertion
  }

  private static resetQuantifier(rule: Rule): void {
    delete rule.quantifier
    delete rule.isClosure
    delete rule.isKleeneClosure
    delete rule.isPositiveClosure
    delete rule.isOptional
  }

  private static resetCombinator(rule: Rule): void {
    delete rule.combinator
    delete rule.isSequence
    delete rule.isOrderedSequence
    delete rule.isUnorderedSequence
    delete rule.isChoice
    delete rule.isOrderedChoice
    delete rule.isUnorderedChoice
  }
}
