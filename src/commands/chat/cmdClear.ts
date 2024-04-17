import * as vscode from "vscode";
import { ChatApi } from '../../api/chatApi';


export function registerClear(context: vscode.ExtensionContext, chatApi: ChatApi): void {

    const clear = vscode.commands.registerCommand('tds-gaia.clear', async () => {
        chatApi.user("clear", true);
    });
    context.subscriptions.push(clear);

}