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
import { TGaiaConfig, getGaiaConfiguration } from "./config";
import { Completion, CompletionResponse } from "./api/interfaceApi";
import { logger } from "./logger";
import { llmApi, feedbackApi } from "./api";

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

/**
 * Registers the inline completion provider. 
 * 
*/
let loading: boolean = false;

export function registerInlineCompletionItemProvider(context: vscode.ExtensionContext) {
    const provider: vscode.InlineCompletionItemProvider = {
        async provideInlineCompletionItems(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken) {
            //: Promise<vscode.InlineCompletionItem[]> {
            try {
                if (loading) {
                    throw new Error("is currently loading");
                }
                loading = true;

                const config: TGaiaConfig = getGaiaConfiguration();
                const autoSuggest: boolean = config.enableAutoSuggest;
                const requestDelay: number = config.requestDelay;

                if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic && !autoSuggest) {
                    throw new Error("manual trigger");
                }
                if (position.line < 0) {
                    throw new Error("invalid position");
                }

                if (requestDelay > 0) {
                    logger.debug("Delay " + requestDelay + "ms before requesting completions");
                    const cancelled = await delay(requestDelay * 10, token);
                    if (cancelled) {
                        throw new Error("Request cancelled by user");
                    }
                }

                const offset = document.offsetAt(position);

                textBeforeCursor = document.getText().substring(0, offset);
                textAfterCursor = document.getText().substring(offset + 1);

                const response: CompletionResponse =
                    await llmApi.getCompletions(textBeforeCursor, textAfterCursor);
                const items: vscode.InlineCompletionItem[] = [];

                if (response !== undefined) {
                    if (response.completions.length == 0) {
                        logger.info(vscode.l10n.t("Sorry. No code found in the stack."));
                        feedbackApi.eventCompletion({ selected: -1, completions: response.completions, textBefore: textBeforeCursor, textAfter: textAfterCursor });
                    }

                    for (const completion of response.completions) {
                        const item: vscode.InlineCompletionItem = new vscode.InlineCompletionItem(
                            completion.generated_text,
                            new vscode.Range(position, position),
                            {
                                title: 'afterInsert',
                                command: 'tds-gaia.afterInsert',
                                arguments: [items.length, response.completions],
                            })
                        items.push(item);
                    }

                    if (token.isCancellationRequested) {
                        //feedback.eventCompletion({ selected: -1, completions: response.completions, textBefore: textBeforeCursor, textAfter: textAfterCursor });
                    }
                }
                loading = false;

                return { items: items };
            } catch (e) {
                const err_msg = (e as Error);

                if (err_msg.message.includes("is currently loading")) {
                    vscode.window.showWarningMessage(err_msg.message);
                } else {//if (err_msg.message !== "Canceled") {
                    //vscode.window.showErrorMessage(err_msg.message);
                    loading = false;
                }

                logger.debug(err_msg.message);

                return;
            }
        }
    };

    const config: TGaiaConfig = getGaiaConfiguration();
    const documentFilter: vscode.DocumentFilter | vscode.DocumentFilter[] = config.documentFilter;
    vscode.languages.registerInlineCompletionItemProvider(documentFilter, provider);

    const afterInsert = vscode.commands.registerCommand('tds-gaia.afterInsert', async (selectedIndex: number, completions: Completion[]) => {
        feedbackApi.eventCompletion({ selected: selectedIndex - 1, completions: completions, textBefore: textBeforeCursor, textAfter: textAfterCursor });
    });
    context.subscriptions.push(afterInsert);
}

