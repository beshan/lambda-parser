export type TranspilerSettings = Partial<{ rte: string }>

export type XpgRule = {
  name: string
  assignment: string
  expression: XpgExpression[]
}

export type XpgExpressionRaw = {
  first: XpgExpression
  rest?: XpgExpression[]
}

export type XpgExpression = {
  group?: XpgGroup
  symbol?: string
  combinator?: string
  quantifier?: string
  assertion?: string
  noncapture?: string
}

export type XpgGroup = {
  name?: string
  expression: XpgExpression[]
}
