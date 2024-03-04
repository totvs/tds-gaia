import * as vscode from "vscode";

import { getDitoUser, isDitoFirstUse, isDitoLogged, isDitoReady } from "../config";
import { Queue } from "../queue";
import { TMessageActionModel, TMessageModel } from "../model/messageModel";
import { exit } from "process";

export type TQueueMessages = Queue<TMessageModel>;

const HELP_RE = /^(help)(\s+(\w+))?$/i;
const LOGOUT_RE = /^logout$/i;
const LOGIN_RE = /^login$/i;
const MANUAL_RE = /^manual$/i;
const HEALTH_RE = /^health$/i;
const CLEAR_RE = /^clear$/i;
const EXPLAIN_RE = /^explain\s(source)?$/i;
const typify_RE = /^typify\s(source)?$/i;

const HINT_1_RE = /^(hint_1)$/i;
const HINT_2_RE = /^(hint_2)$/i;

const COMMAND_IN_MESSAGE = /\{command:([^\}]\w+)(\s+\b.*)?\}/i;

type TCommand = {
    command: string;
    regex: RegExp;
    commandId?: string;
    key?: string;
    caption?: string;
    alias?: string[];
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
        process: (chat: ChatApi) => doClear(chat)
    },
    "explain": {
        command: "explain",
        regex: EXPLAIN_RE,
        alias: ["ex", "e"],
        commandId: "tds-dito.explain",
    },
    "typify": {
        command: "typify",
        regex: typify_RE,
        alias: ["ty", "t"],
        commandId: "tds-dito.typify",
    }
};

export function completeCommandsMap(extension: vscode.Extension<any>) {
    const commands: any = extension.packageJSON.contributes.commands;
    const keybindings: any = extension.packageJSON.contributes.keybindings;

    Object.keys(commands).forEach((key: string) => {
        const command: TCommand | undefined = ChatApi.getCommand(commands[key].command);

        if (command) {
            command.caption = command.caption || commands[key].shortTitle || commands[key].title;

            Object.keys(keybindings).forEach((key2: string) => {
                if (keybindings[key2].command == command.commandId) {
                    command.key = keybindings[key2].key;
                }
            });
        }
    });
}

export class ChatApi {
    // static getCommandsMap(): Record<string, TCommand> {
    //     return commandsMap;
    // }

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

    async dito(message: string | string[]): Promise<void> {

        if (typeof message == "string") {
            this.sendMessage({
                inProcess: true,
                messageId: this.messageId++,
                timeStamp: new Date(),
                author: "Dito",
                message: message,
                actions: this.extractActions(message)
            });
        } else {
            let workMessage: string = "";
            message.forEach((m: string) => {
                workMessage += `\n${m}`;
            });
            this.sendMessage({
                inProcess: true,
                messageId: this.messageId++,
                timeStamp: new Date(),
                author: "Dito",
                message: workMessage,
                actions: this.extractActions(workMessage)
            });
        }
    }

    async ditoInfo(message: string): Promise<void> {

        this.sendMessage({
            inProcess: true,
            messageId: this.messageId++,
            timeStamp: new Date(),
            author: "Dito (info)",
            message: message,
            actions: this.extractActions(message)
        });
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
                    caption: command.caption || `<No caption>${command.command}`,
                    command: commandId
                });
            }

            workMessage = workMessage.replace(commandId, "");
        };

        return actions;
    }

    checkUser() {
        if (isDitoReady()) {
            if (!isDitoLogged()) {
                if (isDitoFirstUse()) {
                    this.dito(`Parece que é a primeira vez que nos encontramos. Quer saber como interagir comigo? ${this.commandText("hint_1")}`);
                }
                this.dito(`Para começar, preciso conhecer você. Favor identificar-se com o comando ${this.commandText('login')}.`);
            } else {
                this.dito(`Olá, ${getDitoUser()?.displayName}. Estou pronto para ajudá-lo no que for possível!`);
            }
        } else {
            vscode.commands.executeCommand("tds-dito.health");
        }
    }

    user(message: string, echo: boolean): void {
        if (echo) {
            this.beginMessageGroup();

            this.sendMessage({
                inProcess: false,
                messageId: this.messageId++,
                timeStamp: new Date(),
                author: getDitoUser()?.displayName || "Unknown",
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
            commands.push(`${this.commandText("typify")}`);
        } else {
            commands.push(`${this.commandText("login")}`);
        }

        return commands.join(", ");
    }

    commandText(_command: string, ...args: string[]): string {
        const command: TCommand | undefined = ChatApi.getCommand(_command);

        if (command) {
            return `[${command.caption}](command:${command.command}${args.length > 0 ? `&${args.join(";")}` : ""})${command.key ? " `" + command.key + "`" : ""}`;
        }

        return _command;
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
                //this.dito(`Funcionalidade não implementada. Por favor, entre em contato com o desenvolvedor.`);
            }
        } else {
            this.dito(`Não entendi. Você pode digitar ${this.commandText("help")} para ver os comandos disponíveis.`);
        }
    }
}

function doHelp(chat: ChatApi, message: string): boolean {
    let matches = undefined;
    let result: boolean = false;

    if (matches = message.match(commandsMap["help"].regex)) {
        if (matches[2]) {
            if (matches[2].trim() == "hint_1") {
                chat.dito([
                    "Para interagir comigo, você usará comandos que podem ser acionados por um desses modos:",
                    "- Um atalho;",
                    "- Pelo painel de comandos(`Ctrl+Shit-P` ou `F1`), filtrando por \"TDS-Dito\";",
                    "- Por uma ligação apresentada nesse bate-papo;",
                    "- Digitando o comando no prompt abaixo;",
                    "- Menu de contexto do bate-papo ou fonte em edição.",
                    `Se você possui familiaridade com o **VS-Code**, veja o ${chat.commandText("hint_2")}, caso não ou queira mais detalhes, a ${chat.commandText("manual")} (será aberto no seu navegador padrão).`,
                    `Para saber os comandos, digite ${chat.commandText("help")}.`
                ]);
            } else if (matches[2].trim() == "hint_2") {
                const url: string = "https://github.com/brodao2/tds-dito/blob/main/README.md#guia-ultra-r%C3%A1pido";
                vscode.env.openExternal(vscode.Uri.parse(url));
            } else {
                chat.dito(`AJUDA DO COMANDO ${matches[2]}.`);
            }
        } else {
            chat.dito(`Os comandos disponíveis, no momento, são: ${chat.commandList()}.`);
            chat.dito(`Se você possui familiaridade com o **VS-Code**, veja o ${chat.commandText("hint_2")}, caso não ou queira mais detalhes, leia o ${chat.commandText("manual")} (será aberto no seu navegador padrão).`);
        }

        result = true;
    }

    return result;
}

function doLogout(chat: ChatApi): boolean {
    chat.beginMessageGroup();

    chat.dito(`${getDitoUser()?.displayName}, até logo!`);
    chat.dito("Obrigado por usar o Dito!");
    chat.dito("Saindo...");

    chat.endMessageGroup();

    return true;
}

function doClear(chat: ChatApi): any {
    //chat.dito("@clear");
}

