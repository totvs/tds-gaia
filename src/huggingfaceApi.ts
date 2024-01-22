import * as vscode from "vscode";

import { HfInference } from "@huggingface/inference";
import { HfAgent, LLMFromHub, defaultTools } from '@huggingface/agents';
import { Credentials, whoAmI } from "@huggingface/hub";

export const USER_TOKEN_BRODAO = "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";

export namespace HuggingFaceApi {
    let _token: string;
    let inference: HfInference;
    let agent: HfAgent;

    export function start(token: string) {
        inference = new HfInference(token);
        agent = new HfAgent(
            token,
            LLMFromHub(token),
            [...defaultTools]
        );

        _token = token;
    }

    export async function login(): Promise<boolean> {
        let result: boolean = false;

        const credentials: Credentials = {
            accessToken: _token
        };

        await whoAmI({
            credentials: credentials
        }).then(async (info) => {
            console.log(info);
            if (info.type === "app") {
                console.error("You are using an app token, which is not supported by the extension. Please use an API token instead.");
                return;
            }
            if (info.type === "user") {
                console.log("You are logged in as " + info.name);
            } else {
                console.log("You are logged in as " + info.name + " (organization)");
            }
Zjt7~'kBGV^3&L,
            result = true;
        }).catch((reason: any) => {
            console.error(reason);
        });

        return result;
    }

    export function logout() {
        _token = "";
    }

    export async function generateCode(text: string): Promise<string[]> {
        const code = await agent.generateCode(text);
        console.log(code);
        const messages = await agent.evaluateCode(code);
        console.log(messages); // contains the data

        return [""]
    }

    export function getCompletions(params: { position: vscode.Position; model: string; tokens_to_clear: string[]; api_token: string | undefined; request_params: { max_new_tokens: number; temperature: number; do_sample: boolean; top_p: number; }; fim: number; context_window: number; tls_skip_verify_insecure: boolean; ide: string; tokenizer_config: object | null; }, token: any): any { //CancellationToken): CompletionResponse | PromiseLike<CompletionResponse> {
        throw new Error('Function not implemented.');
    }

    export function stop() {
        throw new Error('Function not implemented.');
    }

    //export function nearestCodeSearch(body: { document: string; }) {
    //    throw new Error('Function not implemented.');
    // const resp = await fetch(attributionEndpoint, {
    //     method: "POST",
    //     body: JSON.stringify(body),
    //     headers: { "Content-Type": "application/json" },
    // });
    //}

    export function nearestCodeSearch(body: { document: string; }): any {
        throw new Error('Function not implemented.');
    }
}

