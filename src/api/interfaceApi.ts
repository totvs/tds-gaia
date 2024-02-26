import { logger } from "../logger";

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
    checkHealth(detail: boolean): Promise<Error | undefined>;

    login(): Promise<boolean>;
    logout(): Promise<boolean>;

    generateCode(text: string): Promise<string[]>;
    getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse>
    explainCode(code: string): Promise<string>;
}

export class IaAbstractApi {

    constructor() {

    }

    /**
     * Logs the request body to a file.
     * 
     * Writes the request body as a JSON string and object to the log file, 
     * along with the request start time.
     */
    protected logRequest(url: string, method: string, headers: {}, body: string) {
        execBeginTime = new Date();

        logger.http("%s: %s", method, url, { headers: headers, body: body });
    }

    /**
     * Logs the response body to a file after a request has been made.
     * 
     * Writes the response body as a JSON string and object to the log file,
     * along with the request end time and duration.
     */
    protected logResponse(url: string, response: string) {
        logger.profile(url);
        const execEndTime: Date = new Date();
        const duration: number = execEndTime.getMilliseconds() - execBeginTime.getMilliseconds();

        logger.http("Response: %s (%d ms)", url, duration, { body: response });
    }

    /**
     * Logs an error to the log file.
     * 
     * Writes the error details including the end time, 
     * elapsed time, message, cause, and stack trace.
     */
    protected logError(url: string, error: any, complement: string) {
        logger.profile(url);
        logger.error(error);
        logger.verbose(complement);
    }
}