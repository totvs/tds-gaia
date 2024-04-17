import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { getGaiaConfiguration } from "../../config";

export function registerExplain(context: vscode.ExtensionContext, iaApi: IaApiInterface,  chatApi: ChatApi): void {
        /**
         * Registers a text egaiar command to explain the code under the cursor or selection. 
         * Checks if there is an active text egaiar, gets the current selection or line under cursor, 
         * extracts the code to explain, sends it to the explainCode() method, 
         * and prints the explanation to the chat window.
         */
        context.subscriptions.push(vscode.commands.registerTextEditorCommand('tds-gaia.explain', () => {
            const egaiar: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
            let codeToExplain: string = "";

            if (egaiar !== undefined) {
                const selection: vscode.Selection = egaiar.selection;
                let whatExplain: string = "";

                if (selection && !selection.isEmpty) {
                    const selectionRange: vscode.Range = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
                    codeToExplain = egaiar.document.getText(selectionRange);
                    whatExplain = chatApi.linkToSource(egaiar.document.uri, selectionRange);

                } else {
                    const curPos: vscode.Position = selection.start;
                    const contentLine: string = egaiar.document.lineAt(curPos.line).text;

                    whatExplain = chatApi.linkToSource(egaiar.document.uri, curPos.line);
                    codeToExplain = contentLine.trim();
                }

                if (codeToExplain.length > 0) {
                    const messageId: string = chatApi.gaia(
                        vscode.l10n.t("Explaining the code " ,whatExplain)
                    );

                    return iaApi.explainCode(codeToExplain).then((value: string) => {
                        if (getGaiaConfiguration().clearBeforeExplain) {
                            chatApi.gaia("clear");
                        }
                        chatApi.gaia(value, messageId);
                    });
                } else {
                    chatApi.gaiaWarning("I couldn't identify a code to explain it. ");
                }
            } else {
                chatApi.gaiaWarning("Current egaiar is not valid for this operation.");
            }
        }   
    ));

}