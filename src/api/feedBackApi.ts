import * as vscode from "vscode";

import { LoggedUser, getGaiaUser } from "../config";
import { Completion, AbstractApi } from "./interfaceApi";
import { logger } from "../logger";

enum EventsFeedback {
    Login = "login",
}

//const END_POINT: string = "https://events.dta.totvs.ai/";
const END_POINT: string = "https://logs.dta.totvs.ai/";

export class FeedbackApi extends AbstractApi {
    // prefixo _ indica envolvidas com a API CAROL
    private _authorization: string = "";

    private traceMap: Record<EventsFeedback, string> = {
        "login": "",
    };

    /**
     * Constructor for FeedbackApi class.
     * Initializes the Feedback Api client.
     * 
     */
    constructor() {
        super(END_POINT, "v1");
    }

    /**
    * Gets the current session ID.
    * @returns {string} The current session ID.
    */
    get sessionId(): string {
        return vscode.env.sessionId;
    };

    /*
    curl -X POST -H "Content-Type: application/json" \
  --user pk-lf-a25...:sk-lf-524... \
  https://events.dta.totvs.ai/v1 \
  -d '{
  "batch": [
    {
      "type": "trace-create",
      "id": "trace_id_20117-062d60af-21c9-4465",
      "timestamp": "2024-15-04T02:20:00.000Z",
      "body": {
        "id": "trace_id_00117-062d60af-21c9-4475",
        "name": "app-name",
        "userId": "dta@totvs.ai",
        "input": "some input events",
        "output": "some output events"
      }
    }
  ]
}'
    */
    _start(publicKey: string, secretKey: string): Promise<boolean> {
        this._authorization = `${publicKey}:${secretKey}`;

        logger.info(vscode.l10n.t("Logging Service is using [{0}]", this.apiRequest));

        return Promise.resolve(true)
    }

    stop(): Promise<boolean> {

        return Promise.resolve(true)
    }

    /**
    * Sends a JSON request to the specified URL using the provided method and data.
    *
    * @param method - The HTTP method to use for the request ("GET" or "POST").
    * @param headers - The headers to include in the request.
    * @param url - The URL to send the request to.
    * @param data - The data to include in the request body (optional).
    * @returns A Promise that resolves to the response JSON data format or an Error if the request fails.
    */
    protected async jsonRequest(method: "GET" | "POST", url: string, headers: Record<string, string>, data: any = undefined): Promise<{} | Error> {
        headers["authorization"] = `Basic ${this._authorization}`

        return super.jsonRequest(method, url, headers, data);
    }

    eventLogin(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            logger.profile("eventLogin");
            let result: boolean = false;

            if (this._authorization.length > 0) {
                const user: LoggedUser | undefined = getGaiaUser();

                if (user) {
                    const gaiaExt: vscode.Extension<any> | undefined = vscode.extensions.getExtension("tds-gaia-vscode");
                    const tdsExt: vscode.Extension<any> | undefined = vscode.extensions.getExtension("tds-vscode");
                    const body: {} = {
                        "type": "login",
                        "sessionId": this.sessionId,
                        "userId": user.id,
                        "email": user.email,
                        "company": user.orgs?.join(",") || "",
                        "gaiaVersion": gaiaExt?.packageJSON.version || "unavailable",
                        "tdsVersion": tdsExt?.packageJSON.version || "unavailable",
                        "start": new Date().toISOString(),
                        "end": "",
                        "duration": 0,
                    };

                    this.jsonRequest("POST", "login", {}, body).then((json: any) => {
                        logger.info("eventLogin: response", json);

                        if (Object.keys(json).length > 0) {
                            this.traceMap[EventsFeedback.Login] = json.id;
                            resolve(result);
                            result = true;
                        } else {
                            reject(new Error("Invalid response"));
                        }
                    });
                } else {
                    logger.error("eventLogin: user not found");
                    reject(new Error("eventLogin: user not found"));
                }
            }

            logger.profile("eventLogin");
            return result;
        });
    }

    //curl -X POST https://langfuse-api.example.com/traces/trace_id/update -d 'updated_data=your_updated_data'
    eventLogout(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            logger.profile("logout");
            let result: boolean = false;

            if (this._authorization.length > 0) {
                const user: LoggedUser | undefined = getGaiaUser();

                if (user) {
                    const gaiaExt: vscode.Extension<any> | undefined = vscode.extensions.getExtension("tds-gaia-vscode");
                    const tdsExt: vscode.Extension<any> | undefined = vscode.extensions.getExtension("tds-vscode");
                    const body: {} = {
                        "type": "login",
                        "sessionId": this.sessionId,
                        "userId": user.id,
                        "email": user.email,
                        "company": user.orgs?.join(",") || "",
                        "gaiaVersion": gaiaExt?.packageJSON.version || "unavailable",
                        "tdsVersion": tdsExt?.packageJSON.version || "unavailable",
                        "start": new Date().toISOString(),
                        "end": "",
                        "duration": 0,
                    };

                    this.jsonRequest("POST", "logout", {}, body).then((json: any) => {
                        logger.info("eventLogin: response", json);

                        if (Object.keys(json).length > 0) {
                            this.traceMap[EventsFeedback.Login] = json.id;
                            resolve(result);
                            result = true;
                        } else {
                            reject(new Error("Invalid response"));
                        }
                    });
                } else {
                    logger.error("eventLogout: user not found");
                    reject(new Error("eventLogout: user not found"));
                }
            }

            logger.profile("eventLogout");
            return result;
        });
    }

    eventCompletion(arg0: { completion: Completion; textBefore: string; textAfter: string; }) {
        logger.profile("eventCompletion");
        //if (completions !== undefined) {
        //             if (completions.completion !== undefined) {
        //                 let generatedText = completions.completion.generated_text;
        //             }
        //             let textBefore = completions.textBefore;
        //             let textAfter = completions.textAfter;
        //         }
        logger.profile("eventCompletion");
    }
}
