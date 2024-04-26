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
    Completion = "completion",
    Score = "score",
}

enum ScoreEnum {
    Negative = 0,
    Positive = 5
}

const END_POINT: string = "https://events.dta.totvs.ai";

export class FeedbackApi extends AbstractApi {
    // prefixo _ indica envolvidas com a API CAROL
    private _authorization: string = "";
    private startDate: Date = new Date(); //apenas para evitar erro sintaxe, atribuído em #eventLogin
    private traceId: string = "";
    private user: LoggedUser | undefined = undefined;

    private _traceMap: Record<EventsFeedbackEnum, string> = {
        "login": "",
        "logout": "",
        "completion": "",
        "score": "",
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

    async start(accessToken: string): Promise<boolean> {
        this._authorization = accessToken;
        this._authorization = Buffer.from("pk-lf-b1633e3c-c038-4dbe-af55-82bf21be0fd5:sk-lf-bdad2a8c-f646-4ab6-886a-66401033cc48").toString("base64");

        logger.info(vscode.l10n.t("Logging Service is using [{0}]", this.apiRequest));

        return Promise.resolve(true);
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
    private initBatchBody(type: TypeFeedbackEnum, event: EventsFeedbackEnum, data: { [key: string]: any }, parentTrace?: string): { [key: string]: any } {
        data["sessionId"] = this.sessionId;

        if (this.traceId !== "") {
            data["traceId"] = parentTrace ? parentTrace : this.traceId;
        }

        return {
            "batch": [
                {
                    "type": type,
                    "id": this.traceId !== "" ? `${event}_id_${randomUUID()}` : `trace_id_${randomUUID()}`,
                    "timestamp": new Date().toISOString(),
                    "body": data
                }
            ],
        }
    }

    async createTrace(): Promise<boolean> {
        logger.profile("createTrace");
        let result: boolean = false;

        if (this._authorization.length > 0) {
            this.user = getGaiaUser();

            if (this.user) {
                this.startDate = new Date();

                const gaiaExt: vscode.Extension<any> | undefined = vscode.extensions.getExtension("TOTVS.tds-gaia");
                const tdsExt: vscode.Extension<any> | undefined = vscode.extensions.getExtension("TOTVS.tds-vscode");
                let body: any = {
                    "batch": [
                        {
                            "type": "trace-create",
                            "id": `trace_id_${randomUUID()}`,
                            "timestamp": "2024-15-04T02:20:00.000Z",
                            "body": {
                                "id": `trace_id_${randomUUID()}`,
                                "sessionId": this.sessionId,
                                "name": PREFIX_GAIA,
                                "userId": this.user.email,
                                // "input": "some input events",
                                // "output": "some output events",
                                "metadata": {
                                    "email": this.user.email,
                                    "company": this.user.orgs?.join(",") || "",
                                    "gaiaVersion": gaiaExt?.packageJSON.version || "unavailable",
                                    "tdsVersion": tdsExt?.packageJSON.version || "unavailable",
                                },
                            }
                        }
                    ]
                }

                const response: any = await this.jsonRequest("POST", "", {}, body);
                if (response.errors.length > 0) {
                    logger.error("createTrace: errors", response["errors"]);
                } else if (response.successes) {
                    this.traceId = response.successes[0].id;
                    result = true;
                } else {
                    logger.error("createTrace: unexpected response");
                    logger.error(response);
                }
                //});
            } else {
                logger.error("createTrace: user not found");
            }
        }

        if (!result) {
            this.traceId = "";
            this._authorization = ""; //evita novas chamadas deste e demais eventos
        }

        logger.profile("createTrace");

        return Promise.resolve(result);
    }

    /**
    * Logs the user's login event to the feedback API.
    * @returns A Promise that resolves to a boolean indicating whether the login event was successfully logged.
    */
    async eventLogin(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            logger.profile("eventLogin");
            let result: boolean = false;

            if (this._authorization.length > 0) {
                if (this.traceId == "") {
                    await this.createTrace();
                }

                if (this.user) {
                    this.startDate = new Date();

                    const gaiaExt: vscode.Extension<any> | undefined = vscode.extensions.getExtension("TOTVS.tds-gaia");
                    const tdsExt: vscode.Extension<any> | undefined = vscode.extensions.getExtension("TOTVS.tds-vscode");
                    let body: any = this.initBatchBody(TypeFeedbackEnum.EventCreate,
                        EventsFeedbackEnum.Login,
                        {
                            "name": EventsFeedbackEnum.Login,
                            "userId": this.user.email,
                            // "input": this.user.email,
                            // "output": "",
                            "metadata": {
                                "email": this.user.email,
                                "company": this.user.orgs?.join(",") || "",
                                "gaiaVersion": gaiaExt?.packageJSON.version || "unavailable",
                                "tdsVersion": tdsExt?.packageJSON.version || "unavailable",
                            }
                        });

                    this.jsonRequest("POST", "", {}, body).then((response: any) => {
                        if (response.errors.length > 0) {
                            logger.error("eventLogin: errors", response["errors"]);
                            reject(new Error("eventLogin: errors"));
                        } else if (response.successes) {
                            //this._traceMap[EventsFeedbackEnum.Login] = response.successes[0].id;
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
                if (this.user) {
                    const endDate: Date = new Date();

                    let body: any = this.initBatchBody(TypeFeedbackEnum.EventCreate,
                        EventsFeedbackEnum.Logout,
                        {
                            "name": PREFIX_GAIA,
                            "userId": this.user.email,
                            // "input": "",
                            // "output": "",
                            "metadata": {
                                //...this.traceMap[EventsFeedbackEnum.Login],
                                "start": this.startDate.toISOString(),
                                "end": endDate.toISOString(),
                                "duration": (endDate.getMilliseconds() - this.startDate.getMilliseconds()) / 1000 //segundos,
                            }
                        });

                    //body.batch.id = this.traceMap[EventsFeedbackEnum.Login];

                    await this.jsonRequest("POST", "", {}, body).then((response: any) => {
                        if (response.errors.length > 0) {
                            logger.error("eventLogout: errors", response["errors"]);
                            reject(new Error("eventLogout: errors"));
                        } else if (response.successes) {
                            //this.traceMap[EventsFeedbackEnum.Login] = response.successes.id;
                            resolve(response.successes);
                        } else {
                            logger.error("eventLogin: unexpected response");
                            logger.error(response);
                            reject(new Error("Invalid response"));
                        }
                    });
                } else {
                    logger.error("eventLogout: user not found");
                    this._authorization = ""; //evita novas chamadas deste e demais eventos
                    reject(new Error("eventLogin: user not found"));
                }
            }

            this.user = undefined;
            this.traceId = "";

            logger.profile("eventLogout");
            return result;
        });
    }

    eventCompletion(argument: { selected: number, completions: Completion[]; textBefore: string; textAfter: string; }) {

        return new Promise(async (resolve, reject) => {
            logger.profile("eventCompletion");
            let result: boolean = false;

            if (this._authorization.length > 0) {
                if (this.traceId == "") {
                    await this.createTrace();
                }

                if (this.user) {
                    let body: any = this.initBatchBody(TypeFeedbackEnum.TraceCreate,
                        EventsFeedbackEnum.Completion,
                        {
                            "name": EventsFeedbackEnum.Completion,
                            "userId": this.user.email,
                            "input": JSON.stringify({
                                textBefore: argument.textBefore,
                                textAfter: argument.textAfter
                            }, undefined, 2),
                            "output": JSON.stringify({
                                completions: argument.completions,
                            }, undefined, 2),
                            "metadata": {
                                "selected": argument.selected,
                            }
                        });

                    this._traceMap[EventsFeedbackEnum.Completion] = "";
                    this.jsonRequest("POST", "", {}, body).then((response: any) => {
                        if (response.errors.length > 0) {
                            logger.error("eventCompletion: errors", response["errors"]);
                            reject(new Error("eventCompletion: errors"));
                        } else if (response.successes) {
                            this._traceMap[EventsFeedbackEnum.Completion] = response.successes[0].id;
                            this.createScore(
                                this._traceMap[EventsFeedbackEnum.Completion],
                                argument.selected == -1 ? ScoreEnum.Negative : ScoreEnum.Positive,
                                argument.completions[argument.selected].generated_text || "<no suggestion>"
                            );
                            resolve(response.successes);
                        } else {
                            logger.error("eventLogin: unexpected response");
                            logger.error(response);
                            reject(new Error("Invalid response"));
                        }
                    });


                    result = true;
                } else {
                    logger.error("eventLogin: user not found");
                    this._authorization = ""; //evita novas chamadas deste e demais eventos
                    reject(new Error("eventLogin: user not found"));
                }
            }

            logger.profile("eventCompletion");
            return result;
        });
    }

    private createScore(traceId: string, score: number, comment: string): boolean {
        logger.profile("eventCompletion");
        let result: boolean = false;

        if (this.user) {
            let body: any = this.initBatchBody(TypeFeedbackEnum.ScoreCreate,
                EventsFeedbackEnum.Score,
                {
                    "name": PREFIX_GAIA,
                    "traceId": traceId,
                    "value": score,
                    "comment": comment
                },
                traceId);

            this.jsonRequest("POST", "", {}, body).then((response: any) => {
                if (response.errors.length > 0) {
                    logger.error("createScore: errors", response["errors"]);
                } else if (response.successes) {
                    //this._traceMap[EventsFeedbackEnum.Completion] = response.successes[0].id;
                } else {
                    logger.error("createScore: unexpected response");
                    logger.error(response);
                    //reject(new Error("Invalid response"));
                }
            });

            result = true;
        } else {
            logger.error("createScore: user not found");
            this._authorization = ""; //evita novas chamadas deste e demais eventos
            //reject(new Error("eventLogin: user not found"));
        }


        logger.profile("createScore");
        return result;
    }

    eventGeneric(data: any) {
        logger.profile("eventGeneric");
        logger.profile("eventGeneric");

    }
}
