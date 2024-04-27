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

import * as vscode from 'vscode';
import { InferData, dataCache } from '../dataCache';
import { InferType } from '../api/interfaceApi';
import { getSymbols } from './utilCommands';
import { StatusReturnEnum, TBuildInferTextReturn, TGetSymbolsReturn } from './resultStruct';
import { chatApi } from '../api';

/**
* Builds the text to display for inferred type information.
*
* @param documentUri - The URI of the document containing the code to analyze.
* @param range - The range of the code to analyze.
* @param messageId - The ID of the message to update with the inferred type information.
* @param types - The inferred types for the variables in the code.
* @returns An array of strings representing the text to display for the inferred type information.
*/
export async function buildInferText(documentUri: vscode.Uri, range: vscode.Range, messageId: string, types: InferType[]): Promise<TBuildInferTextReturn> {
    const text: string[] = [];
    const inferData: InferData = dataCache.get(messageId) || {
        documentUri: documentUri,
        range: range,
        types: []
    }
    const getSymbolsReturn: TGetSymbolsReturn = await getSymbols(inferData.documentUri, inferData.range);
    const documentSymbols: vscode.DocumentSymbol[] | undefined = getSymbolsReturn.symbols;

    let someTipped: boolean = false;
    dataCache.set(messageId, inferData);

    text.push(vscode.l10n.t("The following variables were inferred:"));
    text.push("");

    for (const varType of types) {
        //if (varType.type !== "function") {
        const documentSymbol: vscode.DocumentSymbol | undefined = documentSymbols?.find((symbol) => {
            return (symbol.name === varType.var) &&
                (symbol.kind === vscode.SymbolKind.Variable);
        });

        varType.active = varType.active === undefined ? true : varType.active; //normalização do dado
        let alreadyTipped: boolean = !(varType.active) || (documentSymbol?.detail.includes(`as ${varType.type}`) || false);

        const index: number = inferData.types.findIndex((inferType) => {
            return inferType.var === varType.var;
        });
        if (index >= 0) {
            inferData.types[index] = {
                var: varType.var,
                type: varType.type,
                active: varType.active
            }
        } else {
            inferData.types.push({
                var: varType.var,
                type: varType.type,
                active: varType.active
            })
        };

        someTipped = someTipped || !alreadyTipped;
        const linkPosition: string = (alreadyTipped || documentSymbol == undefined)
            ? ""
            : chatApi.linkToRange(documentUri, documentSymbol.selectionRange);
        const command: string = (alreadyTipped || documentSymbol == undefined)
            ? `**${varType.var}**`
            : chatApi.commandText("updateType",
                {
                    cacheId: messageId,
                    varName: varType.var,
                })
                .replace(/\[.*\]/, `[${varType.var}]`);

        text.push(vscode.l10n.t("- {0} as **{1}** {2}", command, varType.type, linkPosition));
    }

    if (someTipped) {
        text.push(vscode.l10n.t("{0} or click on variable name.",
            `${chatApi.commandText("updateTypeAll", {
                cacheId: messageId
            })}`));
    } else {
        text.push(vscode.l10n.t("All variables are already typed."));
    }

    if (getSymbolsReturn.status !== StatusReturnEnum.Ok) {
        text.push("");
        text.push(`_${getSymbolsReturn.message}_`);
    }

    return {
        status: StatusReturnEnum.Ok,
        text: text,
        feedback: true
    };
}