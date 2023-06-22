import { c, r, Parser } from '../../../src'
import type { RuleDefinitionEntry } from '../../../src/types'
import * as SCRIPT from './parser_ext'
const NULL = /null/
const BOOLEAN = /(true)|(false)/
const NUMBER = /[+-]?\d+(\.\d+)?/
const STRING = /"((\\")|[^"])*"/
const array = r(
  c(
    [
      c(
        [
          /\[/,
          (): RuleDefinitionEntry => value,
          r(c([/,/, (): RuleDefinitionEntry => value], { skip: SCRIPT.settings.skip }))
            .quantify('*')
            .as('rest'),
          /\]/
        ],
        { skip: SCRIPT.settings.skip }
      ),
      c([/\[/, /\]/], { skip: SCRIPT.settings.skip })
    ],
    { combinator: '/' }
  )
).as('array')
const value = r(c([STRING, BOOLEAN, NULL, NUMBER, (): RuleDefinitionEntry => object, array], { combinator: '/' })).as(
  'value'
)
const prop = r(c([r(STRING).as('key'), /:/, value], { skip: SCRIPT.settings.skip })).as('prop')
const object = r(
  c(
    [
      c(
        [
          /\{/,
          prop,
          r(c([/,/, prop], { skip: SCRIPT.settings.skip }))
            .quantify('*')
            .as('rest'),
          /\}/
        ],
        { skip: SCRIPT.settings.skip }
      ),
      c([/\{/, /\}/], { skip: SCRIPT.settings.skip })
    ],
    { combinator: '/' }
  )
).as('object')
const json = r(object).as('json')
const parser = new Parser(json, { ...SCRIPT.settings })
export default parser
