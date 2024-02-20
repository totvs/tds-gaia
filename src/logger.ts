import * as vscode from 'vscode';
import * as fse from 'fs-extra';
import winston = require('winston');
import Transport = require('winston-transport');
import { getDitoConfiguration } from './config';
import { json } from 'stream/consumers';

const outputChannel: vscode.LogOutputChannel = vscode.window.createOutputChannel('TDS-Dito', { log: true });

class OutputChannelTransport extends Transport {
    constructor(opts: any) {
        super(opts);
    }

    log(info: any, callback: any) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        if (info.level === 'error') {
            outputChannel.error(`${info.message}\n${info.cause}`); //\n${info.stack}
            vscode.window.showErrorMessage(info.message);
            outputChannel.show();
        } else if (info.level === 'warn') {
            outputChannel.warn(info.message);
            vscode.window.showInformationMessage(info.message);
        } else if (info.level === 'verbose') {
            outputChannel.debug(info.message);
        } else if (info.level === 'debug') {
            outputChannel.debug(info.message);
        } else {
            outputChannel.appendLine(info.message);
        }

        // Perform the writing to the remote service
        callback();
    }
};

const userHome: string = process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH || '.';
const logDir: string = userHome + '/.tds-dito/logs';
fse.ensureDirSync(logDir);
const now: Date = new Date();
const logSuffix: string = `${now.getFullYear()}-${(now.getMonth() + 1) < 10 ? "0" : ""}${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

export const logger: winston.Logger = winston.createLogger({
    level: 'verbose',
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'tds-dito' },
    transports: [
        new OutputChannelTransport({ level: getDitoConfiguration().verbose, format: winston.format.simple() }),
        new winston.transports.File({ level: "error", filename: `${logDir}/error-${logSuffix}.log` }),
        new winston.transports.File({ level: "http", filename: `${logDir}/http-${logSuffix}.log` }),
        new winston.transports.File({ filename: `${logDir}/full-${logSuffix}.log`, handleExceptions: true }),
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

outputChannel.appendLine(`TDS-Dito logger initialized and file writes in ${logDir}`);

