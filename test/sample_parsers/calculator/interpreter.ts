import type { Equation } from './types'

export default class Interpreter {
  interpret({ a, b, op }: Equation): number {
    const _a = parseFloat(a)
    const _b = parseFloat(b)
    switch (op) {
      case '+':
        return _a + _b
      case '-':
        return _a - _b
      case '*':
        return _a * _b
      case '/':
        return _a / _b
      case '^':
        return _a ** _b
      case 'sin':
        return Math.sin((_a * Math.PI) / 180.0)
      case 'cos':
        return Math.cos((_a * Math.PI) / 180.0)
    }

    return NaN
  }
}
