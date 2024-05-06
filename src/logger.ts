/*
Copyright 2024 TOTVS S.A

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http: //www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import * as vscode from 'vscode';
import * as fse from 'fs-extra';
import winston = require('winston');
import Transport = require('winston-transport');
import { getGaiaLogLevel } from './config';

const outputChannel: vscode.LogOutputChannel = vscode.window.createOutputChannel('TDS-Gaia', { log: true });
export const PREFIX_GAIA = "[TDS-Gaia]";
const LABEL_GAIA = "tds-gaia";

/**
 * Custom Winston transport that logs messages to the extension's output channel. 
 * Handles log levels and formats messages appropriately.
 */
class OutputChannelTransport extends Transport {
    constructor(opts: any) {
        super(opts);
    }

    log(info: any, callback: any) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        if (info.durationMs) {
            outputChannel.trace(`${info.message} (${info.durationMs} ms)`);
        } else if (info.level === 'error') {
            outputChannel.error(info.message);
            //logger.verbose(`Cause: ${info.cause}\n\tStack: ${info.stack}`);
            if (((this.level || "") == "verbose") || ((this.level || "") == "debug")) {
                outputChannel.error(`Cause: ${info.cause}\n\tStack: ${info.stack}`);
            }
            vscode.window.showErrorMessage(`${PREFIX_GAIA}${info.message}`);
            outputChannel.show();
        } else if (info.level === 'warn') {
            outputChannel.warn(info.message);
            vscode.window.showInformationMessage(`${PREFIX_GAIA}${info.message}`);
        } else if (info.level === 'verbose') {
            outputChannel.debug(info.message);
        } else if (info.level === 'debug') {
            outputChannel.debug(info.message);
        } else if (info.level === 'http') {
            let text: string = info.message;

            if (info.durationMs) {
                text += ` (${info.durationMs} ms)`;
            }

            if (info.headers) {
                text += `\n\tHeaders: ${JSON.stringify(info.headers, undefined, 2)}`;
            }
            if (info.body) {
                text += `\n\tBody: ${info.body}`;
            }

            outputChannel.debug(text);
        } else {
            outputChannel.appendLine(info.message.trim());
        }

        // Perform the writing to the remote service
        callback();
    }
};

const userHome: string = process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH || '.';
const logDir: string = userHome + '/.tds-gaia/logs';
fse.ensureDirSync(logDir);
const now: Date = new Date();
const logSuffix: string = `${now.getFullYear()}-${(now.getMonth() + 1) < 10 ? "0" : ""}${now.getMonth() + 1}-${now.getDate()}` +
    `-${now.toTimeString().substring(0, 5).replace(":", "_")}`;
;
const logFilename: string = `${logDir}/tds-gaia-${logSuffix}.log`;

if (fse.existsSync(logFilename)) {
    fse.removeSync(logFilename);
}

const formatCause = (cause: any, prefix: string = "\t"): string => {
    let text: string = "";

    if (cause) {
        console.log("********************************");
        console.log("********************************");
        console.log("********************************");
        console.dir(cause);

        text += `${prefix}Cause: ${cause.message}\n`;

        if (cause.stack) {
            text += `${prefix}Stack: ${cause.stack.replace(/\t/g, prefix + "\t")}\n`;
        }

        Object.keys(cause).forEach((key: string) => {
            if (key == "cause") {
                text += formatCause(cause.cause, prefix + "\t");
            } else if ((key !== "message") && (key !== "level") && (key !== "service")) {
                text += `${prefix}${key}: ${cause[key]}\n`;
            }
        })
    }

    return text;
}

const myFormat = winston.format.printf((info: winston.Logform.TransformableInfo) => {
    if (info.level == "error") {
        return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}\n${formatCause(info.error)}`;
    }

    let text: string = `${info.timestamp} [${info.label}] ${info.level}: ${(info.message || info.error.message || info).trim()}`;

    if (info.durationMs) {
        text += ` (${info.durationMs} ms)`;
    }

    if (info.level == "http") {
        if (info.headers) {
            text += `\n\tHeaders: ${JSON.stringify(info.headers, undefined, 2)}`;
        }
        if (info.body) {
            text += `\n\tBody: ${info.body}`;
        }
    } else if (info.level == "error") {
        text += `\n${formatCause(info.cause)}`;
    }

    return text;
});

/**
 * Creates a Winston logger instance with the provided configuration.
 * 
 * Configures the log level, format, default metadata, and transport streams.
 * The logger will log to the console and to a dated log file.
 */
export const logger: winston.Logger = winston.createLogger({
    level: getGaiaLogLevel(),
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.timestamp(),
        winston.format.simple(),
        //winston.format.prettyPrint()
    ),
    defaultMeta: { service: 'tds-gaia' },
    transports: [
        new OutputChannelTransport({
            //level: getGaiaConfiguration().logLevel,
            format: winston.format.combine(
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.simple(),
                winston.format.timestamp({ format: 'HH:mm:ss' }),
                //myFormat
            ),
        }
        ),
        new winston.transports.File({
            filename: logFilename,
            handleExceptions: true,
            format: winston.format.combine(
                winston.format.splat(),
                winston.format.timestamp({ format: 'YY-MM-DD HH:mm:ss' }),
                winston.format.label({ label: LABEL_GAIA }),
                //winston.format.prettyPrint(),
                myFormat
            )
        }),
    ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.splat(),
            winston.format.timestamp(),
            winston.format.label({ label: LABEL_GAIA }),
            //winston.format.simple()
            winston.format.prettyPrint(),
        )
    }));
}

outputChannel.appendLine(`TDS-Gaia logger initialized at ${new Date().toDateString()} and file writes in ${logDir}`);
