#!/usr/bin/env node
'use strict'
var __create = Object.create
var __defProp = Object.defineProperty
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropNames = Object.getOwnPropertyNames
var __getProtoOf = Object.getPrototypeOf
var __hasOwnProp = Object.prototype.hasOwnProperty
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
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, 'default', { value: mod, enumerable: true }) : target,
    mod
  )
)

// src/bin/index.ts
var fs = __toESM(require('fs'))
var import_path = require('path')
var import_generator = __toESM(require('../generator'))
require('yargs')
  .scriptName('lambda-parser')
  .usage('usage: $0 <command> [options]')
  .command(
    'gen <xpgfile> <outdir> [rte]',
    'Generates parser from XPG',
    yargs => {
      yargs.positional('rte', {
        type: 'string',
        alias: 'r',
        default: 'node',
        describe: 'Runtime Environment: browser|node|deno'
      })
    },
    argv => {
      const grammar = fs.readFileSync(argv.xpgfile, 'utf8')
      const parser = new import_generator.default()
      const code = parser.transpile(grammar, { rte: argv.rte ?? 'node' })
      const outputFile = (0, import_path.join)(argv.outdir, 'parser.ts')
      fs.writeFileSync(outputFile, code.join('\n'))
      console.info("Successfully wrote the generated parser to '%s'", outputFile)
    }
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help().argv
