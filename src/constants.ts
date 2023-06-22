export enum LogType {
  Error = 'error',
  Warning = 'warning'
}

export enum ErrorMessage {
  NotImplemented = 'Not Implemented',
  UndefinedStackEntryName = "Entry name can't be undefined.",
  UndefinedEntryData = 'Entry data is undefined, create(rule) should be called first.',
  UndefinedEntryParentData = "Entry's parent data is undefined, create(entry.parent) should be called first.",
  UnknownCombinator = "Unknown combinator. Please use '.' for sequence, or '/' for ordered-choice.",
  UnknownQuantifier = "Unknown quantifier. Please use '?' for optional, or '*' for zero-or-more, or '+' for one-or-more.",
  UnknownAssertion = `Unknown assertion. Please use '?=' for lookahead, or '?!' for negative-lookahead.`,
  ArrayInSequenceRuleDefinitionEntry = "Failed to compile '#{0}' rule, entry at index #{1} can't be an array, please use ...[] instead.",
  UnnamedRuleDefinitionEntry = "Failed to compile '#{0}' rule, entry at index #{1} can't be unnamed.",
  InvalidSkipValue = 'Invalid skip value. Literal, RegExp or boolean was expected.'
}

export enum Combinator {
  Sequence = '.',
  OrderedChoice = '/'
}

export enum Quantifier {
  Optional = '?',
  ZeroOrMore = '*',
  OneOrMany = '+'
}

export enum Assertion {
  Lookahead = '?=',
  NegativeLookahead = '?!'
}

export enum EventType {
  RuleSucceeded,
  RuleFailed,
  RuleDebugging
}

export enum RunTimeEnv {
  Browser = 'browser',
  Deno = 'deno',
  Node = 'node'
}

export const UNNAMED_ENTRY_NAME = '__UNNAMED__'
