# Intro

Lambda parser is a top-down recursive parser with both lookback and lookahead functionalities. Lambda parser introduces a new [analytic formal grammar](https://en.wikipedia.org/wiki/Formal_grammar#Analytic_grammars) named XPG (extensible parsing grammar) that's inspired by [PEG](https://en.wikipedia.org/wiki/Parsing_expression_grammar). XPG has generated its own [parser](./src/generator/parser.ts) from this [grammar](./src/generator/grammar.xpg).

# Technical facts

- Uses the builtin JavaScript RegExp for tokenization.
- Is pure JavaScript (library/framework free) and can be used in all JavaScript RTEs.
- Written in TypeScript with the strictest ESNext config.
- Uses no recursive function (uses the stack to implement recursion).
- Returns a JSON object instead of a parse-tree.

# Installation

`npm i lambda-parser`

# Usage

## Generating parser from XPG

For Node.js and browser:

```sh
npx lambda-parser gen src/grammar.xpg src
```

For Deno:

```sh
npx lambda-parser gen src/grammar.xpg src -r deno
```

This command generates a TypeScript ES module with the name `parser.ts`.

## Sample

### ENV file parser

`.env`

```env
HOST=127.0.0.1
PORT=8080
```

`src/grammar.xpg`

```
list : (key(KEY) '=' value(VALUE) END)+
KEY = r'[a-zA-Z0-9_]+'
VALUE = r'.+'
END = r'\n|$'
```

`test/index.ts`

```ts
import { deepEqual } from 'node:assert'
import fs from 'node:fs'
import { join } from 'node:path'

import parser from '../src/parser'

const input = fs.readFileSync(join(process.cwd(), '/.env'), 'utf8')
const output = parser.parse(input.toString())

deepEqual(output, [
  { key: 'HOST', value: '127.0.0.1' },
  { key: 'PORT', value: '8080' }
])

console.log('Done!')
```

`package.json`

```
{
  "scripts": {
    "gen": "npx lambda-parser gen src/grammar.xpg src",
    "test": "ts-node test/index.ts"
  },
  "dependencies": {
    "lambda-parser": "^0.6.1",
    "ts-node": "^10.9.1"
  }
}
```

Test:
```
npm run gen && npm t
```

Please see the [sample parsers](./test/sample_parsers/) for more samples.

# XPG Syntax

`SCRIPT`

Path to the TS/JS script that will be used for [extending](#extending-the-parser) the generated parser.

```
SCRIPT = 'path_to_the_script'
```

`Comment`

```
# A comment must be started with a hashtag.
```

`Variable`

```
name = rule
```

`RegExp rule`

```
name : r'regex_pattern'
# or
name : 'exact_string'
```

`Sequence rule`

```
name : subrule_1 subrule_2
```

`Ordered choice rule`

```
name : subrule_1 / subrule_2
```

`Non-capture rule`

```
name : ~subrule
```

`Dynamic rule`

```
name : SCRIPT.subrule
```

`Group`

```
name : group_name(subrule)
```

Note: group_name can be emitted, in that case the parsed data will be assigned to the closest parent rule.

`Predicate`

```
name : &and_predicate !not_predicate
```

`Quantifiers`

```
name : (subrule)? # Optional
name : (subrule)* # Zero or more
name : (subrule)+ # One or more
```

# Extending the parser

## Global parser settings

When extending a generated parser, the parser script module must export a variable with the name `settings`:

```ts
export const settings: ParserSettings = {}
```

- `ParserSettings`

  ```ts
  type ParserSettings = Partial<{
    skip: RegExp
    listener: ParserListener
  }>
  ```

  - `skip`

    Specifies the global skip pattern.

  - `listener`

    Lambda parser raises an event when a rule is succeeded or failed. This event can be used for transforming the parsed data or resolving the failure:

    ```ts
    export function listener(this: IParser, event: ParserEvent) {
      if (event.type === ParserEventType.RuleSucceeded) {
        const rule = event.data
        if (rule.name === 'NUMBER') return parseInt(rule.data)
      } else if (event.type === ParserEventType.RuleFailed) {
        if (rule.name === 'NUMBER') {
          // Checking if the number is a float number.
          // This is a sample scenario. In a real project, the NUMBER rule should cover both int and float numbers.
          const lexer = this.lexer
          const floatNumber = lexer.lookahead(/[0-9]+\.[0-9]+/)
          if (floatNumber) {
            lexer.position += floatNumber.length
            return parseFloat(floatNumber)
          }
        }
      }
    }
    ```

## Dynamic rule

An XPG rule can be defined programmatically:

`src/grammar.xpg`

```
grammar : SCRIPT.text

SCRIPT = '/src/parser_script.ts'
```

`src/parser_script.ts`

```ts
import { IParser } from 'lambda-parser/src/types'

export function text(this: IParser): string | undefined {
  let text = ''
  const parser = this
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
```

`test/parser.ts`

```ts
import { equal } from 'node:assert'

import parser from './src/parser'

const input = "'It\\'s Ok!'"
const output = parser.parse(input)

equal(output, "It's Ok!")
```

# API

```ts
type ParserListener = (this: IParser, event: ParserEvent) => unknown
type ParserEvent = RuleSucceededEvent | RuleFailedEvent
type RuleSucceededEvent = { type: 0; data: { name?: string; data: any } }
type RuleFailedEvent = { type: 1; data: { name?: string } }

interface IParser {
  lexer: ILexer
}

interface ILexer {
  isEof: boolean
  jump: (length: number) => void
  scan(pattern: RegExp): string | undefined
  lookahead(pattern: RegExp): string | undefined
  lookback(pattern: RegExp): string | undefined
}
```

# License

[MIT License](./LICENSE)