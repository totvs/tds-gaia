import * as vscode from "vscode";
import * as fse from "fs-extra";
import { isDitoShowBanner } from "../config";

const fileLog = "W:\\ws_tds_vscode\\tds-vscode\\test\\resources\\projects\\dss\\src\\communication.log"
fse.writeFileSync(fileLog, `Start at ${new Date().toLocaleTimeString()}\n\n`);
const file = fse.openSync(fileLog, "a");
let execBeginTime: Date;

interface Completion {
    generated_text: string;
}

export interface CompletionResponse {
    request_id?: String,
    completions: Completion[],
}

export interface IaApiInterface {
    start(token: string): Promise<boolean>;
    stop(): Promise<boolean>;
    checkHealth(): Promise<Error | undefined>;

    login(): Promise<boolean>;
    logout(): Promise<boolean>;

    generateCode(text: string): Promise<string[]>;
    getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse>
}

export class IaAbstractApi {
    private fistStart: boolean = true;

    constructor() {

    }

    /**
     * Logs the request body to a file.
     * 
     * Writes the request body as a JSON string and object to the log file, 
     * along with the request start time.
     */
    protected logRequest(body: {}) {
        execBeginTime = new Date();
        const data: string = JSON.stringify(body).replace('\\"', '\\"');
        fse.writeSync(file, `request: ${execBeginTime.toLocaleTimeString()} \n`);
        fse.writeSync(file, `data: ${data} \n\n`);

        const json: string = JSON.stringify(body, undefined, 2);
        fse.writeSync(file, json);
    }

    /**
     * Logs the response body to a file after a request has been made.
     * 
     * Writes the response body as a JSON string and object to the log file,
     * along with the request end time and duration.
     */
    protected logResponse(response: {}) {
        const execEndTime = new Date();
        const data: string = JSON.stringify(response).replace('\\"', '\\"');

        fse.writeSync(file, `request: ${execEndTime.toLocaleTimeString()} (${execEndTime.getMilliseconds() - execBeginTime.getMilliseconds()} ms}\n`);
        fse.writeSync(file, `data: ${data} \n`);
        fse.writeSync(file, `${'-'.repeat(20)} \n\n`);

        const json: string = JSON.stringify(response, undefined, 2);
        fse.writeSync(file, json);
    }

    /**
     * Logs an error to the log file.
     * 
     * Writes the error details including the end time, 
     * elapsed time, message, cause, and stack trace.
     */
    protected logError(error: any) {
        console.error(error);

        const execEndTime = new Date();

        fse.writeSync(file, `ERROR: ${execEndTime.toLocaleTimeString()} (${execEndTime.getMilliseconds() - execBeginTime.getMilliseconds()} ms}\n`);
        fse.writeSync(file, `Message: ${error.message} \n`);
        fse.writeSync(file, `Cause: ${error.cause} \n`);
        fse.writeSync(file, `Cause: ${error.stack} \n`);
        fse.writeSync(file, `${'-'.repeat(20)} \n\n`);
    }
}