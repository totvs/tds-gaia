import * as vscode from "vscode";
import { ChatApi } from '../../api/chatApi';
import { logger } from "../../logger";


export function registerOpenManual(context: vscode.ExtensionContext, chatApi: ChatApi): void {

    const openManual = vscode.commands.registerCommand('tds-gaia.external-open', async (...args) => {
        const baseUrl: string = "https://github.com/brodao2/tds-gaia/blob/main";
        const url: string = `${baseUrl}/${args[0].target}`;
        const title: string = args[0].title;

        return vscode.env.openExternal(vscode.Uri.parse(url)).then(() => {
            chatApi.gaia(vscode.l10n.t("**{0}** opened.", title), {});
        }, (reason) => {
            chatApi.gaia(vscode.l10n.t("It was not possible to open **{0}**.", title), {});
            logger.error(reason);
        });
    });

    context.subscriptions.push(openManual);
}