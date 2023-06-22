import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

import XpgParser from '../src/generator'
import jsonParser from './sample_parsers/json/parser'

const grammar = fs.readFileSync(path.join(process.cwd(), '/test/sample_parsers/json/grammar.xpg'), 'utf8')

describe('Testing JSON parser', () => {
  it('should parse the grammar.xpg', () => {
    const expected = [
      { name: 'json', assignment: ':', expression: [{ symbol: 'object' }] },
      {
        name: 'object',
        assignment: ':',
        expression: [
          {
            group: {
              expression: [
                { symbol: "'{'" },
                { symbol: 'prop' },
                { quantifier: '*', group: { name: 'rest', expression: [{ symbol: "','" }, { symbol: 'prop' }] } },
                { symbol: "'}'" }
              ]
            },
            combinator: '/'
          },
          { group: { expression: [{ symbol: "'{'" }, { symbol: "'}'" }] } }
        ]
      },
      {
        name: 'prop',
        assignment: ':',
        expression: [
          { group: { name: 'key', expression: [{ symbol: 'STRING' }] } },
          { symbol: "':'" },
          { symbol: 'value' }
        ]
      },
      {
        name: 'value',
        assignment: ':',
        expression: [
          { symbol: 'STRING', combinator: '/' },
          { symbol: 'BOOLEAN' },
          { symbol: 'NULL' },
          { symbol: 'NUMBER' },
          { symbol: 'object' },
          { symbol: 'array' }
        ]
      },
      {
        name: 'array',
        assignment: ':',
        expression: [
          {
            group: {
              expression: [
                { symbol: "'['" },
                { symbol: 'value' },
                { quantifier: '*', group: { name: 'rest', expression: [{ symbol: "','" }, { symbol: 'value' }] } },
                { symbol: "']'" }
              ]
            },
            combinator: '/'
          },
          { group: { expression: [{ symbol: "'['" }, { symbol: "']'" }] } }
        ]
      },
      { name: 'STRING', assignment: '=', expression: [{ symbol: 'r\'"((\\\\")|[^"])*"\'' }] },
      { name: 'NUMBER', assignment: '=', expression: [{ symbol: "r'[+-]?\\d+(\\.\\d+)?'" }] },
      { name: 'BOOLEAN', assignment: '=', expression: [{ symbol: "r'(true)|(false)'" }] },
      { name: 'NULL', assignment: '=', expression: [{ symbol: "'null'" }] },
      { name: 'SCRIPT', assignment: '=', expression: [{ symbol: "'./parser_ext'" }] }
    ]

    const pegParser = new XpgParser()
    const actual = pegParser.parse(grammar)
    expect(actual).to.deep.equal(expected)
  })

  it('should transpile the grammar.xpg', () => {
    const expected = [
      "import { c, r, Parser } from 'lambda-parser'",
      "import type { RuleDefinitionEntry } from 'lambda-parser/src/types'",
      "import * as SCRIPT from './parser_ext'",
      'const NULL = /null/',
      'const BOOLEAN = /(true)|(false)/',
      'const NUMBER = /[+-]?\\d+(\\.\\d+)?/',
      'const STRING = /"((\\\\")|[^"])*"/',
      "const array = r(c([c([/\\[/, (): RuleDefinitionEntry => value, r(c([/,/, (): RuleDefinitionEntry => value], { skip: SCRIPT.settings.skip })).quantify('*').as('rest'), /\\]/], { skip: SCRIPT.settings.skip }), c([/\\[/, /\\]/], { skip: SCRIPT.settings.skip })], { combinator: '/' })).as('array')",
      "const value = r(c([STRING, BOOLEAN, NULL, NUMBER, (): RuleDefinitionEntry => object, array], { combinator: '/' })).as('value')",
      "const prop = r(c([r(STRING).as('key'), /:/, value], { skip: SCRIPT.settings.skip })).as('prop')",
      "const object = r(c([c([/\\{/, prop, r(c([/,/, prop], { skip: SCRIPT.settings.skip })).quantify('*').as('rest'), /\\}/], { skip: SCRIPT.settings.skip }), c([/\\{/, /\\}/], { skip: SCRIPT.settings.skip })], { combinator: '/' })).as('object')",
      "const json = r(object).as('json')",
      'const parser = new Parser(json, { ...SCRIPT.settings })',
      'export default parser'
    ]

    const pegParser = new XpgParser()
    const actual = pegParser.transpile(grammar)
    expect(actual).to.deep.equal(expected)
  })

  it('should generate the correct grammar object', () => {
    const expected = {
      '0': {
        '0': { '0': '/(\\{)(\\s*)(\\})/', length: 1, isRegExp: true, name: 'object', isLast: true },
        '1': {
          '0': {
            '0': { '0': '/\\{/', length: 1, isRegExp: true },
            '1': {
              '0': { '0': '/"((\\\\")|[^"])*"/', length: 1, isRegExp: true, name: 'key' },
              '1': { '0': '/:/', length: 1, isRegExp: true },
              '2': {
                '0': {
                  '0': '/("((\\\\")|[^"])*")|((true)|(false))|(null)|([+-]?\\d+(\\.\\d+)?)/',
                  length: 1,
                  isRegExp: true,
                  name: 'value',
                  isLast: true
                },
                '1': {
                  '0': { length: 1, isCallback: true, isLast: true },
                  length: 1,
                  isSequence: true,
                  name: 'value',
                  isLast: true
                },
                '2': {
                  '0': {
                    '0': { '0': '/(\\[)(\\s*)(\\])/', length: 1, isRegExp: true, name: 'array', isLast: true },
                    '1': {
                      '0': {
                        '0': { '0': '/\\[/', length: 1, isRegExp: true },
                        '1': { length: 1, isCallback: true },
                        '2': {
                          '0': { '0': '/,/', length: 1, isRegExp: true },
                          '1': { length: 1, isCallback: true, isLast: true },
                          length: 2,
                          name: 'rest',
                          skipPattern: '/\\s*/',
                          quantifier: '*',
                          isClosure: true,
                          isKleeneClosure: true
                        },
                        '3': { '0': '/\\]/', length: 1, isRegExp: true, isLast: true },
                        length: 4,
                        isSequence: true,
                        skipPattern: '/\\s*/',
                        isLast: true
                      },
                      length: 1,
                      isSequence: true,
                      name: 'array',
                      isLast: true
                    },
                    length: 2,
                    name: 'array',
                    combinator: '/',
                    isChoice: true,
                    isOrderedChoice: true,
                    isLast: true
                  },
                  length: 1,
                  isSequence: true,
                  name: 'value',
                  isLast: true
                },
                length: 3,
                name: 'value',
                combinator: '/',
                isChoice: true,
                isOrderedChoice: true,
                isLast: true
              },
              length: 3,
              name: 'prop',
              skipPattern: '/\\s*/'
            },
            '2': {
              '0': { '0': '/,/', length: 1, isRegExp: true },
              '1': {
                '0': { '0': '/"((\\\\")|[^"])*"/', length: 1, isRegExp: true, name: 'key' },
                '1': { '0': '/:/', length: 1, isRegExp: true },
                '2': {
                  '0': {
                    '0': '/("((\\\\")|[^"])*")|((true)|(false))|(null)|([+-]?\\d+(\\.\\d+)?)/',
                    length: 1,
                    isRegExp: true,
                    name: 'value',
                    isLast: true
                  },
                  '1': {
                    '0': { length: 1, isCallback: true, isLast: true },
                    length: 1,
                    isSequence: true,
                    name: 'value',
                    isLast: true
                  },
                  '2': {
                    '0': {
                      '0': { '0': '/(\\[)(\\s*)(\\])/', length: 1, isRegExp: true, name: 'array', isLast: true },
                      '1': {
                        '0': {
                          '0': { '0': '/\\[/', length: 1, isRegExp: true },
                          '1': { length: 1, isCallback: true },
                          '2': {
                            '0': { '0': '/,/', length: 1, isRegExp: true },
                            '1': { length: 1, isCallback: true, isLast: true },
                            length: 2,
                            name: 'rest',
                            skipPattern: '/\\s*/',
                            quantifier: '*',
                            isClosure: true,
                            isKleeneClosure: true
                          },
                          '3': { '0': '/\\]/', length: 1, isRegExp: true, isLast: true },
                          length: 4,
                          isSequence: true,
                          skipPattern: '/\\s*/',
                          isLast: true
                        },
                        length: 1,
                        isSequence: true,
                        name: 'array',
                        isLast: true
                      },
                      length: 2,
                      name: 'array',
                      combinator: '/',
                      isChoice: true,
                      isOrderedChoice: true,
                      isLast: true
                    },
                    length: 1,
                    isSequence: true,
                    name: 'value',
                    isLast: true
                  },
                  length: 3,
                  name: 'value',
                  combinator: '/',
                  isChoice: true,
                  isOrderedChoice: true,
                  isLast: true
                },
                length: 3,
                name: 'prop',
                skipPattern: '/\\s*/',
                isLast: true
              },
              length: 2,
              name: 'rest',
              skipPattern: '/\\s*/',
              quantifier: '*',
              isClosure: true,
              isKleeneClosure: true
            },
            '3': { '0': '/\\}/', length: 1, isRegExp: true, isLast: true },
            length: 4,
            isSequence: true,
            skipPattern: '/\\s*/',
            isLast: true
          },
          length: 1,
          isSequence: true,
          name: 'object',
          isLast: true
        },
        length: 2,
        name: 'object',
        combinator: '/',
        isChoice: true,
        isOrderedChoice: true,
        isLast: true
      },
      length: 1,
      isSequence: true,
      name: 'json'
    }

    const actual = jsonParser.grammar
    expect(JSON.parse(JSON.stringify(actual))).to.deep.equal(expected)
  })

  it('should parse sample json', () => {
    const input = fs.readFileSync(path.join(process.cwd(), '/test/sample_parsers/json/sample.json'), 'utf8')

    const expected = {
      parent: {},
      parents: [],
      menu: {
        id: 'file',
        value: 'File',
        hasItem: true,
        items: 3,
        order: null,
        popup: {
          menuitem: [
            { value: 'New', onclick: 'CreateNewDoc()', hasItem: false },
            { value: 'Open', onclick: 'OpenDoc()' },
            { value: 'Close', onclick: 'CloseDoc()' }
          ]
        }
      }
    }

    const actual = (jsonParser.parse(input) as { object: unknown }).object
    expect(actual).to.deep.equal(expected)
  })
})
