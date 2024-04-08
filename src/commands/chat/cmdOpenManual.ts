import * as vscode from "vscode";
import { ChatApi } from '../../api/chatApi';
import { logger } from "../../logger";


export function registerOpenManual(context: vscode.ExtensionContext, chatApi: ChatApi): void {

    const openManual = vscode.commands.registerCommand('tds-dito.open-manual', async () => {
        const messageId: string = chatApi.dito("Abrindo manual do **TDS-Dito**.");
        const url: string = "https://github.com/brodao2/tds-dito/blob/main/README.md";

        return vscode.env.openExternal(vscode.Uri.parse(url)).then(() => {
            chatApi.dito("Manual do Dito aberto.", messageId);
        }, (reason) => {
            chatApi.dito("Não foi possível abrir manual do **TDS-Dito**.", messageId);
            logger.error(reason);
        });
    });
    context.subscriptions.push(openManual);

}