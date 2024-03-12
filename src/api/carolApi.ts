import * as vscode from "vscode";

import { TDitoConfig, getDitoConfiguration, getDitoUser, setDitoReady, setDitoUser } from "../config";
import { fetch, Response } from "undici";
import { capitalize } from "../util";
import { CompletionResponse, IaAbstractApi, IaApiInterface, TypifyResponse } from "./interfaceApi";
import { PREFIX_DITO, logger } from "../logger";
import { ChatApi } from "./chatApi";
import { updateContextKey } from "../extension";

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
                    result.cause += `${result.cause}\n Detail: ${bodyResp}`;

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
        const config: TDitoConfig = getDitoConfiguration();

        logger.info("Code completions...");
        logger.profile("getCompletions");

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
            void vscode.window.showInformationMessage("No code found in the stack");
            logger.profile("getCompletions");
            return { completions: [] };
        }

        const response: CompletionResponse = { completions: [] };
        for (let index = 0; index < json.completions.length; index++) {
            const lines: string[] = json.completions[index];
            let blockCode: string = "";

            // blockCode += `//\n//\n//bloco ${index}\n//\n//`;
            lines.forEach((line: string) => {
                if (line.length > 0) {
                    blockCode += line + "\n";
                }
            });

            if (blockCode.length > 0) {
                response.completions.push({ generated_text: blockCode });
            }
        }

        logger.debug(`Code completions end with ${response.completions.length} suggestions in ${json.elapsed_time} ms`);
        logger.debug(JSON.stringify(response.completions, undefined, 2));
        logger.profile("getCompletions");

        return response;
    }

    async explainCode(code: string): Promise<string> {
        logger.info("Code explain...");
        logger.profile("explainCode");

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

        //  logger.debug(`Code explain end with ${response.length} size`);
        const explanation: string = response.explanation.trim().replace(/<\|[^\|].*\|>/i, "").trim()
        logger.debug(response);
        logger.profile("explainCode");

        return explanation;
    }

    async typify(code: string): Promise<TypifyResponse> {
        logger.info("Code typify...");
        logger.profile("typify");

        const body: {} = {
            "code": code,
        };

        let json: any = await this.jsonRequest("POST", `${this._apiRequest}/typefy`, body);

        if (!json || json.length === 0) {
            void vscode.window.showInformationMessage("No code found in the stack");
            logger.profile("typify");
            return { types: [] };
        }

        //  logger.debug(`Code explain end with ${response.length} size`);
        logger.debug(json);
        logger.profile("typify");

        return json;
    }

    stop(): Promise<boolean> {

        return this.logout();
    }

    /**
     * Registers commands for the extension.
     * 
     */
    register(context: vscode.ExtensionContext): void {
        //TODO: Para identificação do usuário, implementar usando AuthProvider
        //const authProvider = new AuthProvider(initialConfig)
        //await authProvider.init()

        /**
         * Registers a command with VS Code to prompt the user to login.
         * 
         * Checks if an API token is already stored, and attempts auto-login if so.
         * Otherwise, prompts the user to enter their API token or username. 
         * Validates the login and stores the token if successful.
         * 
         * @param args - First arg is a boolean to skip auto-login if true.
        */
        context.subscriptions.push(vscode.commands.registerCommand('tds-dito.login', async (...args) => {
            let apiToken = await context.secrets.get('apiToken');

            if (apiToken !== undefined) {
                this.start(apiToken).then(async (value: boolean) => {
                    if (await this.login()) {
                        logger.info('Logged in successfully');
                        return;
                    }
                });
            }

            if (args.length > 0) {
                if (args[0]) { //indica que login foi acionado automaticamente
                    return;
                }
            }

            const input = await vscode.window.showInputBox({
                prompt: 'Please enter your API token or @your name):',
                placeHolder: 'Your token goes here ...'
            });
            if (input !== undefined) {
                if (await this.start(input)) {
                    if (await this.login()) {
                        await context.secrets.store('apiToken', input);
                        vscode.window.showInformationMessage(`${PREFIX_DITO} Logged in successfully`);
                    } else {
                        await context.secrets.delete('apiToken');
                        vscode.window.showErrorMessage(`${PREFIX_DITO} Login failure`);
                    }

                    this.chat.checkUser("");
                }
            }
        }));

        /**
         * Registers a command to log out the user by deleting the stored API token.
         * Logs the user out, deletes the stored API token and shows an informational message.
         */
        context.subscriptions.push(vscode.commands.registerCommand('tds-dito.logout', async (...args) => {
            this.logout();
            await context.secrets.delete('apiToken');
            vscode.window.showInformationMessage(`${PREFIX_DITO} Logged out`);
        }));

        /**
         * Registers a health check command that checks the health of the Dito service. 
         * Shows a detailed error message if the health check fails.
         * On success, logs in the user automatically.
        */
        context.subscriptions.push(vscode.commands.registerCommand('tds-dito.health', async (...args) => {
            let detail: boolean = true;
            const messageId = this.chat.dito("Verificando disponibilidade do serviço.");

            return new Promise((resolve, reject) => {
                if (args.length > 0) {
                    if (!args[0]) { //solicitando verificação sem  detalhes
                        detail = false;
                    }
                }

                this.checkHealth(detail).then((error: any) => {
                    updateContextKey("readyForUse", error === undefined);
                    setDitoReady(error === undefined);

                    if (error !== undefined) {
                        const message: string = `Desculpe, estou com dificuldades técnicas. ${this.chat.commandText("health")}`;
                        this.chat.dito(message, messageId);
                        vscode.window.showErrorMessage(`${PREFIX_DITO} ${message}`);

                        if (error.message.includes("502: Bad Gateway")) {
                            const parts: string = error.message.split("\n");
                            this.chat.ditoInfo(parts[1]);
                        }

                        if (detail) {
                            this.chat.ditoInfo(JSON.stringify(error, undefined, 2));
                        }
                    } else {
                        vscode.commands.executeCommand("tds-dito.login", true).then(() => {
                            this.chat.checkUser(messageId);
                        });
                    }
                })
            });
        }));


        context.subscriptions.push(vscode.commands.registerTextEditorCommand('tds-dito.generate-code', () => {
            const text: string = "Gerar código para varrer um array";
            this.generateCode(text);
        }));

        /**
         * Registers a text editor command to explain the code under the cursor or selection. 
         * Checks if there is an active text editor, gets the current selection or line under cursor, 
         * extracts the code to explain, sends it to the explainCode() method, 
         * and prints the explanation to the chat window.
         */
        context.subscriptions.push(vscode.commands.registerTextEditorCommand('tds-dito.explain', () => {
            const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
            let codeToExplain: string = "";

            if (editor !== undefined) {
                const selection: vscode.Selection = editor.selection;
                let whatExplain: string = "";

                if (selection && !selection.isEmpty) {
                    const selectionRange: vscode.Range = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
                    codeToExplain = editor.document.getText(selectionRange);
                    whatExplain = this.chat.linkToSource(editor.document.uri, selectionRange);

                } else {
                    const curPos: vscode.Position = selection.start;
                    const contentLine: string = editor.document.lineAt(curPos.line).text;

                    whatExplain = this.chat.linkToSource(editor.document.uri, curPos.line);
                    codeToExplain = contentLine.trim();
                }

                if (codeToExplain.length > 0) {
                    const messageId: string = this.chat.dito(
                        `Explicando o código ${whatExplain}`
                    );

                    return this.explainCode(codeToExplain).then((value: string) => {
                        if (getDitoConfiguration().clearBeforeExplain) {
                            this.chat.dito("clear");
                        }
                        this.chat.dito(value, messageId);
                    });
                } else {
                    this.chat.ditoWarning("Não consegui identificar um código para explica-lo.");
                }
            } else {
                this.chat.ditoWarning("Editor corrente não é valido para essa operação.");
            }
        }));

        /**
         * Registers a text editor command to explain the word under the cursor selection. 
         * Gets the current active text editor, then gets the word range at the cursor position. 
         * Sends the word to be explained to the chatbot.
         * Displays the explanation in the chat window.
        */
        context.subscriptions.push(vscode.commands.registerTextEditorCommand('tds-dito.explain-word', () => {
            const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

            if (editor !== undefined) {
                const selection: vscode.Selection = editor.selection;
                const selectionRange: vscode.Range | undefined = editor.document.getWordRangeAtPosition(selection.start);

                if (selectionRange !== undefined) {
                    let wordToExplain: string = editor.document.getText(selectionRange).trim();
                    let whatExplain = this.chat.linkToSource(editor.document.uri, selectionRange);

                    if (wordToExplain.length > 0) {
                        //const workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.getWorkspaceFolder(editor.document.uri);

                        const messageId: string = this.chat.dito(
                            `Explicando palavra ${whatExplain}`
                        );

                        return this.explainCode(wordToExplain).then((value: string) => {
                            if (getDitoConfiguration().clearBeforeExplain) {
                                this.chat.dito("clear");
                            }
                            this.chat.dito(value, messageId);
                        });
                    } else {
                        this.chat.ditoWarning("Não consegui identificar uma palavra para explica-la.");
                    }
                } else {
                    this.chat.ditoWarning("Não consegui identificar uma palavra para explica-la.");
                }
            } else {
                this.chat.ditoWarning("Editor corrente não é valido para essa operação.");
            }
        }));

        /**
         * Registers a command to infer types for a selected function in the active text editor. 
         * Finds the enclosing function based on the cursor position, extracts the function code, and sends it to an API to infer types.
         * Displays the inferred types in the chat window.
        */
        context.subscriptions.push(vscode.commands.registerCommand('tds-dito.typify', async (...args) => {
            const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
            let codeToTypify: string = "";

            if (editor !== undefined) {
                if (getDitoConfiguration().clearBeforeExplain) {
                    this.chat.dito("clear");
                }

                const selection: vscode.Selection = editor.selection;
                const function_re: RegExp = /(function|method(...)class)\s*(\w+)/i
                const curPos: vscode.Position = selection.start;
                let whatExplain: string = "";
                let curLine = curPos.line;
                let startFunction: vscode.Position | undefined = undefined;
                let endFunction: vscode.Position | undefined = undefined;

                //começo da função
                while ((curLine > 0) && (!startFunction)) {
                    const lineStart = new vscode.Position(curLine - 1, 0);
                    const curLineStart = new vscode.Position(lineStart.line, 0);
                    const nextLineStart = new vscode.Position(lineStart.line + 1, 0);
                    const rangeWithFirstCharOfNextLine = new vscode.Range(curLineStart, nextLineStart);
                    const contentWithFirstCharOfNextLine = editor.document.getText(rangeWithFirstCharOfNextLine);

                    if (contentWithFirstCharOfNextLine.match(function_re)) {
                        startFunction = new vscode.Position(curLine, 0);
                    }

                    curLine--;
                }

                curLine = curPos.line;

                while ((curLine < editor.document.lineCount) && (!endFunction)) {
                    const lineStart = new vscode.Position(curLine + 1, 0);
                    const curLineStart = new vscode.Position(lineStart.line, 0);
                    const nextLineStart = new vscode.Position(lineStart.line + 1, 0);
                    const rangeWithFirstCharOfNextLine = new vscode.Range(curLineStart, nextLineStart);
                    const contentWithFirstCharOfNextLine = editor.document.getText(rangeWithFirstCharOfNextLine);
                    const matches = contentWithFirstCharOfNextLine.match(function_re);

                    if (matches) {
                        endFunction = new vscode.Position(curLine, 0);
                    }

                    curLine++;
                }

                if (startFunction) {
                    if (!endFunction) {
                        endFunction = new vscode.Position(editor.document.lineCount - 1, 0);
                    }

                    const rangeForTypify = new vscode.Range(startFunction, endFunction);
                    codeToTypify = editor.document.getText(rangeForTypify);

                    if (codeToTypify.length > 0) {
                        const rangeBlock = new vscode.Range(startFunction, endFunction);

                        whatExplain = this.chat.linkToSource(editor.document.uri, rangeBlock);

                        const messageId: string = this.chat.dito(
                            `Tipificando o código ${whatExplain}`
                        );

                        return this.typify(codeToTypify).then((response: TypifyResponse) => {
                            let text: string[] = [];

                            if (response !== undefined && response.types.length) {
                                for (const varType of response.types) {
                                    text.push(`- **${varType.var}** as **${varType.type}** ${this.chat.commandText("update")}`);
                                }

                                this.chat.dito(text, messageId);
                            }
                        });
                    }
                } else {
                    this.chat.ditoWarning([
                        "Não consegui identificar uma função/método para tipificar.",
                        "Experimente posicionar o cursor em outra linha da implementação."
                    ]);
                }
            } else {
                this.chat.ditoWarning("Editor corrente não é valido para essa operação.");
            }
        }));
    }
}
