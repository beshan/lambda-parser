import type { Dict, RegExpRule, StackEntry } from './types'

import { ErrorMessage } from './constants'

export default class Data {
  source: Dict = {}

  static getInfo(entry: StackEntry): { path: string; symbol: string; index: number } {
    let symbol = ''
    let index = 0
    let parent = entry.parent

    // Retrieving the index of the rule in its parent expression
    if (parent) {
      if (parent.rule.isChoice) {
        index = 0
        for (let i = 0; i < parent.rule.length; i++) {
          const sub = parent.rule[i]
          if ((sub as RegExpRule).isRegExp) {
            if (symbol) symbol += ' or '
            symbol += ((sub as RegExpRule)[0] as RegExp).toString().replace(/\\\\/g, '\\')
          }
        }
      } else {
        for (let i = 0; i < parent.rule.length; i++) {
          const sub = parent.rule[i]
          if (sub === entry.rule) {
            index = i
            symbol = ((sub as RegExpRule)[0] as RegExp).toString().replace(/\\\\/g, '\\')
            break
          }
        }
      }
    }

    const path = []
    if (entry.name) path.push(entry.name)
    // Generating entry's prop path
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
  create(entry: StackEntry): void {
    const propName = entry.name
    if (!propName) throw new Error(ErrorMessage.UndefinedStackEntryName)

    const parent = entry.parent

    if (parent && parent.rule.isChoice) {
      // Sub expressions of a choice rule use the choice rule's data object and their data object.
      if (parent.data) entry.data = parent.data
    } else {
      // Datasource is the parent's data object or this.source for the top-level rule which has no parent.
      const datasource = this.getDatasource(entry)
      entry.data = {}

      // When the rule is a closure or the data has already been written by another rule's data,
      // the data should be converted to a data-array to prevent data mixture.
      if (entry.rule.isClosure || datasource[propName]) {
        // The closure's array should be initialized only at the first iteration
        let data = (datasource[propName] = datasource[propName] || []) as Dict[]

        // The data's been created by another sub expression with the same prop name
        if (!(data instanceof Array)) data = datasource[propName] = [data]

        data.push(entry.data)
      } else {
        datasource[propName] = entry.data
      }
    }
  }

  get(entry: StackEntry): Dict {
    if (!entry.name) throw new Error(ErrorMessage.UndefinedStackEntryName)

    const datasource = this.getDatasource(entry)

    if (entry.rule.isClosure) {
      const dataArray = datasource[entry.name] as Dict[]
      return dataArray[dataArray.length - 1] as Dict
    }

    if (entry.data === undefined) throw new Error(ErrorMessage.UndefinedEntryData)

    return entry.data
  }

  set(entry: StackEntry, data: unknown): void {
    if (!entry.name) throw new Error(ErrorMessage.UndefinedStackEntryName)

    const propName: string = entry.name
    const datasource = this.getDatasource(entry)

    if (datasource[propName] instanceof Array) {
      const dataArray = datasource[propName] as unknown[]
      // Popping the initial data that is set by the create method
      dataArray.pop()
      dataArray.push(data)
    } else datasource[propName] = data
  }

  delete(entry: StackEntry): void {
    if (!entry.name) throw new Error(ErrorMessage.UndefinedStackEntryName)

    const propName = entry.name
    const datasource = this.getDatasource(entry)

    if (entry.rule.isClosure) (datasource[propName] as Dict[]).pop()
    else delete datasource[propName]
  }

  getDatasource(entry: StackEntry): Dict {
    const parent = entry.parent
    // The top-level rule which has no parent, uses this.source as its datasource.
    // Sub expressions(expect for a choice rule) use their parent rule's data as their datasource.
    // Sub expressions of a choice rule use the choice rule's datasource and their datasource.
    if (!parent) return this.source

    if (parent.rule.isChoice) return this.getDatasource(parent)

    if (parent.data === undefined) {
      throw new Error(ErrorMessage.UndefinedEntryParentData)
    }

    return parent.data
  }
}
