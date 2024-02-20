import * as vscode from "vscode";

import { TDitoConfig, TDitoCustomConfig, getDitoConfiguration, getDitoUser, setDitoUser } from "../config";
import { fetch } from "undici";
import { capitalize } from "../util";
import { CompletionResponse, IaAbstractApi, IaApiInterface } from "./interfaceApi";
import { logger } from "../logger";
import { log } from "console";

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

    private async textRequest(method: "GET" | "POST", url: string, data?: any): Promise<string | Error> {
        let resp: any = {};
        let result: Error & { cause?: string } | undefined;
        this.logRequest(url, data);

        try {
            resp = await fetch(url, {
                method: method,
                body: data,
            });

            if (!resp.ok) {
                result = new Error();
                result.cause = "Error requesting [type: " + method + ", url: " + url + "]";
                result.message = `${resp.status}: ${resp.statusText}`;
                Error.captureStackTrace(result);
                this.logError(result);
                return Promise.resolve(result);

            }
            const bodyResp: string = await resp.text();
            this.logResponse(url, bodyResp);
            resp = bodyResp.trim();
        } catch (error: any) {
            result = new Error();
            result.name = "Error requesting [type: " + method + ", url: " + url + "]";
            result.message = `${resp.statusCode}: ${resp.statusText}`;
            result.cause = error;

            return Promise.resolve(result);
        }

        return Promise.resolve(resp);
    }

    private async jsonRequest(method: "GET" | "POST", url: string, data: any): Promise<{} | Error> {
        let resp: any = this.textRequest(method, url, data);

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
            if (detail) {
                logger.error(`${result.cause}\n ${result.stack}`);
            }
        } if (resp !== "\"Server is on.\"") {
            result = new Error("Error getting health check");
            result.name = "Error getting health check";
            result.message = resp;
            Error.captureStackTrace(result);
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
        logger.info("Code completions...");

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
        Object.keys(json).forEach((key: string) => {
            response.completions.push(json[key]);
        });

        return response;
    }

    stop(): Promise<boolean> {

        return this.logout();
    }
}
