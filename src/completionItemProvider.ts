import * as vscode from "vscode";
import { delay } from "./util";
import { getDitoConfiguration } from "./config";
import { CompletionResponse } from "./api/interfaceApi";
import { iaApi } from "./extension"

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
                const cancelled = await delay(requestDelay, token);
                if (cancelled) {
                    return
                }
            }

            let textBeforeCursor: string = "";
            let textAfterCursor: string = "";
            const offset = document.offsetAt(position);

            textBeforeCursor = document.getText().substring(0, offset);
            textAfterCursor = document.getText().substring(offset + 1);

            // let params = {
            //     position,
            //     //textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(document),
            //     model: config.get("modelIdOrEndpoint") as string,
            //     tokens_to_clear: config.get("tokensToClear") as string[],
            //     api_token: await context.secrets.get('apiToken'),
            //     request_params: {
            //         max_new_tokens: config.get("maxNewTokens") as number,
            //         temperature: config.get("temperature") as number,
            //         do_sample: true,
            //         top_p: 0.95,
            //     },
            //     fim: config.get("fillInTheMiddle") as number,
            //     context_window: config.get("contextWindow") as number,
            //     tls_skip_verify_insecure: config.get("tlsSkipVerifyInsecure") as boolean,
            //     ide: "vscode",
            //     tokenizer_config: config.get("tokenizer") as object | null,
            // };
            try {
                const response: CompletionResponse =
                    await iaApi.getCompletions(textBeforeCursor, textAfterCursor);

                const items = [];
                if (response !== undefined && response.completions.length) {
                    for (const completion of response.completions) {
                        items.push({
                            insertText: completion.generated_text,
                            range: new vscode.Range(position, position),
                            command: {
                                title: 'afterInsert',
                                command: 'tds-dito.afterInsert',
                                arguments: [response],
                            }
                        });
                    }
                }

                return {
                    items,
                };
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
