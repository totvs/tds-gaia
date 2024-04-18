import * as vscode from "vscode";
import { IaApiInterface, InferTypeResponse } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { getGaiaConfiguration } from "../../config";


export function registerUpdateType(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {

context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.updateTypify', async (...args) => {
const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
console.log(args);
console.log(args);

}));
}