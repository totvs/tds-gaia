import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { PREFIX_DITO, logger } from "../../logger";
import { updateContextKey } from "../../extension";
import { setDitoReady } from "../../config";

export function registerHealth(context: vscode.ExtensionContext, iaApi: IaApiInterface,  chatApi: ChatApi): void {

    /**
         * Registers a health check command that checks the health of the Dito service. 
         * Shows a detailed error message if the health check fails.
         * On success, logs in the user automatically.
        */
    context.subscriptions.push(vscode.commands.registerCommand('tds-dito.health', async (...args) => {
        let detail: boolean = true;
        const messageId = chatApi.dito("Verificando disponibilidade do serviço.");

        return new Promise((resolve, reject) => {
            if (args.length > 0) {
                if (!args[0]) { //solicitando verificação sem  detalhes
                    detail = false;
                }
            }

            iaApi.checkHealth(detail).then((error: any) => {
                updateContextKey("readyForUse", error === undefined);
                setDitoReady(error === undefined);

                if (error !== undefined) {
                    const message: string = `Desculpe, estou com dificuldades técnicas. ${chatApi.commandText("health")}`;
                    chatApi.dito(message, messageId);
                    vscode.window.showErrorMessage(`${PREFIX_DITO} ${message}`);

                    if (error.message.includes("502: Bad Gateway")) {
                        const parts: string = error.message.split("\n");
                        //TODO: Motta
                        chatApi.ditoInfo(parts[1]);
                    }

                    if (detail) {
                        chatApi.ditoInfo(JSON.stringify(error, undefined, 2));
                    }
                } else {
                    vscode.commands.executeCommand("tds-dito.login", true).then(() => {
                        chatApi.checkUser(messageId);
                    });
                }
            })
        });
    }));

}