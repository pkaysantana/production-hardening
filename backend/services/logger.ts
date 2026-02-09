import chalk from "chalk";

export enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    DEBUG = "DEBUG"
}

export class Logger {
    private serviceName: string;

    constructor(serviceName: string) {
        this.serviceName = serviceName;
    }

    private formatMessage(level: LogLevel, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const levelColor = this.getLevelColor(level);
        const metaString = meta ? `\n${JSON.stringify(meta, null, 2)}` : "";
        return `${chalk.gray(timestamp)} [${levelColor(level)}] [${chalk.cyan(this.serviceName)}]: ${message}${metaString}`;
    }

    private getLevelColor(level: LogLevel) {
        switch (level) {
            case LogLevel.INFO: return chalk.green;
            case LogLevel.WARN: return chalk.yellow;
            case LogLevel.ERROR: return chalk.red;
            case LogLevel.DEBUG: return chalk.blue;
            default: return chalk.white;
        }
    }

    info(message: string, meta?: any) {
        console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }

    warn(message: string, meta?: any) {
        console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }

    error(message: string, error?: any) {
        console.error(this.formatMessage(LogLevel.ERROR, message, error));
    }

    debug(message: string, meta?: any) {
        if (process.env.DEBUG) {
            console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
        }
    }
}
