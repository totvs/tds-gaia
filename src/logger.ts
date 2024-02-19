import * as vscode from 'vscode';
import winston = require('winston');
import Transport = require('winston-transport');
import { getDitoConfiguration } from './config';

const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('TDS-Dito', { log: true });

class OutputChannelTransport extends Transport {
    constructor(opts: any) {
        super(opts);
    }

    log(info: any, callback: any) {
        setImmediate(() => {
            this.emit('logged', info);
        });
        
        outputChannel.appendLine(`${info.message}`);
        if (getDitoConfiguration().verbose == "verbose") {
            outputChannel.appendLine(`${JSON.stringify({...info })}`);
        }
        // Perform the writing to the remote service
        callback();
    }
};

export const logger: winston.Logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'tds-dito-logger' },
    transports: [
        new OutputChannelTransport({ level: 'info', format: winston.format.simple() }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}