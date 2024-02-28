import * as vscode from "vscode";

import { getDitoUser, isDitoLogged, isDitoReady } from "../config";
import { Queue } from "../queue";
import { TMessageActionModel, TMessageModel } from "../model/messageModel";
import { exit } from "process";

export type TQueueMessages = Queue<TMessageModel>;

const HELP_RE = /^(help)(\s+(\w+))?$/i;
const LOGOUT_RE = /^logout$/i;
const LOGIN_RE = /^login$/i;
const MANUAL_RE = /^manual$/i;
const DETAIL_HEALTH_RE = /^detail$/i;
const CLEAR_RE = /^clear$/i;

const COMMAND_IN_MESSAGE = /\{command:([^\}]*)\}/i;

type TCommand = {
    caption: string;
    command: string;
    regex: RegExp;
    alias?: string[];
    commandId?: string;
    process?: (chat: ChatApi, ...args: any[]) => boolean;
}

const commandsMap: Record<string, TCommand> = {
    "help": {
        caption: "Help",
        command: "help",
        regex: HELP_RE,
        alias: ["h", "?"],
        process: (chat: ChatApi, command: string) => doHelp(chat, command)
    },
    "logout": {
        caption: "Logout",
        command: "logout",
        regex: LOGOUT_RE,
        alias: ["logoff", "exit", "bye"],
        commandId: "tds-dito.logout",
        process: (chat: ChatApi, command: string) => doLogout(chat)
    },
    "login": {
        caption: "Login",
        command: "login",
        regex: LOGIN_RE,
        alias: ["logon", "hy", "hello"],
        commandId: "tds-dito.login",
    },
    "manual": {
        caption: "Manual",
        command: "manual",
        regex: MANUAL_RE,
        alias: ["man", "m"],
        commandId: "tds-dito.open-manual",
    },
    "detail": {
        caption: "Details",
        command: "detail",
        regex: DETAIL_HEALTH_RE,
        alias: ["det", "d"],
        commandId: "tds-dito.detail-health",
    },
    "clear": {
        caption: "Clear",
        command: "clear",
        regex: CLEAR_RE,
        alias: ["c"],
        process: (chat: ChatApi) => doClear(chat)
    }
};

export class ChatApi {
    static getCommandsMap(): Record<string, TCommand> {
        return commandsMap;
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

    async dito(message: string): Promise<void> {

        this.sendMessage({
            messageId: this.messageId++,
            timeStamp: new Date(),
            author: "Dito",
            message: message,
            actions: this.extractActions(message)
        });
    }

    private extractActions(message: string): TMessageActionModel[] {
        let actions: TMessageActionModel[] = [];
        let matches = undefined;

        if (matches = message.match(COMMAND_IN_MESSAGE)) {
            const commandId: string = matches[1];
            const command: TCommand | undefined = this.getCommand(commandId);

            if (command) {
                actions.push({
                    caption: command.caption,
                    command: commandId
                });
            }
        };

        return actions;
    }

    checkUser() {
        if (isDitoReady()) {
            if (!isDitoLogged()) {
                const command: TCommand | undefined = this.getCommand("login");

                this.dito("Estou pronto para ajudá-lo no que for possível!");
                this.dito(`Para começar, preciso conhecer você. Favor identificar-se com o comando ${this.commandText('login')}.`);
            } else {
                this.dito(`Olá, ${getDitoUser()?.displayName}. Estou pronto para ajudá-lo no que for possível!`);
            }
        } else {
            vscode.commands.executeCommand("tds-dito.detail-health");
        }
    }

    user(message: string): void {
        this.beginMessageGroup();

        this.sendMessage({
            messageId: this.messageId++,
            timeStamp: new Date(),
            author: getDitoUser()?.displayName || "Unknown",
            message: message == undefined ? "???" : message,
        });

        this.processMessage(message);

        this.endMessageGroup();
    }

    commandList(): string {
        let commands: string[] = [];
        const command = (command: TCommand) => `${command.command}`;

        commands.push(command(commandsMap["help"]));
        commands.push(command(commandsMap["clear"]));

        if (!isDitoReady()) {
            commands.push(command(commandsMap["details"]));
        } else if (isDitoLogged()) {
            commands.push(command(commandsMap["logout"]));
        } else {
            commands.push(command(commandsMap["login"]));
        }

        return commands.join(", ");
    }

    commandText(_command: string): string {
        const command: TCommand | undefined = this.getCommand(_command);

        if (command) {
            return `'{command:${command.commandId || command.command}}'`;
        }

        return _command;
    }

    private processMessage(message: string) {
        const command: TCommand | undefined = this.getCommand(message);

        if (command) {
            let processResult: boolean = true;

            if (command.process) {
                processResult = command.process(this, message);
            }

            if (processResult && command.commandId) {
                vscode.commands.executeCommand(command.commandId);
            } else {
                //this.dito(`Funcionalidade não implementada. Por favor, entre em contato com o desenvolvedor.`);
            }
        } else {
            this.dito(`Não entendi. Você pode digitar ${this.commandText("help")} para ver os comandos disponíveis.`);
        }
    }

    protected getCommand(_command: string): TCommand | undefined {
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
}

function doHelp(chat: ChatApi, message: string): boolean {
    let matches = undefined;
    let result: boolean = false;

    if (matches = message.match(commandsMap["help"].regex)) {
        if (matches[2]) {
            chat.dito(`AJUDA DO COMANDO ${matches[2]}.`);
        } else {
            chat.dito(`Os comandos disponíveis são: ${chat.commandList()}.`);
            chat.dito(`Para informações mais específicas, digite ${chat.commandText("help")} seguido do comando desejado.`);
            chat.dito(`Se desejar, digite ${chat.commandText("manual")} para abrir uma documentação geral.`);
        }

        result = true;
    }

    return result;
}

function doLogout(chat: ChatApi): boolean {

    chat.dito(`${getDitoUser()?.displayName}, até logo!`);
    chat.dito("Obrigado por usar o Dito!");
    chat.dito("Saindo...");

    return true;
}

function doClear(chat: ChatApi): any {
    chat.dito("Function not implemented.");
}

