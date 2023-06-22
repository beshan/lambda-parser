/* eslint-disable @typescript-eslint/no-explicit-any */

export const object = {
  map: (obj: any, mapper: (data: any) => any): any => {
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

  trim: (obj: any, what: any[] = [undefined], callback?: (obj: any) => any): any => {
    if (obj instanceof Array) {
      const result = []
      for (let i = 0; i < obj.length; i++) {
        const trimmed = object.trim(obj[i], what, callback)
        if (trimmed !== undefined) result.push(trimmed)
      }

      if (object.isEmpty(result) && what.includes('[]')) return
      return result
    }

    if (obj instanceof Object) {
      for (const key in obj) {
        const trimmed = object.trim(obj[key], what, callback)
        if (trimmed === undefined) delete obj[key]
        else obj[key] = trimmed
      }

      if (object.isEmpty(obj) && what.includes('{}')) return
      return callback ? callback(obj) : obj
    }

    if (what.includes(obj)) return

    return obj
  },

  isEmpty: (obj: any): boolean => {
    if (obj instanceof Array) return obj.length === 0
    return Object.keys(obj).length === 0
  },

  toJson: (obj: unknown): unknown => {
    return JSON.parse(JSON.stringify(obj))
  },

  filterProps(obj: any, namePattern: RegExp | string): string[] {
    if (!(namePattern instanceof RegExp)) namePattern = string.toRegExp(namePattern)
    const result = []
    for (const key in obj) {
      if (key.match(namePattern)) result.push(key)
    }

    return result
  },

  // Assigning the given props to the given object's root
  // Assigning the given props to the given object's root
  spreadProps(obj: any, propNames: string[]): any {
    for (let i = 0; i < propNames.length; i++) {
      const propName = propNames[i] as string
      const prop = obj[propName]
      if (prop !== undefined) {
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

  isMap(obj: any): boolean {
    if (obj.length && !(obj instanceof Array) && Object.keys(obj).length - 1 == obj.length) {
      for (let i = 0; i < obj.length; i++) {
        if (obj[i] === undefined) return false
      }
      return true
    }

    return false
  }
}

export const map = {
  toArray(obj: any): any {
    const arr = []
    for (let j = 0; j < obj.length; j++) arr.push(obj[j])
    return arr
  },

  last: (obj: any): any => {
    return obj[obj.length - 1]
  }
}

export const string = {
  format: (str: string, ...values: any[]): string => {
    return str.replace(/{([0-9]+)}/g, (match, index) => {
      // check if the argument is present
      return typeof values[index] == 'undefined' ? match : values[index]
    })
  },
  toRegExp: (str: string): RegExp => new RegExp(str.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&'))
}

export const array = {
  last: (arr: any[]): any => {
    return arr[arr.length - 1]
  },

  unshiftWith(arr: any[], index: number): any[] {
    const item = arr.splice(index, 1)
    arr.unshift(item)
    return arr
  }
}

export const func = {
  fails: (callback: () => unknown) => {
    try {
      callback()
    } catch (error) {
      return true
    }
    return false
  }
}
