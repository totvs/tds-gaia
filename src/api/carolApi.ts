import * as vscode from "vscode";

import { TDitoConfig, getDitoConfiguration, getDitoUser, setDitoUser } from "../config";
import { fetch } from "undici";
import { capitalize } from "../util";
import { CompletionResponse, IaAbstractApi, IaApiInterface } from "./interfaceApi";
import { logger } from "../logger";

export class CarolApi extends IaAbstractApi implements IaApiInterface {

    // prefixo _ indica envolvidas com a API CAROL
    private _token: string = "";
    private _endPoint: string = getDitoConfiguration().endPoint;
    private _apiVersion: string = getDitoConfiguration().apiVersion;
    private _urlRequest: string = `${this._endPoint}`;
    private _apiRequest: string = `${this._urlRequest}/api/${this._apiVersion}`;

    async start(token: string): Promise<boolean> {
        this._token = token;

        logger.info(`Extension is using [${this._urlRequest}]`);

        return Promise.resolve(await this.checkHealth() === undefined)
    }

    async checkHealth(): Promise<Error | undefined> {
        let result: any = undefined
        logger.info("Getting health check...");

        let resp: any = {};
        try {
            resp = await fetch(`${this._apiRequest}/health_check`, {
                method: "GET"
            });

            if (!resp.ok) {
                result = new Error("Error getting health check");
                result.name = "Error getting health check";
                result.message = resp.statusText;
                result.cause = resp.statusText;
                Error.captureStackTrace(result);
            } else {
                const bodyResp: string = await resp.text();
                this.logResponse(bodyResp);

                if (bodyResp !== "Server is on") {
                    result = new Error("Error getting health check");
                    result.name = "Error getting health check";
                    result.message = bodyResp;
                    result.cause = resp.statusText;
                    Error.captureStackTrace(result);
                }
            }
        } catch (error: any) {
            result = error;
        }

        result = undefined
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
        this.logRequest({ calledBy: "_generateCode", params: text });
        logger.info("Generating code...");

        return [""]
    }

    async getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse> {
        const config: TDitoConfig = getDitoConfiguration();
        const startTime = new Date().getMilliseconds();
        logger.info("Code completions...");

        const headers: {} = {
            "authorization": `Bearer ${this._token}`,
            "content-type": "application/json",
            "x-use-cache": "false",
            "origin": "https://ui.endpoints.huggingface.co"
        };

        const body: {} = {
            "inputs": `<fim_prefix>${textBeforeCursor}<fim_suffix>${textAfterCursor}<fim_middle>`,
            "parameters": {
                "top_k": config.top_k,
                "top_p": config.top_p,
                "temperature": config.temperature,
                "max_new_tokens": config.maxNewTokens,
                "do_sample": true
            }
        };

        this.logRequest(body);

        let resp: any = {};
        try {
            resp = await fetch(config.endPoint, {
                method: "POST",
                body: JSON.stringify(body),
                headers: headers
            });

        } catch (error: any) {
            this.logError(error);
            logger.error("Catch (Fetch) error: ", error);
            // logger.info(error.message);
            // logger.info(error.cause);
            // logger.info(error.stack);

            resp.ok = false;
        }

        if (!resp.ok) {
            const usarName: string = getDitoUser()!["name"];

            if (resp.status == 502) {
                logger.info(`${usarName}, I'm sorry but I can't answer you at the moment.`);
            } else if (resp.status == 401) {
                logger.info(`${usarName}, I'm sorry but you do not have access privileges. Try login.`);
            } else {
                logger.info(`Fetch response error: Status: ${resp.status}-${resp.statusText}`);
            }

            return { completions: [] };
        }

        const bodyResp: string = await resp.text();
        const json = JSON.parse(bodyResp);
        this.logResponse(json);

        if (!json || json.length === 0) {
            void vscode.window.showInformationMessage("No code found in the stack");
            return { completions: [] };
        }

        const response: CompletionResponse = { completions: [] };
        Object.keys(json).forEach((key: string) => {
            response.completions.push(json[key]);
        });

        const endTime = new Date().getMilliseconds();
        logger.info("Code completions finish " + (endTime - startTime) + " ms");

        return response;
    }

    stop(): Promise<boolean> {

        return this.logout();
    }
}
