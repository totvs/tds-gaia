import * as vscode from "vscode";

import { HfInference, HfInferenceEndpoint } from "@huggingface/inference";
import { HfAgent, LLMFromHub, defaultTools } from '@huggingface/agents';
import { AuthInfo, Credentials, WhoAmI, WhoAmIOrg, WhoAmIUser, whoAmI } from "@huggingface/hub";
import { TDitoConfig, getDitoConfiguration, getDitoUser, isDitoShowBanner, setDitoUser } from "./config";
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
    const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('TDS-Dito', { log: true });
    let fistStart = true;

    // prefixo _ indica envolvidas com a API HF
    let _token: string;
    let _inference: HfInference;
    let _agent: HfAgent;
    let _model: string = getDitoConfiguration().endPoint;
    let _endPoint: HfInferenceEndpoint;

    function showBanner(force: boolean = false) {
        const showBanner = isDitoShowBanner();

        if ((fistStart && showBanner) || force) {

            let ext = vscode.extensions.getExtension("TOTVS.tds-dito-vscode");
            // prettier-ignore
            {
                const lines: string[] = [
                    "",
                    "--------------------------------v---------------------------------------------",
                    "     ////    //  //////  ////// |  TDS-Dito, your partner in AdvPL programming",
                    "    //  //        //    //  //  |  Version " + ext?.packageJSON["version"] + " (BETA)",
                    "   //  //  //    //    //  //   |  TOTVS Technology",
                    "  //  //  //    //    //  //    |",
                    " ////    //    //    //////     |  https://github.com/totvs/tds-dito",
                    "--------------------------------^----------------------------------------------",
                    "",
                ];

                outputChannel.appendLine(lines.join("\n"));
            }

        }

        fistStart = false;
        // prettier-ignore
        // {
        //     appLine("-------------------------------------------------------------------------------");
        //     appLine("SOBRE O USO DE CHAVES E TOKENS DE COMPILAÇÃO                                   ");
        //     appLine("");
        //     appLine("As chaves de compilação ou tokens de compilação empregados na construção do    ");
        //     appLine("Protheus e suas funcionalidades, são de uso restrito dos desenvolvedores de    ");
        //     appLine("cada módulo.                                                                   ");
        //     appLine("");
        //     appLine("Em caso de mau uso destas chaves ou tokens, por qualquer outra parte, que não  ");
        //     appLine("a referida acima, a mesma irá se responsabilizar, direta ou regressivamente,   ");
        //     appLine("única e exclusivamente, por todos os prejuízos, perdas, danos, indenizações,   ");
        //     appLine("multas, condenações judiciais, arbitrais e administrativas e quaisquer outras  ");
        //     appLine("despesas relacionadas ao mau uso, causados tanto à TOTVS quanto a terceiros,   ");
        //     appLine("eximindo a TOTVS de toda e qualquer responsabilidade.                          ");
        //     appLine("-------------------------------------------------------------------------------");
        // }
    }

    export function start(token: string) {
        // logging.set_verbosity_error()
        // logging.set_verbosity_warning()
        // logging.set_verbosity_info()
        // logging.set_verbosity_debug()
        const config = getDitoConfiguration();
        showBanner()

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

            message = `Logged in as ${capitalize(info.name)}\n`;

            const orgs: WhoAmIOrg[] = (info as any as WhoAmIUser).orgs;
            if (orgs.length > 0) {
                message += `\tYou are part of the following organizations: ${orgs.map((org: WhoAmIOrg) => {
                    return `${org.fullname} (${org.name})`;
                }).join(", ")}`;
            }

            outputChannel.appendLine(message);

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

    export async function getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse> {
        const startTime = new Date().getMilliseconds();

        outputChannel.appendLine("Code completions...");
        const config: TDitoConfig = getDitoConfiguration();

        const headers: {} = {
            "authorization": `Bearer ${_token}`,
            "content-type": "application/json",
            "x-use-cache": "false",
            "origin": "https://ui.endpoints.huggingface.co"
        };

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
            const usarName: string = getDitoUser()!["name"];

            if (resp.status == 502) {
                outputChannel.appendLine(`${usarName}, I'm sorry but I can't answer you at the moment.`);
            } else if (resp.status == 401) {
                outputChannel.appendLine(`${usarName}, I'm sorry but you do not have access privileges. Try login.`);
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

        // const samples: string[] = json.map((item: any) => item.generated_text.replace("\r", "").split("\n\n"));
        // samples.forEach((sample: string) => {
        //     response.completions.push({ generated_text: sample });
        // });

        const endTime = new Date().getMilliseconds();
        outputChannel.appendLine("Code completions finish " + (endTime - startTime) + " ms");

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

    const fileLog = "W:\\ws_tds_vscode\\tds-vscode\\test\\resources\\projects\\dss\\src\\communication.log"
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
