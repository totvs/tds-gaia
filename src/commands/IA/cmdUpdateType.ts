/*
Copyright 2024 TOTVS S.A

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http: //www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import * as vscode from "vscode";
import { InferData, dataCache } from "../../dataCache";
import { getSymbols } from "../utilCommands";
import { buildInferText } from "../buildInferText";
import { InferType } from "../../api/interfaceApi";
import { TBuildInferTextReturn, TGetSymbolsReturn } from "../resultStruct";
import { ScoreEnum } from "../../api/feedbackApi";
import { chatApi, feedbackApi } from "../../api";

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
        const buildInferTextReturn: TBuildInferTextReturn = await buildInferText(inferData.documentUri, inferData.range, messageId, inferTypes);
        const text: string[] = buildInferTextReturn.text;

        dataCache.set(messageId, inferData);
        chatApi.gaiaUpdateMessage(messageId, text, { canFeedback: true, disabledFeedback: buildInferTextReturn.feedback });
        feedbackApi.scoreInferType(messageId, inferTypes.filter(((type: InferType) => !type.active)),
            ScoreEnum.Relative,
            (inferTypes.length == processVars.length)
                ? vscode.l10n.t(`User accept all`)
                : vscode.l10n.t("User accept others: {0}", processVars.join(",")),
            true);
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
        const buildInferTextReturn: TBuildInferTextReturn = await buildInferText(inferData.documentUri, inferData.range, messageId, inferTypes);
        const text: string[] = buildInferTextReturn.text;

        dataCache.set(messageId, inferData);
        chatApi.gaiaUpdateMessage(messageId, text, { canFeedback: true, disabledFeedback: buildInferTextReturn.feedback });
        feedbackApi.scoreInferType(messageId, inferTypes.filter(((type: InferType) => !type.active)),
            ScoreEnum.Relative, vscode.l10n.t("User accept: {0}}", processVars.join(",")), false);
    }));
}

async function updateType(inferData: InferData, targetSymbol: string | undefined): Promise<string[]> {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    const processVars: string[] = [];

    if (editor !== undefined) {
        const getSymbolsReturn: TGetSymbolsReturn = await getSymbols(inferData.documentUri, inferData.range);
        const documentSymbols: vscode.DocumentSymbol[] | undefined = getSymbolsReturn.symbols;

        if (documentSymbols && documentSymbols.length > 0) {
            editor.edit(editBuilder => {
                inferData.types.forEach(infer => {
                    if (!infer.active) {
                        processVars.push(infer.var);
                    } else {
                        documentSymbols
                            .filter(symbol => {
                                return ((infer.var === symbol.name)
                                    && ((targetSymbol === "" || targetSymbol === symbol.name)));
                            })
                            .forEach(symbol => {
                                const changeRange: vscode.Range = new vscode.Range(
                                    symbol.range.start.line,
                                    symbol.range.start.character,
                                    symbol.range.start.line,
                                    symbol.range.start.character + infer.var.length);
                                editBuilder.replace(changeRange, `${infer.var} as ${infer.type}`);

                                processVars.push(infer.var);
                            });
                    }
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