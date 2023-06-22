import { EventType, LogType, UNNAMED_ENTRY_NAME } from './constants'
import Data from './data'
import Lexer from './lexer'
import Logger from './logger'
import * as util from './utils'

import type {
  Callback,
  IParser,
  ParentStackEntry,
  ParserEvent,
  ParserListener,
  ParserSettings,
  RegExpRule,
  Rule,
  RuleBase,
  StackEntry
} from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RegExpPrototype = RegExp.prototype as any
RegExpPrototype.toJSON = RegExp.prototype.toString

export default class Parser implements IParser {
  private step = 0
  private stack: StackEntry[]
  private data: Data
  lexer: Lexer
  private loggingEnabled: boolean
  private skipPattern?: RegExp | undefined
  private listener?: ParserListener

  constructor(public grammar: Rule, public settings?: ParserSettings) {
    this.stack = []
    this.data = new Data()
    this.lexer = new Lexer()
    this.loggingEnabled = settings?.log ?? false
    this.skipPattern = settings?.skip ? new RegExp(`^(${settings?.skip.source})`) : undefined

    this.listener = (event: ParserEvent): unknown => {
      if (event.type === EventType.RuleSucceeded) {
        const data = this.internalListener(event)
        event.data.data = data
        const result = settings?.listener?.call(this, event)
        if (result === undefined) return event.data.data
        return result
      }
      return settings?.listener?.call(this, event)
    }

    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse(input: string): any {
    this.stack = []
    this.data = new Data()
    this.lexer.init(input)

    this.push(this.grammar)

    this.step = 0
    while (this.stack.length) {
      this.step++

      const entry = this.stack.pop() as StackEntry

      if (entry.rule.debuggerEnabled) debugger

      // An ordered-choice rule is canceled when one of its alternatives succeeds
      if (entry.canceled) continue

      // A closure rule can't be popped from stack unless either it's failed
      // or stack is empty and there is no input left to be scanned
      if (entry.rule.isClosure) {
        if (!this.stack.length && this.lexer.isEof) {
          this.closureSucceeded(entry as ParentStackEntry)
          break
        }

        this.stack.push(entry)
      }

      if (!entry.rule.isPrepared) {
        if (entry.rule.skipPattern) entry.rule.skipPattern = new RegExp(`^(${entry.rule.skipPattern.source})`)
        if (entry.rule.isRegExp) entry.rule[0] = new RegExp(`^(${(entry.rule[0] as RegExp).source})`)
        entry.rule.isPrepared = true
      }
      entry.startPosition = this.lexer.position

      if (entry.rule.skipPattern) this.lexer.scan(entry.rule.skipPattern)

      if (entry.rule.isAssertion) {
        const assertionRule = { ...entry.rule, isAssertion: false }
        const assertionParser = new Parser(assertionRule, {
          ...this.settings
        })

        const succeeded =
          !util.func.fails(() => assertionParser.parse(this.lexer.unscannedInput)) ||
          (assertionParser.lexer.scannedInput.length > 0 && !assertionParser.stack.length)

        if ((!succeeded && entry.rule.isLookaheadAssertion) || (succeeded && entry.rule.isNegativeLookaheadAssertion))
          this.failed(entry)
        else this.succeeded(entry, undefined)
      } else {
        if (entry.name) this.data.create(entry)

        if (entry.rule.isRegExp) {
          const lexeme = this.lexer.scan((entry.rule as RegExpRule)[0] as RegExp)
          if (lexeme === undefined) this.failed(entry)
          else this.succeeded(entry, lexeme)

          if (!this.stack.length && !this.lexer.isEof && entry.rule.skipPattern) this.lexer.scan(entry.rule.skipPattern)
        } else if (entry.rule.isCallback) {
          const callbackRule = (entry.rule[0] as Callback).call(this, entry, entry.rule)
          if (callbackRule instanceof Function) {
            // Rule is a dynamic rule
            const parent = entry.parent as ParentStackEntry
            const lexeme = callbackRule.call(this, entry)
            if (lexeme === undefined) this.failed(parent)
            else if (!parent.rule.isClosure) this.succeeded(parent, lexeme)
          } else {
            const _rule = { ...callbackRule }
            if (entry.rule.isLast) (_rule as Rule).isLast = entry.rule.isLast
            if (entry.parent) {
              // Replacing the parent's subrule's with the referenced Rule
              for (let j = 0; j < entry.parent?.rule.length; j++) {
                if (entry.parent.rule[j] === entry.rule) {
                  entry.parent.rule[j] = _rule as Rule
                  break
                }
              }
              // The referenced rule should be parsed so pushing it into the stack
              this.push(_rule as Rule, entry.parent)
            } else {
              // The callback is a single sub expression
              entry.rule[0] = _rule as Rule
              entry.rule.isCallback = false
              this.push(entry.rule, entry.parent)
            }
          }
        } else {
          for (let i = entry.rule.length - 1; i >= 0; i--) this.push(entry.rule[i] as Rule, entry as ParentStackEntry)
        }
      }
    }

    if (this.skipPattern) this.lexer.scan(this.skipPattern)
    if (!this.lexer.isEof) this.log(LogType.Error, 'Unable to continue parsing.')
    if (this.loggingEnabled) console.log('Parsing done in %d steps:', this.step)

    const result = Object.values(this.data.source)[0]
    return result
  }

  private push(rule: Rule, parent?: ParentStackEntry): void {
    if (typeof rule !== 'string' && !rule.skipPattern) {
      if (parent?.rule.skipPattern) rule.skipPattern = parent?.rule.skipPattern
      else if (this.skipPattern) rule.skipPattern = this.skipPattern
    }

    // The startPosition is used for backtracking when a rule fails.
    // Every time that a closure rule succeeds to iterate the input, it's start position is set to the lexer's current position,
    // therefor when a rule fails the lexer position will be set to the last successfully iterated position instead of
    // setting it to the closure's initial start position.
    if (parent) parent.startPosition = this.lexer.position

    if (!rule.name && !rule.isCallback && !rule.isRegExp) this.setRandomNameForUnnamedRule(rule)

    const entry: StackEntry = {
      rule,
      startPosition: this.lexer.position
    }
    if (rule.name) entry.name = rule.name
    if (parent) entry.parent = parent
    this.stack.push(entry)
  }

  private closureSucceeded(entry: ParentStackEntry): void {
    const data = this.data.getDatasource(entry)[entry.name] as unknown[]
    this.succeeded(entry, data, true)
  }

  private succeeded(entry: StackEntry, lexeme: unknown, isClosureSuccess?: boolean): void {
    if (this.loggingEnabled) console.log('Parsed: %s', lexeme)
    if (entry.name) {
      if (entry.rule.isNonCapture) this.data.delete(entry)
      else {
        if (!entry.rule.isClosure || isClosureSuccess) {
          const modification = this.listener?.call(this, {
            type: EventType.RuleSucceeded,
            data: {
              data: lexeme,
              name: entry.name,
              entry
            }
          })
          if (modification !== undefined) lexeme = modification
        }
        if (lexeme !== undefined) {
          if (isClosureSuccess) this.data.getDatasource(entry)[entry.name] = lexeme
          else this.data.set(entry, lexeme)
        }
      }
    }

    this.propagateSuccess(entry)
  }

  private failed(failedEntry: StackEntry): void {
    let entry: StackEntry | undefined = failedEntry

    // Try to resolve the failure if the rule is:
    // a closure with acceptable count of data or
    // an optional rule
    // an ordered-choice with an alternative
    do {
      // A rule can be choice and closure/optional at the same time, in such a case, choice has the higher priority.
      if (
        this.resolveFailureByAlternativeRule(entry) ||
        this.resolveFailureByClosureRule(entry) ||
        this.resolveFailureByOptionalRule(entry)
      )
        // Not failed
        return
    } while ((entry = entry.parent))

    // Try to resolve manually
    const resolved = this.listener?.call(this, {
      type: EventType.RuleFailed,
      data: {
        name: failedEntry.name as string,
        entry: failedEntry
      }
    }) as boolean

    if (!resolved) {
      const info = Data.getInfo(failedEntry)
      const message = `Symbol ${info.symbol} was expected. Failed to parse the rule at the index ${info.index} of the ${info.path} rule.`
      this.log(LogType.Error, message)
    }
  }

  private resolveFailureByAlternativeRule(entry: StackEntry): boolean {
    const rule = entry.rule
    if (rule.isOrderedChoice) {
      const index = this.indexOfAlternativeRuleInStack(entry)
      if (index !== -1) {
        this.choiceAlternativeRule(index, entry)
        // Not failed.
        return true
      }
    }

    return false
  }

  private resolveFailureByClosureRule(entry: StackEntry): boolean {
    const rule = entry.rule as RuleBase

    if (rule.isClosure) {
      // The rule is not failed when the closure rule is either kleene (*) or is positive (+)
      // with at least one valid data (the last data is incomplete so it's invalid).
      // Deleting the last item from the closure rule's array since it's an invalid data.
      this.data.delete(entry)
      const data = this.data.getDatasource(entry)[rule.name as string] as unknown[]
      if (rule.isKleeneClosure || data.length) {
        // Popping the closure rule and its nested rules.
        const index = this.stack.lastIndexOf(entry)
        this.stack.splice(index - this.stack.length)
        this.lexer.position = entry.startPosition
        this.closureSucceeded(entry as ParentStackEntry)
        // Not failed.
        return true
      }
    }

    return false
  }

  private resolveFailureByOptionalRule(entry: StackEntry): boolean {
    const rule = entry.rule as RuleBase

    if (rule.isOptional) {
      // Popping nested rules of the optional rule
      while (this.stack.length) {
        let isNestedRule = false
        let stackEntry = this.stack[this.stack.length - 1] as StackEntry
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
      // Not failed.
      return true
    }

    return false
  }

  private internalListener(event: ParserEvent): unknown {
    if (event.type === EventType.RuleSucceeded) {
      const data = event.data.data

      if (!data) return

      // Assigning unnamed props to their parent object
      if (data instanceof Array) {
        const result = []
        for (let i = 0; i < data.length; i++) {
          const item = data[i]
          const obj = this.spreadUnnamedProps(item)
          if (!util.object.isEmpty(obj)) result.push(util.object.isMap(obj) ? util.map.toArray(obj) : obj)
        }
        return result
      }
      if (data instanceof Object) {
        const obj = this.spreadUnnamedProps(data)
        return util.object.isMap(obj) ? util.map.toArray(obj) : obj
      }

      return data
    }

    return undefined
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private spreadUnnamedProps(obj: any): any {
    for (const key in obj) {
      const prop = obj[key]
      if (prop === undefined || !key.startsWith(UNNAMED_ENTRY_NAME)) continue
      delete obj[key]
      if (prop === null) continue
      if (prop instanceof Array || !(prop instanceof Object)) return prop
      Object.assign(obj, prop)
    }

    return obj
  }

  private propagateSuccess(entry: StackEntry): void {
    // When a rule is last subrule, the success event should be notified to its parent
    // and if its parents are last subrules too then the event should be notified to them as well
    if (!entry.rule.isLast) return

    let parent = entry.parent as ParentStackEntry

    let isClosure = false
    while (parent) {
      if (parent.rule.isNonCapture) this.data.delete(entry)
      else {
        isClosure ||= (parent.rule.isClosure ||
          (parent.parent?.rule.isOrderedChoice && parent.parent?.rule.isClosure)) as boolean
        // A closure rule's success must be handled only when the closure has no more matching input,
        // ignoring the current success which is an iteration success
        // An choice rule's success has already been propagated by its succeeded sub rule
        if (!isClosure && !parent.rule.isOrderedChoice) {
          const data = this.data.get(parent)
          const modification = this.listener?.call(this, {
            type: EventType.RuleSucceeded,
            data: {
              data,
              name: parent.name,
              entry: parent
            }
          })
          if (modification !== undefined) this.data.set(parent, modification)
        }
      }

      this.cancelAlternativeRules(parent)

      if (!parent.rule.isLast) break
      parent = parent.parent as ParentStackEntry
    }
  }

  private cancelAlternativeRules(entry: StackEntry): void {
    const parent = entry.rule.isOrderedChoice ? entry : entry.parent
    if (!parent || !parent.rule.isOrderedChoice) return
    const rule = parent.rule
    for (let i = 0; i < rule.length; i++) {
      const subrule = rule[i] as Rule
      if (subrule === entry.rule) continue
      const index = this.indexOfStackEntry(subrule)
      if (index !== -1) (this.stack[index] as StackEntry).canceled = true
    }
  }

  private indexOfAlternativeRuleInStack(choiceRuleEntry: StackEntry): number {
    const rule = choiceRuleEntry.rule

    for (let i = 0; i < rule.length; i++) {
      const subrule = rule[i] as Rule

      // const subruleEntry = this.getStackEntry(subrule)
      // if (subruleEntry === failedEntry || this.isSubruleOf(failedEntry, subruleEntry)) continue

      const index = this.indexOfStackEntry(subrule)
      if (index !== -1 && (this.stack[index] as StackEntry).parent === choiceRuleEntry) {
        return index
      }
    }

    return -1
  }

  private choiceAlternativeRule(alternativeRuleIndex: number, failedStackEntry: StackEntry): void {
    if (alternativeRuleIndex !== this.stack.length - 1)
      // Removing rules from stack so the alternative rule can become the upper rule.
      this.stack.splice(alternativeRuleIndex + 1 - this.stack.length)

    this.lexer.position = failedStackEntry.startPosition
    // Deleting the choice rule's data since it's incomplete.
    this.data.delete(failedStackEntry)
    this.data.create(failedStackEntry)
  }

  private indexOfStackEntry(rule: Rule): number {
    const entries = this.stack
    for (let i = entries.length - 1; i >= 0; i--) {
      if ((entries[i] as StackEntry).rule === rule) return i
    }
    return -1
  }

  private log(logType: string, message: string): void {
    const lexer = this.lexer
    if (lexer.lines.length > 1) {
      const lineNumber = lexer.input.substr(0, lexer.position).split('\n').length - 1
      const eol = lexer.input.substr(lexer.position).indexOf('\n')
      const line = lexer.lines[lineNumber] as string
      const offset = line.indexOf(lexer.input.substr(lexer.position, eol))
      Logger.log(logType, message, line, lineNumber, offset)
    } else {
      const line = lexer.lines[0] as string
      const offset = line.indexOf(lexer.input.substr(lexer.position))
      Logger.log(logType, message, line, 0, offset)
    }
  }

  private setRandomNameForUnnamedRule(rule: Rule): void {
    rule.name = UNNAMED_ENTRY_NAME + process.hrtime()

    if (rule.isChoice) {
      for (let i = 0; i < rule.length; i++) {
        const sub = rule[i] as Rule
        if (!sub.name && !sub.assertion) {
          sub.name = rule.name
        }
      }
    }
  }
}
