import * as vscode from "vscode";
import { delay } from "./util";
import { getDitoConfiguration } from "./config";
import * as hf from "./huggingfaceApi";
import { text } from "stream/consumers";

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
                    //return
                }
            }

            let line: number = position.line;
            let textLine: vscode.TextLine = document.lineAt(line);
            while ((line > 0) && textLine.isEmptyOrWhitespace) {
                line--;
                textLine = document.lineAt(line);
            }
            if (textLine.isEmptyOrWhitespace) {
                return;
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
                //const text: string = textLine.text;
                //const text = "<fim_prefix><fim_suffix>\n// Cria browse\noBrowse := MsBrGetDBase():New( 0, 0, 260, 170,,,, oDlg,,,,,,,,,,,, .F., \"\", .T.,, .F.,,, )<fim_middle>";
                const textBeforeCursor: string = "// Cria array com dados\naDados := {}\naadd(aDados, {\"01\",\"Nome 01\",\"Descri\ufffd\ufffdo 01\",\"Conteu1\"})\naadd(aDados, {\"02\",\"Nome 02\",\"Descri\ufffd\ufffdo 02\",\"Conteu2\"})"; 
                const textAfterCursor: string = "";

                const response: any = //hf.CompletionResponse | undefined =
                    await hf.HuggingFaceApi._getCompletions3(textBeforeCursor, textAfterCursor);

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
                const err_msg = (e as Error).message;
                if (err_msg.includes("is currently loading")) {
                    vscode.window.showWarningMessage(err_msg);
                } else if (err_msg !== "Canceled") {
                    vscode.window.showErrorMessage(err_msg);
                }
            }
        },

    };

    return provider;
}
