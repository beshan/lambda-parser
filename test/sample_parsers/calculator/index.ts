import Interpreter from './interpreter'
import parser from './parser'

import type Parser from '../../../src/parser'
import type { Equation } from './types'

export default class Calculator {
  public parser: Parser

  constructor() {
    this.parser = parser
  }

  parse(input: string): Equation {
    return this.parser.parse(input) as Equation
  }

  transpile(input: string): number {
    const equation = this.parse(input)
    const interpreter = new Interpreter()
    return interpreter.interpret(equation)
  }
}
