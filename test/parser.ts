import { expect } from 'chai'

import * as util from '../src/utils'
import { EventType } from '../src/constants'
import Parser from '../src/parser'
import RuleFactory from '../src/rule-factory'
import type { ParserEvent, Rule, RuleDefinitionEntry } from '../src/types'

const r = (...args: RuleDefinitionEntry[]): RuleFactory => new RuleFactory(...args)
const c = RuleFactory.clone

const NAME = /[a-zA-Z0-9_]+/
const ALPHABET = /[a-zA-Z]/
const DIGIT = /[0-9]/
const SYMBOL = /[@#%]/
const WORD = /[a-zA-Z]+/
const NUMBER = /[+-]?\d*\.?\d+(?:[Ee][+-]?\d+)?/
const NULL = /null/
const TRUE = /true/
const FALSE = /false/
const STRING = /("[^"]*")|('[^']*')/
const WHITESPACE = /\s+/
const ENDOFLINE = /\n|$/

describe('Testing parser', () => {
  it('should generate schema for sequence expression', () => {
    const digit = r(DIGIT).quantify('+').as('digit')
    const alphabet = r(ALPHABET).quantify('+').as('alphabet')
    const value = r(digit, alphabet, () => alphabet, ENDOFLINE)
      .quantify('+')
      .skip(WHITESPACE)
      .debug()
      .as('value')

    const expected = {
      '0': {
        '0': '/([0-9])+/',
        name: 'digit',
        length: 1,
        isRegExp: true
      },
      '1': {
        '0': '/([a-zA-Z])+/',
        name: 'alphabet',
        length: 1,
        isRegExp: true
      },
      '2': { isCallback: true, length: 1 },
      '3': { '0': '/\\n|$/', isRegExp: true, length: 1, isLast: true },
      name: 'value',
      length: 4,
      isClosure: true,
      quantifier: '+',
      isPositiveClosure: true,
      isSequence: true,
      skipPattern: '/\\s+/',
      debuggerEnabled: true
    }

    expect(util.object.toJson(value)).to.deep.equal(expected)
  })

  it('should generate schema for choice expression', () => {
    const digit = r(DIGIT).quantify('+').as('digit')
    const alphabet = r(ALPHABET).quantify('+').as('alphabet')
    const symbol = r(SYMBOL).quantify('+').as('symbol')
    const value = r(() => alphabet, [alphabet, digit], symbol, ENDOFLINE)
      .combine('/')
      .quantify('+')
      .skip(WHITESPACE)
      .as('value')

    const expected = {
      '0': { '0': '/\\n|$/', name: 'value', isRegExp: true, isLast: true, length: 1 },
      '1': {
        '0': { isCallback: true, isLast: true, length: 1 },
        name: 'value',
        isSequence: true,
        isLast: true,
        length: 1
      },
      '2': {
        '0': {
          '0': '/([a-zA-Z])+/',
          name: 'alphabet',
          length: 1,
          isRegExp: true
        },
        '1': {
          '0': '/([0-9])+/',
          name: 'digit',
          length: 1,
          isRegExp: true,
          isLast: true
        },
        name: 'value',
        isSequence: true,
        length: 2,
        isLast: true
      },
      '3': {
        '0': {
          '0': '/([@#%])+/',
          name: 'symbol',
          length: 1,
          isRegExp: true,
          isLast: true
        },
        name: 'value',
        isSequence: true,
        isLast: true,
        length: 1
      },
      name: 'value',
      isChoice: true,
      combinator: '/',
      isOrderedChoice: true,
      length: 4,
      skipPattern: '/\\s+/',
      isClosure: true,
      quantifier: '+',
      isPositiveClosure: true
    }

    expect(util.object.toJson(value)).to.deep.equal(expected)
  })

  it('should clone a rule with modification', () => {
    const digit = r(DIGIT).quantify('+').as('digit')
    const alphabet = r(ALPHABET).quantify('+').as('alphabet')
    const symbol = r(SYMBOL).quantify('+').as('symbol')
    const value = r(() => alphabet, [alphabet, digit], symbol, ENDOFLINE)
      .combine('/')
      .quantify('+')
      .skip(WHITESPACE)
      .as('value')

    const clone = c([value], { quantifier: '?' })

    const expected = {
      '0': { '0': '/\\n|$/', length: 1, isRegExp: true, name: 'value', isLast: true },
      '1': {
        '0': { length: 1, isCallback: true, isLast: true },
        length: 1,
        isSequence: true,
        name: 'value',
        isLast: true
      },
      '2': {
        '0': { '0': '/([a-zA-Z])+/', length: 1, isRegExp: true, name: 'alphabet' },
        '1': { '0': '/([0-9])+/', length: 1, isRegExp: true, name: 'digit', isLast: true },
        length: 2,
        isSequence: true,
        name: 'value',
        isLast: true
      },
      '3': {
        '0': { '0': '/([@#%])+/', length: 1, isRegExp: true, name: 'symbol', isLast: true },
        length: 1,
        isSequence: true,
        name: 'value',
        isLast: true
      },
      length: 4,
      name: 'value',
      skipPattern: '/\\s+/',
      quantifier: '*',
      combinator: '/',
      isClosure: true,
      isKleeneClosure: true,
      isChoice: true,
      isOrderedChoice: true
    }

    expect(util.object.toJson(clone)).to.deep.equal(expected)
  })

  it('should parse solo regex expression', () => {
    const input = '1234567890'
    const expected = '1234567890'

    const value = r(NUMBER).as('value')
    expect(value).to.deep.equal({
      '0': /[+-]?\d*\.?\d+(?:[Ee][+-]?\d+)?/,
      name: 'value',
      length: 1,
      isRegExp: true
    })

    const parser = new Parser(value)
    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should merge and parse regex expressions', () => {
    const input = '12345ABCD'
    const expected = '12345ABCD'

    const value = r(NUMBER, WORD).as('value')
    expect(value).to.deep.equal({
      '0': /([+-]?\d*\.?\d+(?:[Ee][+-]?\d+)?)([a-zA-Z]+)/,
      name: 'value',
      length: 1,
      isRegExp: true
    })

    const parser = new Parser(value)
    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should merge and parse choice regex expression', () => {
    const input = 'ab12cd34'
    const expected = 'AB12CD34'

    const value = r(DIGIT, ALPHABET).combine('/').quantify('+').as('value')

    expect(value).to.deep.equal({
      '0': /(([0-9])|([a-zA-Z]))+/,
      name: 'value',
      length: 1,
      isRegExp: true
    })

    const listener = (event: ParserEvent) => {
      if (event.type === EventType.RuleSucceeded) {
        const { name, data } = event.data
        if (name === 'value') return data.toUpperCase()
      }
      return undefined
    }

    const parser = new Parser(value, { listener })
    const actual = parser.parse(input) as string[]
    expect(actual).to.deep.equal(expected)
  })

  it('should merge and parse complex choice regex expression', () => {
    const input = 'AA213FD51B3801043FBC'
    const expected = 'AA213FD51B3801043FBC'

    const digit = r(DIGIT).as('digit')
    const alphabet = r(ALPHABET).as('alphabet')
    const value = r(digit, alphabet).combine('/').quantify('+').as('value')

    expect(value).to.deep.equal({
      '0': {
        '0': { '0': /[0-9]/, name: 'digit', length: 1, isRegExp: true, isLast: true },
        isSequence: true,
        isLast: true,
        length: 1,
        name: 'value'
      },
      '1': {
        '0': { '0': /[a-zA-Z]/, name: 'alphabet', length: 1, isRegExp: true, isLast: true },
        isSequence: true,
        isLast: true,
        length: 1,
        name: 'value'
      },
      length: 2,
      isChoice: true,
      combinator: '/',
      isOrderedChoice: true,
      isClosure: true,
      quantifier: '+',
      isPositiveClosure: true,
      name: 'value'
    })

    const listener = (event: ParserEvent) => {
      if (event.type === EventType.RuleSucceeded) {
        const { name, data } = event.data
        if (name === 'value') {
          return data.map(({ digit, alphabet }: { digit: string; alphabet: string }) =>
            digit !== undefined ? digit : alphabet
          )
        }
      }
    }

    const parser = new Parser(value, { listener })
    const actual = parser.parse(input).join('')
    expect(actual).to.deep.equal(expected)
  })

  it('should parse closure rule', () => {
    const input = 'Name:Apple\nColor:Yellow'
    const expected = [
      { key: 'name', value: 'APPLE' },
      { key: 'color', value: 'YELLOW' }
    ]

    const key = r(/[a-zA-Z]+/, /[a-zA-Z0-9]*/).as('key')
    const value = r(/.+/).as('value')
    const list = r(key, /:/, value, ENDOFLINE).quantify('+').as('list')

    const listener = (event: ParserEvent): unknown => {
      if (event.type === EventType.RuleSucceeded) {
        const { name, data } = event.data
        if (name === 'list') {
          return data.map(({ key, value }: { key: string; value: string }) => ({
            key: key.toLowerCase(),
            value: value.toUpperCase()
          }))
        }
      }

      return undefined
    }

    const parser = new Parser(list, { listener })
    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should parse closure subrule', () => {
    const input = '[1,2,3,4]'
    const expected = [1, 2, 3, 4]

    const item = r(NUMBER).as('item')
    const array = r(/\[/, item, r(/,/, item).quantify('*').as('rest'), /\]/).as('array')

    const listener = (event: ParserEvent) => {
      if (event.type === EventType.RuleSucceeded) {
        const { name, data } = event.data
        if (name === 'array') {
          const { item, rest } = data
          return [item, ...rest.map((r: { item: string }) => r.item)].map(n => parseInt(n))
        }
      }
      return undefined
    }

    const parser = new Parser(array, { listener })
    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should compact regex rule', () => {
    const input = 'AA213FD51B3801043FBC'
    const expected = 'AA213FD51B3801043FBC'.toLocaleLowerCase()

    const digit = r(/[0-9]/, /[a-fA-F]/)
      .combine('/')
      .as('digit')

    const hex = r(digit).quantify('+').as('hex')
    expect(hex).to.deep.equal({
      '0': { '0': /(([0-9])|([a-fA-F]))+/, length: 1, isRegExp: true, name: 'digit', isLast: true },
      length: 1,
      isSequence: true,
      name: 'hex'
    })

    const listener = (event: ParserEvent) => {
      if (event.type === EventType.RuleSucceeded) {
        const { name, data } = event.data
        if (name === 'hex') return data.digit
        if (name === 'digit') return data.toLowerCase()
      }
    }

    const parser = new Parser(hex, { listener })
    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should parse sub expressions with a same name', () => {
    const input = 'West North'
    const expected = { name: ['West', 'North'] }

    const name = r(WORD).as('name')
    const direction = r(name, / /, name).as('direction')

    const parser = new Parser(direction)
    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should parse ordered choice expression', () => {
    const input = 'ABCD 1234 @#% EFGH 5678 %@#'
    const expected = 'ABCD1234@#%EFGH5678%@#'

    const alphabet = r(ALPHABET).quantify('+').as('alphabet')
    const digit = r(DIGIT).quantify('+').as('digit')
    const alpha_digit = r(alphabet, digit).combine('/').quantify('+').as('alpha_digit')
    const symbol = r(/[@#%]/).quantify('+').as('symbol')
    const password = r(alpha_digit, symbol).quantify('+').combine('/').as('password')

    expect(password).to.deep.equal({
      '0': {
        '0': {
          '0': {
            '0': {
              '0': /([a-zA-Z])+/,
              length: 1,
              name: 'alphabet',
              isRegExp: true,
              isLast: true
            },
            isSequence: true,
            isLast: true,
            length: 1,
            name: 'alpha_digit'
          },
          '1': {
            '0': {
              '0': /([0-9])+/,
              length: 1,
              name: 'digit',
              isRegExp: true,
              isLast: true
            },
            isSequence: true,
            isLast: true,
            length: 1,
            name: 'alpha_digit'
          },
          length: 2,
          isChoice: true,
          combinator: '/',
          isOrderedChoice: true,
          isClosure: true,
          quantifier: '+',
          isPositiveClosure: true,
          name: 'alpha_digit',
          isLast: true
        },
        isSequence: true,
        isLast: true,
        length: 1,
        name: 'password'
      },
      '1': {
        '0': {
          '0': /([@#%])+/,
          length: 1,
          name: 'symbol',
          isRegExp: true,
          isLast: true
        },
        isSequence: true,
        isLast: true,
        length: 1,
        name: 'password'
      },
      length: 2,
      isClosure: true,
      quantifier: '+',
      isPositiveClosure: true,
      isChoice: true,
      combinator: '/',
      isOrderedChoice: true,
      name: 'password'
    })

    const listener = (event: ParserEvent) => {
      if (event.type === EventType.RuleSucceeded) {
        const { name, data } = event.data
        if (name === 'alpha_digit')
          return data.map((item: Partial<{ alphabet: string; digit: string }>) => item.alphabet ?? item.digit).join('')
        if (name === 'password')
          return data
            .map((item: Partial<{ alpha_digit: string; symbol: string }>) => item.alpha_digit ?? item.symbol)
            .join('')
      }
    }

    const parser = new Parser(password, { listener, skip: WHITESPACE })
    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should parse an input using a dynamic rule', () => {
    const scanner = function (this: Parser): string | undefined {
      let text = ''
      const parser = this as Parser
      while (!parser.lexer.isEof) {
        const char = parser.lexer.scan(/[\w\W\s\S]/)
        if (char === "'") {
          // If the quotation mark has been escaped then remove the \ char
          if (text[text.length - 1] === '\\') text = text.slice(0, -1) + "'"
          // Otherwise the quotation mark is an enclosing mark and should be dropped
          continue
        }
        text += char
      }
      return text
    }

    const text = r(() => scanner).as('text')

    const input = "'It\\'s Ok!'"
    const expected = "It's Ok!"

    const parser = new Parser(text)
    const actual = parser.parse(input)

    expect(actual).to.deep.equal(expected)
  })

  it('should parse closure callback', () => {
    const input = '12345'
    const expected = '12345'

    const digit = r(DIGIT).as('digit')
    const number = r(() => digit)
      .quantify('+')
      .as('number')

    expect(util.object.toJson(number)).to.deep.equal({
      '0': { isCallback: true, length: 1, isLast: true },
      name: 'number',
      length: 1,
      isClosure: true,
      quantifier: '+',
      isPositiveClosure: true,
      isSequence: true
    })

    const listener = (event: ParserEvent) => {
      if (event.type === EventType.RuleSucceeded) {
        const { name, data } = event.data
        if (name === 'number') return data.map((item: { digit: string }) => item.digit).join('')
      }
    }

    const parser = new Parser(number, { listener })
    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should parse recursive choice', () => {
    const array = r([/\[/, (): Rule => array, /\]/], NUMBER)
      .combine('/')
      .as('array') as Rule

    const expected = [[[[1]]]]

    expect(util.object.toJson(array)).to.deep.equal({
      '0': {
        '0': '/[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?/',
        isRegExp: true,
        isLast: true,
        length: 1,
        name: 'array'
      },
      '1': {
        '0': { '0': '/\\[/', isRegExp: true, length: 1 },
        '1': { isCallback: true, length: 1 },
        '2': { '0': '/\\]/', isRegExp: true, length: 1, isLast: true },
        isSequence: true,
        length: 3,
        isLast: true,
        name: 'array'
      },

      length: 2,
      isChoice: true,
      combinator: '/',
      isOrderedChoice: true,
      name: 'array'
    })

    const listener = (event: ParserEvent) => {
      if (event.type === EventType.RuleSucceeded) {
        const { name, data } = event.data
        if (name === 'array') return data.array ? [data.array] : parseInt(data)
      }

      return undefined
    }

    const parser = new Parser(array, { listener })
    const actual = parser.parse('[[[[1]]]]')

    expect(actual).to.deep.equal(expected)
  })

  it('should apply skip pattern', () => {
    const value = r(NULL).as('value')

    const parser = new Parser(value, { skip: WHITESPACE })

    const actual = parser.parse(' null ')
    expect(actual).to.deep.equal('null')
  })

  it('should parse recursive choice rule', () => {
    const value = r(() => array, TRUE, FALSE, NULL, NUMBER, STRING)
      .combine('/')
      .as('value') as Rule

    const array = r(/\[/, value, r(/,/, value).quantify('*').as('rest'), /\]/).as('array') as Rule

    const listener = (event: ParserEvent) => {
      if (event.type === EventType.RuleSucceeded) {
        const { name, data } = event.data
        if (name === 'value') {
          if (data.array) return data.array
          if (data === 'null') return null
          if (data === 'true') return true
          if (data === 'false') return false
          if (data.startsWith('"') || data.startsWith("'")) return data.substr(1, data.length - 2)
          return data.indexOf('.') !== -1 ? parseFloat(data) : parseInt(data)
        }
        if (name === 'array') {
          const { value, rest } = data
          const result = [value]
          if (rest) result.push(...rest.map((item: { value: string }) => item.value))
          return result
        }
      }
    }

    const parser = new Parser(value, { listener })

    let actual = parser.parse('null')
    expect(actual).to.deep.equal(null)

    actual = parser.parse('true')
    expect(actual).to.deep.equal(true)

    actual = parser.parse('false')
    expect(actual).to.deep.equal(false)

    actual = parser.parse('1')
    expect(actual).to.deep.equal(1)

    actual = parser.parse('"text"')
    expect(actual).to.deep.equal('text')

    actual = parser.parse('[1,2,3]')
    expect(actual).to.deep.equal([1, 2, 3])
  })

  it('should parse closure choice rule', () => {
    const name = r(NAME).as('name')
    const type = r(/num/).as('type')
    const multiArgs = r(type, name, /,|:/).quantify('+').as('multi_args')
    const singleArg = r(type, /:/).as('single_arg')
    const args = r(multiArgs, singleArg).combine('/').as('args')
    const output = r(/->/, args).as('output')

    const parser = new Parser(output, { skip: WHITESPACE })

    let actual = parser.parse('-> num x, num y:')
    expect(actual).to.deep.equal({
      args: {
        multi_args: [
          { type: 'num', name: 'x' },
          { type: 'num', name: 'y' }
        ]
      }
    })

    actual = parser.parse('-> num:')
    expect(actual).to.deep.equal({
      args: {
        single_arg: { type: 'num' }
      }
    })
  })

  it('should parse assertion rule (1)', () => {
    const input = 'num a = 1'
    const expected = { type: 'num', name: 'a', value: '1' }

    const type = r(/str/, /bool/, /num/).combine('/').as('type')
    const isDeclare = r(type[0] as Rule, NAME)
      .skip(WHITESPACE)
      .assert('?=')

    const variable = r(NAME).as('name')
    const value = r(STRING, NUMBER, TRUE, FALSE, NULL).combine('/').as('value')
    const assignment = r([isDeclare, type, variable, /=/, value], [variable, /=/, value]).combine('/').as('assignment')

    expect(assignment).to.deep.equal({
      '0': {
        '0': {
          0: /(?=(((str)|(bool)|(num))(\s+)([a-zA-Z0-9_]+)))/,
          length: 1,
          isRegExp: true
        },
        '1': { '0': /(str)|(bool)|(num)/, name: 'type', length: 1, isRegExp: true },
        '2': { '0': /[a-zA-Z0-9_]+/, name: 'name', length: 1, isRegExp: true },
        '3': { '0': /=/, isRegExp: true, length: 1 },
        '4': {
          '0': /(("[^"]*")|('[^']*'))|([+-]?\d*\.?\d+(?:[Ee][+-]?\d+)?)|(true)|(false)|(null)/,
          name: 'value',
          length: 1,
          isRegExp: true,
          isLast: true
        },
        name: 'assignment',
        isSequence: true,
        length: 5,
        isLast: true
      },
      '1': {
        '0': { '0': /[a-zA-Z0-9_]+/, name: 'name', length: 1, isRegExp: true },
        '1': { '0': /=/, isRegExp: true, length: 1 },
        '2': {
          '0': /(("[^"]*")|('[^']*'))|([+-]?\d*\.?\d+(?:[Ee][+-]?\d+)?)|(true)|(false)|(null)/,
          name: 'value',
          length: 1,
          isRegExp: true,
          isLast: true
        },
        name: 'assignment',
        isSequence: true,
        length: 3,
        isLast: true
      },
      name: 'assignment',
      isChoice: true,
      combinator: '/',
      isOrderedChoice: true,
      length: 2
    })

    const parser = new Parser(assignment, { skip: WHITESPACE })

    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should parse assertion rule (2)', () => {
    const input = 'num a = 1'
    const expected = { type: { number: 'num' }, name: 'a', value: '1' }
    const string = r(/str/).as('string')
    const boolean = r(/bool/).as('boolean')
    const number = r(/num/).as('number')
    const type = r(string, boolean, number).combine('/').as('type')
    const isDeclare = r(type, NAME).skip(WHITESPACE).assert('?=')

    const variable = r(NAME).as('name')
    const value = r(STRING, NUMBER, TRUE, FALSE, NULL).combine('/').as('value')
    const assignment = r([isDeclare, type, variable, /=/, value], [variable, /=/, value]).combine('/').as('assignment')

    const parser = new Parser(assignment, { skip: WHITESPACE })

    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should not capture a non-captured rule', () => {
    const input = '# This is a comment!\nprint("Hello World!")# This is another comment\n'
    const expected = [{ statement: 'print("Hello World!")' }]

    const comment = r(/#[^\n]+(\n|$)/)
      .capture(false)
      .as('comment')
    const statement = r(/[^#\n]+(\n|$|)/).as('statement')
    const program = r(comment, statement).quantify('*').combine('/').as('program')

    const parser = new Parser(program)
    const actual = parser.parse(input)
    expect(actual).to.deep.equal(expected)
  })

  it('should throw error on success rejection', () => {
    const password = r(/.+/).as('password')

    const listener = (event: ParserEvent) => {
      if (event.type === EventType.RuleSucceeded) {
        const { name, data } = event.data
        if (name === 'password' && data.length < 6) throw Error
      }
    }

    const parser = new Parser(password, { listener })
    expect(() => parser.parse('12345')).to.throw()
  })
})
