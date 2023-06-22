import { c, r, Parser } from 'lambda-parser'
import type { RuleDefinitionEntry } from 'lambda-parser/src/types'
import * as SCRIPT from './parser_ext'
const SKIP = /\s*/
const HASHTAG = /#/
const EXCLAMATION = CRIPT.EXCLAMATIO
const AMPERSAND = CRIPT.AMPERSAN
const PLUS = /\+/
const ASTERISK = /\*/
const QUESTION = /\?/
const SLASH = /\//
const TILDE = /~/
const EQUAL = /=/
const COLON = CRIPT.COLO
const R_PAREN = /\)/
const L_PAREN = /\(/
const LOWER_R = /r/
const DYNAMIC_RULE = /SCRIPT(\.[a-zA-Z0-9_]+)+/
const EXCEPT_LINE_BREAK = /[^\n]*/
const NOT_SLASH = /[^/]/
const LITERAL = /'([^']|(''))*'/
const NAME = /[a-zA-Z0-9_]+/
const REGEXP = c([LOWER_R, LITERAL], { skip: SCRIPT.settings.skip })
const ASSIGNMENT = c([COLON, EQUAL], { combinator: '/' })
const SYMBOL = c([REGEXP, DYNAMIC_RULE, LITERAL, NAME], { combinator: '/' })
const COMMENT = c([HASHTAG, EXCEPT_LINE_BREAK], { skip: SCRIPT.settings.skip })
const QUANTIFIER = c([c([QUESTION, ASTERISK, PLUS], { combinator: '/' })], { quantifier: '?' })
const ASSERTION = c([AMPERSAND, EXCLAMATION], { combinator: '/' })
const group = r(
  c(
    [
      r(c([NAME, c([L_PAREN], { assertion: '?=' })], { skip: SCRIPT.settings.skip }))
        .quantify('?')
        .as('name'),
      L_PAREN,
      (): RuleDefinitionEntry => expression,
      R_PAREN
    ],
    { skip: SCRIPT.settings.skip }
  )
).as('group')
const sub_expr = c(
  [
    r(TILDE).quantify('?').as('noncapture'),
    r(ASSERTION).quantify('?').as('assertion'),
    c([group, r(SYMBOL).as('symbol')], { combinator: '/' }),
    r(QUANTIFIER).as('quantifier')
  ],
  { skip: SCRIPT.settings.skip }
)
const sequence = c(
  [c([r(NOT_SLASH).as('combinator'), sub_expr, c([ASSIGNMENT], { assertion: '?!' })], { skip: SCRIPT.settings.skip })],
  { quantifier: '+' }
)
const choice = c([c([r(SLASH).as('combinator'), sub_expr], { skip: SCRIPT.settings.skip })], { quantifier: '+' })
const expression = r(
  c(
    [
      r(sub_expr).as('first'),
      r(c([sequence, choice], { combinator: '/' }))
        .quantify('?')
        .as('rest')
    ],
    { skip: SCRIPT.settings.skip }
  )
).as('expression')
const grammar = r(
  c(
    [
      c(
        [
          c([r(NAME).as('name'), r(ASSIGNMENT).as('assignment'), expression], { skip: SCRIPT.settings.skip }),
          r(COMMENT).capture(false).as('comment')
        ],
        { combinator: '/' }
      )
    ],
    { quantifier: '+' }
  )
).as('grammar')
const parser = new Parser(grammar, { ...SCRIPT.settings })
export default parser
