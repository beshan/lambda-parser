import Parser from '../src/parser'
import RuleFactory from '../src/rule-factory'
import type { RuleDefinitionEntry } from '../src/types'
export { Combinator, Quantifier, Assertion, EventType, RunTimeEnv, LogType } from '../src/constants'
declare const r: (...subrules: RuleDefinitionEntry[]) => RuleFactory
declare const c: typeof RuleFactory.clone
export { Parser, r, c }
