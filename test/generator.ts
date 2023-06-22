import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

import ParserGenerator from '../src/generator'

const grammar = fs.readFileSync(path.join(process.cwd(), '/src/generator/grammar.xpg'), 'utf8')

describe('Testing Parser Generator', () => {
  it('should parse the grammar.xpg', () => {
    const expected = [
      {
        name: 'grammar',
        assignment: ':',
        expression: [
          {
            quantifier: '+',
            group: {
              expression: [
                {
                  group: {
                    expression: [
                      { group: { name: 'name', expression: [{ symbol: 'NAME' }] } },
                      { group: { name: 'assignment', expression: [{ symbol: 'ASSIGNMENT' }] } },
                      { symbol: 'expression' }
                    ]
                  },
                  combinator: '/'
                },
                { noncapture: '~', group: { name: 'comment', expression: [{ symbol: 'COMMENT' }] } }
              ]
            }
          }
        ]
      },
      {
        name: 'expression',
        assignment: ':',
        expression: [
          { group: { name: 'first', expression: [{ symbol: 'sub_expr' }] } },
          {
            quantifier: '?',
            group: { name: 'rest', expression: [{ symbol: 'sequence', combinator: '/' }, { symbol: 'choice' }] }
          }
        ]
      },
      {
        name: 'choice',
        assignment: '=',
        expression: [
          {
            quantifier: '+',
            group: {
              expression: [{ group: { name: 'combinator', expression: [{ symbol: 'SLASH' }] } }, { symbol: 'sub_expr' }]
            }
          }
        ]
      },
      {
        name: 'sequence',
        assignment: '=',
        expression: [
          {
            quantifier: '+',
            group: {
              expression: [
                { group: { name: 'combinator', expression: [{ symbol: 'NOT_SLASH' }] } },
                { symbol: 'sub_expr' },
                { assertion: '!', symbol: 'ASSIGNMENT' }
              ]
            }
          }
        ]
      },
      {
        name: 'sub_expr',
        assignment: '=',
        expression: [
          { quantifier: '?', group: { name: 'noncapture', expression: [{ symbol: 'TILDE' }] } },
          { quantifier: '?', group: { name: 'assertion', expression: [{ symbol: 'ASSERTION' }] } },
          {
            group: {
              expression: [
                { symbol: 'group', combinator: '/' },
                { group: { name: 'symbol', expression: [{ symbol: 'SYMBOL' }] } }
              ]
            }
          },
          { group: { name: 'quantifier', expression: [{ symbol: 'QUANTIFIER' }] } }
        ]
      },
      {
        name: 'group',
        assignment: ':',
        expression: [
          {
            quantifier: '?',
            group: { name: 'name', expression: [{ symbol: 'NAME' }, { assertion: '&', symbol: 'L_PAREN' }] }
          },
          { symbol: 'L_PAREN' },
          { symbol: 'expression' },
          { symbol: 'R_PAREN' }
        ]
      },
      {
        name: 'ASSERTION',
        assignment: '=',
        expression: [{ symbol: 'AMPERSAND', combinator: '/' }, { symbol: 'EXCLAMATION' }]
      },
      {
        name: 'QUANTIFIER',
        assignment: '=',
        expression: [
          {
            quantifier: '?',
            group: { expression: [{ symbol: 'QUESTION', combinator: '/' }, { symbol: 'ASTERISK' }, { symbol: 'PLUS' }] }
          }
        ]
      },
      { name: 'COMMENT', assignment: '=', expression: [{ symbol: 'HASHTAG' }, { symbol: 'EXCEPT_LINE_BREAK' }] },
      {
        name: 'SYMBOL',
        assignment: '=',
        expression: [
          { symbol: 'REGEXP', combinator: '/' },
          { symbol: 'DYNAMIC_RULE' },
          { symbol: 'LITERAL' },
          { symbol: 'NAME' }
        ]
      },
      { name: 'ASSIGNMENT', assignment: '=', expression: [{ symbol: 'COLON', combinator: '/' }, { symbol: 'EQUAL' }] },
      { name: 'REGEXP', assignment: '=', expression: [{ symbol: 'LOWER_R' }, { symbol: 'LITERAL' }] },
      { name: 'NAME', assignment: '=', expression: [{ symbol: "r'[a-zA-Z0-9_]+'" }] },
      { name: 'LITERAL', assignment: '=', expression: [{ symbol: "r'''([^'']|(''''))*'''" }] },
      { name: 'NOT_SLASH', assignment: '=', expression: [{ symbol: "r'[^/]'" }] },
      { name: 'EXCEPT_LINE_BREAK', assignment: '=', expression: [{ symbol: "r'[^\\n]*'" }] },
      { name: 'DYNAMIC_RULE', assignment: '=', expression: [{ symbol: "r'SCRIPT(\\.[a-zA-Z0-9_]+)+'" }] },
      { name: 'LOWER_R', assignment: '=', expression: [{ symbol: "'r'" }] },
      { name: 'L_PAREN', assignment: '=', expression: [{ symbol: "'('" }] },
      { name: 'R_PAREN', assignment: '=', expression: [{ symbol: "')'" }] },
      { name: 'COLON', assignment: '=', expression: [{ symbol: 'SCRIPT.COLON' }] },
      { name: 'EQUAL', assignment: '=', expression: [{ symbol: "'='" }] },
      { name: 'TILDE', assignment: '=', expression: [{ symbol: "'~'" }] },
      { name: 'SLASH', assignment: '=', expression: [{ symbol: "'/'" }] },
      { name: 'QUESTION', assignment: '=', expression: [{ symbol: "'?'" }] },
      { name: 'ASTERISK', assignment: '=', expression: [{ symbol: "'*'" }] },
      { name: 'PLUS', assignment: '=', expression: [{ symbol: "'+'" }] },
      { name: 'AMPERSAND', assignment: '=', expression: [{ symbol: 'SCRIPT.AMPERSAND' }] },
      { name: 'EXCLAMATION', assignment: '=', expression: [{ symbol: 'SCRIPT.EXCLAMATION' }] },
      { name: 'HASHTAG', assignment: '=', expression: [{ symbol: "'#'" }] },
      { name: 'SKIP', assignment: '=', expression: [{ symbol: "r'\\s*'" }] },
      { name: 'SCRIPT', assignment: '=', expression: [{ symbol: "'./parser_ext'" }] }
    ]

    const generator = new ParserGenerator()
    const actual = generator.parse(grammar)
    expect(actual).to.deep.equal(expected)
  })

  it('should transpile the grammar.xpg', () => {
    const expected = [
      "import { c, r, Parser } from 'lambda-parser'",
      "import type { RuleDefinitionEntry } from 'lambda-parser/src/types'",
      "import * as SCRIPT from './parser_ext'",
      'const SKIP = /\\s*/',
      'const HASHTAG = /#/',
      'const EXCLAMATION = SCRIPT.EXCLAMATION',
      'const AMPERSAND = SCRIPT.AMPERSAND',
      'const PLUS = /\\+/',
      'const ASTERISK = /\\*/',
      'const QUESTION = /\\?/',
      'const SLASH = /\\//',
      'const TILDE = /~/',
      'const EQUAL = /=/',
      'const COLON = SCRIPT.COLON',
      'const R_PAREN = /\\)/',
      'const L_PAREN = /\\(/',
      'const LOWER_R = /r/',
      'const DYNAMIC_RULE = /SCRIPT(\\.[a-zA-Z0-9_]+)+/',
      'const EXCEPT_LINE_BREAK = /[^\\n]*/',
      'const NOT_SLASH = /[^/]/',
      "const LITERAL = /'([^']|(''))*'/",
      'const NAME = /[a-zA-Z0-9_]+/',
      'const REGEXP = c([LOWER_R, LITERAL], { skip: SCRIPT.settings.skip })',
      "const ASSIGNMENT = c([COLON, EQUAL], { combinator: '/' })",
      "const SYMBOL = c([REGEXP, DYNAMIC_RULE, LITERAL, NAME], { combinator: '/' })",
      'const COMMENT = c([HASHTAG, EXCEPT_LINE_BREAK], { skip: SCRIPT.settings.skip })',
      "const QUANTIFIER = c([c([QUESTION, ASTERISK, PLUS], { combinator: '/' })], { quantifier: '?' })",
      "const ASSERTION = c([AMPERSAND, EXCLAMATION], { combinator: '/' })",
      "const group = r(c([r(c([NAME, c([L_PAREN], { assertion: '?=' })], { skip: SCRIPT.settings.skip })).quantify('?').as('name'), L_PAREN, (): RuleDefinitionEntry => expression, R_PAREN], { skip: SCRIPT.settings.skip })).as('group')",
      "const sub_expr = c([r(TILDE).quantify('?').as('noncapture'), r(ASSERTION).quantify('?').as('assertion'), c([group, r(SYMBOL).as('symbol')], { combinator: '/' }), r(QUANTIFIER).as('quantifier')], { skip: SCRIPT.settings.skip })",
      "const sequence = c([c([r(NOT_SLASH).as('combinator'), sub_expr, c([ASSIGNMENT], { assertion: '?!' })], { skip: SCRIPT.settings.skip })], { quantifier: '+' })",
      "const choice = c([c([r(SLASH).as('combinator'), sub_expr], { skip: SCRIPT.settings.skip })], { quantifier: '+' })",
      "const expression = r(c([r(sub_expr).as('first'), r(c([sequence, choice], { combinator: '/' })).quantify('?').as('rest')], { skip: SCRIPT.settings.skip })).as('expression')",
      "const grammar = r(c([c([c([r(NAME).as('name'), r(ASSIGNMENT).as('assignment'), expression], { skip: SCRIPT.settings.skip }), r(COMMENT).capture(false).as('comment')], { combinator: '/' })], { quantifier: '+' })).as('grammar')",
      'const parser = new Parser(grammar, { ...SCRIPT.settings })',
      'export default parser'
    ]

    const parser = new ParserGenerator()
    const actual = parser.transpile(grammar)
    expect(actual).to.deep.equal(expected)
  })

  it.skip('should generate the correct grammar object', () => {
    const expected = {
      '0': {
        '0': {
          '0': { '0': '[a-zA-Z0-9_]+', length: 1, isRegExp: true, name: 'name' },
          '1': { '0': '(:)|(=)', length: 1, isRegExp: true, name: 'assignment' },
          '2': {
            '0': {
              '0': { '0': '(~)?', length: 1, isRegExp: true, name: 'skip' },
              '1': { '0': '((&)|(!))?', length: 1, isRegExp: true, name: 'assertion' },
              '2': {
                '0': {
                  '0': {
                    '0': {
                      '0': '(([a-zA-Z0-9_]+)((?=(\\())))?',
                      length: 1,
                      isRegExp: true,
                      name: 'name'
                    },
                    '1': { '0': '\\(', length: 1, isRegExp: true },
                    '2': { length: 1, isCallback: true },
                    '3': { '0': '\\)', length: 1, isRegExp: true, isLast: true },
                    length: 4,
                    name: 'group',
                    isLast: true
                  },
                  length: 1,
                  isSequence: true,
                  name: '',
                  isLast: true
                },
                '1': {
                  '0': {
                    '0': "((r)('([^']|(''))*'))|('([^']|(''))*')|([a-zA-Z0-9_]+)",
                    length: 1,
                    isRegExp: true,
                    name: 'symbol',
                    isLast: true
                  },
                  length: 1,
                  isSequence: true,
                  name: '',
                  isLast: true
                },
                length: 2,
                isChoice: true,
                combinator: '/',
                isOrderedChoice: true
              },
              '3': {
                '0': '((\\?)|(\\*)|(\\+))?',
                length: 1,
                isRegExp: true,
                name: 'quantifier',
                isLast: true
              },
              length: 4,
              name: 'first'
            },
            '1': {
              '0': {
                '0': {
                  '0': { '0': '[^|/]', length: 1, isRegExp: true, name: 'combinator' },
                  '1': {
                    '0': { '0': '(~)?', length: 1, isRegExp: true, name: 'skip' },
                    '1': { '0': '((&)|(!))?', length: 1, isRegExp: true, name: 'assertion' },
                    '2': {
                      '0': {
                        '0': {
                          '0': {
                            '0': '(([a-zA-Z0-9_]+)((?=(\\())))?',
                            length: 1,
                            isRegExp: true,
                            name: 'name'
                          },
                          '1': { '0': '\\(', length: 1, isRegExp: true },
                          '2': { length: 1, isCallback: true },
                          '3': { '0': '\\)', length: 1, isRegExp: true, isLast: true },
                          length: 4,
                          name: 'group',
                          isLast: true
                        },
                        length: 1,
                        isSequence: true,
                        name: '',
                        isLast: true
                      },
                      '1': {
                        '0': {
                          '0': "((r)('([^']|(''))*'))|('([^']|(''))*')|([a-zA-Z0-9_]+)",
                          length: 1,
                          isRegExp: true,
                          name: 'symbol',
                          isLast: true
                        },
                        length: 1,
                        isSequence: true,
                        name: '',
                        isLast: true
                      },
                      length: 2,
                      isChoice: true,
                      combinator: '/',
                      isOrderedChoice: true
                    },
                    '3': {
                      '0': '((\\?)|(\\*)|(\\+))?',
                      length: 1,
                      isRegExp: true,
                      name: 'quantifier',
                      isLast: true
                    },
                    length: 4,
                    isSequence: true
                  },
                  '2': { '0': '(?!((:)|(=)))', length: 1, isRegExp: true, isLast: true },
                  length: 3,
                  quantifier: '+',
                  isClosure: true,
                  isPositiveClosure: true,
                  isLast: true
                },
                length: 1,
                isSequence: true,
                name: 'rest',
                isLast: true
              },
              '1': {
                '0': {
                  '0': {
                    '0': {
                      '0': { '0': '\\|', length: 1, isRegExp: true, name: 'combinator' },
                      '1': {
                        '0': { '0': '(~)?', length: 1, isRegExp: true, name: 'skip' },
                        '1': { '0': '((&)|(!))?', length: 1, isRegExp: true, name: 'assertion' },
                        '2': {
                          '0': {
                            '0': {
                              '0': {
                                '0': '(([a-zA-Z0-9_]+)((?=(\\())))?',
                                length: 1,
                                isRegExp: true,
                                name: 'name'
                              },
                              '1': { '0': '\\(', length: 1, isRegExp: true },
                              '2': { length: 1, isCallback: true },
                              '3': { '0': '\\)', length: 1, isRegExp: true, isLast: true },
                              length: 4,
                              name: 'group',
                              isLast: true
                            },
                            length: 1,
                            isSequence: true,
                            name: '',
                            isLast: true
                          },
                          '1': {
                            '0': {
                              '0': "((r)('([^']|(''))*'))|('([^']|(''))*')|([a-zA-Z0-9_]+)",
                              length: 1,
                              isRegExp: true,
                              name: 'symbol',
                              isLast: true
                            },
                            length: 1,
                            isSequence: true,
                            name: '',
                            isLast: true
                          },
                          length: 2,
                          isChoice: true,
                          combinator: '/',
                          isOrderedChoice: true
                        },
                        '3': {
                          '0': '((\\?)|(\\*)|(\\+))?',
                          length: 1,
                          isRegExp: true,
                          name: 'quantifier',
                          isLast: true
                        },
                        length: 4,
                        isSequence: true,
                        isLast: true
                      },
                      length: 2,
                      quantifier: '+',
                      isClosure: true,
                      isPositiveClosure: true,
                      isLast: true
                    },
                    length: 1,
                    isSequence: true,
                    name: '',
                    isLast: true
                  },
                  '1': {
                    '0': {
                      '0': { '0': '\\/', length: 1, isRegExp: true, name: 'combinator' },
                      '1': {
                        '0': { '0': '(~)?', length: 1, isRegExp: true, name: 'skip' },
                        '1': { '0': '((&)|(!))?', length: 1, isRegExp: true, name: 'assertion' },
                        '2': {
                          '0': {
                            '0': {
                              '0': {
                                '0': '(([a-zA-Z0-9_]+)((?=(\\())))?',
                                length: 1,
                                isRegExp: true,
                                name: 'name'
                              },
                              '1': { '0': '\\(', length: 1, isRegExp: true },
                              '2': { length: 1, isCallback: true },
                              '3': { '0': '\\)', length: 1, isRegExp: true, isLast: true },
                              length: 4,
                              name: 'group',
                              isLast: true
                            },
                            length: 1,
                            isSequence: true,
                            name: '',
                            isLast: true
                          },
                          '1': {
                            '0': {
                              '0': "((r)('([^']|(''))*'))|('([^']|(''))*')|([a-zA-Z0-9_]+)",
                              length: 1,
                              isRegExp: true,
                              name: 'symbol',
                              isLast: true
                            },
                            length: 1,
                            isSequence: true,
                            name: '',
                            isLast: true
                          },
                          length: 2,
                          isChoice: true,
                          combinator: '/',
                          isOrderedChoice: true
                        },
                        '3': {
                          '0': '((\\?)|(\\*)|(\\+))?',
                          length: 1,
                          isRegExp: true,
                          name: 'quantifier',
                          isLast: true
                        },
                        length: 4,
                        isSequence: true,
                        isLast: true
                      },
                      length: 2,
                      quantifier: '+',
                      isClosure: true,
                      isPositiveClosure: true,
                      isLast: true
                    },
                    length: 1,
                    isSequence: true,
                    name: '',
                    isLast: true
                  },
                  length: 2,
                  isChoice: true,
                  combinator: '/',
                  isOrderedChoice: true,
                  isLast: true
                },
                length: 1,
                isSequence: true,
                name: 'rest',
                isLast: true
              },
              length: 2,
              name: 'rest',
              quantifier: '?',
              combinator: '/',
              isOptional: true,
              isChoice: true,
              isOrderedChoice: true,
              isLast: true
            },
            length: 2,
            name: 'expression',
            isLast: true
          },
          length: 3,
          isSequence: true,
          isLast: true
        },
        length: 1,
        isSequence: true,
        name: 'grammar',
        isLast: true
      },
      '1': {
        '0': {
          '0': '(#)([^\\n]*)',
          length: 1,
          isRegExp: true,
          name: 'comment',
          capture: false,
          isLast: true
        },
        length: 1,
        isSequence: true,
        name: 'grammar',
        isLast: true
      },
      length: 2,
      name: 'grammar',
      quantifier: '+',
      combinator: '/',
      isClosure: true,
      isPositiveClosure: true,
      isChoice: true,
      isOrderedChoice: true
    }

    const generator = new ParserGenerator()
    const actual = generator.parser.grammar
    expect(JSON.stringify(actual)).to.deep.equal(JSON.stringify(expected))
  })
})
