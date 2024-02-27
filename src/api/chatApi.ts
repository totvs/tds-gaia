import * as vscode from "vscode";

import { getDitoUser } from "../config";
import { Queue } from "../queue";
import { TMessageModel } from "../model/messageModel";

export type TQueueMessages = Queue<TMessageModel>;

export class ChatApi {
    private queueMessages: TQueueMessages = new Queue<TMessageModel>();
    private messageGroup: boolean = false;

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

    dito(message: string): void {
        this.sendMessage({
            timeStamp: new Date(),
            author: "Dito",
            message: message
        });
    }

    user(message: string): void {
        this.beginMessageGroup();

        this.sendMessage({
            timeStamp: new Date(),
            author: getDitoUser()?.displayName || "Unknown",
            message: message
        });

        this.processMessage(message);

        this.endMessageGroup();
    }

    private processMessage(message: string) {
        if (message.toLowerCase() === "ajuda") {
            this.dito("Os comandos disponíveis são: ajuda, login, logout. Para sair do chat, digite logout.");
            this.dito("Para informações mais específicas, digite ajuda seguido do comando desejado.");
        } else {
            this.dito("Não entendi. Você pode digitar 'ajuda' para ver os comandos disponíveis.");
        }
    }
}
