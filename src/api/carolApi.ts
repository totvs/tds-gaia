import * as vscode from "vscode";

import { TDitoConfig, getDitoConfiguration, getDitoUser, setDitoUser } from "../config";
import { fetch, Response } from "undici";
import { capitalize } from "../util";
import { CompletionResponse, IaAbstractApi, IaApiInterface } from "./interfaceApi";
import { logger } from "../logger";

export class CarolApi extends IaAbstractApi implements IaApiInterface {
    // prefixo _ indica envolvidas com a API CAROL
    private _requestId: number = 0;
    private _token: string = "";
    private _endPoint: string = getDitoConfiguration().endPoint;
    private _apiVersion: string = getDitoConfiguration().apiVersion;
    private _urlRequest: string = `${this._endPoint}`;
    private _apiRequest: string = `${this._urlRequest}/api/${this._apiVersion}`;

    private config: TDitoConfig = getDitoConfiguration();

    async start(token: string): Promise<boolean> {
        this._token = token;

        logger.info(`Extension is using [${this._urlRequest}]`);

        return Promise.resolve(true)
    }

    private async fetch(url: string, method: string, headers: Record<string, string>, data: any): Promise<string | {} | Error> {
        logger.profile(`${url}-${this._requestId++}`);
        logger.http(url, { method, headers, data });

        let result: any;

        try {
            let resp: Response = await fetch(url, {
                method: method,
                body: typeof (data) == "string" ? data : JSON.stringify(data),
                headers: headers
            });

            logger.info(`Status: ${resp.status}`);

            const bodyResp: string = await resp.text();
            if (!resp.ok) {
                let statusText = "";

                if (resp.status === 502) { //bad gateway
                    const pos_s: number = bodyResp.indexOf("<h2>");
                    const pos_e: number = bodyResp.indexOf("</h2>");

                    statusText = "\n" + bodyResp.substring(pos_s + 4, pos_e).replace(/<p>/g, " ");
                }

                result = new Error();
                result.name = `REQUEST_${method.toUpperCase()}`;
                result.cause = "Error requesting [type: " + method + ", url: " + url + " ]";
                result.message = `${resp.status}: ${resp.statusText}${statusText}`;

                if (resp.headers.get("content-type") == "application/json") {
                    const json = JSON.parse(bodyResp);
                    if (json) {
                        if (json.detail) {
                            result.message += `\n Detail: ${json.detail}`;
                        }
                    }
                } else {
                    result.message += `\n Detail: ${bodyResp}`;

                }
                Error.captureStackTrace(result);
                this.logError(url, result, bodyResp);
            } else {
                this.logResponse(url, bodyResp);
                if (resp.headers.get("content-type") == "application/json") {
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

        logger.profile(`${url}-${this._requestId++}`);
        return result;
    }

    private async textRequest(method: "GET" | "POST", url: string, data?: string): Promise<string | Error> {
        logger.debug("textRequest");
        const headers: {} = {};
        //  = {
        //     "accept": "*/*",
        //     "Content-Type": "*/* ; charset=UTF8"
        // };

        let result: Error & { cause?: string } | string;
        this.logRequest(url, method, headers || {}, data || "");

        let resp: any = await this.fetch(url, method, headers, data);
        if (typeof (resp) === "object" && resp instanceof Error) {
            result = resp;
        } else {
            result = resp;
        }

        return Promise.resolve(result);
    }

    private async jsonRequest(method: "GET" | "POST", url: string, data: any = undefined): Promise<{} | Error> {
        const headers: {} = {
            "accept": "application/json",
            "Content-Type": "application/json"
        };
        let result: {} | Error;
        this.logRequest(url, method, headers || {}, data || "");

        const resp: string | {} | Error = await this.fetch(url, method, headers, data);
        result = resp;

        return Promise.resolve(resp);
    }

    async checkHealth(detail: boolean): Promise<Error | undefined> {
        let result: any = undefined
        logger.info("Getting health check...");

        let resp: any = await this.jsonRequest("GET", `${this._apiRequest}/health_check`);

        if (typeof (resp) === "object" && resp instanceof Error) {
            result = resp
        } else if (resp.message !== "Server is on.") {
            result = new Error("Server is off-line or unreachable.");
            result.cause = resp;
            Error.captureStackTrace(result);
            logger.error(result);
        } else {
            logger.info("IA Service on-line");
        }

        return Promise.resolve(result);
    }

    login(): Promise<boolean> {
        logger.info(`Logging in...`);

        let result: boolean = false;

        if (this._token.startsWith("@")) {
            const parts: string[] = this._token.split(" ");

            if (parts[0].length == 0) {
                parts[0] = "@<uninformed>"
            } else {
                parts[0] = parts[0].substring(1);
            }

            setDitoUser({
                id: `ID:${this._token}`,
                email: "",
                name: capitalize(parts[0]),
                fullname: capitalize(`${parts[0]} ${parts[1]}`) || capitalize(parts[0]),
                displayName: capitalize(parts[0]),
                avatarUrl: "",
                expiration: new Date(2024, 0, 1, 0, 0, 0, 0),
                expiresAt: new Date(2024, 11, 31, 23, 59, 59, 999),
            });
        } else {
            setDitoUser({
                id: `$ID:{this._token}`,
                email: "",
                name: capitalize(this._token),
                fullname: capitalize(this._token),
                displayName: capitalize(this._token),
                avatarUrl: "",
                expiration: new Date(2024, 0, 1, 0, 0, 0, 0),
                expiresAt: new Date(2024, 11, 31, 23, 59, 59, 999),
            });
        }

        let message: string = `Logged in as ${getDitoUser()?.displayName}`;
        logger.info(message);

        result = true;

        return Promise.resolve(result);
    }

    logout(): Promise<boolean> {
        logger.info("Logging out...");
        this._token = "";
        setDitoUser(undefined);

        return Promise.resolve(true);
    }

    async generateCode(text: string): Promise<string[]> {
        throw new Error("Method not implemented.");
    }

    async getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse> {
        logger.info("Code completions...");
        logger.profile("getCompletions");

        const body: {} = {
            "prefix": textBeforeCursor,
            "suffix": textAfterCursor,
            "parameters": {
                "nb_alternatives": this.config.maxSuggestions,
                "nb_lines": this.config.maxLine
            }
        };

        let json: any = await this.jsonRequest("POST", `${this._apiRequest}/complete`, body);

        if (!json || json.length === 0) {
            void vscode.window.showInformationMessage("No code found in the stack");
            return { completions: [] };
        }

        const response: CompletionResponse = { completions: [] };
        for (let index = 0; index < json.length; index++) {
            const lines: string[] = json[index];
            let blockCode: string = "";

            // blockCode += `//\n//\n//bloco ${index}\n//\n//`;
            lines.forEach((line: string) => {
                blockCode += line + "\n";
            });

            response.completions.push({ generated_text: blockCode });
        }

        logger.debug(`Code completions end with ${response.completions.length} suggestions`);
        logger.debug(JSON.stringify(response.completions, undefined, 2));

        return response;
    }

    async explainCode(code: string): Promise<string> {
        logger.info("Code explain...");
        logger.profile("explainCode");

        const body: {} = {
            "code": code,
        };

        let response: {} | Error = await this.jsonRequest("POST", `${this._apiRequest}/explain`, JSON.stringify(body));

        if (typeof (response) === "object") {
            return "";
        } else if (!response) {// } || response.length === 0) {
            void vscode.window.showInformationMessage("No explain found");
            return "";
        }

        //  logger.debug(`Code explain end with ${response.length} size`);
        logger.debug(response);

        return JSON.stringify(response);
    }

    stop(): Promise<boolean> {

        return this.logout();
    }
}
