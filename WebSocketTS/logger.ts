import moment from 'moment'
import chalk from 'chalk'

export class Logger {

    private readonly errorPrefix: string = chalk.bgBlue('ERROR')
    private readonly warnPrefix: string = chalk.bgYellow('WARN')
    private readonly debugPrefix: string = chalk.green('DEBUG')
    private readonly logPrefix: string = chalk.bgBlue('LOG')
    private readonly readyPrefix: string = chalk.bgGreen('READY')

    private print(value: string): void {
        console.log(`[${moment().format('MM-DD HH:mm:ss')}] ${value}`)
    }

    public warn(...args) {
        this.print(`[${this.warnPrefix}] ${args}`)
    }
    public debug(...args) {
        this.print(`[${this.debugPrefix}] ${args}`)
    }
    public error(...args) {
        this.print(`[${this.errorPrefix}] ${args}`)
    }
    public log(...args) {
        this.print(`[${this.logPrefix}] ${args}`)
    }
    public ready(...args) {
        this.print(`[${this.readyPrefix}] ${args}`)
    }
}