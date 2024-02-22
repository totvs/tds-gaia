import * as vscode from "vscode";

import { TDitoConfig, getDitoConfiguration, getDitoUser, setDitoUser } from "../config";
import { fetch } from "undici";
import { capitalize } from "../util";
import { CompletionResponse, IaAbstractApi, IaApiInterface } from "./interfaceApi";
import { logger } from "../logger";

//import { encode, decode, labels } from 'windows-1252';
//let windows1252 = await import('windows-1252')
const windows1252 = require('windows-1252');

export class CarolApi extends IaAbstractApi implements IaApiInterface {

    // prefixo _ indica envolvidas com a API CAROL
    private _token: string = "";
    private _endPoint: string = getDitoConfiguration().endPoint;
    private _apiVersion: string = getDitoConfiguration().apiVersion;
    private _urlRequest: string = `${this._endPoint}`;
    private _apiRequest: string = `${this._urlRequest}/api/${this._apiVersion}`;

    private config: TDitoConfig = getDitoConfiguration();

    async start(token: string): Promise<boolean> {
        this._token = token;

        logger.info(`Extension is using [${this._urlRequest}]`);

        return Promise.resolve(await this.checkHealth(false) === undefined)
    }

    private async textRequest(method: "GET" | "POST", url: string, data?: string, headers?: {}): Promise<string | Error> {
        logger.profile("textRequest");

        let result: Error & { cause?: string } | string;
        this.logRequest(url, method, headers || {}, data || "");

        let resp: any = {};
        try {
            resp = await fetch(url, {
                method: method,
                body: data,
                headers: headers
            });

            const bodyResp: string = await resp.text();
            if (!resp.ok) {
                result = new Error();
                result.name = `REQUEST_${method.toUpperCase()}`;
                result.cause = "Error requesting [type: " + method + ", url: " + url + " ]";
                result.message = `${resp.status}: ${resp.statusText}`;
                Error.captureStackTrace(result);
                this.logError(url, result, bodyResp);
            } else {
                this.logResponse(url, bodyResp);
            }
            result = bodyResp.trim();
        } catch (error: any) {
            result = new Error();
            result.message = `${resp.statusCode}: ${resp.statusText}`;
            result.cause = error;
            this.logError(url, error, "");
        }

        logger.profile("textRequest");//, { message: typeof (result) == "object" ? "Error" : "OK" });
        return Promise.resolve(result);
    }

    private async jsonRequest(method: "GET" | "POST", url: string, data: any): Promise<{} | Error> {
        const headers: {} = {
            //"authorization": `Bearer ${this._token} `,
            "accept": "application/json",
            "Content-Type": "application/json"
            //"x-use-cache": "false",
            //            "origin": "https://ui.endpoints.huggingface.co"
        };

        let resp: any = await this.textRequest(method, url, JSON.stringify(data), headers);

        if (typeof (resp) === "string") {
            const json = JSON.parse(resp);
            return Promise.resolve(json);
        }

        return Promise.resolve(resp);
    }

    async checkHealth(detail: boolean): Promise<Error | undefined> {
        let result: any = undefined
        logger.info("Getting health check...");

        let resp: string | Error = await this.textRequest("GET", `${this._apiRequest}/health_check`);

        if (typeof (resp) === "object") {
            result = resp
        } if (resp !== "\"Server is on.\"") {
            result = new Error("Server is off-line or not responding.");
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

        setDitoUser({
            id: "XXXXXX",
            email: "xxxxxx@xxxxxxx.xxxx",
            name: capitalize("xxxxx"),
            fullname: capitalize("xxxxxxxxxx da xxxxxxxxxxxx"),
            displayName: capitalize("xxxx"),
            avatarUrl: "",
            expiration: new Date(2024, 0, 1, 0, 0, 0, 0),
            expiresAt: new Date(2024, 11, 31, 23, 59, 59, 999),
        });

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
        //this.logRequest({ calledBy: "_generateCode", params: text });
        logger.error("Generating code... (not implemented");

        return [""]
    }

    async getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse> {
        logger.debug("Code completions...");
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

    stop(): Promise<boolean> {

        return this.logout();
    }
}
