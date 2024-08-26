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
import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import { logger } from "../logger";
import { TGaiaConfig, getGaiaConfiguration } from "../config";
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
export interface InferType {
    var: string;
    type: string;
    active: boolean;
}

/**
 * Interface defining the shape of infer type response. 
 * Contains request ID and array of Type objects.
 */
export interface InferTypeResponse {
    request_id?: String,
    types: InferType[],
}

/**
 * Interface defining the API for the AI assistant.
 * 
 */
export interface IaApiInterface {
    start(): Promise<boolean>;
    stop(): Promise<boolean>;
    checkHealth(detail: boolean): Promise<Error | undefined>;

    login(email: string, token: string): Promise<boolean>;
    logout(): Promise<boolean>;

    generateCode(text: string): Promise<string[]>;
    getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse>
    explainCode(code: string): Promise<string>;
    inferType(code: string): Promise<InferTypeResponse>;
}

/**
 * Contains methods for logging requests, responses, and errors.
 * 
 */
export class AbstractApi {

    private _requestId: any;
    private _endPoint: string = "";
    private _apiVersion: string = "";
    private _urlRequest: string = "";
    private _apiRequest: string = "";

    /**
    * Initializes a new instance of the `AbstractApi` class.
    * 
    * @param endPoint - The base URL of the API endpoint.
    * @param apiVersion - The version of the API to use.
    */
    constructor(endPoint: string, apiVersion: string) {
        this._endPoint = endPoint;
        this._apiVersion = apiVersion;
        this._urlRequest = `${this._endPoint}`;
        this._apiRequest = `${this._urlRequest}/${this._apiVersion}`;
    }

    /**
     * Gets the base URL of the API endpoint.
     * 
     * @returns The base URL of the API endpoint.
     */
    get endPoint(): string {
        return this._endPoint;
    }

    /**
    * Gets the API request string.
    * 
    * @returns The API request string.
    */
    public get apiRequest(): string {
        return this._apiRequest;
    }

    /**
     * Logs the request body to a file.
     * 
     * Writes the request body as a JSON string and object to the log file, 
     * along with the request start time.
     */
    private logRequest(url: string, method: string, headers: {}, body: string | object) {
        execBeginTime = new Date();

        if (typeof (body) == "string") {
            logger.http("%s: %s", method, url, { headers: headers, body: body });
        } else {
            logger.http("%s: %s", method, url, { headers: headers, body: JSON.stringify(body) });
        }
    }

    /**
     * Logs the response body to a file after a request has been made.
     * 
     * Writes the response body as a JSON string and object to the log file,
     * along with the request end time and duration.
     */
    private logResponse(url: string, response: string) {
        //logger.profile(url);
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
    private logError(url: string, error: any, complement: string) {
        //logger.profile(url);
        logger.error(error);
        logger.verbose(complement);
    }

    /**
    * Sends a JSON request to the specified URL using the provided method and data.
    * 
    * @param partialUrl - The partial URL to send the request to. Example: "sendData"
    * @param headers - The headers to include in the request.
    * @param method - The HTTP method to use for the request ("GET" or "POST").
    * @param url - The URL to send the request to.
    * @param data - The data to include in the request body (optional).
    * @returns A Promise that resolves to the response text data or an Error object if the request fails.
    */
    private async fetch(partialUrl: string, method: string, headers: Record<string, string>, data: any): Promise<string | {} | Error> {
        const url: string = `${this._apiRequest}${partialUrl.length > 0 ? "/" + partialUrl : ""}`;
        //logger.profile(`${url}-${this._requestId++}`);
        logger.http(url, { method, headers, data });
        this.logRequest(url, method, headers, data);

        let result: any;

        try {
            let resp: Response = await fetch(url, {
                method: method,
                body: typeof (data) == "string" ? data : JSON.stringify(data),
                headers: headers
            });

            const bodyResp: string = await resp.text();

            if (!resp.ok) {
                let statusText = "";

                if (resp.status === 502) { //bad gateway
                    const pos_s: number = bodyResp.indexOf("<h2>");
                    const pos_e: number = bodyResp.indexOf("</h2>");

                    statusText = "\n" + bodyResp.substring(pos_s + 4, pos_e).replace(/<p>/g, " ");
                } else {
                    this.logError(url, resp.statusText, resp.statusText);
                }

                result = new Error();
                result.name = `REQUEST_${method.toUpperCase()}`;
                result.cause = vscode.l10n.t("Error requesting [type: {0}, url: {1}]", method, url);
                result.message = `${resp.status}: ${resp.statusText}${statusText}`;

                if (resp.headers.get("content-type") == "application/json") {
                    const json = JSON.parse(bodyResp);
                    if (json) {
                        if (json.detail) {
                            result.message += `\n ${vscode.l10n.t("Detail: {0}", json.detail)}`;
                        }
                    }
                } else {
                    result.cause += `${result.cause}\n ${vscode.l10n.t("Detail: {0}", bodyResp)}`;

                }
                Error.captureStackTrace(result);
                this.logError(url, result, bodyResp);
            } else {
                this.logResponse(url, bodyResp);
                if (resp.headers.get("content-type")?.startsWith("application/json")) {
                    try {
                        result = JSON.parse(bodyResp);
                    } catch (error) {
                        result = bodyResp.trim();
                    }
                } else {
                    result = bodyResp.trim();
                }
            }
        } catch (error: any) {
            result = new Error();
            result.message = "Unexpected error";
            result.cause = error;
            this.logError(url, error, "");
        }

        //logger.profile(`${url}-${this._requestId++}`);
        return result;
    }

    /**
    * Sends a JSON request to the specified URL using the provided method and data.
    *
    * @param method - The HTTP method to use for the request ("GET" or "POST").
    * @param headers - The headers to include in the request.
    * @param url - The URL to send the request to.
    * @param data - The data to include in the request body (optional).
    * @returns A Promise that resolves to the response JSON data format or an Error if the request fails.
    */
    protected async jsonRequest(method: "GET" | "POST", url: string, headers: Record<string, string>, data: any = undefined): Promise<{} | Error> {
        let result: {} | string | Error;

        headers["accept"] = "application/json";
        headers["Content-Type"] = "application/json"

        result = await this.fetch(url, method, headers, data);

        return Promise.resolve(result);
    }
}