import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

import XpgParser from '../src/generator'
import Calculator from './sample_parsers/calculator/'

const grammar = fs.readFileSync(path.join(process.cwd(), '/test/sample_parsers/calculator/grammar.xpg'), 'utf8')

describe('Testing Sample Calculator', () => {
  it('should parse the grammar.xpg', () => {
    const expected = [
      {
        name: 'equation',
        assignment: ':',
        expression: [
          {
            group: {
              expression: [
                { group: { name: 'a', expression: [{ symbol: 'VALUE' }] } },
                { group: { name: 'op', expression: [{ symbol: 'PAIR_OP' }] } },
                { group: { name: 'b', expression: [{ symbol: 'VALUE' }] } }
              ]
            },
            combinator: '/'
          },
          {
            group: {
              expression: [
                { group: { name: 'op', expression: [{ symbol: 'SOLO_OP' }] } },
                { group: { name: 'a', expression: [{ symbol: 'VALUE' }] } }
              ]
            }
          }
        ]
      },
      {
        name: 'PAIR_OP',
        assignment: '=',
        expression: [
          { symbol: "'+'", combinator: '/' },
          { symbol: "'-'" },
          { symbol: "'/'" },
          { symbol: "'*'" },
          { symbol: "'^'" }
        ]
      },
      { name: 'SOLO_OP', assignment: '=', expression: [{ symbol: "'sin'", combinator: '/' }, { symbol: "'cos'" }] },
      { name: 'VALUE', assignment: '=', expression: [{ symbol: 'FLOAT', combinator: '/' }, { symbol: 'INT' }] },
      { name: 'INT', assignment: '=', expression: [{ symbol: "r'[0-9]+'" }] },
      { name: 'FLOAT', assignment: '=', expression: [{ symbol: "r'[0-9]+\\.[0-9]+'" }] },
      { name: 'SCRIPT', assignment: '=', expression: [{ symbol: "'./parser_ext'" }] }
    ]

    const xpgParser = new XpgParser()
    const actual = xpgParser.parse(grammar)
    expect(actual).to.deep.equal(expected)
  })

  it('should transpile the grammar.xpg', () => {
    const expected = [
      "import { c, r, Parser } from 'lambda-parser'",
      "import type { RuleDefinitionEntry } from 'lambda-parser/src/types'",
      "import * as SCRIPT from './parser_ext'",
      'const FLOAT = /[0-9]+\\.[0-9]+/',
      'const INT = /[0-9]+/',
      "const VALUE = c([FLOAT, INT], { combinator: '/' })",
      "const SOLO_OP = c([/sin/, /cos/], { combinator: '/' })",
      "const PAIR_OP = c([/\\+/, /-/, /\\//, /\\*/, /\\^/], { combinator: '/' })",
      "const equation = r(c([c([r(VALUE).as('a'), r(PAIR_OP).as('op'), r(VALUE).as('b')], { skip: SCRIPT.settings.skip }), c([r(SOLO_OP).as('op'), r(VALUE).as('a')], { skip: SCRIPT.settings.skip })], { combinator: '/' })).as('equation')",
      'const parser = new Parser(equation, { ...SCRIPT.settings })',
      'export default parser'
    ]
    const xpgParser = new XpgParser()
    const actual = xpgParser.transpile(grammar)
    expect(actual).to.deep.equal(expected)
  })

  it('should generate the correct grammar object', () => {
    const expected = {
      '0': {
        '0': {
          '0': { '0': '/([0-9]+\\.[0-9]+)|([0-9]+)/', length: 1, isRegExp: true, name: 'a' },
          '1': { '0': '/(\\+)|(-)|(\\/)|(\\*)|(\\^)/', length: 1, isRegExp: true, name: 'op' },
          '2': { '0': '/([0-9]+\\.[0-9]+)|([0-9]+)/', length: 1, isRegExp: true, name: 'b', isLast: true },
          length: 3,
          isSequence: true,
          skipPattern: '/\\s*/',
          isLast: true
        },
        length: 1,
        isSequence: true,
        name: 'equation',
        isLast: true
      },
      '1': {
        '0': {
          '0': { '0': '/(sin)|(cos)/', length: 1, isRegExp: true, name: 'op' },
          '1': { '0': '/([0-9]+\\.[0-9]+)|([0-9]+)/', length: 1, isRegExp: true, name: 'a', isLast: true },
          length: 2,
          isSequence: true,
          skipPattern: '/\\s*/',
          isLast: true
        },
        length: 1,
        isSequence: true,
        name: 'equation',
        isLast: true
      },
      length: 2,
      name: 'equation',
      combinator: '/',
      isChoice: true,
      isOrderedChoice: true
    }
    const calc = new Calculator()
    const actual = calc.parser.grammar
    expect(JSON.parse(JSON.stringify(actual))).to.deep.equal(expected)
  })

  it('should interpret equations', () => {
    const calc = new Calculator()
    expect(calc.transpile('2+2')).to.be.equal(4)
    expect(calc.transpile('2-2')).to.be.equal(0)
    expect(calc.transpile('2*3')).to.be.equal(6)
    expect(calc.transpile('2/2')).to.be.equal(1)
    expect(calc.transpile('2^3')).to.be.equal(8)
    expect(calc.transpile('sin 0')).to.be.equal(0)
    expect(calc.transpile('cos 0')).to.be.equal(1)
  })
})
