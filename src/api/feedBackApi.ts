import * as vscode from "vscode";

import { LoggedUser, getGaiaUser } from "../config";
import { Completion, AbstractApi } from "./interfaceApi";
import { PREFIX_GAIA, logger } from "../logger";
import { randomUUID } from "crypto";

enum TypeFeedbackEnum {
    TraceCreate = "trace-create",
    ScoreCreate = "score-create",
    EventCreate = "event-create",
    SpanCreate = "span-create",
    SpanUpdate = "span-update",
    GenerationCreate = "generation-create",
    GenerationUpdate = "generation-update",
    SdkLog = "sdk-log",
    ObservationCreate = "observation-create",
    ObservationUpdate = "observation-update",
}

enum EventsFeedbackEnum {
    Login = "login",
    Logout = "logout",
}

const END_POINT: string = "https://events.dta.totvs.ai";

export class FeedbackApi extends AbstractApi {
    // prefixo _ indica envolvidas com a API CAROL
    private _authorization: string = "";
    private startDate: Date = new Date(); //apenas para evitar erro sintaxe, atribuído em #eventLogin

    private traceMap: Record<EventsFeedbackEnum, any> = {
        "login": {},
        "logout": {}
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

    start(accessToken: string): Promise<boolean> {
        this._authorization = accessToken;
        this._authorization = Buffer.from("pk-lf-b1633e3c-c038-4dbe-af55-82bf21be0fd5:sk-lf-bdad2a8c-f646-4ab6-886a-66401033cc48").toString("base64");

        logger.info(vscode.l10n.t("Logging Service is using [{0}]", this.apiRequest));

        return Promise.resolve(true)
    }

    async stop(): Promise<boolean> {
        this._authorization = "";

        return Promise.resolve(true);
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
    protected async jsonRequest(method: "GET" | "POST", url: string, headers: Record<string, string>, data: any): Promise<{} | Error> {
        headers["authorization"] = `Basic ${this._authorization}`

        return super.jsonRequest(method, url, headers, data);
    }

    /**
    * Initializes the batch body for a feedback event.
    * @param type - The type of feedback event.
    * @param event - The name of the feedback event.
    * @param data - Additional data to include in the feedback event.
    * @returns An object containing the batch information for the feedback event.
    */
    private initBatchBody(type: TypeFeedbackEnum, event: EventsFeedbackEnum, data: { [key: string]: any }): { [key: string]: any } {
        data["sessionId"] = this.sessionId;

        return {
            "batch": [
                {
                    "type": type,
                    "id": `${event}_id_${randomUUID()}`,
                    "timestamp": new Date().toISOString(),
                    "body": data
                }
            ],
        }
    }

    /**
    * Logs the user's login event to the feedback API.
    * @returns A Promise that resolves to a boolean indicating whether the login event was successfully logged.
    */
    eventLogin(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            logger.profile("eventLogin");
            let result: boolean = false;

            if (this._authorization.length > 0) {
                const user: LoggedUser | undefined = getGaiaUser();

                if (user) {
                    this.startDate = new Date();

                    const gaiaExt: vscode.Extension<any> | undefined = vscode.extensions.getExtension("TOTVS.tds-gaia");
                    const tdsExt: vscode.Extension<any> | undefined = vscode.extensions.getExtension("TOTVS.tds-vscode");
                    let body: any = this.initBatchBody(TypeFeedbackEnum.TraceCreate,
                        EventsFeedbackEnum.Login,
                        {
                            "name": PREFIX_GAIA,
                            "userId": user.email,
                            // "input": "",
                            // "output": "",
                            "metadata": {
                                "email": user.email,
                                "company": user.orgs?.join(",") || "",
                                "gaiaVersion": gaiaExt?.packageJSON.version || "unavailable",
                                "tdsVersion": tdsExt?.packageJSON.version || "unavailable",
                            }
                        });

                    this.jsonRequest("POST", "", {}, body).then((response: any) => {
                        if (response.errors.length > 0) {
                            logger.error("eventLogin: errors", response["errors"]);
                            reject(new Error("eventLogin: errors"));
                        } else if (response.successes) {
                            this.traceMap[EventsFeedbackEnum.Login] = body.metadata;
                            resolve(response.successes);
                        } else {
                            logger.error("eventLogin: unexpected response");
                            logger.error(response);
                            reject(new Error("Invalid response"));
                        }
                    });
                } else {
                    logger.error("eventLogin: user not found");
                    this._authorization = ""; //evita novas chamadas deste e demais eventos
                    reject(new Error("eventLogin: user not found"));
                }
            }

            logger.profile("eventLogin");
            return result;
        });
    }

    //curl -X POST https://langfuse-api.example.com/traces/trace_id/update -d 'updated_data=your_updated_data'
    eventLogout(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            logger.profile("eventLogout");
            let result: boolean = false;

            if (this._authorization.length > 0) {
                const user: LoggedUser | undefined = getGaiaUser();

                if (user) {
                    const endDate: Date = new Date();

                    console.log(this.traceMap[EventsFeedbackEnum.Login]);

                    let body: any = this.initBatchBody(TypeFeedbackEnum.EventCreate,
                        EventsFeedbackEnum.Logout,
                        {
                            "name": PREFIX_GAIA,
                            "userId": user.email,
                            // "input": "",
                            // "output": "",
                            "metadata": {
                                ...this.traceMap[EventsFeedbackEnum.Login],
                                "start": this.startDate.toISOString(),
                                "end": endDate.toISOString(),
                                "duration": (endDate.getMilliseconds() - this.startDate.getMilliseconds()) / 1000 //segundos,
                            }
                        });

                    //body.batch.id = this.traceMap[EventsFeedbackEnum.Login];

                    await this.jsonRequest("POST", "", {}, body).then((response: any) => {
                        console.log("***********************************");
                        console.dir(response);
                        
                        if (response.errors.length > 0) {
                            logger.error("eventLogin: errors", response["errors"]);
                            reject(new Error("eventLogin: errors"));
                        } else if (response.successes) {
                            this.traceMap[EventsFeedbackEnum.Login] = response.successes.id;
                            resolve(response.successes);
                        } else {
                            logger.error("eventLogin: unexpected response");
                            logger.error(response);
                            reject(new Error("Invalid response"));
                        }
                    });
                } else {
                    logger.error("eventLogin: user not found");
                    this._authorization = ""; //evita novas chamadas deste e demais eventos
                    reject(new Error("eventLogin: user not found"));
                }
            }
            this._authorization = "";

            logger.profile("eventLogin");
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

    eventGeneric(data: any) {
        logger.profile("eventGeneric");
        logger.profile("eventGeneric");

    }
}
