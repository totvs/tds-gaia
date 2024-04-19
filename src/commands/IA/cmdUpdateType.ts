import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { InferData, dataCache } from "../../dataCache";
import { getSymbols } from "../utilCommands";

/**
* Registers a command to update the variables type of the current document.
* * 
* @param context The extension context.
* @param iaApi The IA API interface.
* @param chatApi The chat API.
*/
export function registerUpdateType(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {
    context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.updateTypifyAll', async (...args) => {
        updateType(chatApi, dataCache.get(args[0].cacheId) || {}, undefined);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.updateTypify', async (...args) => {
        updateType(chatApi, dataCache.get(args[0].cacheId) || {}, args[0].varName);
    }));
}

async function updateType(chatApi: ChatApi, inferData: InferData, targetSymbol: string | undefined): Promise<void> {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

    if (editor !== undefined) {
        const document: vscode.TextDocument = editor.document;
        const documentSymbols: vscode.DocumentSymbol[] | undefined = await getSymbols(inferData.documentUri, inferData.range, targetSymbol);

        if (documentSymbols && documentSymbols.length > 0) {
            editor.edit(editBuilder => {
                documentSymbols.forEach(symbol => {
                    inferData.types.filter(element => element.varName === symbol.name)
                        .forEach(infer => {
                            const changeRange: vscode.Range = new vscode.Range(
                                symbol.range.start.line,
                                symbol.range.start.character,
                                symbol.range.start.line,
                                symbol.range.start.character + infer.varName.length);
                            editBuilder.replace(changeRange, `${infer.varName} as ${infer.type}`);
                        });
                });
            });
        } else {
            chatApi.gaiaWarning([
                vscode.l10n.t("It was not possible to recover the definitions of the source symbols."),
                vscode.l10n.t("Make sure file is open for editing and does not contain syntax errors."),
                vscode.l10n.t("Editions in the file during analysis, it can also be the reason. Try again, please."),
            ]);
        }
    } else {
        chatApi.gaiaWarning(vscode.l10n.t("Current editor is not valid for this operation."));
    }
}