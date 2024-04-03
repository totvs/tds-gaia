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

import { ExtensionContext } from "vscode";
import { logger } from "../logger";
import { TDitoConfig, getDitoConfiguration } from "../config";
import { ChatApi } from "./chatApi";

let execBeginTime: Date;

/**
 * Interface for completion response from autocomplete API.
 */
export interface Completion {
    generated_text: string;
}

/**
 * Interface for completion response from autocomplete API.
 * Contains request ID and array of Completion objects.
 */
export interface CompletionResponse {
    request_id?: String,
    completions: Completion[],
}

/**
 * Interface defining the shape of type information.
 * Contains a type name and variable name.
 */
interface Type {
    var: string;
    type: string;
}

/**
 * Interface defining the shape of typify response. 
 * Contains request ID and array of Type objects.
 */
export interface TypifyResponse {
    request_id?: String,
    types: Type[],
}

/**
 * Interface defining the API for the AI assistant.
 * 
 */
export interface IaApiInterface {
    register(context: ExtensionContext): void;

    start(token: string): Promise<boolean>;
    stop(): Promise<boolean>;
    checkHealth(detail: boolean): Promise<Error | undefined>;

    login(): Promise<boolean>;
    logout(): Promise<boolean>;

    generateCode(text: string): Promise<string[]>;
    getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse>
    explainCode(code: string): Promise<string>;
    typify(code: string): Promise<TypifyResponse>;

    logCompletionFeedback(completions: {completion: Completion, textBefore: string, textAfter: string}): void;
}

/**
 * Contains methods for logging requests, responses, and errors.
 * 
 */
export class IaAbstractApi {

    protected chat: ChatApi;

    /**
     * Constructor for IaAbstractApi class.
     * Initializes the chat API client.
     * 
     * @param chat - ChatApi client instance
     */
    constructor(chat: ChatApi) {
        this.chat = chat;
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