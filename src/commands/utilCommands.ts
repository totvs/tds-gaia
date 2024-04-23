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
import { StatusReturnEnum, TGetSymbolsReturn } from './resultStruct';

/**
* Retrieves the document symbols for the given document URI, optionally filtering by a target range and/or target symbol name.
*
* @param documentUri - The URI of the document to retrieve symbols for.
* @param targetRange - An optional range to filter the symbols by.
* @param targetSymbol - An optional symbol name to filter the symbols by.
* @returns A promise that resolves to an object containing the status, filtered symbols, and an optional warning message.
*/
export async function getSymbols(documentUri: vscode.Uri, targetRange?: vscode.Range, targetSymbol?: string): Promise<TGetSymbolsReturn> {
    let response: TGetSymbolsReturn;
    const symbols: vscode.DocumentSymbol[] = await (vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', documentUri) as Thenable<vscode.DocumentSymbol[]>);

    if (symbols) {
        if (symbols.find((symbol) => symbol.name.toLowerCase() === "compile error") !== undefined) {
            response = {
                status: StatusReturnEnum.Warning,
                symbols: filterSymbols(symbols, targetRange, targetSymbol),
                message: "There are compilation errors in the file. Symbols may contain incorrect information."
            };
        } else {
            response = {
                status: StatusReturnEnum.Ok,
                symbols: filterSymbols(symbols, targetRange, targetSymbol)
            };
        }
    } else {
        response = {
            status: StatusReturnEnum.Error,
            symbols: undefined,
            message: "It was not possible to obtain the symbols of the document"
        };
    }

    return Promise.resolve(response);
}

function filterSymbols(symbols: vscode.DocumentSymbol[], targetRange?: vscode.Range, targetSymbol?: string): vscode.DocumentSymbol[] {
    const result: vscode.DocumentSymbol[] = [];


    symbols.forEach((symbol: vscode.DocumentSymbol) => {
        if (!targetRange || targetRange.contains(symbol.range)) {
            if ((symbol.kind === vscode.SymbolKind.Variable) &&
                ((targetSymbol === undefined) || (symbol.name === targetSymbol))) {
                result.push(symbol);
            } else {
                result.push(...filterSymbols(symbol.children, targetRange, targetSymbol));
            }
        } else if (symbol.children.length > 0) {
            result.push(...filterSymbols(symbol.children, targetRange, targetSymbol))
        }
    })

    return result;
}
