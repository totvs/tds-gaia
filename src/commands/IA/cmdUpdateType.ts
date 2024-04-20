import * as vscode from "vscode";
import { InferData, dataCache } from "../../dataCache";
import { getSymbols } from "../utilCommands";
import { chatApi } from "../../extension";
import { buildInferText } from "../buildInferText";
import { InferType } from "../../api/interfaceApi";

/**
* Registers a command to update the variables type of the current document.
* * 
* @param context The extension context.
* @param iaApi The IA API interface.
* @param chatApi The chat API.
*/
export function registerUpdateType(context: vscode.ExtensionContext): void {
    context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.updateTypifyAll', async (...args) => {
        const messageId: string = args[0].cacheId;
        const inferData: InferData = dataCache.get(messageId) as InferData;
        const processVars: string[] = await updateType(inferData, undefined);
        const inferTypes: InferType[] = inferData.types.map(type => {
            return {
                var: type.var,
                type: type.type,
                active: !(processVars.includes(type.var))
            };
        });
        const text: string[] = await buildInferText(inferData.documentUri, inferData.range, messageId, inferTypes);

        //inferData.types = inferData.types;
        dataCache.set(messageId, inferData);
        chatApi.gaiaUpdateMessage(messageId, text);

    }));

    context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.updateTypify', async (...args) => {
        const messageId: string = args[0].cacheId;
        const inferData: InferData = dataCache.get(messageId) as InferData;
        const targetVar: string = args[0].varName;
        const processVars: string[] = await updateType(inferData, targetVar);
        const inferTypes: InferType[] = inferData.types.map(type => {
            return {
                var: type.var,
                type: type.type,
                active: !(processVars.includes(type.var))
            };
        });
        const text: string[] = await buildInferText(inferData.documentUri, inferData.range, messageId, inferTypes);

        //inferData.types = inferData.types;
        dataCache.set(messageId, inferData);
        chatApi.gaiaUpdateMessage(messageId, text);
    }));
}

async function updateType(inferData: InferData, targetSymbol: string | undefined): Promise<string[]> {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    const processVars: string[] = [];

    if (editor !== undefined) {
        const documentSymbols: vscode.DocumentSymbol[] | undefined = await getSymbols(inferData.documentUri, inferData.range, targetSymbol);

        if (documentSymbols && documentSymbols.length > 0) {
            editor.edit(editBuilder => {
                documentSymbols.forEach(symbol => {
                    inferData.types.forEach(infer => {
                        if (!infer.active) {
                            processVars.push(infer.var);
                        } else if (infer.var === symbol.name) {
                            const changeRange: vscode.Range = new vscode.Range(
                                symbol.range.start.line,
                                symbol.range.start.character,
                                symbol.range.start.line,
                                symbol.range.start.character + infer.var.length);
                            editBuilder.replace(changeRange, `${infer.var} as ${infer.type}`);

                            processVars.push(infer.var);
                        }
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

    return processVars;
}