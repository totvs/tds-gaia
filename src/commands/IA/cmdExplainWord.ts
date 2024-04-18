import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { getGaiaConfiguration } from "../../config";

export function registerExplainWord(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {

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
            chatApi.gaiaWarning("Current editor is not valid for this operation.");
        }
    }));
}