import * as vscode from "vscode";
import { delay } from "./util";
import { getDitoConfiguration } from "./config";
import * as hf from "./huggingfaceApi";
import { text } from "stream/consumers";


//acionamento manual: F1 +  editor.action.inlineSuggest.trigger
export function inlineCompletionItemProvider(context: vscode.ExtensionContext): vscode.InlineCompletionItemProvider {

    const provider: vscode.InlineCompletionItemProvider = {
        async provideInlineCompletionItems(document, position, context, token) {
            const config = getDitoConfiguration();
            const autoSuggest = config.enableAutoSuggest;
            const requestDelay = config.requestDelay;

            if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic && !autoSuggest) {
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

            const textBeforeCursor: string[] = [];
            const textAfterCursor: string[] = [];
            const textSelected: string = "";

            let line: number = 0;

            const validLine = (textLine: vscode.TextLine) => {

                return !textLine.isEmptyOrWhitespace &&
                    !textLine.text.trim().startsWith("//");
            };

            //verifica se há texto selecionado (ocorre na invocação manual)
            if (context.selectedCompletionInfo) {
                //a inserção ocorre da última linha para a primeira
                textBeforeCursor.push(context.selectedCompletionInfo.text);
            }

            //busca por uma linha vazia antes da linha corrente
            line = position.line - 1;
            while ((line > 0) && validLine(document.lineAt(line))) {
                //a inserção ocorre da última linha para a primeira
                textBeforeCursor.push(document.lineAt(line).text);
                line--;
            }

            //busca por uma linha vazia depois da linha corrente
            line = position.line + 1;
            while ((line < document.lineCount) && validLine(document.lineAt(line))) {
                textAfterCursor.push(document.lineAt(line).text);
                line++;
            }

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
                const response: hf.CompletionResponse =
                    await hf.HuggingFaceApi.getCompletions(textBeforeCursor.reverse().join("\n"), textAfterCursor.join("\n"));

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
