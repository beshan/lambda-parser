export default class Logger {
  static log(type: string, message: string, line: string, lineNumber: number, offset: number, filename = ''): void {
    const logs = []

    logs.push(filename, ':', lineNumber + 1, ':', offset + 1, ': ', message, '\n')
    logs.push('\t', line, '\n')
    logs.push('\t', line.substr(0, offset).replace(/[^\t]/g, '.'), '^\n')
    if (type === 'error') throw new Error(logs.join(''))
    else console.log(logs.join(''))
  }
}
