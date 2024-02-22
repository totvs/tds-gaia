import * as vscode from "vscode";

import { HfInference, HfInferenceEndpoint } from "@huggingface/inference";
import { HfAgent, LLMFromHub, defaultTools } from '@huggingface/agents';
import { AuthInfo, Credentials, WhoAmI, WhoAmIOrg, WhoAmIUser, whoAmI } from "@huggingface/hub";
import { TDitoConfig, getDitoConfiguration, getDitoUser, isDitoShowBanner, setDitoUser } from "../config";
import { fetch } from "undici";
import { capitalize } from "../util";
import { CompletionResponse, IaAbstractApi, IaApiInterface } from "./interfaceApi";
import { logger } from "../logger";

// TOKEN_BRODAO  = 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
// TOKEN PADRÃO  = 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

//huggingface-cli login --token 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 --add-to-git-credential

export class HuggingFaceApi extends IaAbstractApi implements IaApiInterface {
    // prefixo _ indica envolvidas com a API HF
    private _token!: string;
    private _inference!: HfInference;
    private _agent!: HfAgent;
    private _model: string = getDitoConfiguration().endPoint;
    private _endPoint!: HfInferenceEndpoint;

    constructor() {
        super();
    }

    checkHealth(): Promise<Error | undefined> {
        throw new Error("Method not implemented.");
    }

    start(token: string): Promise<boolean> {
        const config = getDitoConfiguration();

        logger.info(`Extension is using [${config.endPoint}]`);

        this._inference = new HfInference(token);
        this._endPoint = this._inference.endpoint(config.endPoint);
        this._agent = new HfAgent(
            token,
            LLMFromHub(token, this._model),
            [...defaultTools]
        );

        this._token = token;

        return Promise.resolve(true);
    }

    async login(): Promise<boolean> {
        logger.info(`Logging in ${this._model}`);

        let result: boolean = false;

        const credentials: Credentials = {
            accessToken: this._token
        };

        await whoAmI({
            credentials: credentials
        }).then(async (info: WhoAmI & {
            auth: AuthInfo;
        }) => {
            let message: string = "";

            if (info.type === "app") {
                logger.info("You are using an app token, which is not supported by the extension. Please use an API token instead.");
                return;
            }

            message = `Logged in as ${capitalize(info.name)} \n`;

            const orgs: WhoAmIOrg[] = (info as any as WhoAmIUser).orgs;
            if (orgs.length > 0) {
                message += `\tYou are part of the following organizations: ${orgs.map((org: WhoAmIOrg) => {
                    return `${org.fullname} (${org.name})`;
                }).join(", ")
                    } `;
            }

            logger.info(message);

            setDitoUser({
                id: info.id,
                email: info.email || "",
                name: capitalize(info.name),
                fullname: capitalize(info.fullname),
                displayName: capitalize(info.auth.accessToken?.displayName || info.name),
                avatarUrl: info.avatarUrl,
                expiration: new Date(2024, 0, 1, 0, 0, 0, 0),
                expiresAt: new Date(info.periodEnd || 0),
            });

            result = true;
        }).catch((reason: any) => {
            this.logError("", reason, "");

            setDitoUser(undefined);
        });

        return Promise.resolve(result);
    }

    logout(): Promise<boolean> {
        logger.info("Logging out...");
        this._token = "";

        return Promise.resolve(true);
    }

    generateCode(text: string): Promise<string[]> {
        this.logRequest(getDitoConfiguration().endPoint, "", "", JSON.stringify({ calledBy: "_generateCode", params: text }));
        logger.info("Generating code...");

        this._agent.generateCode(text).then((code: string) => {
            this.logResponse(getDitoConfiguration().endPoint,
                JSON.stringify({ calledBy: "_generateCode", code: code })
            );

            return this._agent.evaluateCode(code);
        }).then((value: any[]) => {
            this.logResponse(getDitoConfiguration().endPoint,
                JSON.stringify({ calledBy: ".evaluateCode", value: value })
            );
        }).catch((reason: any) => {
            this.logError("", reason, "");
        });

        return Promise.resolve([""]);
    }

    async getCompletions(textBeforeCursor: string, textAfterCursor: string): Promise<CompletionResponse> {
        const startTime = new Date().getMilliseconds();

        logger.info("Code completions...");
        const config: TDitoConfig = getDitoConfiguration();

        const headers: {} = {
            "authorization": `Bearer ${this._token} `,
            "content-type": "application/json",
            "x-use-cache": "false",
            "origin": "https://ui.endpoints.huggingface.co"
        };

        const body: {} = {
            "inputs": `< fim_prefix > ${textBeforeCursor} <fim_suffix>${textAfterCursor} <fim_middle>`,
            "parameters": {
                "top_k": config.top_k,
                "top_p": config.top_p,
                "temperature": config.temperature,
                "max_new_tokens": config.maxNewTokens,
                "do_sample": true
            }
        };

        this.logRequest(getDitoConfiguration().endPoint, "", JSON.stringify(headers, undefined, 2), JSON.stringify(body, undefined, 2));

        let resp: any = {};
        try {
            resp = await fetch(config.endPoint, {
                method: "POST",
                body: JSON.stringify(body),
                headers: headers
            });

        } catch (error: any) {
            this.logError("", error, "");

            resp.ok = false;
        }

        if (!resp.ok) {
            const usarName: string = getDitoUser()!["name"];

            if (resp.status == 502) {
                logger.info(`${usarName}, I'm sorry but I can't answer you at the moment.`);
            } else if (resp.status == 401) {
                logger.info(`${usarName}, I'm sorry but you do not have access privileges. Try login.`);
            } else {
                logger.info(`Fetch response error: Status: ${resp.status}-${resp.statusText}`);
            }

            return Promise.resolve({ completions: [] });
        }

        const bodyResp: string = await resp.text();
        const json = JSON.parse(bodyResp);
        this.logResponse(getDitoConfiguration().endPoint, json);

        if (!json || json.length === 0) {
            void vscode.window.showInformationMessage("No code found in the stack");
            return Promise.resolve({ completions: [] });
        }

        const response: CompletionResponse = { completions: [] };
        Object.keys(json).forEach((key: string) => {
            response.completions.push(json[key]);
        });

        const endTime = new Date().getMilliseconds();
        logger.info("Code completions finish " + (endTime - startTime) + " ms");

        return Promise.resolve(response);
    }

    stop(): Promise<boolean> {

        return this.logout();
    }
}
