/* eslint-disable @typescript-eslint/no-explicit-any */
export type ParserSettings = Partial<{
  log: boolean
  skip: RegExp
  listener: ParserListener
}>
export type ParserListener = (this: IParser, event: ParserEvent) => unknown
export type ParserEvent = RuleSucceededEvent | RuleFailedEvent
export type RuleSucceededEvent = {
  type: 0
  data: { name?: string; data: any; entry: StackEntry }
}
export type RuleFailedEvent = {
  type: 1
  data: { name?: string; entry: StackEntry }
}
export type StackEntry = {
  name?: string
  rule: Rule
  parent?: ParentStackEntry
  startPosition: number
  data?: Dict
  canceled?: boolean
}
export type ParentStackEntry = StackEntry & {
  name: string
}
export interface IParser {
  lexer: ILexer
  parse(input: string): any
}
export interface ILexer {
  isEof: boolean
  jump: (length: number) => void
  scan(pattern: RegExp): string | undefined
  lookahead(pattern: RegExp): string | undefined
  lookback(pattern: RegExp): string | undefined
}

export interface IRuleFactory {
  combine(combinator: string): IRuleFactory
  quantify(quantifier: string): IRuleFactory
  assert(assertion: string): Rule
  capture(value: boolean): IRuleFactory
  skip(pattern: RegExp): IRuleFactory
  as(name: string): Rule
}

export type CloneRuleMethod = (
  entries: IndividualRuleDefinitionEntry[],
  settings?: Partial<{
    name: string
    quantifier: string
    combinator: string
    assertion: string
    capture: boolean
    skip: RegExp
    debug: boolean
  }>
) => Rule | RegExp | Callback

export type RuleDefinitionEntry = IndividualRuleDefinitionEntry | Array<IndividualRuleDefinitionEntry>
export type IndividualRuleDefinitionEntry = RegExp | Callback | Rule
export type Rule = SequenceRule | OrderedChoiceRule | RegExpRule | CallbackRule
export type Callback = (...args: any[]) => any
export type Dict = { [key: string]: any }

export type SequenceRule = RuleBase & {
  isSequence: true
}

export type OrderedChoiceRule = RuleBase & {
  combinator: '/'
  isOrderedChoice: true
}
export type RegExpRule = RuleBase & {
  [key: number]: RegExp
  isRegExp: true
  length: 1
  // A RegExp sub expression has name when it's a solo sub expression.
  name?: string
}
export type CallbackRule = RuleBase & {
  [key: number]: Callback
  isCallback: true
  length: 1
  // A Callback sub expression has name when it's a solo sub expression.
  name?: string
}
export type RuleBase = {
  [key: number]: RegExp | Callback | Rule
  length: number

  name?: string

  quantifier?: string
  isClosure?: boolean
  isKleeneClosure?: boolean
  isPositiveClosure?: boolean
  isOptional?: boolean

  isAssertion?: boolean
  assertion?: string
  isLookaheadAssertion?: boolean
  isNegativeLookaheadAssertion?: boolean

  isNonCapture?: boolean

  debuggerEnabled?: true

  skipPattern?: RegExp

  combinator?: string
  isSequence?: boolean
  isOrderedSequence?: boolean
  isUnorderedSequence?: boolean

  isChoice?: boolean
  isOrderedChoice?: boolean
  isUnorderedChoice?: boolean

  isRegExp?: boolean
  isCallback?: boolean

  isLast?: boolean
  isPrepared?: boolean
}
