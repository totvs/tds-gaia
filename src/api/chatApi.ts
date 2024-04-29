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
import * as path from "path";
import { getGaiaUser, isGaiaFirstUse, isGaiaLogged, isGaiaReady } from "../config";
import { Queue } from "../queue";
import { MessageOperationEnum, TMessageModel } from "../model/messageModel";
import { exit } from "process";

/**
 * Defines the queue message type for chat messages.
 * Includes the message content, sender, and metadata like timestamp.
*/
export type TQueueMessages = Queue<TMessageModel>;

/**
 * Regular expressions to match chat commands.
 * 
 */
const HELP_RE = /^(help)(\s+(\w+))?$/i;
const LOGOUT_RE = /^logout$/i;
const LOGIN_RE = /^login$/i;
const OPEN_MANUAL_RE = /^(open )?manual$/i;
const HEALTH_RE = /^health$/i;
const CLEAR_RE = /^clear$/i;
const EXPLAIN_RE = /^explain\s(source)?$/i;
const EXPLAIN_WORD_RE = /^explain\sword\s(source)?$/i;
const INFER_TYPE_RE = /^infer\s(source)?$/i;
const UPDATE_ALL_TYPE_RE = /^updateAllTypify\s(source)?$/i;
const UPDATE_TYPE_RE = /^updateTypify\s(source)?$/i;

const HINT_1_RE = /^(hint_1)$/i;
const OPEN_QUICK_GUIDE = /^(open )?(quick guide)$/i;

const COMMAND_IN_MESSAGE = /\{command:([^\}]\w+)(\s+\b.*)?\}/i;

/**
 * Defines the shape of command objects used for chat command handling.
 * Includes the command name, regex to match it, an optional ID, 
 * optional caption and aliases, and an optional handler function.
*/
export type TCommand = {
    command: string;
    regex: RegExp;
    commandId: string;
    commandArgs?: {};
    key?: string;
    caption?: string;
    alias?: string[];
    process?: (chat: ChatApi, ...args: any[]) => boolean;
}

/**
 * Defines a map of chat command objects used for handling chat commands.
 * The keys are the primary command names.
 */
const commandsMap: Record<string, TCommand> = {
    "help": {
        caption: vscode.l10n.t("Help"),
        command: "help",
        regex: HELP_RE,
        alias: ["h", "?"],
        commandId: "tds-gaia.help",
        process: (chat: ChatApi, command: string) => doHelp(chat, command)
    },
    "hint_1": {
        caption: vscode.l10n.t("Hint"),
        command: "hint_1",
        regex: HINT_1_RE,
        commandId: "tds-gaia.showHint?hint=1",
        process: (chat: ChatApi, command: string) => doHelp(chat, "help hint_1")
    },
    "open-quick-guide": {
        caption: vscode.l10n.t("Quick Guide"),
        command: "open-quick-guide",
        regex: OPEN_QUICK_GUIDE,
        commandId: "tds-gaia.external-open",
        commandArgs: {
            target: "README.md#guia-rápido",
            title: vscode.l10n.t("Quick Guide")
        }
    },
    "logout": {
        command: "logout",
        regex: LOGOUT_RE,
        alias: ["logoff", "exit", "bye"],
        commandId: "tds-gaia.logout",
        process: (chat: ChatApi, command: string) => doLogout(chat)
    },
    "login": {
        command: "login",
        regex: LOGIN_RE,
        alias: ["logon", "hy", "hello"],
        commandId: "tds-gaia.login",
    },
    "open-manual": {
        command: "open-manual",
        regex: OPEN_MANUAL_RE,
        alias: ["man", "m"],
        commandId: "tds-gaia.external-open",
        commandArgs: {
            target: "README.md",
            title: vscode.l10n.t("Manual")
        }
    },
    "health": {
        command: "health",
        regex: HEALTH_RE,
        alias: ["det", "d"],
        commandId: "tds-gaia.health",
    },
    "clear": {
        caption: vscode.l10n.t("Clear"),
        command: "clear",
        regex: CLEAR_RE,
        alias: ["c"],
        commandId: "tds-gaia.clear",
        process: (chat: ChatApi) => true
    },
    "explain": {
        command: "explain",
        regex: EXPLAIN_RE,
        alias: ["ex", "e"],
        commandId: "tds-gaia.explain",
    },
    "explain-world": {
        command: "explain-word",
        regex: EXPLAIN_WORD_RE,
        alias: ["ew"],
        commandId: "tds-gaia.explain-word",
    },
    "infer": {
        command: "infer",
        regex: INFER_TYPE_RE,
        alias: ["ty", "t"],
        commandId: "tds-gaia.infer",
    },
    "updateTypeAll": {
        //caption: vscode.l10n.t("Update All Typified Variables"),
        command: "update",
        regex: UPDATE_TYPE_RE,
        commandId: "tds-gaia.updateTypifyAll",
    },
    "updateType": {
        //caption: vscode.l10n.t("Update Typified Variables"),
        command: "update",
        regex: UPDATE_TYPE_RE,
        commandId: "tds-gaia.updateTypify",
    },
    "generateCode": {
        //caption: vscode.l10n.t("Generate Code"),
        command: "generate",
        regex: UPDATE_TYPE_RE,
        commandId: "tds-gaia.generateCode",
    }
};

/**
* Represents the options for a chat message.
* 
* @property {string} [answeringId] - The ID of the message being answered.
* @property {boolean} [withFeedback] - Whether the message should include feedback.
* @property {boolean} [inProgress] - Whether the message is in progress.
*/
export type TMessageOptions = {
    answeringId?: string;
    canFeedback?: boolean;
    inProgress?: boolean;
    disabledFeedback?: boolean;
}

type TCommandKey = keyof typeof commandsMap;

/**
 * Provides methods for interacting with the chat API. 
 * Allows sending messages, responding to user input, executing commands, etc.
 * Maintains internal state like user login status, message history.
 * Dispatches events for new messages.
 */
export class ChatApi {

    static getCommand(_command: TCommandKey): TCommand | undefined {
        const commandId: TCommandKey = _command;
        let command: TCommand | undefined = commandsMap[commandId];

        if (!command) {
            Object.keys(commandsMap).forEach((key: string) => {
                if (commandsMap[key].commandId === commandId) {
                    command = commandsMap[key];
                    exit;
                }
            });
        }

        return command;
    }

    private queueMessages: TQueueMessages = new Queue<TMessageModel>();
    private messageGroup: boolean = false;
    private messageId: number = 0;

    /**
     * Eventos de notificação
     */
    private _onMessage = new vscode.EventEmitter<TQueueMessages>(); //novas mensagens

    /**
     * Subscrição para eventos de notificação
     */
    get onMessage(): vscode.Event<TQueueMessages> {
        return this._onMessage.event;
    }

    beginMessageGroup(): void {
        this.messageGroup = true;
    }

    endMessageGroup(): void {
        if (this.messageGroup) {
            this.messageGroup = false;
            this._onMessage.fire(this.queueMessages);
        }
    }

    protected sendMessage(message: TMessageModel): void {
        this.queueMessages.enqueue(message);

        if (!this.messageGroup) {
            this._onMessage.fire(this.queueMessages);
        }
    }

    /**
     * Sends a message to the message queue. 
     * 
     * @param message - The message text to send. Can be a string or string array, where each element is a paragraph. 
     * @param answeringId - (Optional) The ID of the message this is answering.
     * @returns The ID of the sent message.
     */
    gaia(message: string | string[], options: TMessageOptions): string {
        let workMessage: string = typeof message == "string"
            ? message
            : message.join("\n\n");

        //Necessário nesse formato para evitar conflitos nos objetos React criados dinamicamente
        const id: string = `FF0000${(this.messageId++).toString(16)}`.substring(-6);

        this.sendMessage({
            operation: MessageOperationEnum.Add,
            messageId: id,
            answering: options.answeringId || "",
            inProcess: (options.answeringId || "") === "",
            timeStamp: new Date(),
            author: "Gaia",
            message: workMessage,
            className: "tds-message-gaia",
            feedback: (options.canFeedback || false),
            disabled: (options.disabledFeedback || false)
        });

        return id;
    }

    /**
    * Updates an existing message in the Gaia chat interface.
    *
    * @param messageId - The unique identifier of the message to update.
    * @param message - The updated message content, either as a single string or an array of strings. If an array, the lines will be joined with a newline.
    * @returns The message ID of the updated message.
    */
    gaiaUpdateMessage(messageId: string, message: string | string[], options: TMessageOptions): string {
        let workMessage: string = typeof message == "string"
            ? message
            : message.join("\n\n");

        this.sendMessage({
            operation: MessageOperationEnum.Update,
            messageId: messageId,
            answering: options.answeringId || "",
            inProcess: false,
            timeStamp: new Date(),
            author: "Gaia",
            message: workMessage,
            className: "tds-message-gaia",
            feedback: options.canFeedback || false,
            disabled: (options.disabledFeedback || false)
        });

        return messageId;
    }

    /**
    * Sends an informational message to the Gaia chat interface.
    *
    * @param message - The informational message to send, either as a single string or an array of strings. If an array, each line will be prefixed with '> '.
    */
    gaiaInfo(message: string | string[]): void {
        let workMessage: string | string[] = typeof message == "string"
            ? message
            : message.map((line: string) => `> ${line}`);

        this.gaia(workMessage, {});
    }

    /**
    * Sends a warning message to the Gaia chat interface.
    *
    * @param message - The warning message to send, either as a single string or an array of strings.
    */
    gaiaWarning(message: string | string[]): void {
        let workMessage: string | string[] = typeof message == "string"
            ? `[WARN] ${message}`
            : message.map((line: string, index: number) => {
                if (index == 0) {
                    return `[WARN] ${line}`;
                }

                return line;
            });

        this.gaia(workMessage, {});
    }

    /**
    * Sends an error message to the Gaia chat interface.
    *
    * @param message - The error message to send, either as a single string or an array of strings.
    */
    gaiaError(message: string | string[]): void {
        let workMessage: string | string[] = typeof message == "string"
            ? `[ERR] ${message}`
            : message.map((line: string, index: number) => {
                if (index == 0) {
                    return `[ERR] ${line}`;
                }

                return line;
            });

        this.gaia(workMessage, {});

    }

    /**
    * Checks the user's login state and provides appropriate responses based on the Gaia system's readiness 
    * and the user's login status.
    *
    * @param answeringId - The ID of the message being answered.
    * @returns Void
    */
    checkUser(answeringId: string) {
        if (isGaiaReady()) {
            if (!isGaiaLogged()) {
                if (isGaiaFirstUse()) {
                    this.gaia([
                        vscode.l10n.t("It seems like this is the first time we've met."),
                        vscode.l10n.t("Want to know how to interact with me? {0}", this.commandText("hint_1"))
                    ], { answeringId: "answeringId" });
                }
                this.gaia([
                    vscode.l10n.t("To start, I need to know you."),
                    vscode.l10n.t("Please, identify yourself with the command {0}.", this.commandText("login"))
                ], { answeringId: "answeringId" });
            } else {
                this.gaia([
                    vscode.l10n.t("Hello, **{0}**.", getGaiaUser()?.displayName || "<unknown>"),
                    vscode.l10n.t("I'm ready to help you in any way possible!"),
                ], { answeringId: "answeringId" });
            }
        } else {
            vscode.commands.executeCommand("tds-gaia.health");
        }
    }

    logout() {
        if (isGaiaLogged()) {
            this.gaia([
                vscode.l10n.t("**{0}**, thank you for working with me!", getGaiaUser()?.displayName || "<unknown>"),
                vscode.l10n.t("See you soon!"),
            ], {});
        }
    }

    /**
    * Sends a message to the chat, optionally echoing it to the user interface.
    *
    * @param message - The message to send.
    * @param echo - If true, the message will be displayed in the user interface.
    */
    user(message: string, echo: boolean): void {
        if (echo) {
            //Necessário nesse formato para evitar conflitos nos objetos React criados dinamicamente
            const id: string = `FF0000${(this.messageId++).toString(16)}`.substring(-6);

            this.beginMessageGroup();

            this.sendMessage({
                operation: MessageOperationEnum.Add,
                messageId: id,
                answering: "",
                inProcess: false,
                timeStamp: new Date(),
                author: getGaiaUser()?.displayName || "<unknown>",
                message: message == undefined ? "???" : message,
                className: "tds-message-user",
                feedback: false,
                disabled: true
            });

            this.processMessage(message);

            this.endMessageGroup();
        } else {
            this.processMessage(message);
        }
    }

    /**
    * Generates a list of formatted command text for various chat commands.
    *
    * The list of commands is generated based on the current state of the Gaia system, 
    * such as whether it is ready and whether the user is logged in.
    *
    * @returns A comma-separated string of formatted command text that can be used to execute the commands.
    */
    commandList(): string {
        let commands: string[] = [];

        commands.push(`${this.commandText("help")}`);
        commands.push(`${this.commandText("open-manual")}`);
        commands.push(`${this.commandText("open-quick-guide")}`);
        commands.push(`${this.commandText("clear")}`);

        if (!isGaiaReady()) {
            commands.push(`${this.commandText("details")}`);
        } else if (isGaiaLogged()) {
            commands.push(`${this.commandText("logout")}`);
            commands.push(`${this.commandText("explain")}`);
            commands.push(`${this.commandText("explain-world")}`);
            commands.push(`${this.commandText("infer")}`);
        } else {
            commands.push(`${this.commandText("login")}`);
        }

        return commands.join(", ");
    }

    /**
    * Generates a formatted command text for a given command key and optional arguments.
    *
    * @param _command - The command key to generate the text for.
    * @param args - Any optional arguments to include in the command text. Use JSON format.
    * @returns A formatted command text that can be used to execute the command.
    * 
    */
    commandText(_command: TCommandKey, args?: {}): string {
        const command: TCommand | undefined = ChatApi.getCommand(_command);

        if (command) {
            args = {
                ...args,
                ...command.commandArgs
            };
            const argsString: string = JSON.stringify(args);
            const encodeArgs: string = argsString.length > 2 ? `?${encodeURI(argsString)}` : "";

            return `[${command.caption}](command:${command.commandId}${encodeArgs})${command.key ? " `" + command.key + "`" : ""} `;
        }

        return _command;
    }

    /**
     * Generates a formatted link to a source code location.
     *
     * @param source - The URI of the source file.
     * @param range - The range within the source file to link to, specified as either a `vscode.Range` or a line number.
     * @returns A formatted link to the specified source code location, or an error message if the workspace folder cannot be found.
     */
    linkToSource(source: vscode.Uri, range: vscode.Range | number): string {
        const workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.getWorkspaceFolder(source);

        if (workspaceFolder !== undefined) {
            let filename: string = path.basename(source.fsPath)
                .replace(workspaceFolder.uri.fsPath, "@")
                .replace(/\\/g, "/");

            let position: string = "";

            if ((range instanceof vscode.Range)) {
                const workRange: vscode.Range = (range as vscode.Range);
                position = `${workRange.start.line + 1}:${workRange.start.character + 1}`;
                position += `-${workRange.end.line + 1}:${workRange.end.character + 1}`;
            } else {
                position = `${(range as number) + 1}`;
            }

            return `[${filename}(${position})](link:${source.fsPath}&${position})`;
        }

        return vscode.l10n.t("Workspace of \`{0}\` not found.", source.fsPath);
    }

    /**
    * Generates a link to a specific range within a source file.
    * 
    * @param source - The URI of the source file.
    * @param range - The range within the source file, specified as either a `vscode.Range` object or a line number.
    * @returns A formatted string representing a link to the specified range in the source file.
    */
    linkToRange(source: vscode.Uri, range: vscode.Range | number): string {
        let position: string = "";

        if ((range instanceof vscode.Range)) {
            const workRange: vscode.Range = (range as vscode.Range);
            position = `${workRange.start.line + 1}:${workRange.start.character + 1}`;
            position += `-${workRange.end.line + 1}:${workRange.end.character + 1}`;
        } else {
            position = `${(range as number) + 1}`;
        }

        return `[(${position})](link:${source.fsPath}&${position})`;
    }

    private processMessage(message: string) {
        const command: TCommand | undefined = ChatApi.getCommand(message);

        if (command) {
            let processResult: boolean = true;

            if (command.process) {
                processResult = command.process(this, message);
            } else {
                vscode.commands.executeCommand(command.commandId);
            }
        } else {
            this.gaia(vscode.l10n.t("I didn't understand. You can type {0} to see available commands.",
                this.commandText("help")), {});
        }
    }

    /**
    * Return NEXT unique message ID for a chat message.
    * The ID is a 6-character hexadecimal string starting with "FF0000".
    * 
    * @returns A next message ID.
    */
    nextMessageId(): string {
        return `FF0000${(this.messageId).toString(16)}`.substring(-6);
    }
}

/**
 * Processes a help command entered by the user. 
 * Checks if a specific command was requested and provides help for it, 
 * otherwise prints the list of available commands.
*/
function doHelp(chat: ChatApi, message: string): boolean {
    let matches = undefined;
    let result: boolean = false;

    if (matches = message.match(commandsMap["help"].regex)) {
        if (matches[2]) {
            if (matches[2].trim() == "hint_1") {
                chat.gaia([
                    vscode.l10n.t("To interact with me, you will use commands that can be triggered by one of these modes:"),
                    vscode.l10n.t("- A shortcut;"),
                    vscode.l10n.t("- By the command panel (`ctrl + shift - p` or` f1`), filtering by \"tds-gaia\";"),
                    vscode.l10n.t("- By a link presented in this chat;"),
                    vscode.l10n.t("- Typing the command in the prompt chat;"),
                    vscode.l10n.t("- Context menu of the chat or source in edition."),
                    vscode.l10n.t("If you are familiar with **VS-Code**, see {0}, if you do not or want more details, see {1} (will open on your default browser).",
                        chat.commandText("open-quick-guide"),
                        chat.commandText("open-manual")),
                ], {});
                chat.gaia([
                    vscode.l10n.t("To know the commands, type `{0}`.", chat.commandText("help")),
                    vscode.l10n.t("If you want to know more about a specific command, type `{0} command`.", chat.commandText("help")),
                ], {});
                chat.gaia([
                    vscode.l10n.t("In some messages of mine, there may be a block of **feedback**."),
                    vscode.l10n.t("I thank you to give your opinion and comment, especially if You think I'm wrong."),
                ], {});
            } else {
                chat.gaia(vscode.l10n.t("Command aid {0}.", matches[2]), {});
            }
        } else {
            chat.gaia([
                vscode.l10n.t("The commands available at the moment are: {0}.", chat.commandList()),
                vscode.l10n.t("If you are familiar with **VS-Code**, see {0}, if you do not or want more details, see {1} (will open on your default browser).",
                    chat.commandText("open-quick-guide"),
                    chat.commandText("open-manual")),
            ], {});
        }

        result = true;
    }

    return result;
}

/**
 * Logs the user out by printing a logout message.
 * 
 * @returns Always returns true after printing the logout message.
 */
function doLogout(chat: ChatApi): boolean {
    chat.logout();
    chat.checkUser("");

    return true;
}

/**
 * Clears the chat history.
 */
// function doClear(chat: ChatApi): any {
//     chat.user("clear", true);
// }
