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

export function registerExplainWord(context: vscode.ExtensionContext): void {

    /**
        * Registers a text editor command to explain the word under the cursor selection. 
        * Gets the current active text editor, then gets the word range at the cursor position. 
        * Sends the word to be explained to the chatbot.
        * Displays the explanation in the chat window.
       */
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('tds-gaia.explain-word', () => {
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

        if (editor !== undefined) {
            const selection: vscode.Selection = editor.selection;
            const selectionRange: vscode.Range | undefined = editor.document.getWordRangeAtPosition(selection.start);

            if (selectionRange !== undefined) {
                let wordToExplain: string = editor.document.getText(selectionRange).trim();
                let whatExplain = chatApi.linkToSource(editor.document.uri, selectionRange);

                if (wordToExplain.length > 0) {
                    const messageId: string = chatApi.gaia(
                        vscode.l10n.t("Explaining word **{0}** {1}", wordToExplain, whatExplain), {}
                    );

                    return llmApi.explainCode(wordToExplain).then((explain: string) => {
                        const responseId: string = chatApi.nextMessageId();
                        if (getGaiaConfiguration().clearBeforeExplain) {
                            chatApi.gaia("clear", {});
                        }
                        chatApi.gaia(explain, { answeringId: messageId, canFeedback: true });
                        feedbackApi.traceExplain(responseId, wordToExplain, explain)
                    });
                } else {
                    chatApi.gaiaWarning(vscode.l10n.t("I couldn't identify a word to explain it."));
                }
            } else {
                chatApi.gaiaWarning(vscode.l10n.t("I couldn't identify a word to explain it."));
            }
        } else {
            chatApi.gaiaWarning(vscode.l10n.t("Current editor is not valid for this operation."));
        }
    }));
}