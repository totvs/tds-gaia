import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { PREFIX_DITO } from "../../logger";

export function registerLogout(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {

    /**
     * Registers a command to log out the user by deleting the stored API token.
     * Logs the user out, deletes the stored API token and shows an informational message.
    */
    context.subscriptions.push(vscode.commands.registerCommand('tds-dito.logout', async (...args) => {
        chatApi.logout();
        iaApi.logout();

        await context.secrets.delete('apiToken');

        vscode.window.showInformationMessage(vscode.l10n.t("{0} Logged out", PREFIX_DITO));
        chatApi.checkUser("");
    }));

}