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
import { delay } from "./util";
import { TDitoConfig, getDitoConfiguration } from "./config";
import { Completion, CompletionResponse } from "./api/interfaceApi";
import { iaApi } from "./extension"
import { logger } from "./logger";

let textBeforeCursor: string = "";
let textAfterCursor: string = "";

/**
 * Provides inline completion items by making requests to the IA API. 
 * Checks configuration settings related to auto suggest and request delay.
 * Makes API request with text before and after cursor. 
 * Returns InlineCompletionList with completion items.
 * Handles errors and cancellation.
*/
//acionamento manual: F1 + editor.action.inlineSuggest.trigger
export class InlineCompletionItemProvider implements vscode.InlineCompletionItemProvider {

    /**
     * Registers the inline completion provider. 
     * 
    */
    static register(context: vscode.ExtensionContext) {
        const config: TDitoConfig = getDitoConfiguration();
        const provider: vscode.InlineCompletionItemProvider = new InlineCompletionItemProvider();
        const documentFilter = config.documentFilter;
        const inlineRegister: vscode.Disposable = vscode.languages.registerInlineCompletionItemProvider(documentFilter, provider);
        context.subscriptions.push(inlineRegister);

        const afterInsert = vscode.commands.registerCommand('tds-dito.afterInsert', async (response: Completion) => {
            vscode.commands.executeCommand("tds-dito.logCompletionFeedback", {completion: response, textBefore: textBeforeCursor, textAfter: textAfterCursor});
        });
        
        const logCompletionFeedback = vscode.commands.registerCommand('tds-dito.logCompletionFeedback', async (response: {completion: Completion, textBefore: string, textAfter: string}) => {
            iaApi.logCompletionFeedback(response);
        });

        context.subscriptions.push(afterInsert);
        context.subscriptions.push(logCompletionFeedback);
    }

    async provideInlineCompletionItems(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken): Promise<vscode.InlineCompletionItem[]> {
        // if (context.workspaceState.get("tds-dito.readyFoUse") === false) {
        //     return;
        // }

        const config = getDitoConfiguration();
        const autoSuggest = config.enableAutoSuggest;
        const requestDelay = config.requestDelay;

        if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic && !autoSuggest) {
            return [];
        }
        if (position.line < 0) {
            return [];
        }

        if (requestDelay > 0) {
            logger.debug("Delay " + requestDelay + "ms before requesting completions");
            const cancelled = await delay(requestDelay * 10, token);
            if (cancelled) {
                logger.debug("Request cancelled by user");
                return [];
            }
        }

        const offset = document.offsetAt(position);

        textBeforeCursor = document.getText().substring(0, offset);
        textAfterCursor = document.getText().substring(offset + 1);

        try {
            const response: CompletionResponse =
                await iaApi.getCompletions(textBeforeCursor, textAfterCursor);

            if (token.isCancellationRequested) {
                logger.warn('Request cancelled by user');
                return [];
            }

            const items: vscode.InlineCompletionItem[] = [];

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

            const result: vscode.ProviderResult<vscode.InlineCompletionItem[]> = items;
            return Promise.resolve(result);
        } catch (e) {
            const err_msg = (e as Error);

            if (err_msg.message.includes("is currently loading")) {
                vscode.window.showWarningMessage(err_msg.message);
            } else if (err_msg.message !== "Canceled") {
                vscode.window.showErrorMessage(err_msg.message);
            }

            console.error(e);

            return [];
        }
    }
}
