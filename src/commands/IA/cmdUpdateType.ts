import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { InferData, dataCache } from "../../dataCache";
import { logger } from "../../logger";

/**
* Registers a command to update the variables type of the current document.
* * 
* @param context The extension context.
* @param iaApi The IA API interface.
* @param chatApi The chat API.
*/
export function registerUpdateType(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {

    context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.updateTypify', async (...args) => {
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

        if (editor !== undefined) {
            const document: vscode.TextDocument = editor.document;
            const inferData: InferData = dataCache.get(args[0].cacheId) || {};
            const targetSymbol: string = args[0].varName;

            (vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri) as Thenable<vscode.DocumentSymbol[]>)
                .then(symbols => {
                    if (symbols) {
                        filterSymbols(inferData, symbols, targetSymbol).forEach(symbol => {
                            inferData.types.filter(element => element.varName === symbol.name)
                                .forEach(infer => {
                                    editor.edit(editBuilder => {
                                        editBuilder.replace(symbol.range, `${infer.varName} as ${infer.type}`);
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
                }, (reason) => {
                    chatApi.gaiaError(vscode.l10n.t("Desculpe, ocorreu um erro ao recuperar as definições dos símbolos. Veja o log para mais detalhes."))
                    logger.error(reason);
                });

            //dataCache.delete(args[0].cacheId);
        } else {
            chatApi.gaiaWarning(vscode.l10n.t("Current editor is not valid for this operation."));
        }
    }));
}

function filterSymbols(inferData: InferData, symbols: vscode.DocumentSymbol[], targetSymbol: string): vscode.DocumentSymbol[] {
    const result: vscode.DocumentSymbol[] = [];
    const targetRange: vscode.Range = new vscode.Range(inferData.location.start, inferData.location.end);

    symbols.forEach((symbol: vscode.DocumentSymbol) => {
        if (targetRange.contains(symbol.range)) {
            if (symbol.kind === vscode.SymbolKind.Variable) {
                inferData.types.filter(type =>
                    (type.varName === symbol.name) &&
                    ((targetSymbol === symbol.name) || (targetSymbol === "*"))
                ).forEach(_ => {
                    result.push(symbol);
                });
            }
        } else if (symbol.children.length > 0) {
            result.push(...filterSymbols(inferData, symbol.children, targetSymbol))
        }
    })

    return result;
}

