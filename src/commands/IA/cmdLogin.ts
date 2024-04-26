import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { PREFIX_GAIA, logger } from "../../logger";
import { GaiaAuthenticationProvider, getGaiaSession } from "../../authenticationProvider";
import { feedback } from "../../extension";

export function registerLogin(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {

    /**
    * Registers a command with VS Code to prompt the user to login.
    * 
    * Checks if an API token is already stored, and attempts auto-login if so.
    * Otherwise, prompts the user to enter their API token or username. 
    * Validates the login and stores the token if successful.
    * 
    * @param args - First arg is a boolean to skip auto-login if true.
    */

    context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.login', async (...args) => {
        let session: vscode.AuthenticationSession | undefined = await getGaiaSession();

        if (session !== undefined) {
            await iaApi.start();

            if (await iaApi.login(session.account.id, session.accessToken)) {
                logger.info(vscode.l10n.t('Logged in successfully'));
                vscode.window.showInformationMessage(vscode.l10n.t("{0} Logged in successfully", PREFIX_GAIA));
                const [_, publicKey, secretKey] = session.scopes[0].split(":");
                feedback.start(publicKey, secretKey);
                feedback.eventLogin();
            } else {
                logger.error(vscode.l10n.t('Failed to automatic login'));
                vscode.window.showErrorMessage(vscode.l10n.t("{0} Failed to automatic login", PREFIX_GAIA));
            }
        };


        if (args.length > 0) {
            if (args[0]) { //indica que login foi acionado automaticamente
                return;
            }
        }

        session = await vscode.authentication.getSession(GaiaAuthenticationProvider.AUTH_TYPE, [], { createIfNone: true });
        console.log(session);
        if (session !== undefined) {

            if (session.accessToken) {
                vscode.window.showInformationMessage(vscode.l10n.t("{0} Logged in successfully", PREFIX_GAIA));
            } else {
                vscode.window.showInformationMessage(vscode.l10n.t("{0} Login failure", PREFIX_GAIA));
            }

            chatApi.checkUser("");
        }
    }));
}