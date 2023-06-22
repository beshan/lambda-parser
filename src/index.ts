import Parser from './parser'
import RuleFactory from './rule-factory'

import type { RuleDefinitionEntry } from './types'
export { Combinator, Quantifier, Assertion, EventType } from './constants'

const r = (...subrules: RuleDefinitionEntry[]): RuleFactory => new RuleFactory(...subrules)
const c = RuleFactory.clone

export { Parser, r, c }
