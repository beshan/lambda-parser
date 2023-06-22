import { EventType } from '../../../src'

import type { IParser, Dict, ParserEvent, ParserSettings } from '../../../src/types'

function listener(this: IParser, event: ParserEvent): unknown {
  if (event.type === EventType.RuleSucceeded) {
    const { name, data } = event.data
    if (name === 'prop') {
      const { key, value } = data as { key: string; value: unknown }
      return { [key]: value }
    }

    if (name === 'object') {
      const { prop, rest } = data as {
        prop: Dict
        rest: Array<{ prop: Dict }>
      }
      if (!prop) return {}
      const result = prop
      for (let i = 0; i < rest.length; i++) {
        const { prop } = rest[i] as Dict
        Object.assign(result, prop)
      }

      return result
    }

    if (name === 'array') {
      const { value, rest } = data as { value: unknown; rest: Array<{ value: unknown }> }
      const result: unknown[] = value === undefined ? [] : [value]
      if (rest) {
        for (let i = 0; i < rest.length; i++) {
          const { value } = rest[i] as Dict
          result.push(value)
        }
      }
      return result
    }

    if (name && ['value', 'key'].includes(name)) {
      const value = data as string | Partial<{ array: unknown; object: unknown }>
      if (typeof value === 'string') {
        if (value === 'null') return null
        if (value === 'true') return true
        if (value === 'false') return false
        if (value.startsWith('"') || value.startsWith("'")) return value.substr(1, value.length - 2)
        return value.indexOf('.') !== -1 ? parseFloat(value) : parseInt(value)
      } else {
        if (value.array) return value.array
        if (value.object) return value.object
      }
    }
  }

  return undefined
}

export const settings: ParserSettings = {
  listener,
  skip: /\s*/
}
