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
import { InferTypeResponse } from '../../api/interfaceApi';
import { getGaiaConfiguration } from "../../config";
import { chatApi, iaApi } from "../../extension";
import { buildInferText } from "../buildInferText";
import { TBuildInferTextReturn } from "../resultStruct";

/**
* Registers a command to infer types for a selected function in the active text editor.
* Finds the enclosing function based on the cursor position, extracts the function code, and sends it to an API to infer types.
* Displays the inferred types in the chat window.
*
* @param context - The extension context.
* @param iaApi - The IA API interface.
* @param chatApi - The chat API.
*/
export function registerInfer(context: vscode.ExtensionContext): void {
    /**
    * Registers a command to infer types for a selected function in the active text editor. 
    * Finds the enclosing function based on the cursor position, extracts the function code, and sends it to an API to infer types.
    * Displays the inferred types in the chat window.
    */
    context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.infer', async (...args) => {
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
        let codeToAnalyze: string = "";

        if (editor !== undefined) {
            if (getGaiaConfiguration().clearBeforeExplain) {
                chatApi.gaia("clear");
            }

            const selection: vscode.Selection = editor.selection;
            const function_re: RegExp = /(function|method(...)class)\s*(\w+)/i
            const return_re: RegExp = /^\s*(Return|EndClass)/i
            const curPos: vscode.Position = selection.start;
            let whatAnalyze: string = "";
            let curLine = curPos.line;
            let startFunction: vscode.Position | undefined = undefined;
            let endFunction: vscode.Position | undefined = undefined;

            //começo da função
            while ((curLine > 0) && (!startFunction)) {
                const lineStart = new vscode.Position(curLine - 1, 0);
                const curLineStart = new vscode.Position(lineStart.line, 0);
                const nextLineStart = new vscode.Position(lineStart.line + 1, 0);
                const rangeWithFirstCharOfNextLine = new vscode.Range(curLineStart, nextLineStart);
                const contentWithFirstCharOfNextLine = editor.document.getText(rangeWithFirstCharOfNextLine);

                if (contentWithFirstCharOfNextLine.match(function_re)) {
                    startFunction = new vscode.Position(curLine, 0);
                }

                curLine--;
            }

            curLine = curPos.line;

            while ((curLine < editor.document.lineCount) && (!endFunction)) {
                const lineStart = new vscode.Position(curLine + 1, 0);
                const curLineStart = new vscode.Position(lineStart.line, 0);
                const nextLineStart = new vscode.Position(lineStart.line + 1, 0);
                const rangeWithFirstCharOfNextLine = new vscode.Range(curLineStart, nextLineStart);
                const contentWithFirstCharOfNextLine = editor.document.getText(rangeWithFirstCharOfNextLine);
                const matches = contentWithFirstCharOfNextLine.match(return_re);

                if (matches) {
                    //endFunction = new vscode.Position(curLine, contentWithFirstCharOfNextLine.length-1);
                    const textLine: vscode.TextLine = editor.document.lineAt(curLine);
                    endFunction = textLine.range.end;
                }

                curLine++;
            }

            if (startFunction) {
                if (!endFunction) {
                    const textLine: vscode.TextLine = editor.document.lineAt(editor.document.lineCount - 1);
                    endFunction = textLine.range.end;
                }

                const rangeForAnalyze = new vscode.Range(startFunction, endFunction);
                codeToAnalyze = editor.document.getText(rangeForAnalyze);

                if (codeToAnalyze.length > 0) {
                    const rangeBlock = new vscode.Range(startFunction, endFunction);

                    whatAnalyze = chatApi.linkToSource(editor.document.uri, rangeBlock);

                    const messageId: string = chatApi.gaia(
                        vscode.l10n.t("Analyzing the code for infer type variables. {0} ", whatAnalyze)
                    );

                    return iaApi.inferType(codeToAnalyze).then(async (response: InferTypeResponse) => {
                        if (response !== undefined && response.types !== undefined && response.types.length) {
                            const responseId: string = chatApi.nextMessageId();
                            const buildInferTextReturn: TBuildInferTextReturn = await buildInferText(editor.document.uri, rangeForAnalyze, responseId, response.types);
                            const text: string[] = buildInferTextReturn.text;

                            chatApi.gaia(text.join("\n"), messageId);
                        } else {
                            chatApi.gaia(vscode.l10n.t("Sorry, I couldn't make the typification because of an internal problem."), messageId);
                        }
                    });
                }
            } else {
                chatApi.gaiaWarning([
                    vscode.l10n.t("I could not identify a function/method for analyzing."),
                    vscode.l10n.t("Try positioning the cursor in another line of implementation.")
                ]);
            }
        } else {
            chatApi.gaiaWarning(vscode.l10n.t("Current editor is not valid for this operation."));
        }
    }));
}

