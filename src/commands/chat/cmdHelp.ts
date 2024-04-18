import * as vscode from "vscode";
import { ChatApi } from '../../api/chatApi';


export function registerHelp(context: vscode.ExtensionContext, chatApi: ChatApi): void {

    const clear = vscode.commands.registerCommand('tds-gaia.help', async () => {
        chatApi.user("help", true);
    });
    context.subscriptions.push(clear);

}