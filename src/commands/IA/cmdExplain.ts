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
import { getGaiaConfiguration } from "../../config";
import { chatApi, feedbackApi, llmApi } from "../../api";

export function registerExplain(context: vscode.ExtensionContext): void {
    /**
     * Registers a text editor command to explain the code under the cursor or selection. 
     * Checks if there is an active text editor, gets the current selection or line under cursor, 
     * extracts the code to explain, sends it to the explainCode() method, 
     * and prints the explanation to the chat window.
     */
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('tds-gaia.explain', () => {
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
        let codeToExplain: string = "";

        if (editor !== undefined) {
            const selection: vscode.Selection = editor.selection;
            let whatExplain: string = "";

            if (selection && !selection.isEmpty) {
                const selectionRange: vscode.Range = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);

                codeToExplain = editor.document.getText(selectionRange);
                whatExplain = chatApi.linkToSource(editor.document.uri, selectionRange);
            } else {
                const curPos: vscode.Position = selection.start;
                const contentLine: string = editor.document.lineAt(curPos.line).text;

                whatExplain = chatApi.linkToSource(editor.document.uri, curPos.line);
                codeToExplain = contentLine.trim();
            }

            if (codeToExplain.length > 0) {
                const messageId: string = chatApi.gaia(
                    vscode.l10n.t("Analyzing the code for explain. {0}", whatExplain), {});

                return llmApi.explainCode(codeToExplain).then((explain: string) => {
                    const responseId: string = chatApi.nextMessageId();
                    if (getGaiaConfiguration().clearBeforeExplain) {
                        chatApi.user("clear", true);
                    }

                    chatApi.gaia(explain, { canFeedback: true, answeringId: messageId });
                    feedbackApi.traceExplain(responseId, codeToExplain, explain)
                });
            } else {
                chatApi.gaiaWarning([
                    "I couldn't identify a code to explain it.",
                    "Try positioning the cursor in another line of implementation."
                ]);
            }
        } else {
            chatApi.gaiaWarning("Current editor is not valid for this operation.");
        }
    }
    ));
}