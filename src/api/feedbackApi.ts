/*
Copyright 2024 TOTVS S.A

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http: //www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import * as vscode from "vscode";
import { getGaiaConfiguration, LoggedUser } from "../config";
import { Completion, InferType } from "./interfaceApi";
import { logger } from "../logger";
import { TraceApi } from "./traceApi";
import { EventElement, ScoreElement, TraceElement } from "./traceTypes";
import { sanitizeJson } from "../util";

enum EventsFeedbackEnum {
    Login = "login",
    Logout = "logout",
    SelectedCompletion = "selectedCompletion",
    InferType = "inferType",
    // Completion = "completion",
    // Score = "score",
    // Infer = "infer",
    Request = "request"
}

export enum ScoreEnum {
    Relative = -1,
    Negative = 0,
    Positive = 5
}

export class FeedbackApi {
    private user: LoggedUser | undefined;
    private feedbackMap: Record<string, string> = {};
    private traceApi: TraceApi = new TraceApi();
    private elementMap: Record<string, TraceElement | EventElement> = {};

    /**
     * Constructor for FeedbackApi class.
     * Initializes the Feedback Api client.
     * 
     */
    constructor() {
        //
    }

    /**
    * Starts the feedback service by initializing the trace API with the provided public and secret keys.
    *
    * @param publicKey - The public key to use for the trace API.
    * @param secretKey - The secret key to use for the trace API.
    * @returns A Promise that resolves to `true` when the feedback service has been successfully started.
    */
    start(publicKey: string, secretKey: string): boolean {
        this.traceApi.start(publicKey, secretKey);

        logger.info(vscode.l10n.t("Feedback Service is running"));
        this.user = getGaiaConfiguration().currentUser;

        return true;
    }

    stop(): boolean {
        this.traceApi.stop();
        this.user = undefined;

        return true;
    }

    private createTrace(name: string): TraceElement {
        let result!: TraceElement;

        if (this.user) {
            result = this.traceApi.createTrace(name);
            result.userId = this.user.email;
        } else {
            logger.error("createTrace: user not found");
        }

        return result;
    }

    private createEvent(trace: TraceElement, event: EventsFeedbackEnum): EventElement {
        const result = this.traceApi.createEvent(trace);

        result.name = event;

        this.elementMap[event] = result;

        return result;
    }

    private createScore(trace: TraceElement): ScoreElement {
        const result = this.traceApi.createScore(trace);

        return result;
    }

    /**
    * Logs the user's login event to the feedback API.
    * @returns A Promise that resolves to a boolean indicating whether the login event was successfully logged.
    */
    eventLogin(): void {
        if (this.user == undefined) {
            this.user = getGaiaConfiguration().currentUser;
        }

        if (this.user) {
            const trace: TraceElement = this.createTrace("login");

            trace.metadata = {
                "email": this.user.email,
                "name": this.user.fullname,
                "company": this.user.orgs?.join(",") || "",
                "vscode": {
                    "version": vscode.version,
                    "language": vscode.env.language,
                    "arc": process.arch,
                    "platform": process.platform,
                    "processor": process.env.PROCESSOR_ARCHITECTURE || "unavailable",
                    "processorID": process.env.PROCESSOR_IDENTIFIER || "unavailable"
                }
            }

            const event: EventElement = this.createEvent(trace, EventsFeedbackEnum.Login);

            this.traceApi.enqueue(trace);
            this.traceApi.enqueue(event);
            this.traceApi.sendQueue();

            this.elementMap[EventsFeedbackEnum.Login] = event;
            //this.traceMap[trace.id] = trace;
        } else {
            logger.error("eventLogin: user not found");
        }

        return;
    }

    eventLogout(): boolean {
        const eventLogin: EventElement = this.elementMap[EventsFeedbackEnum.Login] as EventElement;
        let result: boolean = false;

        if (eventLogin) {
            const eventLogout: EventElement = this.createEvent(eventLogin.trace, EventsFeedbackEnum.Logout);

            eventLogout.input = JSON.stringify({
                //"start": eventLogin.timeStamp.toISOString(),
                //"end": eventLogout.timeStamp.toISOString(),
                //"duration": `${(eventLogout.timeStamp.getMilliseconds() - eventLogin.timeStamp.getMilliseconds()) / 1000} seg`
            });

            this.traceApi.enqueue(eventLogout);
            this.traceApi.sendQueue();

            delete this.elementMap[EventsFeedbackEnum.Login];
        } else {
            logger.debug("eventLogout: login event not found in map.");
        }

        this.user = undefined;

        return result;
    }

    eventCompletion(argument: { selected: number, completions: Completion[]; textBefore: string; textAfter: string; }) {
        if (this.user) {
            const trace: TraceElement = this.createTrace("completion");
            trace.input = JSON.stringify({
                textBefore: argument.textBefore,
                textAfter: argument.textAfter,
            });
            trace.output = JSON.stringify({
                completions: argument.completions,
            });

            const event: EventElement = this.createEvent(trace, EventsFeedbackEnum.SelectedCompletion);
            event.input = JSON.stringify({
                "index": argument.selected
            });
            event.output = argument.selected !== 1
                ? JSON.stringify(argument.completions[argument.selected])
                : "";

            const score: ScoreElement = this.createScore(trace);
            score.name = "completion";
            score.value = argument.selected !== 1 ? ScoreEnum.Positive : ScoreEnum.Negative;

            this.traceApi.enqueue(trace);
            this.traceApi.enqueue(event);
            this.traceApi.enqueue(score);
            this.traceApi.sendQueue();
        } else {
            logger.error("eventCompletion: user not found");
        }
    }

    /**
    * Traces the feedback for the given message ID.
    *
    * @param codeToAnalyze - The code to analyze for feedback.
    * @param types - The types to include in the feedback.
    * @returns 
    */
    traceInferType(messageId: string, codeToAnalyze: string, types: InferType[]): string {
        let result: string = "";

        if (this.user) {
            const trace: TraceElement = this.createTrace("inferType");
            trace.input = JSON.stringify({
                code: codeToAnalyze,
            });
            trace.output = JSON.stringify({
                types: types,
            });
            trace.metadata = {
                "typesCount": types.length,
                "scorePerItem": ScoreEnum.Positive / types.length
            }

            this.traceApi.enqueue(trace);
            this.traceApi.sendQueue();

            this.elementMap[trace.id] = trace;
            this.feedbackMap[messageId] = trace.id;
        } else {
            logger.error("traceInferType: user not found");
        }

        return result;
    }

    scoreInferType(messageId: string, types: InferType[], scoreValue: number, comment: string = "", unregister: boolean = false) {
        let result: string = "";

        if (this.user) {
            const traceId: string = this.feedbackMap[messageId];
            const trace: TraceElement = this.elementMap[traceId] as TraceElement;

            if (trace) {
                const event: EventElement = this.createEvent(trace, EventsFeedbackEnum.InferType);
                event.input = JSON.stringify({
                    "types": types
                });

                const score: ScoreElement = this.createScore(trace);
                score.name = "inferType";
                score.value = scoreValue == ScoreEnum.Relative
                    ? ((trace.metadata || {})["scorePerItem"]) * types.length || ScoreEnum.Positive
                    : scoreValue;
                score.comment = comment;

                //this.traceApi.enqueue(trace);
                //this.traceApi.enqueue(event);
                this.traceApi.enqueue(score);
                this.traceApi.sendQueue();

                if (unregister) {
                    delete this.elementMap[traceId];
                    delete this.feedbackMap[messageId];
                }
            } else {
                logger.error("eventInferType: Infer trace element not found");
            }
        }

        return result;
    }

    scoreMessage(messageId: string, scoreValue: number) {

        if (this.user) {
            const traceId: string = this.feedbackMap[messageId];
            const trace: TraceElement = this.elementMap[traceId] as TraceElement;

            if (trace) {
                const score: ScoreElement = this.createScore(trace);
                score.name = "chat-msg";
                score.value = scoreValue;
                score.comment = "Score the chat message";

                this.traceApi.enqueue(score);
                this.traceApi.sendQueue();
            } else {
                logger.error("scoreMessage: Message trace element not found");
            }
        }

        return;
    }

    commentTrace(messageId: string, comment: string) {

        if (this.user) {
            const traceId: string = this.feedbackMap[messageId];
            const trace: TraceElement = this.elementMap[traceId] as TraceElement;

            if (trace) {
                if (!trace.metadata) {
                    trace.metadata = {}
                }
                let comments: string[] = trace.metadata.comment ? trace.metadata.comment!.split("\n") : [];
                comments.push(`${new Date().toTimeString()}: ${comment}`);
                trace.metadata = {
                    ...trace.metadata,
                    "comment": comments.join("\n")
                }

                trace.tags = [...trace.tags, "comment"];

                this.traceApi.enqueue(trace);
                this.traceApi.sendQueue();
            } else {
                logger.error("scoreMessage: Message trace element not found");
            }
        }

        return;
    }

    /**
    * Traces the explanation of a code snippet.
    *
    * @param messageId - The ID of the message associated with the code explanation.
    * @param codeToExplain - The code snippet to be explained.
    * @param explain - The explanation for the code snippet.
    */
    traceExplain(messageId: string, codeToExplain: string, explain: string): void {
        let result: string = "";

        if (this.user) {
            const trace: TraceElement = this.createTrace("explain");
            trace.input = JSON.stringify({
                code: codeToExplain,
            });
            trace.output = JSON.stringify({
                explain: explain,
            });

            this.traceApi.enqueue(trace);
            this.traceApi.sendQueue();

            this.elementMap[trace.id] = trace;
            this.feedbackMap[messageId] = trace.id;
        } else {
            logger.error("traceExplain: user not found");
        }

        return;
    }

    traceGenerateCode(messageId: string, generateText: string, generateCode: string[]) {
        if (this.user) {
            const trace: TraceElement = this.createTrace("generateCode");
            trace.input = JSON.stringify({
                code: generateText,
            });
            trace.output = JSON.stringify({
                generateCode: generateCode,
            });
            trace.metadata = {
                "lines": generateCode.length,
                "completeCode": generateCode,
            }

            this.traceApi.enqueue(trace);
            this.traceApi.sendQueue();

            this.elementMap[trace.id] = trace;
            this.feedbackMap[messageId] = trace.id;
        } else {
            logger.error("traceGenerateCode: user not found");
        }

        return;
    }

    traceRequestError(status: number, statusText: string, url: string, method: string, headers: {}, body: string | object): void {
        let result: string = "";

        if (this.user) {
            const trace: TraceElement = this.createTrace("requestError");
            trace.input = JSON.stringify({
                url: url,
                method: method,
            });
            trace.output = JSON.stringify({
                status: status,
                statusText: statusText,
            });
            trace.metadata = {
                headers: sanitizeJson(headers),
                body: body,
            }
            this.traceApi.enqueue(trace);

            const event: EventElement = this.createEvent(trace, EventsFeedbackEnum.Request);
            event.level = "ERROR";
            event.input = JSON.stringify({
                url: url,
                method: method,
            });
            event.output = JSON.stringify({
                status: status,
                statusText: statusText,
            });

            this.traceApi.enqueue(event);
            this.traceApi.sendQueue();
        } else {
            logger.error("traceRequestError: user not found");
        }

        return;
    }

}
