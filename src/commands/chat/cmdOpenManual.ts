import * as vscode from "vscode";
import { ChatApi } from '../../api/chatApi';
import { logger } from "../../logger";


export function registerOpenManual(context: vscode.ExtensionContext, chatApi: ChatApi): void {

    const openManual = vscode.commands.registerCommand('tds-gaia.open-manual', async (...args) => {
        const baseUrl: string = "https://github.com/brodao2/tds-gaia/blob/main";
        const url: string = args.length > 0
            ? `${baseUrl}/${args[0]}`
            : `${baseUrl}/README.md`;
        const title: string = args.length > 0
            ? args[1]
            : vscode.l10n.t("**TDS-Gaia** Manual");
        const messageId: string = chatApi.gaia(vscode.l10n.t("Opening {0}.", title));

        return vscode.env.openExternal(vscode.Uri.parse(url)).then(() => {
            chatApi.gaia(vscode.l10n.t("{0} opened.", title), messageId);
        }, (reason) => {
            chatApi.gaia(vscode.l10n.t("It was not possible to open {0}.", title), messageId);
            logger.error(reason);
        });
    });

    context.subscriptions.push(openManual);
}