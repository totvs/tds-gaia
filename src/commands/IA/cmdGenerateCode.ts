import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';

export function registerGenerateCode(context: vscode.ExtensionContext, iaApi: IaApiInterface,  chatApi: ChatApi): void {

    //o que o usuário descrever vai vim veio argumento
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('tds-gaia.generate-code', () => {
        const text: string = "Gerar código para varrer um array";
        iaApi.generateCode(text);
    }));   

}