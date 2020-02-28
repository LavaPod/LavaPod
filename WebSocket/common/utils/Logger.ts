const { r, g, b, w, c, m, y, k } = [
    ['r', 1], ['g', 2], ['b', 4], ['w', 7],
    ['c', 6], ['m', 5], ['y', 3], ['k', 0],
  ].reduce((cols, col) => ({
    ...cols,  [col[0]]: f => `\x1b[3${col[1]}m${f}\x1b[0m`
  }), {} as any)
  
  export class Logger {
  
      private readonly errorPrefix: string = r('ERROR')
      private readonly warnPrefix: string = y('WARN')
      private readonly debugPrefix: string = g('DEBUG')
      private readonly logPrefix: string = b('LOG')
      private readonly cmdPrefix: string = w('CMD')
  
      private print(value: string): void {
          const date = new Date()
          console.log(`[${date.toLocaleDateString()} ${date.toLocaleTimeString('us-US')}] ${value}`)
      }
  
      public warn(...args) {
          this.print(`[${this.warnPrefix}] ${args}`)
      }
      public debug(...args) {
          this.print(`[${this.debugPrefix}] ${args}`)
      }
      public cmd(...args) {
          this.print(`[${this.cmdPrefix}] ${args}`)
      }
      public error(...args) {
          this.print(`[${this.errorPrefix}] ${args}`)
      }
      public log(...args) {
          this.print(`[${this.logPrefix}] ${args}`)
      }
  }