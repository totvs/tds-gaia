import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { PREFIX_GAIA } from "../../logger";
import { feedback } from "../../extension";
import { getGaiaSession } from "../../authenticationProvider";
import { isGaiaLogged } from "../../config";

export function registerLogout(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {

    /**
     * Registers a command to log out the user by deleting the stored API token.
     * Logs the user out, deletes the stored API token and shows an informational message.
    */
    context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.logout', async (...args) => {
        if (isGaiaLogged()) {
            //await feedback.eventLogout();
            chatApi.logout();
            iaApi.logout();

            vscode.window.showInformationMessage(vscode.l10n.t("{0} Logged out", PREFIX_GAIA));
            chatApi.checkUser("");
        }
    }));

}