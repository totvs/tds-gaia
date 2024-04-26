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

import { TGaiaConfig, getGaiaConfiguration, getGaiaUser, isGaiaLogged, setGaiaUser } from "../config";
import { capitalize } from "../util";
import { Completion, CompletionResponse, AbstractApi, IaApiInterface, InferTypeResponse } from "./interfaceApi";
import { logger } from "../logger";
import { ChatApi } from "./chatApi";

export class LLMApi extends AbstractApi implements IaApiInterface {
    private authorization: string = "";

    /**
     * Constructor for llmApi. class.
     * Initializes the IA API client.
     * 
     */
    constructor() {
        super(`${getGaiaConfiguration().endPoint}/api`, getGaiaConfiguration().apiVersion);
    }

    start(): Promise<boolean> {

        logger.info(vscode.l10n.t("Extension is using [{0}]", this.apiRequest));

        return Promise.resolve(true)
    }

    stop(): Promise<boolean> {

        return this.logout();
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
        headers["X-Auth"] = this.authorization;

        return super.jsonRequest(method, url, headers, data);
    }

    /**
     * Logs in the user and sets the Gaia user information.
     *
     * @returns {Promise<boolean>} A promise that resolves to `true` if the login was successful, or `false` otherwise.
     */
    login(email: string, authorization: string): Promise<boolean> {
        logger.profile("login");
        logger.info(vscode.l10n.t("Logging in..."));
        let result: boolean = false;
        const parts: string[] = email.split("@");

        this.authorization = authorization;
        //obter informações usuário 
        setGaiaUser({
            id: `ID:${this.authorization
                }`,
            email: email,
            name: parts[0],
            fullname: `${capitalize(parts[0])} at ${parts.length > 1 ? capitalize(parts[1]) : "<unknown>"} `,
            displayName: capitalize(parts[0]),
            avatarUrl: "",
            expiration: new Date(2024, 0, 1, 0, 0, 0, 0),
            expiresAt: new Date(2024, 11, 31, 23, 59, 59, 999),
        });

        let message: string = vscode.l10n.t("Logged in as {0}", getGaiaUser()?.displayName || vscode.l10n.t("<unknown>"));
        logger.info(message);

        result = true;
        logger.profile("login");

        return Promise.resolve(result);
    }

    /**
    * Logs out the current user and clears the authentication token.
    * If the user is logged into Gaia, their user session is also cleared.
    *
    * @returns A promise that resolves to `true` when the logout operation is complete.
    */
    logout(): Promise<boolean> {
        logger.profile("logout");
        logger.info(vscode.l10n.t("Logging out..."));
        this.authorization = "";

        if (isGaiaLogged()) {
            setGaiaUser(undefined);
        }

        logger.profile("logout");
        return Promise.resolve(true);
    }

    /**
    * Checks the health of the Carol API service.
    *
    * @param detail - If true, returns more detailed health check information.
    * @returns A promise that resolves to an `Error` object if the health check fails, or `undefined` if the health check is successful.
    */
    async checkHealth(detail: boolean): Promise<Error | undefined> {
        logger.profile("checkHealth");
        let result: any = undefined
        logger.info(vscode.l10n.t("Getting health check..."));

        let resp: any = await this.jsonRequest("GET", "health_check", {});

        if (typeof (resp) === "object" && resp instanceof Error) {
            result = resp
        } else if (resp.message !== "Server is on.") {
            result = new Error(vscode.l10n.t("Server is off-line or unreachable."));
            result.cause = resp;
            Error.captureStackTrace(result);
            logger.error(result);
        } else {
            logger.info(vscode.l10n.t("Gaia IA Service on-line"));
        }

        logger.profile("checkHealth");
        return Promise.resolve(result);
    }

    /**
    * Generates code based on the provided text.
    *
    * @param text - The input text to generate code from.
    * @returns A promise that resolves to an array of generated code strings.
    */
    async generateCode(text: string): Promise<string[]> {
        logger.profile("generateCode");
        logger.profile("generateCode");

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

        const config: TGaiaConfig = getGaiaConfiguration();
        const body: {} = {
            "prefix": textBeforeCursor,
            "suffix": textAfterCursor,
            "parameters": {
                "nb_alternatives": config.maxSuggestions,
                "nb_lines": config.maxLine
            }
        };

        let json: any = await this.jsonRequest("POST", "complete", {}, body);
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

        let response: any | Error = await this.jsonRequest("POST", "explain", {}, JSON.stringify(body));
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

        let json: any = await this.jsonRequest("POST", "infer_type", {}, body);
        let types: any[] = [];

        if (!json || json.length === 0) {
            void vscode.window.showInformationMessage(vscode.l10n.t("No code found in the stack"));
            logger.profile("innerType");
        } else if (json.types) {
            types = json.types;
        }

        logger.debug(vscode.l10n.t("Code infer end with {0} suggestions", types.length));

        logger.profile("innerType");

        return json;
    }
}
