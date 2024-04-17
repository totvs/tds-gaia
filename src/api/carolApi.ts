import * as vscode from "vscode";

import { TDitoConfig, getDitoConfiguration, getDitoUser, setDitoUser } from "../config";
import { fetch, Response } from "undici";
import { capitalize } from "../util";
import { Completion, CompletionResponse, IaAbstractApi, IaApiInterface, InferTypeResponse } from "./interfaceApi";
import { PREFIX_DITO, logger } from "../logger";
import { ChatViewProvider } from "../panels/chatViewProvider";

export class CarolApi extends IaAbstractApi implements IaApiInterface {
    // prefixo _ indica envolvidas com a API CAROL
    private _requestId: number = 0;
    private _token: string = "";
    private _endPoint: string = getDitoConfiguration().endPoint;
    private _apiVersion: string = getDitoConfiguration().apiVersion;
    private _urlRequest: string = `${this._endPoint}`;
    private _apiRequest: string = `${this._urlRequest}/api/${this._apiVersion}`;

    async start(token: string): Promise<boolean> {
        this._token = token;

        logger.info(vscode.l10n.t("Extension is using [{0}]", this._urlRequest));

        return Promise.resolve(true)
    }

    private async fetch(url: string, method: string, headers: Record<string, string>, data: any): Promise<string | {} | Error> {
        logger.profile(`${url}-${this._requestId++}`);
        logger.http(url, { method, headers, data });

        let result: any;
        await vscode.window.withProgress({
            location: { viewId: ChatViewProvider.viewType },
            cancellable: false,
            title: vscode.l10n.t("{0}: requesting data...", PREFIX_DITO)
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                result = new Error();
                result.message = "Cancelled";
            });

            try {
                let resp: Response = await fetch(url, {
                    method: method,
                    body: typeof (data) == "string" ? data : JSON.stringify(data),
                    headers: headers
                });

                logger.info(vscode.l10n.t("Status: {0}", resp.status));

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

            progress.report({ increment: 100 });
        });

        logger.profile(`${url}-${this._requestId++}`);
        return result;
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
        logger.info(vscode.l10n.t("Getting health check..."));

        let resp: any = await this.jsonRequest("GET", `${this._apiRequest}/health_check`);

        if (typeof (resp) === "object" && resp instanceof Error) {
            result = resp
        } else if (resp.message !== "Server is on.") {
            result = new Error(vscode.l10n.t("Server is off-line or unreachable."));
            result.cause = resp;
            Error.captureStackTrace(result);
            logger.error(result);
        } else {
            logger.info(vscode.l10n.t("IA Service on-line"));
        }

        return Promise.resolve(result);
    }

    /**
     * Logs in the user and sets the Dito user information.
     *
     * @returns {Promise<boolean>} A promise that resolves to `true` if the login was successful, or `false` otherwise.
     */
    login(): Promise<boolean> {
        logger.profile("login");
        logger.info(vscode.l10n.t("Logging in..."));

        let result: boolean = false;

        if (this._token.startsWith("@")) {
            const parts: string[] = this._token.split(" ");

            if (parts[0].length == 0) {
                parts[0] = "@<uninformed>";
            } else {
                parts[0] = parts[0].substring(1);
            }
            parts[1] = parts[1] || "";

            setDitoUser({
                id: `ID:${this._token}`,
                email: `${this._token}`,
                name: capitalize(parts[0]),
                fullname: `${capitalize(parts[0])} ${capitalize(parts[1])}`,
                displayName: capitalize(parts[0]),
                avatarUrl: "",
                expiration: new Date(2024, 0, 1, 0, 0, 0, 0),
                expiresAt: new Date(2024, 11, 31, 23, 59, 59, 999),
            });
        } else {
            setDitoUser({
                id: `ID:${this._token}`,
                email: `${this._token}`,
                name: this._token,
                fullname: this._token,
                displayName: this._token,
                avatarUrl: "",
                expiration: new Date(2024, 0, 1, 0, 0, 0, 0),
                expiresAt: new Date(2024, 11, 31, 23, 59, 59, 999),
            });
        }

        let message: string = vscode.l10n.t("Logged in as {0}", getDitoUser()?.displayName || vscode.l10n.t("<unknown>"));
        logger.info(message);

        result = true;
        logger.profile("login");

        return Promise.resolve(result);
    }

    logout(): Promise<boolean> {
        logger.info(vscode.l10n.t("Logging out..."));
        this._token = "";
        setDitoUser(undefined);

        return Promise.resolve(true);
    }

    async generateCode(text: string): Promise<string[]> {
        throw new Error(vscode.l10n.t("Method not implemented."));
    }

    /**
     * Retrieves code completions from the Carol API based on the provided text before and after the cursor.
     *
     * @param textBeforeCursor - The text before the cursor position.
     * @param textAfterCursor - The text after the cursor position.
     * @returns A promise that resolves to a `CompletionResponse` object containing the generated code completions.
     */
    async getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse> {
        logger.profile("getCompletions");
        logger.info(vscode.l10n.t("Code completions..."));

        const config: TDitoConfig = getDitoConfiguration();
        const body: {} = {
            "prefix": textBeforeCursor,
            "suffix": textAfterCursor,
            "parameters": {
                "nb_alternatives": config.maxSuggestions,
                "nb_lines": config.maxLine
            }
        };

        let json: any = await this.jsonRequest("POST", `${this._apiRequest}/complete`, body);
        if (!json || json.length === 0) {
            void vscode.window.showInformationMessage(vscode.l10n.t("No code found in the stack"));
            logger.profile("getCompletions");
            return { completions: [] };
        }

        const response: CompletionResponse = { completions: [] };
        for (let index = 0; index < json.completions.length; index++) {
            const lines: string[] = json.completions[index];
            let blockCode: string = "";

            lines.forEach((line: string) => {
                if (line.length > 0) {
                    blockCode += line + "\n";
                }
            });

            if (blockCode.length > 0) {
                response.completions.push({ generated_text: blockCode });
            }
        }

        logger.debug(vscode.l10n.t("Code completions end with {0} suggestions in {1} ms", response.completions.length, json.elapsed_time));
        logger.debug(JSON.stringify(response.completions, undefined, 2));
        logger.profile("getCompletions");

        return response;
    }

    /**
     * Explains the provided code by sending a request to the API and returning the explanation.
     *
     * @param code - The code to be explained.
     * @returns The explanation of the provided code, or an empty string if an error occurs.
     */
    async explainCode(code: string): Promise<string> {
        logger.profile("explainCode");
        logger.info(vscode.l10n.t("Code explain..."));

        const body: any = {
            "code": code,
        };

        let response: any | Error = await this.jsonRequest("POST", `${this._apiRequest}/explain`, JSON.stringify(body));

        if (typeof (response) === "object" && response instanceof Error) {
            return "";
        } else if (!response) {// } || response.length === 0) {
            logger.profile("explainCode");
            return "";
        }

        logger.debug(vscode.l10n.t("Code explain end with {0} size", response.length));
        logger.debug(response);

        const explanation: string = response.explanation.trim().replace(/<\|[^\|].*\|>/i, "").trim()

        logger.profile("explainCode");
        return explanation;
    }

    /**
     * Analyzes the provided code and infer the variable types.
     *
     * @param code - The code to be infer.
     * @returns A promise that resolves to a `InferTypeResponse` object containing the inferred types.
     */
    async inferType(code: string): Promise<InferTypeResponse> {
        logger.profile("inferType");
        logger.info(vscode.l10n.t("Code typify..."));

        const body: {} = {
            "code": code,
        };

        let json: any = await this.jsonRequest("POST", `${this._apiRequest}/infer_type`, body);

        if (!json || json.length === 0) {
            void vscode.window.showInformationMessage(vscode.l10n.t("No code found in the stack"));
            logger.profile("innerType");
            return { types: [] };
        }

        logger.debug(vscode.l10n.t("Code typify end with {0} size", json.length));
        logger.debug(JSON.stringify(json, undefined, 2));;

        logger.profile("innerType");

        return json;
    }

    stop(): Promise<boolean> {

        return this.logout();
    }

    /**
   * Registers commands for the extension.
   * 
   */
    logCompletionFeedback(completions: { completion: Completion, textBefore: string, textAfter: string }): void {
        logger.profile("logCompletionFeedback");
        logger.debug("Logging completion feedback...");

        if (completions !== undefined) {
            if (completions.completion !== undefined) {
                let generatedText = completions.completion.generated_text;
            }
            let textBefore = completions.textBefore;
            let textAfter = completions.textAfter;
        }

        //Implementar a chamada para a API Rest para enviar feedback quando estiver disponível
        logger.profile("logCompletionFeedback");
    }
}
