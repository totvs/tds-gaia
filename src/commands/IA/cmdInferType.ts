import * as vscode from "vscode";
import { IaApiInterface, InferTypeResponse } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { getGaiaConfiguration } from "../../config";
import { dataCache, InferData } from "../../dataCache";

/**
* Registers a command to infer types for a selected function in the active text editor.
* Finds the enclosing function based on the cursor position, extracts the function code, and sends it to an API to infer types.
* Displays the inferred types in the chat window.
*
* @param context - The extension context.
* @param iaApi - The IA API interface.
* @param chatApi - The chat API.
*/
export function registerInfer(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {
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

                    return iaApi.inferType(codeToAnalyze).then((response: InferTypeResponse) => {
                        let text: string[] = [];

                        if (response !== undefined && response.types !== undefined && response.types.length) {
                            const makeLocation = (range: vscode.Range) => {
                                return {
                                    uri: editor.document.uri,
                                    start: range.start,
                                    end: range.end
                                }
                            }

                            const inferData: InferData = {
                                location: makeLocation(rangeForAnalyze),
                                types: []
                            }

                            dataCache.set(messageId, inferData);

                            text.push(vscode.l10n.t("The following variables were inferred:"));
                            text.push("");
                            for (const varType of response.types) {
                                //if (varType.type !== "function") {
                                inferData.types.push({
                                    varName: varType.var,
                                    type: varType.type
                                })
                                let command: string = chatApi.commandText("updateType",
                                    {
                                        cacheId: messageId,
                                        varName: varType.var,
                                    })
                                    .replace(/\[.*\]/, `[${varType.var}]`);

                                text.push(vscode.l10n.t("- {0} as **{1}**", command, varType.type));
                                //}
                            }
                            text.push("");
                            text.push(vscode.l10n.t("{0} or click on variable name.",
                                `${chatApi.commandText("updateTypeAll", {
                                    cacheId: messageId,
                                    varName: "*"
                                })}`));

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