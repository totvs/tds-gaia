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
import { getDitoUser, isDitoFirstUse, isDitoLogged, isDitoReady } from "../config";
import { Queue } from "../queue";
import { TMessageActionModel, TMessageModel } from "../model/messageModel";
import { exit } from "process";
import { logger } from "../logger";

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
const MANUAL_RE = /^manual$/i;
const HEALTH_RE = /^health$/i;
const CLEAR_RE = /^clear$/i;
const EXPLAIN_RE = /^explain\s(source)?$/i;
const EXPLAIN_WORD_RE = /^explain\sword\s(source)?$/i;
const TYPIFY_RE = /^typify\s(source)?$/i;
const UPDATE_RE = /^updatetypify\s(source)?$/i;

const HINT_1_RE = /^(hint_1)$/i;
const HINT_2_RE = /^(hint_2)$/i;

const COMMAND_IN_MESSAGE = /\{command:([^\}]\w+)(\s+\b.*)?\}/i;

/**
 * Defines the shape of command objects used for chat command handling.
 * Includes the command name, regex to match it, an optional ID, 
 * optional caption and aliases, and an optional handler function.
*/
export type TCommand = {
    command: string;
    regex: RegExp;
    commandId?: string;
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
        process: (chat: ChatApi, command: string) => doHelp(chat, command)
    },
    "hint_1": {
        caption: vscode.l10n.t("Hint"),
        command: "hint_1",
        regex: HINT_1_RE,
        process: (chat: ChatApi, command: string) => doHelp(chat, "help hint_1")
    },
    "hint_2": {
        caption: vscode.l10n.t("Quick Guide"),
        command: "hint_2",
        regex: HINT_2_RE,
        process: (chat: ChatApi, command: string) => doHelp(chat, "help hint_2")
    },
    "logout": {
        command: "logout",
        regex: LOGOUT_RE,
        alias: ["logoff", "exit", "bye"],
        commandId: "tds-dito.logout",
        process: (chat: ChatApi, command: string) => doLogout(chat)
    },
    "login": {
        command: "login",
        regex: LOGIN_RE,
        alias: ["logon", "hy", "hello"],
        commandId: "tds-dito.login",
    },
    "manual": {
        command: "manual",
        regex: MANUAL_RE,
        alias: ["man", "m"],
        commandId: "tds-dito.open-manual",
    },
    "health": {
        command: "health",
        regex: HEALTH_RE,
        alias: ["det", "d"],
        commandId: "tds-dito.health",
    },
    "clear": {
        caption: vscode.l10n.t("Clear"),
        command: "clear",
        regex: CLEAR_RE,
        alias: ["c"],
        //process: (chat: ChatApi) => doClear(chat)
    },
    "explain": {
        command: "explain",
        regex: EXPLAIN_RE,
        alias: ["ex", "e"],
        commandId: "tds-dito.explain",
    },
    "explain-world": {
        command: "explain-word",
        regex: EXPLAIN_WORD_RE,
        alias: ["ew"],
        commandId: "tds-dito.explain-word",
    },
    "typify": {
        command: "typify",
        regex: TYPIFY_RE,
        alias: ["ty", "t"],
        commandId: "tds-dito.typify",
    },
    "update": {
        caption: vscode.l10n.t("Update Typified Variables"),
        command: "update",
        regex: UPDATE_RE,
        commandId: "tds-dito.updateTypify",
    }
};

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
        if (!message.actions || message.actions.length == 0) {
            message.actions = this.extractActions(message.message)
        }

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
    dito(message: string | string[], answeringId: string | undefined = undefined): string {
        let workMessage: string = typeof message == "string"
            ? message
            : message.join("\n\n");

        //Necessário nesse formato para evitar conflitos nos objetos React criados dinamicamente
        const id: string = `FF0000${(this.messageId++).toString(16)}`.substring(-6);

        this.sendMessage({
            messageId: id,
            answering: answeringId || "",
            inProcess: (answeringId === undefined),
            timeStamp: new Date(),
            author: "Dito",
            message: workMessage
        });

        return id;
    }

    ditoInfo(message: string | string[]): void {
        let workMessage: string | string[] = typeof message == "string"
            ? message
            : message.map((line: string) => `> ${line}`);

        this.dito(workMessage, "");
    }

    ditoWarning(message: string | string[]): void {
        let workMessage: string | string[] = typeof message == "string"
            ? `[WARN] ${message}`
            : message.map((line: string, index: number) => {
                if (index == 0) {
                    return `[WARN] ${line}`;
                }

                return line;
            });

        this.dito(workMessage, "");
    }

    private extractActions(message: string): TMessageActionModel[] {
        let actions: TMessageActionModel[] = [];
        let matches = undefined;
        let workMessage: string = message;

        while (matches = workMessage.match(COMMAND_IN_MESSAGE)) {
            const commandId: string = matches[1];
            const command: TCommand | undefined = ChatApi.getCommand(commandId);

            if (command) {
                actions.push({
                    caption: command.caption || vscode.l10n.t("<No caption> {0}", command.command),
                    command: commandId
                });
            }

            workMessage = workMessage.replace(commandId, "");
        };

        return actions;
    }

    checkUser(answeringId: string) {
        if (isDitoReady()) {
            if (!isDitoLogged()) {
                if (isDitoFirstUse()) {
                    this.dito([
                        vscode.l10n.t("It seems like this is the first time we've met."),
                        vscode.l10n.t("Want to know how to interact with me? {0}", this.commandText("hint_1"))
                    ], answeringId);
                }
                this.dito([
                    vscode.l10n.t("To start, I need to know you."),
                    vscode.l10n.t("Please, identify yourself with the command {0}", this.commandText("login"))
                ], answeringId);
            } else {
                this.dito([
                    vscode.l10n.t("Hello, **{0}**.", getDitoUser()?.displayName || "<unknown>"),
                    vscode.l10n.t("I'm ready to help you in any way possible!"),
                ], answeringId);
            }
        } else {
            vscode.commands.executeCommand("tds-dito.health");
        }
    }

    logout() {
        this.dito([
            vscode.l10n.t("**{0}**, thank you for working with me!", getDitoUser()?.displayName || "<unknown>"),
            vscode.l10n.t("See you soon!"),
        ], "");
    }

    user(message: string, echo: boolean): void {
        if (echo) {
            //Necessário nesse formato para evitar conflitos nos objetos React criados dinamicamente
            const id: string = `FF0000${(this.messageId++).toString(16)}`.substring(-6);

            this.beginMessageGroup();

            this.sendMessage({
                messageId: id,
                answering: "",
                inProcess: false,
                timeStamp: new Date(),
                author: getDitoUser()?.displayName || "<unknown>",
                message: message == undefined ? "???" : message,
            });

            this.processMessage(message);

            this.endMessageGroup();
        } else {
            this.processMessage(message);
        }
    }

    commandList(): string {
        let commands: string[] = [];

        commands.push(`${this.commandText("help")}`);
        commands.push(`${this.commandText("manual")}`);
        commands.push(`${this.commandText("clear")}`);

        if (!isDitoReady()) {
            commands.push(`${this.commandText("details")}`);
        } else if (isDitoLogged()) {
            commands.push(`${this.commandText("logout")}`);
            commands.push(`${this.commandText("explain")}`);
            commands.push(`${this.commandText("explain-world")}`);
            commands.push(`${this.commandText("typify")}`);
        } else {
            commands.push(`${this.commandText("login")}`);
        }

        return commands.join(", ");
    }

    commandText(_command: TCommandKey, ...args: string[]): string {
        const command: TCommand | undefined = ChatApi.getCommand(_command);

        if (command) {
            return `[${command.caption}](command:${command.command}${args.length > 0 ? `&${args.join(";")}` : ""})${command.key ? " `" + command.key + "`" : ""} `;
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

    private processMessage(message: string) {
        const command: TCommand | undefined = ChatApi.getCommand(message);

        if (command) {
            let processResult: boolean = true;

            if (command.process) {
                processResult = command.process(this, message);
            }

            if (processResult && command.commandId) {
                vscode.commands.executeCommand(command.commandId);
            } else {
                //this.dito(`Funcionalidade não implementada.Por favor, entre em contato com o desenvolvedor.`);
            }
        } else {
            this.dito(vscode.l10n.t("I didn't understand. You can type {0} to see available commands.", this.commandText("help")), "");
        }
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
                chat.dito([
                    vscode.l10n.t("To interact with me, you will use commands that can be triggered by one of these modes:"),
                    vscode.l10n.t("- A shortcut;"),
                    vscode.l10n.t("- By the command panel (`ctrl + shift - p` or` f1`), filtering by \"tds-dito\";"),
                    vscode.l10n.t("- By a link presented in this chat;"),
                    vscode.l10n.t("- Typing the command in the prompt chat;"),
                    vscode.l10n.t("- Context menu of the chat or source in edition."),
                    vscode.l10n.t("If you are familiar with **VS-Code**, see {0}, if you do not or want more details, {1} (will open on your default browser).", chat.commandText("hint_2"), chat.commandText("manual")),
                    vscode.l10n.t("To know the commands, type `{0}` or `{0} command`.", chat.commandText("help"))
                ], "");
            } else if (matches[2].trim() == "hint_2") {
                const messageId: string = chat.dito(vscode.l10n.t("Opening Quick Guide from **TDS-Dito**."));

                vscode.commands.executeCommand("tds-dito.open-manual", "README.md#guia-r%C3%A1pido", vscode.l10n.t("Quick Guide"), messageId);
            } else {
                chat.dito(vscode.l10n.t("Command aid {0}.", matches[2]));
            }
        } else {
            chat.dito([
                vscode.l10n.t("The commands available at the moment are: {0}.", chat.commandList()),
                vscode.l10n.t("If you are familiar with **VS-Code**, see {0}, if you do not or want more details, {1} (will open on your default browser).", chat.commandText("hint_2"), chat.commandText("manual")),
            ], "");
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
