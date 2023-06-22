'use strict'
var __defProp = Object.defineProperty
var __defProps = Object.defineProperties
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropDescs = Object.getOwnPropertyDescriptors
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b))
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

// src/index.ts
var src_exports = {}
__export(src_exports, {
  Assertion: () => Assertion,
  Combinator: () => Combinator,
  EventType: () => EventType,
  Parser: () => Parser,
  Quantifier: () => Quantifier,
  c: () => c,
  r: () => r
})
module.exports = __toCommonJS(src_exports)

// src/constants.ts
var Combinator = /* @__PURE__ */ (Combinator2 => {
  Combinator2['Sequence'] = '.'
  Combinator2['OrderedChoice'] = '/'
  return Combinator2
})(Combinator || {})
var Quantifier = /* @__PURE__ */ (Quantifier2 => {
  Quantifier2['Optional'] = '?'
  Quantifier2['ZeroOrMore'] = '*'
  Quantifier2['OneOrMany'] = '+'
  return Quantifier2
})(Quantifier || {})
var Assertion = /* @__PURE__ */ (Assertion2 => {
  Assertion2['Lookahead'] = '?='
  Assertion2['NegativeLookahead'] = '?!'
  return Assertion2
})(Assertion || {})
var EventType = /* @__PURE__ */ (EventType2 => {
  EventType2[(EventType2['RuleSucceeded'] = 0)] = 'RuleSucceeded'
  EventType2[(EventType2['RuleFailed'] = 1)] = 'RuleFailed'
  EventType2[(EventType2['RuleDebugging'] = 2)] = 'RuleDebugging'
  return EventType2
})(EventType || {})
var UNNAMED_ENTRY_NAME = '__UNNAMED__'

// src/data.ts
var Data = class {
  constructor() {
    __publicField(this, 'source', {})
  }
  static getInfo(entry) {
    let symbol = ''
    let index = 0
    let parent = entry.parent
    if (parent) {
      if (parent.rule.isChoice) {
        index = 0
        for (let i = 0; i < parent.rule.length; i++) {
          const sub = parent.rule[i]
          if (sub.isRegExp) {
            if (symbol) symbol += ' or '
            symbol += sub[0].toString().replace(/\\\\/g, '\\')
          }
        }
      } else {
        for (let i = 0; i < parent.rule.length; i++) {
          const sub = parent.rule[i]
          if (sub === entry.rule) {
            index = i
            symbol = sub[0].toString().replace(/\\\\/g, '\\')
            break
          }
        }
      }
    }
    const path = []
    if (entry.name) path.push(entry.name)
    parent = entry.parent
    while (parent) {
      if (!parent.rule.isChoice) path.push(parent.name)
      parent = parent.parent
    }
    return {
      path: `${path.reverse().join('.')}`,
      index,
      symbol
    }
  }
  // Initializing a data object for the given rule so its sub expressions can set their data into it.
  // Each sub expression's has its own data object which is embedded into its parent rule's data object.
  create(entry) {
    const propName = entry.name
    if (!propName) throw new Error("Entry name can't be undefined." /* UndefinedStackEntryName */)
    const parent = entry.parent
    if (parent && parent.rule.isChoice) {
      if (parent.data) entry.data = parent.data
    } else {
      const datasource = this.getDatasource(entry)
      entry.data = {}
      if (entry.rule.isClosure || datasource[propName]) {
        let data = (datasource[propName] = datasource[propName] || [])
        if (!(data instanceof Array)) data = datasource[propName] = [data]
        data.push(entry.data)
      } else {
        datasource[propName] = entry.data
      }
    }
  }
  get(entry) {
    if (!entry.name) throw new Error("Entry name can't be undefined." /* UndefinedStackEntryName */)
    const datasource = this.getDatasource(entry)
    if (entry.rule.isClosure) {
      const dataArray = datasource[entry.name]
      return dataArray[dataArray.length - 1]
    }
    if (entry.data === void 0)
      throw new Error('Entry data is undefined, create(rule) should be called first.' /* UndefinedEntryData */)
    return entry.data
  }
  set(entry, data) {
    if (!entry.name) throw new Error("Entry name can't be undefined." /* UndefinedStackEntryName */)
    const propName = entry.name
    const datasource = this.getDatasource(entry)
    if (datasource[propName] instanceof Array) {
      const dataArray = datasource[propName]
      dataArray.pop()
      dataArray.push(data)
    } else datasource[propName] = data
  }
  delete(entry) {
    if (!entry.name) throw new Error("Entry name can't be undefined." /* UndefinedStackEntryName */)
    const propName = entry.name
    const datasource = this.getDatasource(entry)
    if (entry.rule.isClosure) datasource[propName].pop()
    else delete datasource[propName]
  }
  getDatasource(entry) {
    const parent = entry.parent
    if (!parent) return this.source
    if (parent.rule.isChoice) return this.getDatasource(parent)
    if (parent.data === void 0) {
      throw new Error(
        "Entry's parent data is undefined, create(entry.parent) should be called first." /* UndefinedEntryParentData */
      )
    }
    return parent.data
  }
}

// src/lexer.ts
var Lexer = class {
  constructor() {
    __publicField(this, 'input', '')
    __publicField(this, 'position', 0)
    __publicField(this, 'lines', [])
  }
  get isEof() {
    return this.position >= this.input.length
  }
  get unscannedInput() {
    return this.input.slice(this.position)
  }
  get scannedInput() {
    return this.input.slice(0, this.position)
  }
  get nextLexeme() {
    return this.getNextNthLexeme(0)
  }
  init(input) {
    this.input = input
    this.position = 0
    this.lines = input.match(/^.*$/gm)
  }
  getNextNthLexeme(index) {
    let match
    const lastPosition = this.position
    for (let i = 0; i <= index; i++) {
      const pattern = new RegExp(/[^\s]+/)
      match = this.scan(pattern)
      this.scan(/\s*/)
    }
    this.position = lastPosition
    return match
  }
  scan(pattern) {
    const match = this.unscannedInput.match(pattern)
    if (match !== null) {
      this.position += match[0].length
      return match[0]
    }
    return
  }
  replace(pattern, replacement) {
    pattern = new RegExp(`^(${pattern.source})`)
    const leftStr = this.unscannedInput.replace(pattern, replacement)
    this.input = this.input.substr(0, this.position) + leftStr
  }
  lookahead(pattern) {
    const match = this.unscannedInput.match(new RegExp(`^(${pattern.source})`))
    if (match !== null) return match[0]
    else return void 0
  }
  lookback(pattern) {
    const match = this.scannedInput.match(new RegExp(`(${pattern.source})$`))
    if (match !== null) return match[0]
    else return void 0
  }
  jump(length) {
    this.position += length
  }
}

// src/logger.ts
var Logger = class {
  static log(type, message, line, lineNumber, offset, filename = '') {
    const logs = []
    logs.push(filename, ':', lineNumber + 1, ':', offset + 1, ': ', message, '\n')
    logs.push('	', line, '\n')
    logs.push('	', line.substr(0, offset).replace(/[^\t]/g, '.'), '^\n')
    if (type === 'error') throw new Error(logs.join(''))
    else console.log(logs.join(''))
  }
}

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
var map = {
  toArray(obj) {
    const arr = []
    for (let j = 0; j < obj.length; j++) arr.push(obj[j])
    return arr
  },
  last: obj => {
    return obj[obj.length - 1]
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
var func = {
  fails: callback => {
    try {
      callback()
    } catch (error) {
      return true
    }
    return false
  }
}

// src/parser.ts
var RegExpPrototype = RegExp.prototype
RegExpPrototype.toJSON = RegExp.prototype.toString
var Parser = class {
  constructor(grammar, settings) {
    this.grammar = grammar
    this.settings = settings
    __publicField(this, 'step', 0)
    __publicField(this, 'stack')
    __publicField(this, 'data')
    __publicField(this, 'lexer')
    __publicField(this, 'loggingEnabled')
    __publicField(this, 'skipPattern')
    __publicField(this, 'listener')
    var _a
    this.stack = []
    this.data = new Data()
    this.lexer = new Lexer()
    this.loggingEnabled = (_a = settings == null ? void 0 : settings.log) != null ? _a : false
    this.skipPattern = (settings == null ? void 0 : settings.skip)
      ? new RegExp(`^(${settings == null ? void 0 : settings.skip.source})`)
      : void 0
    this.listener = event => {
      var _a2, _b
      if (event.type === 0 /* RuleSucceeded */) {
        const data = this.internalListener(event)
        event.data.data = data
        const result = (_a2 = settings == null ? void 0 : settings.listener) == null ? void 0 : _a2.call(this, event)
        if (result === void 0) return event.data.data
        return result
      }
      return (_b = settings == null ? void 0 : settings.listener) == null ? void 0 : _b.call(this, event)
    }
    return this
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse(input) {
    var _a
    this.stack = []
    this.data = new Data()
    this.lexer.init(input)
    this.push(this.grammar)
    this.step = 0
    while (this.stack.length) {
      this.step++
      const entry = this.stack.pop()
      if (entry.rule.debuggerEnabled) debugger
      if (entry.canceled) continue
      if (entry.rule.isClosure) {
        if (!this.stack.length && this.lexer.isEof) {
          this.closureSucceeded(entry)
          break
        }
        this.stack.push(entry)
      }
      if (!entry.rule.isPrepared) {
        if (entry.rule.skipPattern) entry.rule.skipPattern = new RegExp(`^(${entry.rule.skipPattern.source})`)
        if (entry.rule.isRegExp) entry.rule[0] = new RegExp(`^(${entry.rule[0].source})`)
        entry.rule.isPrepared = true
      }
      entry.startPosition = this.lexer.position
      if (entry.rule.skipPattern) this.lexer.scan(entry.rule.skipPattern)
      if (entry.rule.isAssertion) {
        const assertionRule = __spreadProps(__spreadValues({}, entry.rule), { isAssertion: false })
        const assertionParser = new Parser(assertionRule, __spreadValues({}, this.settings))
        const succeeded =
          !func.fails(() => assertionParser.parse(this.lexer.unscannedInput)) ||
          (assertionParser.lexer.scannedInput.length > 0 && !assertionParser.stack.length)
        if ((!succeeded && entry.rule.isLookaheadAssertion) || (succeeded && entry.rule.isNegativeLookaheadAssertion))
          this.failed(entry)
        else this.succeeded(entry, void 0)
      } else {
        if (entry.name) this.data.create(entry)
        if (entry.rule.isRegExp) {
          const lexeme = this.lexer.scan(entry.rule[0])
          if (lexeme === void 0) this.failed(entry)
          else this.succeeded(entry, lexeme)
          if (!this.stack.length && !this.lexer.isEof && entry.rule.skipPattern) this.lexer.scan(entry.rule.skipPattern)
        } else if (entry.rule.isCallback) {
          const callbackRule = entry.rule[0].call(this, entry, entry.rule)
          if (callbackRule instanceof Function) {
            const parent = entry.parent
            const lexeme = callbackRule.call(this, entry)
            if (lexeme === void 0) this.failed(parent)
            else if (!parent.rule.isClosure) this.succeeded(parent, lexeme)
          } else {
            const _rule = __spreadValues({}, callbackRule)
            if (entry.rule.isLast) _rule.isLast = entry.rule.isLast
            if (entry.parent) {
              for (let j = 0; j < ((_a = entry.parent) == null ? void 0 : _a.rule.length); j++) {
                if (entry.parent.rule[j] === entry.rule) {
                  entry.parent.rule[j] = _rule
                  break
                }
              }
              this.push(_rule, entry.parent)
            } else {
              entry.rule[0] = _rule
              entry.rule.isCallback = false
              this.push(entry.rule, entry.parent)
            }
          }
        } else {
          for (let i = entry.rule.length - 1; i >= 0; i--) this.push(entry.rule[i], entry)
        }
      }
    }
    if (this.skipPattern) this.lexer.scan(this.skipPattern)
    if (!this.lexer.isEof) this.log('error' /* Error */, 'Unable to continue parsing.')
    if (this.loggingEnabled) console.log('Parsing done in %d steps:', this.step)
    const result = Object.values(this.data.source)[0]
    return result
  }
  push(rule, parent) {
    if (typeof rule !== 'string' && !rule.skipPattern) {
      if (parent == null ? void 0 : parent.rule.skipPattern)
        rule.skipPattern = parent == null ? void 0 : parent.rule.skipPattern
      else if (this.skipPattern) rule.skipPattern = this.skipPattern
    }
    if (parent) parent.startPosition = this.lexer.position
    if (!rule.name && !rule.isCallback && !rule.isRegExp) this.setRandomNameForUnnamedRule(rule)
    const entry = {
      rule,
      startPosition: this.lexer.position
    }
    if (rule.name) entry.name = rule.name
    if (parent) entry.parent = parent
    this.stack.push(entry)
  }
  closureSucceeded(entry) {
    const data = this.data.getDatasource(entry)[entry.name]
    this.succeeded(entry, data, true)
  }
  succeeded(entry, lexeme, isClosureSuccess) {
    var _a
    if (this.loggingEnabled) console.log('Parsed: %s', lexeme)
    if (entry.name) {
      if (entry.rule.isNonCapture) this.data.delete(entry)
      else {
        if (!entry.rule.isClosure || isClosureSuccess) {
          const modification =
            (_a = this.listener) == null
              ? void 0
              : _a.call(this, {
                  type: 0 /* RuleSucceeded */,
                  data: {
                    data: lexeme,
                    name: entry.name,
                    entry
                  }
                })
          if (modification !== void 0) lexeme = modification
        }
        if (lexeme !== void 0) {
          if (isClosureSuccess) this.data.getDatasource(entry)[entry.name] = lexeme
          else this.data.set(entry, lexeme)
        }
      }
    }
    this.propagateSuccess(entry)
  }
  failed(failedEntry) {
    var _a
    let entry = failedEntry
    do {
      if (
        this.resolveFailureByAlternativeRule(entry) ||
        this.resolveFailureByClosureRule(entry) ||
        this.resolveFailureByOptionalRule(entry)
      )
        return
    } while ((entry = entry.parent))
    const resolved =
      (_a = this.listener) == null
        ? void 0
        : _a.call(this, {
            type: 1 /* RuleFailed */,
            data: {
              name: failedEntry.name,
              entry: failedEntry
            }
          })
    if (!resolved) {
      const info = Data.getInfo(failedEntry)
      const message = `Symbol ${info.symbol} was expected. Failed to parse the rule at the index ${info.index} of the ${info.path} rule.`
      this.log('error' /* Error */, message)
    }
  }
  resolveFailureByAlternativeRule(entry) {
    const rule = entry.rule
    if (rule.isOrderedChoice) {
      const index = this.indexOfAlternativeRuleInStack(entry)
      if (index !== -1) {
        this.choiceAlternativeRule(index, entry)
        return true
      }
    }
    return false
  }
  resolveFailureByClosureRule(entry) {
    const rule = entry.rule
    if (rule.isClosure) {
      this.data.delete(entry)
      const data = this.data.getDatasource(entry)[rule.name]
      if (rule.isKleeneClosure || data.length) {
        const index = this.stack.lastIndexOf(entry)
        this.stack.splice(index - this.stack.length)
        this.lexer.position = entry.startPosition
        this.closureSucceeded(entry)
        return true
      }
    }
    return false
  }
  resolveFailureByOptionalRule(entry) {
    const rule = entry.rule
    if (rule.isOptional) {
      while (this.stack.length) {
        let isNestedRule = false
        let stackEntry = this.stack[this.stack.length - 1]
        while (stackEntry.parent) {
          if (stackEntry.parent === entry) {
            isNestedRule = true
            break
          }
          stackEntry = stackEntry.parent
        }
        if (!isNestedRule) break
        this.stack.pop()
      }
      this.lexer.position = entry.startPosition
      this.succeeded(entry, null)
      return true
    }
    return false
  }
  internalListener(event) {
    if (event.type === 0 /* RuleSucceeded */) {
      const data = event.data.data
      if (!data) return
      if (data instanceof Array) {
        const result = []
        for (let i = 0; i < data.length; i++) {
          const item = data[i]
          const obj = this.spreadUnnamedProps(item)
          if (!object.isEmpty(obj)) result.push(object.isMap(obj) ? map.toArray(obj) : obj)
        }
        return result
      }
      if (data instanceof Object) {
        const obj = this.spreadUnnamedProps(data)
        return object.isMap(obj) ? map.toArray(obj) : obj
      }
      return data
    }
    return void 0
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spreadUnnamedProps(obj) {
    for (const key in obj) {
      const prop = obj[key]
      if (prop === void 0 || !key.startsWith(UNNAMED_ENTRY_NAME)) continue
      delete obj[key]
      if (prop === null) continue
      if (prop instanceof Array || !(prop instanceof Object)) return prop
      Object.assign(obj, prop)
    }
    return obj
  }
  propagateSuccess(entry) {
    var _a, _b, _c
    if (!entry.rule.isLast) return
    let parent = entry.parent
    let isClosure = false
    while (parent) {
      if (parent.rule.isNonCapture) this.data.delete(entry)
      else {
        isClosure ||
          (isClosure =
            parent.rule.isClosure ||
            (((_a = parent.parent) == null ? void 0 : _a.rule.isOrderedChoice) &&
              ((_b = parent.parent) == null ? void 0 : _b.rule.isClosure)))
        if (!isClosure && !parent.rule.isOrderedChoice) {
          const data = this.data.get(parent)
          const modification =
            (_c = this.listener) == null
              ? void 0
              : _c.call(this, {
                  type: 0 /* RuleSucceeded */,
                  data: {
                    data,
                    name: parent.name,
                    entry: parent
                  }
                })
          if (modification !== void 0) this.data.set(parent, modification)
        }
      }
      this.cancelAlternativeRules(parent)
      if (!parent.rule.isLast) break
      parent = parent.parent
    }
  }
  cancelAlternativeRules(entry) {
    const parent = entry.rule.isOrderedChoice ? entry : entry.parent
    if (!parent || !parent.rule.isOrderedChoice) return
    const rule = parent.rule
    for (let i = 0; i < rule.length; i++) {
      const subrule = rule[i]
      if (subrule === entry.rule) continue
      const index = this.indexOfStackEntry(subrule)
      if (index !== -1) this.stack[index].canceled = true
    }
  }
  indexOfAlternativeRuleInStack(choiceRuleEntry) {
    const rule = choiceRuleEntry.rule
    for (let i = 0; i < rule.length; i++) {
      const subrule = rule[i]
      const index = this.indexOfStackEntry(subrule)
      if (index !== -1 && this.stack[index].parent === choiceRuleEntry) {
        return index
      }
    }
    return -1
  }
  choiceAlternativeRule(alternativeRuleIndex, failedStackEntry) {
    if (alternativeRuleIndex !== this.stack.length - 1) this.stack.splice(alternativeRuleIndex + 1 - this.stack.length)
    this.lexer.position = failedStackEntry.startPosition
    this.data.delete(failedStackEntry)
    this.data.create(failedStackEntry)
  }
  indexOfStackEntry(rule) {
    const entries = this.stack
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].rule === rule) return i
    }
    return -1
  }
  log(logType, message) {
    const lexer = this.lexer
    if (lexer.lines.length > 1) {
      const lineNumber = lexer.input.substr(0, lexer.position).split('\n').length - 1
      const eol = lexer.input.substr(lexer.position).indexOf('\n')
      const line = lexer.lines[lineNumber]
      const offset = line.indexOf(lexer.input.substr(lexer.position, eol))
      Logger.log(logType, message, line, lineNumber, offset)
    } else {
      const line = lexer.lines[0]
      const offset = line.indexOf(lexer.input.substr(lexer.position))
      Logger.log(logType, message, line, 0, offset)
    }
  }
  setRandomNameForUnnamedRule(rule) {
    rule.name = UNNAMED_ENTRY_NAME + process.hrtime()
    if (rule.isChoice) {
      for (let i = 0; i < rule.length; i++) {
        const sub = rule[i]
        if (!sub.name && !sub.assertion) {
          sub.name = rule.name
        }
      }
    }
  }
}

// src/expression-factory.ts
var ExpressionFactory = class {
  static compile(name, entries, skip, combinator = '.' /* Sequence */) {
    entries = this.mergeRegExpEntries(entries, combinator, skip)
    if (entries.length === 1) combinator = '.' /* Sequence */
    let result
    if (combinator === '.' /* Sequence */)
      result = {
        length: 0,
        isSequence: true,
        name
      }
    else if (combinator === '/' /* OrderedChoice */)
      result = {
        length: 0,
        isChoice: true,
        combinator: '/',
        isOrderedChoice: true,
        name
      }
    else
      throw new Error(
        "Unknown combinator. Please use '.' for sequence, or '/' for ordered-choice." /* UnknownCombinator */
      )
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      let expr
      if (combinator === '.' /* Sequence */ && entry instanceof Array)
        throw new Error(
          string.format(
            "Failed to compile '#{0}' rule, entry at index #{1} can't be an array, please use ...[] instead." /* ArrayInSequenceRuleDefinitionEntry */,
            name,
            i
          )
        )
      expr =
        combinator === '.' /* Sequence */
          ? this.compileSequenceEntry(entry)
          : (expr = this.compileChoiceEntry(name, entry, skip))
      result[result.length] = expr
      result.length++
    }
    const last = map.last(result)
    result[result.length - 1] = __spreadProps(__spreadValues({}, last), {
      isLast: true
    })
    if (result.length === 1 && last.isRegExp && !last.name) {
      if (last.isRegExp) {
        const expr = {
          0: last[0],
          length: 1,
          isRegExp: true,
          name
        }
        return expr
      } else {
        const expr = {
          0: last[0],
          length: 1,
          isCallback: true,
          name
        }
        return expr
      }
    }
    return result
  }
  static compileSequenceEntry(entry) {
    if (entry instanceof RegExp) {
      const expr = {
        0: entry,
        length: 1,
        isRegExp: true
      }
      return expr
    }
    if (entry instanceof Function) {
      const expr = {
        0: entry,
        length: 1,
        isCallback: true
      }
      return expr
    }
    return __spreadValues({}, entry)
  }
  static compileChoiceEntry(name, entry, skip) {
    if (entry instanceof Array) {
      const group = this.compile(name, entry, skip)
      const rule2 = __spreadProps(__spreadValues({}, group), {
        isLast: true
      })
      return rule2
    }
    if (entry instanceof RegExp) {
      const rule2 = __spreadProps(__spreadValues({}, this.compileSequenceEntry(entry)), {
        name,
        isLast: true
      })
      return rule2
    }
    const sub = entry instanceof Function ? this.compileSequenceEntry(entry) : entry
    const rule = {
      0: __spreadProps(__spreadValues({}, sub), {
        isLast: true
      }),
      length: 1,
      isSequence: true,
      name,
      isLast: true
    }
    return rule
  }
  static mergeRegExpEntries(entries, combinator, skip) {
    if (entries.filter(e => e instanceof RegExp).length === 1) {
      if (entries.length === 1 || combinator === '.' /* Sequence */) return entries
      const index = entries.findIndex(e => e instanceof RegExp)
      array.unshiftWith(entries, index)
    }
    const merged = []
    if (combinator === '.' /* Sequence */) {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const last = array.last(merged)
        if (entry instanceof RegExp && last instanceof RegExp)
          merged[merged.length - 1] = new RegExp(
            (merged.length === 1 ? `(${last.source})` : last.source) +
              ((skip == null ? void 0 : skip.source) ? `(${skip == null ? void 0 : skip.source})` : '') +
              `(${entry.source})`
          )
        else merged.push(entry)
      }
    } else {
      let pattern = ''
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        if (!(entry instanceof RegExp)) merged.push(entry)
        else pattern += `${pattern ? '|' : ''}(${entry.source})`
      }
      if (pattern) merged.unshift(new RegExp(pattern))
    }
    return merged
  }
  static mergeQuantifiers(first, second) {
    if (!second) return first
    if (!first) return second
    const quantifiers = [first, second]
    if (quantifiers.includes('*')) return '*'
    if (quantifiers.includes('+') && quantifiers.includes('?')) return '*'
    return first
  }
  static applyModifiersToRegExpRule(rule, { quantifier, assertion }) {
    if (quantifier) rule[0] = new RegExp(`(${rule[0].source})${quantifier}`)
    if (assertion) rule[0] = new RegExp(`(${assertion}(${rule[0].source}))`)
  }
}

// src/rule-factory.ts
var RuleFactory = class {
  constructor(...entries) {
    __publicField(this, 'entries')
    __publicField(this, 'isSequence', true)
    __publicField(this, 'isOrderedChoice', false)
    __publicField(this, 'isNonCapture', false)
    __publicField(this, 'combinator')
    __publicField(this, 'quantifier')
    __publicField(this, 'assertion')
    __publicField(this, 'skipPattern')
    __publicField(this, 'debuggerEnabled', false)
    this.entries = entries
    return this
  }
  static clone(entries, { name, quantifier, combinator, assertion, capture, skip, debug } = {}) {
    const r2 = (...args) => new RuleFactory(...args)
    const factory = r2(...entries)
    if (quantifier) factory.quantify(quantifier)
    if (combinator) factory.combine(combinator)
    if (capture === false) factory.capture(false)
    if (skip !== void 0) factory.skip(skip)
    if (debug) factory.debug()
    const rule = assertion ? factory.assert(assertion) : factory.as(name != null ? name : '')
    if (!rule.name) delete rule.name
    if ((rule.isRegExp || rule.isCallback) && !rule.name && capture !== false) {
      if (rule.isRegExp) return new RegExp(rule[0])
      return rule[0]
    }
    return rule
  }
  combine(combinator) {
    if (!['/' /* OrderedChoice */, '.' /* Sequence */].includes(combinator))
      throw new Error(
        "Unknown combinator. Please use '.' for sequence, or '/' for ordered-choice." /* UnknownCombinator */
      )
    this.combinator = combinator
    return this
  }
  quantify(quantifier) {
    if (!['?' /* Optional */, '*' /* ZeroOrMore */, '+' /* OneOrMany */].includes(quantifier))
      throw new Error(
        "Unknown quantifier. Please use '?' for optional, or '*' for zero-or-more, or '+' for one-or-more." /* UnknownQuantifier */
      )
    this.quantifier = quantifier
    return this
  }
  assert(assertion) {
    if (!['?=' /* Lookahead */, '?!' /* NegativeLookahead */].includes(assertion))
      throw new Error(
        "Unknown assertion. Please use '?=' for lookahead, or '?!' for negative-lookahead." /* UnknownAssertion */
      )
    this.assertion = assertion
    const rule = this.as('')
    delete rule.name
    return rule
  }
  capture(value) {
    this.isNonCapture = !value
    return this
  }
  skip(pattern) {
    this.skipPattern = pattern
    return this
  }
  debug() {
    this.debuggerEnabled = true
    return this
  }
  as(name) {
    const expression = ExpressionFactory.compile(name, this.entries, this.skipPattern, this.combinator)
    const rule = expression
    if (this.quantifier) rule.quantifier = this.quantifier
    if (this.assertion) rule.assertion = this.assertion
    if (this.combinator) rule.combinator = this.combinator
    if (this.debuggerEnabled) rule.debuggerEnabled = true
    if (this.skipPattern && !rule.isRegExp) {
      rule.skipPattern = this.skipPattern
    }
    if (this.isNonCapture) rule.isNonCapture = true
    this.optimize(rule)
    const firstSubRule = rule[0]
    if (rule.isRegExp || (rule.length === 1 && firstSubRule.isRegExp)) {
      ExpressionFactory.applyModifiersToRegExpRule(rule.isRegExp ? rule : firstSubRule, {
        quantifier: rule.quantifier,
        assertion: rule.assertion
      })
      RuleFactory.resetModifiers(rule)
      if (firstSubRule.isRegExp) rule.isSequence = true
      return rule
    }
    if (rule.quantifier) {
      switch (rule.quantifier) {
        case '?' /* Optional */:
          rule.isOptional = true
          break
        case '*' /* ZeroOrMore */:
          rule.isClosure = true
          rule.isKleeneClosure = true
          break
        case '+' /* OneOrMany */:
          rule.isClosure = true
          rule.isPositiveClosure = true
      }
    }
    if (rule.assertion) {
      rule.isAssertion = true
      switch (rule.assertion) {
        case '?=' /* Lookahead */:
          rule.isLookaheadAssertion = true
          break
        case '?!' /* NegativeLookahead */:
          rule.isNegativeLookaheadAssertion = true
      }
    }
    if (rule.combinator) {
      switch (rule.combinator) {
        case '/' /* OrderedChoice */:
          rule.isChoice = true
          rule.isOrderedChoice = true
          break
      }
    }
    return rule
  }
  optimize(rule) {
    var _a, _b
    const firstSubRule = rule[0]
    if (
      rule.length > 1 ||
      rule.isRegExp ||
      rule[0].isCallback ||
      (firstSubRule.name && rule.name) || // sub.combinator !== this.combinator ||
      rule.isChoice ||
      firstSubRule.isNonCapture === false ||
      (rule.skipPattern && firstSubRule.skipPattern && rule.skipPattern !== firstSubRule.skipPattern)
    )
      return
    const quantifier = ExpressionFactory.mergeQuantifiers(this.quantifier, firstSubRule.quantifier)
    const assertion = (_a = this.assertion) != null ? _a : firstSubRule.assertion
    const combinator = rule.combinator === '/' || firstSubRule.combinator === '/' ? '/' : void 0
    RuleFactory.resetModifiers(rule)
    RuleFactory.resetModifiers(firstSubRule)
    delete rule[0].isLast
    delete rule[0]
    const name = rule.name || firstSubRule.name
    Object.assign(
      rule,
      __spreadProps(__spreadValues({}, firstSubRule), {
        name,
        quantifier,
        assertion,
        combinator,
        skipPattern: (_b = rule.skipPattern) != null ? _b : firstSubRule.skipPattern
      })
    )
    if (combinator === '/' /* OrderedChoice */) {
      for (let i = 0; i < rule.length; i++) {
        rule[i] = Object.assign({}, rule[i], { name })
      }
    }
  }
  static resetModifiers(rule) {
    this.resetAssertion(rule)
    this.resetQuantifier(rule)
    this.resetCombinator(rule)
  }
  static resetAssertion(rule) {
    delete rule.isLookaheadAssertion
    delete rule.isNegativeLookaheadAssertion
    delete rule.isAssertion
    delete rule.assertion
  }
  static resetQuantifier(rule) {
    delete rule.quantifier
    delete rule.isClosure
    delete rule.isKleeneClosure
    delete rule.isPositiveClosure
    delete rule.isOptional
  }
  static resetCombinator(rule) {
    delete rule.combinator
    delete rule.isSequence
    delete rule.isOrderedSequence
    delete rule.isUnorderedSequence
    delete rule.isChoice
    delete rule.isOrderedChoice
    delete rule.isUnorderedChoice
  }
}

// src/index.ts
var r = (...subrules) => new RuleFactory(...subrules)
var c = RuleFactory.clone
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    Assertion,
    Combinator,
    EventType,
    Parser,
    Quantifier,
    c,
    r
  })
