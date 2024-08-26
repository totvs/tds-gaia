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
import { getGaiaConfiguration, LoggedUser, TGaiaConfig } from "../config";
import { AbstractApi } from "./interfaceApi";
import { PREFIX_GAIA, logger } from "../logger";
import { Queue } from "../queue";
import { EventElement, ScoreElement, TraceElement } from "./traceTypes";

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
const config: TGaiaConfig = getGaiaConfiguration();
const END_POINT: string = config.endPointEvent;

type TQueueData = TraceElement | EventElement | ScoreElement;

export class TraceApi extends AbstractApi {
    private authorization: string = "";
    private user: LoggedUser | undefined = undefined;
    private queue: Queue<TQueueData> = new Queue<TQueueData>();

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

    /**
    * Initializes the Trace Service by setting the authorization header with the provided public and secret keys.
    *
    * @param publicKey - The public key for the Trace Service.
    * @param secretKey - The secret key for the Trace Service.
    * @returns `true` if the initialization was successful, `false` otherwise.
    */
    start(publicKey: string, secretKey: string): boolean {
        this.authorization = Buffer.from(`pk-lf-${publicKey}:sk-lf-${secretKey}`).toString("base64");

        logger.info(vscode.l10n.t("Trace Service is running. EndPoint: {0}", this.endPoint));

        return true;
    }

    /**
    * Stops the current session by clearing the authorization and user information.
    * @returns `true` if the session was successfully stopped, `false` otherwise.
    */
    stop(): boolean {
        this.authorization = "";
        this.user = undefined;

        return true;
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
        headers["authorization"] = `Basic ${this.authorization}`

        return super.jsonRequest(method, url, headers, data);
    }

    createTrace(): TraceElement {
        let trace: TraceElement = new TraceElement();

        trace.name = PREFIX_GAIA;

        return trace;
    }

    createEvent(trace: TraceElement): EventElement {
        const event: EventElement = new EventElement(trace);

        return event;
    }

    createScore(trace: TraceElement): ScoreElement {
        const score: ScoreElement = new ScoreElement(trace);

        return score;
    }

    enqueue(element: TQueueData) {
        this.queue.enqueue(element);
    }

    sendQueue(): void {
        const data: {}[] = [];

        while (this.queue.size() > 0) {
            const element = this.queue.dequeue();

            if (element !== undefined) {
                data.push(element.toJSON())
            }
        }

        if (data.length > 0) {
            this.jsonRequest("POST", "", {}, { "batch": data })
                .then(response => {
                    if (response instanceof Error) {
                        logger.error("sendQueue: ERROR.");
                        logger.error(response);
                    } else {
                        logger.debug("sendQueue: SUCCESS. Messages sent: {0}", (response as any).successes.length);
                        logger.debug(JSON.stringify(data));
                    }
                })
                .catch(error => {
                    logger.error("sendQueue: ERROR. Messages count: {0}", data.length);
                    logger.error(JSON.stringify(data));
                    logger.error(error);
                });
        } else {
            logger.debug("sendQueue: Empty queue.");
        }
    }

}
