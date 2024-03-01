import * as vscode from "vscode";
import { delay } from "./util";
import { getDitoConfiguration } from "./config";
import { CompletionResponse } from "./api/interfaceApi";
import { iaApi } from "./extension"
import { logger } from "./logger";

//acionamento manual: F1 + editor.action.inlineSuggest.trigger
export function inlineCompletionItemProvider(context: vscode.ExtensionContext): vscode.InlineCompletionItemProvider {

    const provider: vscode.InlineCompletionItemProvider = {
        async provideInlineCompletionItems(document, position, innerContext, token) {

            // if (context.workspaceState.get("tds-dito.readyFoUse") === false) {
            //     return;
            // }

            const config = getDitoConfiguration();
            const autoSuggest = config.enableAutoSuggest;
            const requestDelay = config.requestDelay;

            if (innerContext.triggerKind === vscode.InlineCompletionTriggerKind.Automatic && !autoSuggest) {
                return;
            }
            if (position.line < 0) {
                return;
            }

            if (requestDelay > 0) {
                logger.debug("Delay " + requestDelay + "ms before requesting completions");
                const cancelled = await delay(requestDelay * 10, token);
                if (cancelled) {
                    logger.debug("Request cancelled by user");
                    return;
                }
            }

            let textBeforeCursor: string = "";
            let textAfterCursor: string = "";
            const offset = document.offsetAt(position);

            textBeforeCursor = document.getText().substring(0, offset);
            textAfterCursor = document.getText().substring(offset + 1);

            try {
                const response: CompletionResponse =
                    await iaApi.getCompletions(textBeforeCursor, textAfterCursor);

                const items: vscode.InlineCompletionItem[] = [];
                if (token.isCancellationRequested) {
                    logger.warn('Request cancelled by user');
                    return;
                }

                if (response !== undefined && response.completions.length) {
                    for (const completion of response.completions) {
                        items.push({
                            insertText: completion.generated_text,
                            range: new vscode.Range(position, position),
                            command: {
                                title: 'afterInsert',
                                command: 'tds-dito.afterInsert',
                                arguments: [completion],
                            }
                        });
                    }
                }

                const list: vscode.InlineCompletionList = new vscode.InlineCompletionList(items);
                return list;
            } catch (e) {
                const err_msg = (e as Error);

                if (err_msg.message.includes("is currently loading")) {
                    vscode.window.showWarningMessage(err_msg.message);
                } else if (err_msg.message !== "Canceled") {
                    vscode.window.showErrorMessage(err_msg.message);
                }

                console.error(e);
            }
        },

    };

    return provider;
}
