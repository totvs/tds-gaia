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
        caption: "Help",
        command: "help",
        regex: HELP_RE,
        alias: ["h", "?"],
        process: (chat: ChatApi, command: string) => doHelp(chat, command)
    },
    "hint_1": {
        caption: "Dica",
        command: "hint_1",
        regex: HINT_1_RE,
        process: (chat: ChatApi, command: string) => doHelp(chat, "help hint_1")
    },
    "hint_2": {
        caption: "Guia rápido",
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
        caption: "Clear",
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
        caption: "Update typified Variables",
        command: "update",
        regex: UPDATE_RE,
        commandId: "tds-dito.updateTypify",
    }
};

/**
 * Provides methods for interacting with the chat API. 
 * Allows sending messages, responding to user input, executing commands, etc.
 * Maintains internal state like user login status, message history.
 * Dispatches events for new messages.
 */
export class ChatApi {
    static getCommand(_command: string): TCommand | undefined {
        const commandId: string = _command.toLowerCase();
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

    register(context: vscode.ExtensionContext) {
        //Os registros de comandos devem ficar em uma estrutura propria.
        //Seguir o exemplo da pasta src/commands/chat
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
     * @param message - The message text to send. Can be a string or string array. 
     * @param answeringId - (Optional) The ID of the message this is answering.
     * @returns The ID of the sent message.
     */
    dito(message: string | string[], answeringId: string | undefined = undefined): string {
        let workMessage: string = typeof message == "string"
            ? message
            : message.join("\n");

        //Necessário nesse formato para evitar conflitos nos objetos React criados dinamicamente
        const id: string = `FF0000${(this.messageId++).toString(16)}`.substring(-6);

        this.sendMessage({
            id: id,
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
                    caption: command.caption || `< No caption > ${command.command} `,
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
                        "Parece que é a primeira vez que nos encontramos.\n",
                        `Quer saber como interagir comigo? ${this.commandText("hint_1")} `
                    ], answeringId);
                }
                this.dito([
                    "Para começar, preciso conhecer você.\n",
                    `Favor identificar-se com o comando ${this.commandText('login')}.`
                ],
                    answeringId);
            } else {
                this.dito(
                    `Olá, ** ${getDitoUser()?.displayName}**.\n\n` +
                    `Estou pronto para ajudá-lo no que for possível!`
                    , answeringId);
            }
        } else {
            vscode.commands.executeCommand("tds-dito.health");
        }
    }

    logout() {
        this.dito([
            `** ${getDitoUser()?.displayName}**, obrigado por trabalhar comigo!\n`,
            "Até logo!",
        ], "");
    }

    user(message: string, echo: boolean): void {
        if (echo) {
            //Necessário nesse formato para evitar conflitos nos objetos React criados dinamicamente
            const id: string = `FF0000${(this.messageId++).toString(16)}`.substring(-6);

            this.beginMessageGroup();

            this.sendMessage({
                id: id,
                answering: "",
                inProcess: false,
                timeStamp: new Date(),
                author: getDitoUser()?.displayName || "<Not Logged>",
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
            commands.push(`${this.commandText("explain-word")}`);
            commands.push(`${this.commandText("typify")}`);
        } else {
            commands.push(`${this.commandText("login")}`);
        }

        return commands.join(", ");
    }

    commandText(_command: string, ...args: string[]): string {
        const command: TCommand | undefined = ChatApi.getCommand(_command);

        if (command) {
            return `[${command.caption}](command:${command.command}${args.length > 0 ? `&${args.join(";")}` : ""})${command.key ? " `" + command.key + "`" : ""} `;
        }

        return _command;
    }

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

        return `Workspace of \`${source.fsPath}\` not found.`;
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
            this.dito(`Não entendi.Você pode digitar ${this.commandText("help")} para ver os comandos disponíveis.`, "");
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
                    "Para interagir comigo, você usará comandos que podem ser acionados por um desses modos:",
                    "- Um atalho;",
                    "- Pelo painel de comandos(`Ctrl + Shit - P` ou `F1`), filtrando por \"TDS-Dito\";",
                    "- Por uma ligação apresentada nesse bate-papo;",
                    "- Digitando o comando no prompt abaixo;",
                    "- Menu de contexto do bate-papo ou fonte em edição.",
                    `Se você possui familiaridade com o ** VS - Code **, veja o ${chat.commandText("hint_2")}, caso não ou queira mais detalhes, a ${chat.commandText("manual")} (será aberto no seu navegador padrão).`,
                    `Para saber os comandos, digite ${chat.commandText("help")}.`
                ], "");
            } else if (matches[2].trim() == "hint_2") {
                const messageId: string = chat.dito("Abrindo manual rápido do **TDS-Dito**.");
                const url: string = "https://github.com/brodao2/tds-dito/blob/main/README.md#guia-ultra-r%C3%A1pido";

                vscode.env.openExternal(vscode.Uri.parse(url)).then(() => {
                    chat.dito("Manual do Dito aberto.", messageId);
                }, (reason) => {
                    chat.dito("Não foi possível abrir manual rápido do **TDS-Dito**.", messageId);
                    logger.error(reason);
                });
            } else {
                chat.dito(`AJUDA DO COMANDO ${matches[2]}.`);
            }
        } else {
            chat.dito([
                `Os comandos disponíveis, no momento, são: ${chat.commandList()}.`,
                `Se você possui familiaridade com o ** VS - Code **, veja o ${chat.commandText("hint_2")}, caso não ou queira mais detalhes, leia o ${chat.commandText("manual")} (será aberto no seu navegador padrão).`
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
