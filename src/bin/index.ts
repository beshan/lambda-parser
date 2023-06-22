#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */

import * as fs from 'fs'
import { join } from 'path'

import XpgParser from '../generator'

require('yargs')
  .scriptName('lambda-parser')
  .usage('usage: $0 <command> [options]')
  .command(
    'gen <xpgfile> <outdir> [rte]',
    'Generates parser from XPG',
    (yargs: any) => {
      yargs.positional('rte', {
        type: 'string',
        alias: 'r',
        default: 'node',
        describe: 'Runtime Environment: browser|node|deno'
      })
    },
    (argv: any) => {
      const grammar = fs.readFileSync(argv.xpgfile, 'utf8')
      const parser = new XpgParser()
      const code = parser.transpile(grammar, { rte: argv.rte ?? 'node' })
      const outputFile = join(argv.outdir, 'parser.ts')
      fs.writeFileSync(outputFile, code.join('\n'))
      console.info("Successfully wrote the generated parser to '%s'", outputFile)
    }
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help().argv
