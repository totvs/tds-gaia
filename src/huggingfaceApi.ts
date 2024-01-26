import * as vscode from "vscode";

import { HfInference, HfInferenceEndpoint, Options, TextGenerationArgs, TextGenerationOutput } from "@huggingface/inference";
import { HfAgent, LLMFromHub, defaultTools } from '@huggingface/agents';
import { AuthInfo, Credentials, WhoAmI, WhoAmIOrg, WhoAmIUser, whoAmI } from "@huggingface/hub";
import { TDitoConfig, getDitoConfiguration, getDitoUser, isDitoLogged, setDitoUser } from "./config";
import { fetch } from "undici";
import { capitalize } from "./util";
import * as fse from 'fs-extra';

// TOKEN_BRODAO  = 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
// TOKEN PADRÃO  = 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

//huggingface-cli login --token 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 --add-to-git-credential

interface Completion {
    generated_text: string;
}

export interface CompletionResponse {
    request_id?: String,
    completions: Completion[],
}

export namespace HuggingFaceApi {
    let outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('TDS-Dito', { log: true });
    // prefixo _ indica envolvidas com a API HF
    let _token: string;
    let _inference: HfInference;
    let _agent: HfAgent;
    let _model: string = getDitoConfiguration().endPoint;
    let _endPoint: HfInferenceEndpoint;

    export function start(token: string) {
        // logging.set_verbosity_error()
        // logging.set_verbosity_warning()
        // logging.set_verbosity_info()
        // logging.set_verbosity_debug()
        const config = getDitoConfiguration();

        _inference = new HfInference(token);
        _endPoint = _inference.endpoint(config.endPoint);
        _agent = new HfAgent(
            token,
            LLMFromHub(token, _model),
            [...defaultTools]
        );

        _token = token;
    }

    export async function login(): Promise<boolean> {
        outputChannel.appendLine("Logging in...");

        let result: boolean = false;

        const credentials: Credentials = {
            accessToken: _token
        };

        await whoAmI({
            credentials: credentials
        }).then(async (info: WhoAmI & {
            auth: AuthInfo;
        }) => {
            let message: string = "";

            if (info.type === "app") {
                outputChannel.appendLine("You are using an app token, which is not supported by the extension. Please use an API token instead.");
                return;
            }
            outputChannel.appendLine(`"Logged in as ${capitalize(info.name)}`);

            if (info.type === "user") {
            } else {
                outputChannel.appendLine(`"Organizations: (${(info as any as WhoAmIUser).orgs.map((org: WhoAmIOrg) => {
                    return org.name;
                }).join(", ")})`);
            }

            setDitoUser(info);

            result = true;
        }).catch((reason: any) => {
            outputChannel.appendLine("ERROR login: " + reason);
            outputChannel.appendLine(reason.cause);
            outputChannel.appendLine(reason.stack);

            console.error(reason);

            setDitoUser(undefined);
        });

        return result;
    }

    export function logout() {
        outputChannel.appendLine("Logging out...");
        _token = "";
    }

    export async function _generateCode(text: string): Promise<string[]> {
        logRequest({ calledBy: "_generateCode", params: text });

        outputChannel.appendLine("Generating code...");

        // const code = await _agent.generateCode(text);
        // const messages = await _agent.evaluateCode(code);
        // logResponse({ calledBy: "_generateCode", messages: messages });

        _agent.generateCode(text).then((code: string) => {
            logResponse({
                calledBy: "_generateCode", code: code
            });

            return _agent.evaluateCode(code);
        }).then((value: any[]) => {
            logResponse({
                calledBy: ".evaluateCode", value: value
            });
        }).catch((reason: any) => {
            logResponse({
                calledBy: "_generateCode (ERROR)", error: reason
            });
        });

        return [""]
    }

    // export async function __getCompletions(text: string
    //     //position: vscode.Position,
    //     //tokens_to_clear: string[],
    //     //request_params: { max_new_tokens: number; temperature: number; do_sample: boolean; top_p: number; }; 
    //     //fim: number; 
    //     //context_window: number; 
    //     //tls_skip_verify_insecure: boolean; 
    //     //ide: string; 
    //     //tokenizer_config: object | null; }, token: any): any { //CancellationToken)
    // ): Promise<CompletionResponse | PromiseLike<CompletionResponse> | undefined> {
    //     if (!isDitoLogged()) {
    //         return undefined;
    //     }
    //     const startCall = new Date().getMilliseconds();
    //     outputChannel.appendLine("Get completions...");
    //     const config: TDitoConfig = getDitoConfiguration();

    //     // const params = {
    //     //     position,
    //     //     //textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(document),
    //     //     model: config.modelIdOrEndpoint,
    //     //     tokens_to_clear: config.tokensToClear,
    //     //     api_token: _token,
    //     //     request_params: {
    //     //         max_new_tokens: config.maxNewTokens,
    //     //         temperature: config.temperature,
    //     //         do_sample: true,
    //     //         top_p: 0.95,
    //     //     },
    //     //     fim: config.fillInTheMiddle,
    //     //     context_window: config.contextWindow,
    //     //     tls_skip_verify_insecure: config.tlsSkipVerifyInsecure,
    //     //     ide: "vscode",
    //     //     tokenizer_config: config.tokenizer,
    //     // };

    //     //agent.generateCode()
    //     //agent.evaluateCode()
    //     //agent.generatePrompt()
    //     //agent.run()
    //     //inference.request
    //     //export function textGeneration(args: TextGenerationArgs, options?: Options): Promise<TextGenerationOutput>;3


    //     // "llm.modelIdOrEndpoint": "https://bgit1s84n6bop23h.us-east-1.aws.endpoints.huggingface.cloud",
    //     // "llm.fillInTheMiddle.enabled": true,
    //     // "llm.fillInTheMiddle.prefix": "<fim_prefix>",
    //     // "llm.fillInTheMiddle.middle": "<fim_middle>",
    //     // "llm.fillInTheMiddle.suffix": "<fim_suffix>",
    //     // "llm.temperature": 0.2,
    //     // "llm.contextWindow": 8192,
    //     // "llm.tokensToClear": [
    //     // "<|endoftext|>"
    //     // ],
    //     // "llm.tokenizer": {
    //     // "repository": "totvs-ai/advpl-merged"
    //     // },
    //     // <fim_prefix>Codigo que vem antes do cursor < fim_suffix > Codigo que vem depois do cursor < fim_middle > "

    //     //chamada curl
    //     //"parameters": { "top_k": 50, "top_p": 0.95, "temperature": 0.2, "max_new_tokens": 128, "do_sample": true }} '

    //     const args: TextGenerationArgs = {
    //         accessToken: _token,
    //         model: config.endPoint,
    //         inputs: text,
    //         parameters: {
    //             /**
    //              * (Optional: True). Bool. Whether or not to use sampling, use greedy decoding otherwise.
    //              */
    //             do_sample: true,
    //             /**
    //              * (Default: None). Int (0-250). The amount of new tokens to be generated, this does not include the input length it is a estimate of the size of generated text you want. Each new tokens slows down the request, so look for balance between response times and length of text generated.
    //              */
    //             max_new_tokens: config.maxNewTokens,
    //             /**
    //              * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit. Use that in combination with max_new_tokens for best results.
    //              */
    //             //max_time?: number;
    //             /**
    //              * (Default: 1). Integer. The number of proposition you want to be returned.
    //              */
    //             //num_return_sequences?: number;
    //             /**
    //              * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
    //              */
    //             //repetition_penalty?: number;
    //             /**
    //              * (Default: True). Bool. If set to False, the return results will not contain the original query making it easier for prompting.
    //              */
    //             //return_full_text?: boolean;
    //             /**
    //              * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
    //              */
    //             temperature: config.temperature,
    //             /**
    //              * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
    //              */
    //             top_k: config.top_k,
    //             /**
    //              * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
    //              */
    //             top_p: config.top_p,
    //             /**
    //              * (Default: None). Integer. The maximum number of tokens from the input.
    //              */
    //             //truncate?: number;
    //             /**
    //              * (Default: []) List of strings. The model will stop generating text when one of the strings in the list is generated.
    //              * **/
    //             //stop_sequences: config.stop_sequence - se usar gerar erro
    //         }
    //     };
    //     const options: Options | undefined = undefined;
    //     //getCompletions
    //     const startTime = new Date().getMilliseconds();
    //     const result: TextGenerationOutput | undefined = await _endPoint.textGeneration(args, options)
    //         .then((value: TextGenerationOutput) => {
    //             const endTime = new Date().getMilliseconds();
    //             outputChannel.appendLine(`Time response getCompletions (OK): ${(endTime - startTime)} ms`);
    //             outputChannel.appendLine(value.generated_text);

    //             return value;
    //         }).catch((reason: any) => {
    //             const endTime = new Date().getMilliseconds();
    //             outputChannel.appendLine(`Time response getCompletions (ERROR): ${(endTime - startTime)} ms`);
    //             outputChannel.appendLine("ERROR getCompletions: " + reason);
    //             outputChannel.appendLine(reason.cause);
    //             outputChannel.appendLine(reason.stack);

    //             console.error(reason);
    //             return undefined;
    //         });

    //     const endCall = new Date().getMilliseconds();

    //     outputChannel.appendLine(`Completions finish ${endCall - startCall} ms`);
    //     return {} as CompletionResponse;
    // }

    // export async function __getCompletions2(text: string): Promise<string | undefined> {
    //     outputChannel.appendLine("Code completions... (2)");
    //     try {
    //         const promptResult: string = _agent.generatePrompt(text);
    //         outputChannel.append("Prompt=");
    //         outputChannel.appendLine(promptResult);
    //         const result: string = await _agent.generateCode(text);
    //         outputChannel.append("Code=");
    //         outputChannel.appendLine(result);

    //         return result;
    //     } catch (e) {
    //         const err_msg = (e as Error);
    //         outputChannel.appendLine(err_msg.message);
    //         outputChannel.appendLine(err_msg.stack!);
    //     }

    //     return undefined;
    //     // // Crie um objeto de pipeline para geração de texto usando GPT-3.5-turbo
    //     // const codeGenerationPipeline = pipeline("text-generation", { model: "EleutherAI/gpt-neo-1.3B" });

    //     // // Escreva uma prompt para gerar código
    //     // const prompt = "Escreva um código TypeScript para";

    //     // // Gere código usando o modelo
    //     // const generatedCode = codeGenerationPipeline(prompt, { max_length: 150, num_return_sequences: 1 })[0].generated_text;

    //     // console.log("Código gerado:");
    //     // console.log(generatedCode);
    // }

    export async function getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse> {
        outputChannel.appendLine("Code completions... (3)");
        const config: TDitoConfig = getDitoConfiguration();

        const headers: {} = {
            "authorization": `Bearer ${_token}`,
            "content-type": "application/json",
            "x-use-cache": "false",
            "origin": "https://ui.endpoints.huggingface.co"

        };
        //jenn: <fim_prefix>before<fim_suffix>after<fim_middle>
        //alan: <fix_prefix>before<fim_prefix>after<fim_middle> (alteração Jean)
        //leo: <fim_prefix>beforeCursor<fim_suffix>afterCursor<fim_middle>textoselecionado
        // 
        const body: {} = {
            "inputs": `<fim_prefix>${textBeforeCursor}<fim_suffix>${textAfterCursor}<fim_middle>`,
            "parameters": {
                "top_k": config.top_k,
                "top_p": config.top_p,
                "temperature": config.temperature,
                "max_new_tokens": config.maxNewTokens,
                "do_sample": true
            }
        };

        logRequest(body);

        let resp: any = {};
        try {
            resp = await fetch(config.endPoint, {
                method: "POST",
                body: JSON.stringify(body),
                headers: headers
            });

        } catch (error: any) {
            outputChannel.append("Catch (Fetch) error: ");
            outputChannel.appendLine(error.message);
            outputChannel.appendLine(error.cause);
            outputChannel.appendLine(error.stack);

            resp.ok = false;
        }

        if (!resp.ok) {
            if (resp.status == 502) {
                outputChannel.appendLine(`${capitalize(getDitoUser()!.name)}, I'm sorry but I can't answer you at the moment.`);
            } else if (resp.status == 401) {
                outputChannel.appendLine(`${capitalize(getDitoUser()!.name)}, I'm sorry but you do not have access privileges.`);
            } else {
                outputChannel.appendLine(`Fetch response error: Status: ${resp.status}-${resp.statusText}`);
            }

            return { completions: [] };
        }

        const bodyResp: string = await resp.text();
        const json = JSON.parse(bodyResp);
        logResponse(json);

        if (!json || json.length === 0) {
            void vscode.window.showInformationMessage("No code found in the stack");
            return { completions: [] };
        }

        const response: CompletionResponse = { completions: [] };
        Object.keys(json).forEach((key: string) => {
            response.completions.push(json[key]);
        });

        return response;
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

    const fileLog = "P:\\git\\tds-vscode\\test\\resources\\projects\\dss\\communication.log"
    fse.writeFileSync(fileLog, `Start at ${new Date().toLocaleTimeString()}\n\n`);
    const file = fse.openSync(fileLog, "a");
    let execBeginTime: Date;

    function logRequest(body: {}) {
        execBeginTime = new Date();
        const data: string = JSON.stringify(body).replace('\\"', '\\"');
        fse.writeSync(file, `request: ${execBeginTime.toLocaleTimeString()}\n`);
        fse.writeSync(file, `data   : ${data}\n\n`);

        const json: string = JSON.stringify(body, undefined, 2);
        fse.writeSync(file, json);
    }

    function logResponse(response: {}) {
        const execEndTime = new Date();
        const data: string = JSON.stringify(response).replace('\\"', '\\"');
        fse.writeSync(file, `request: ${execEndTime.toLocaleTimeString()} (${execEndTime.getMilliseconds() - execBeginTime.getMilliseconds()} ms}\n`);
        fse.writeSync(file, `data   : ${data}\n`);
        fse.writeSync(file, `${'-'.repeat(20)}\n\n`);

        const json: string = JSON.stringify(response, undefined, 2);
        fse.writeSync(file, json);
    }

}
