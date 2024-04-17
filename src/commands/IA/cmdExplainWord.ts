import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { getGaiaConfiguration } from "../../config";

export function registerExplainWord(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {

    /**
        * Registers a text egaiar command to explain the word under the cursor selection. 
        * Gets the current active text egaiar, then gets the word range at the cursor position. 
        * Sends the word to be explained to the chatbot.
        * Displays the explanation in the chat window.
       */
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('tds-gaia.explain-word', () => {
        const egaiar: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

        if (egaiar !== undefined) {
            const selection: vscode.Selection = egaiar.selection;
            const selectionRange: vscode.Range | undefined = egaiar.document.getWordRangeAtPosition(selection.start);

            if (selectionRange !== undefined) {
                let wordToExplain: string = egaiar.document.getText(selectionRange).trim();
                let whatExplain = chatApi.linkToSource(egaiar.document.uri, selectionRange);

                if (wordToExplain.length > 0) {
                    const messageId: string = chatApi.gaia(
                        vscode.l10n.t("Explaining Word \'{0}\'", whatExplain)
                    );

                    return iaApi.explainCode(wordToExplain).then((value: string) => {
                        if (getGaiaConfiguration().clearBeforeExplain) {
                            chatApi.gaia("clear");
                        }
                        chatApi.gaia(value, messageId);
                    });
                } else {
                    chatApi.gaiaWarning("I couldn't identify a word to explain it.");
                }
            } else {
                chatApi.gaiaWarning("I couldn't identify a word to explain it.");
            }
        } else {
            chatApi.gaiaWarning("Current egaiar is not valid for this operation.");
        }
    }));
}