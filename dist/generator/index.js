'use strict'
var __defProp = Object.defineProperty
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropNames = Object.getOwnPropertyNames
var __getOwnPropSymbols = Object.getOwnPropertySymbols
var __hasOwnProp = Object.prototype.hasOwnProperty
var __propIsEnum = Object.prototype.propertyIsEnumerable
var __defNormalProp = (obj, key, value) =>
  key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : (obj[key] = value)
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {})) if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop])
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop])
    }
  return a
}
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true })
}
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        })
  }
  return to
}
var __toCommonJS = mod => __copyProps(__defProp({}, '__esModule', { value: true }), mod)
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value)
  return value
}

// src/generator/index.ts
var generator_exports = {}
__export(generator_exports, {
  default: () => XpgParser
})
module.exports = __toCommonJS(generator_exports)

// src/utils.ts
var object = {
  map: (obj, mapper) => {
    if (obj instanceof Array) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = mapper(obj[i])
      }
      return obj
    }
    if (obj instanceof Object) {
      for (const key in obj) {
        obj[key] = mapper(obj[key])
      }
      return obj
    }
    return mapper(obj)
  },
  trim: (obj, what = [void 0], callback) => {
    if (obj instanceof Array) {
      const result = []
      for (let i = 0; i < obj.length; i++) {
        const trimmed = object.trim(obj[i], what, callback)
        if (trimmed !== void 0) result.push(trimmed)
      }
      if (object.isEmpty(result) && what.includes('[]')) return
      return result
    }
    if (obj instanceof Object) {
      for (const key in obj) {
        const trimmed = object.trim(obj[key], what, callback)
        if (trimmed === void 0) delete obj[key]
        else obj[key] = trimmed
      }
      if (object.isEmpty(obj) && what.includes('{}')) return
      return callback ? callback(obj) : obj
    }
    if (what.includes(obj)) return
    return obj
  },
  isEmpty: obj => {
    if (obj instanceof Array) return obj.length === 0
    return Object.keys(obj).length === 0
  },
  toJson: obj => {
    return JSON.parse(JSON.stringify(obj))
  },
  filterProps(obj, namePattern) {
    if (!(namePattern instanceof RegExp)) namePattern = string.toRegExp(namePattern)
    const result = []
    for (const key in obj) {
      if (key.match(namePattern)) result.push(key)
    }
    return result
  },
  // Assigning the given props to the given object's root
  // Assigning the given props to the given object's root
  spreadProps(obj, propNames) {
    for (let i = 0; i < propNames.length; i++) {
      const propName = propNames[i]
      const prop = obj[propName]
      if (prop !== void 0) {
        delete obj[propName]
        if (prop === null) continue
        if (prop instanceof Object || prop instanceof Array) {
          if (prop instanceof Array) return prop
          Object.assign(obj, prop)
        } else {
          return prop
        }
      }
    }
    return obj
  },
  isMap(obj) {
    if (obj.length && !(obj instanceof Array) && Object.keys(obj).length - 1 == obj.length) {
      for (let i = 0; i < obj.length; i++) {
        if (obj[i] === void 0) return false
      }
      return true
    }
    return false
  }
}
var string = {
  format: (str, ...values) => {
    return str.replace(/{([0-9]+)}/g, (match, index) => {
      return typeof values[index] == 'undefined' ? match : values[index]
    })
  },
  toRegExp: str => new RegExp(str.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&'))
}
var array = {
  last: arr => {
    return arr[arr.length - 1]
  },
  unshiftWith(arr, index) {
    const item = arr.splice(index, 1)
    arr.unshift(item)
    return arr
  }
}

// src/generator/parser_ext.ts
var COLON = /:/
var EXCLAMATION = /!/
var AMPERSAND = /&/
var settings = {
  listener,
  skip: /\s*/
}
function listener(event) {
  if (event.type === 0 /* RuleSucceeded */) {
    const { name, data } = event.data
    if (name === 'combinator') return formatCombinator(data, this.lexer)
    if (name === 'expression') return formatExpression(data)
    if (name === 'grammar') return formatGrammar(data)
  }
  return void 0
}
function formatGrammar(grammar2) {
  const result = []
  for (let i = 0; i < grammar2.length; i++) {
    const rule = grammar2[i]
    if (rule.name) result.push(rule)
  }
  return object.trim(result, [void 0, null, '', false, '{}', '[]'])
}
function formatExpression({ first, rest }) {
  const result = [first]
  if (rest) {
    const combinator = rest[0].combinator
    result[0].combinator = combinator
    for (let i = 0; i < rest.length; i++) {
      const expr = rest[i]
      delete expr.combinator
      result.push(expr)
    }
  }
  return result
}
function formatCombinator(val, lexer) {
  if (val !== '/') {
    lexer.jump(-1)
    return ''
  }
  return val
}

// src/generator/transpiler.ts
var Transpiler = class {
  constructor(settings2) {
    this.settings = settings2
    __publicField(this, 'ruleset', {})
  }
  transpile(grammar2) {
    this.ruleset = {}
    const transpiledRules = grammar2.reverse().map(i => this.transpileRules(i))
    const result = [
      `import { c, r, Parser } from '${this.settings.rte === 'deno' /* Deno */ ? 'npm:' : ''}lambda-parser'`,
      "import type { RuleDefinitionEntry } from 'lambda-parser/src/types'",
      ...transpiledRules,
      `const parser = new Parser(${array.last(grammar2).name}, {${
        this.ruleset['SCRIPT'] ? ' ...SCRIPT.settings ' : ''
      }})`,
      'export default parser'
    ]
    return result
  }
  transpileRules(rule) {
    var _a
    let result
    let transpiledExpression
    if (rule.name === 'SCRIPT') {
      transpiledExpression = (_a = rule.expression[0]) == null ? void 0 : _a.symbol
      result = `import * as SCRIPT from ${transpiledExpression}`
    } else {
      transpiledExpression = this.transpileExpression([
        { group: { name: rule.assignment.match(COLON) ? rule.name : '', expression: rule.expression } }
      ])
      result = `const ${rule.name} = ${transpiledExpression}`
    }
    this.ruleset[rule.name] = transpiledExpression
    return result
  }
  transpileExpression(expression2) {
    var _a, _b, _c, _d
    const result = []
    for (let i = 0; i < expression2.length; i++) {
      const sub = expression2[i]
      let assertion = (_a = sub.assertion) != null ? _a : ''
      if (assertion.match(EXCLAMATION)) assertion = '?!'
      else if (assertion.match(AMPERSAND)) assertion = '?='
      const quantifier = (_b = sub.quantifier) != null ? _b : ''
      const noncapture = sub.noncapture
      const name = (_d = (_c = sub.group) == null ? void 0 : _c.name) != null ? _d : ''
      const expr = sub.symbol ? this.transpileSymbol(sub.symbol) : this.transpileExpression(sub.group.expression)
      if (!name && !quantifier && !assertion && !noncapture) result.push(expr)
      else {
        const transpiled = []
        if (name) {
          transpiled.push([`r(${expr})`])
          if (quantifier) transpiled.push(`.quantify('${quantifier}')`)
          if (noncapture) transpiled.push(`.capture(false)`)
          if (assertion) transpiled.push(`.assert('${assertion}')`)
          else transpiled.push(`.as('${name}')`)
        } else {
          transpiled.push([`c([${expr}]`])
          if (quantifier || assertion || noncapture !== void 0) {
            transpiled.push(', { ')
            const modifiers = []
            if (quantifier) modifiers.push(`quantifier: '${quantifier}'`)
            if (assertion) modifiers.push(`assertion: '${assertion}'`)
            if (noncapture) modifiers.push(`capture: false`)
            transpiled.push(modifiers.join(', '), ' }')
          }
          transpiled.push(')')
        }
        result.push(transpiled.join(''))
      }
    }
    if (result.length === 1) return result[0]
    const combinator = expression2[0].combinator
    if (combinator) return `c([${result.join(', ')}], { combinator: '${combinator}' })`
    const skip = this.ruleset['SCRIPT'] ? 'SCRIPT.settings.skip' : void 0
    if (skip) return `c([${result.join(', ')}], { skip: ${skip} })`
    return `c([${result.join(', ')}])`
  }
  transpileSymbol(symbol) {
    var _a
    if (symbol.startsWith('SCRIPT.')) return symbol
    else
      return (_a = this.toRegExp(symbol)) != null
        ? _a
        : this.ruleset[symbol] !== void 0
        ? symbol
        : `(): RuleDefinitionEntry => ${symbol}`
  }
  toRegExp(str) {
    let isRegExp = false
    if (str.startsWith("r'")) {
      isRegExp = true
      str = str.slice(2, str.length - 1)
    } else if (str.startsWith("'")) {
      str = str.slice(1, str.length - 1)
    } else return
    str = str.replace(/''/g, "'")
    str = (isRegExp ? new RegExp(str) : string.toRegExp(str)).source
    return `/${str}/`
  }
}

// src/generator/parser.ts
var import__ = require('../')
var HASHTAG = /#/
var EXCLAMATION2 = EXCLAMATION
var AMPERSAND2 = AMPERSAND
var PLUS = /\+/
var ASTERISK = /\*/
var QUESTION = /\?/
var SLASH = /\//
var TILDE = /~/
var EQUAL = /=/
var COLON2 = COLON
var R_PAREN = /\)/
var L_PAREN = /\(/
var LOWER_R = /r/
var DYNAMIC_RULE = /SCRIPT(\.[a-zA-Z0-9_]+)+/
var EXCEPT_LINE_BREAK = /[^\n]*/
var NOT_SLASH = /[^/]/
var LITERAL = /'([^']|(''))*'/
var NAME = /[a-zA-Z0-9_]+/
var REGEXP = (0, import__.c)([LOWER_R, LITERAL], { skip: settings.skip })
var ASSIGNMENT = (0, import__.c)([COLON2, EQUAL], { combinator: '/' })
var SYMBOL = (0, import__.c)([REGEXP, DYNAMIC_RULE, LITERAL, NAME], { combinator: '/' })
var COMMENT = (0, import__.c)([HASHTAG, EXCEPT_LINE_BREAK], { skip: settings.skip })
var QUANTIFIER = (0, import__.c)([(0, import__.c)([QUESTION, ASTERISK, PLUS], { combinator: '/' })], {
  quantifier: '?'
})
var ASSERTION = (0, import__.c)([AMPERSAND2, EXCLAMATION2], { combinator: '/' })
var group = (0, import__.r)(
  (0, import__.c)(
    [
      (0, import__.r)((0, import__.c)([NAME, (0, import__.c)([L_PAREN], { assertion: '?=' })], { skip: settings.skip }))
        .quantify('?')
        .as('name'),
      L_PAREN,
      () => expression,
      R_PAREN
    ],
    { skip: settings.skip }
  )
).as('group')
var sub_expr = (0, import__.c)(
  [
    (0, import__.r)(TILDE).quantify('?').as('noncapture'),
    (0, import__.r)(ASSERTION).quantify('?').as('assertion'),
    (0, import__.c)([group, (0, import__.r)(SYMBOL).as('symbol')], { combinator: '/' }),
    (0, import__.r)(QUANTIFIER).as('quantifier')
  ],
  { skip: settings.skip }
)
var sequence = (0, import__.c)(
  [
    (0, import__.c)(
      [(0, import__.r)(NOT_SLASH).as('combinator'), sub_expr, (0, import__.c)([ASSIGNMENT], { assertion: '?!' })],
      { skip: settings.skip }
    )
  ],
  { quantifier: '+' }
)
var choice = (0, import__.c)(
  [(0, import__.c)([(0, import__.r)(SLASH).as('combinator'), sub_expr], { skip: settings.skip })],
  { quantifier: '+' }
)
var expression = (0, import__.r)(
  (0, import__.c)(
    [
      (0, import__.r)(sub_expr).as('first'),
      (0, import__.r)((0, import__.c)([sequence, choice], { combinator: '/' }))
        .quantify('?')
        .as('rest')
    ],
    { skip: settings.skip }
  )
).as('expression')
var grammar = (0, import__.r)(
  (0, import__.c)(
    [
      (0, import__.c)(
        [
          (0, import__.c)(
            [(0, import__.r)(NAME).as('name'), (0, import__.r)(ASSIGNMENT).as('assignment'), expression],
            { skip: settings.skip }
          ),
          (0, import__.r)(COMMENT).capture(false).as('comment')
        ],
        { combinator: '/' }
      )
    ],
    { quantifier: '+' }
  )
).as('grammar')
var parser = new import__.Parser(grammar, __spreadValues({}, settings))
var parser_default = parser

// src/generator/index.ts
var XpgParser = class {
  constructor() {
    __publicField(this, 'parser')
    this.parser = parser_default
  }
  parse(input) {
    return this.parser.parse(input)
  }
  transpile(input, settings2 = {}) {
    const xpgRules = this.parse(input)
    const transpiler = new Transpiler(settings2)
    return transpiler.transpile(xpgRules)
  }
}
