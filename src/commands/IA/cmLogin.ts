import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { PREFIX_DITO, logger } from "../../logger";

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
    //TODO: Para identificação do usuário. Aguardando definição de processo externo
    //const authProvider = new AuthProvider(initialConfig)
    //await authProvider.init()

    context.subscriptions.push(vscode.commands.registerCommand('tds-dito.login', async (...args) => {

        let apiToken = await context.secrets.get('apiToken');

        if (apiToken !== undefined) {
            iaApi.start(apiToken).then(async (value: boolean) => {
                if (await iaApi.login()) {
                    logger.info(vscode.l10n.t('Logged in successfully'));
                    vscode.window.showInformationMessage(vscode.l10n.t("{0} Logged in successfully", PREFIX_DITO));

                    return;
                }
            });
        }

        if (args.length > 0) {
            if (args[0]) { //indica que login foi acionado automaticamente
                return;
            }
        }

        const input = await vscode.window.showInputBox({
            prompt: vscode.l10n.t('Please enter your API token or @your name):'),
            placeHolder: vscode.l10n.t('Your token goes here ...')
        });

        if (input !== undefined) {
            // const session: vscode.AuthenticationSession = await vscode.authentication.getSession(DitoAuthenticationProvider.AUTH_TYPE, [], { createIfNone: true });
            // console.log(session);

            if (await iaApi.start(input)) {
                if (await iaApi.login()) {
                    await context.secrets.store('apiToken', input);
                    vscode.window.showInformationMessage(vscode.l10n.t("{0} Logged in successfully", PREFIX_DITO));
                } else {
                    await context.secrets.delete('apiToken');
                    vscode.window.showInformationMessage(vscode.l10n.t("{0} Login failure", PREFIX_DITO));
                }

                chatApi.checkUser("");
            }
        }
    }));
}