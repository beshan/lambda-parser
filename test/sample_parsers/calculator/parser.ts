import { c, r, Parser } from '../../../src'
import * as SCRIPT from './parser_ext'
const FLOAT = /[0-9]+\.[0-9]+/
const INT = /[0-9]+/
const VALUE = c([FLOAT, INT], { combinator: '/' })
const SOLO_OP = c([/sin/, /cos/], { combinator: '/' })
const PAIR_OP = c([/\+/, /-/, /\//, /\*/, /\^/], { combinator: '/' })
const equation = r(
  c(
    [
      c([r(VALUE).as('a'), r(PAIR_OP).as('op'), r(VALUE).as('b')], { skip: SCRIPT.settings.skip }),
      c([r(SOLO_OP).as('op'), r(VALUE).as('a')], { skip: SCRIPT.settings.skip })
    ],
    { combinator: '/' }
  )
).as('equation')
const parser = new Parser(equation, { ...SCRIPT.settings })
export default parser
