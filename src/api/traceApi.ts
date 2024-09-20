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
import { getGaiaConfiguration } from "../config";
import { AbstractApi } from "./interfaceApi";
import { PREFIX_GAIA, logger } from "../logger";
import { Queue } from "../queue";
import { EventElement, ScoreElement, TraceElement } from "./traceTypes";
import { Langfuse } from "langfuse-langchain";

type TQueueData = TraceElement | EventElement | ScoreElement;

export class TraceApi extends AbstractApi {
    private authorization: string = "";
    private queue: Queue<TQueueData> = new Queue<TQueueData>();
    private langfuse!: Langfuse;

    /**
     * Constructor for FeedbackApi class.
     * Initializes the Feedback Api client.
     * 
     */
    constructor() {
        super(`${getGaiaConfiguration().endPointEvent}`, "v1");

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
        this.langfuse = new Langfuse({
            secretKey: `sk-lf-${secretKey}`,
            publicKey: `pk-lf-${publicKey}`,
            baseUrl: `${this.apiRequest}`, //"https://cloud.langfuse.com",
            flushAt: 1,
            release: `${getGaiaConfiguration().apiVersion}`,
        });
        // this.langfuse.debug(true);

        // const trace = this.langfuse.trace({
        //     //id: this.sessionId,
        //     name: "gaia-trace-new",
        //     //release: `${getGaiaConfiguration().apiVersion}`,
        // });
        //console.log(trace);

        logger.info(vscode.l10n.t("Trace Service is running. EndPoint: {0}", this.endPoint));

        return true;
    }

    /**
    * Stops the current session by clearing the authorization and user information.
    * @returns `true` if the session was successfully stopped, `false` otherwise.
    */
    stop(): boolean {
        this.authorization = "";

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
        trace.tags.push(`gaia-${getGaiaConfiguration().gaiaVersion}`)
        trace.tags.push(`tds-${getGaiaConfiguration().tdsVersion}`)

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
        let countMsg: number = 0;

        while (this.queue.size() > 0) {
            const element = this.queue.dequeue();

            if (element !== undefined) {
                if (element instanceof TraceElement) {
                    this.langfuse.trace(element.toJson());
                } else if (element instanceof EventElement) {
                    this.langfuse.event(element.toJson());
                } else if (element instanceof ScoreElement) {
                    this.langfuse.score(element.toJson() as any);
                }

                countMsg++;
            }
        }

        // if ((this.authorization !== "")) {
        //     this.langfuse.flushAsync()
        //         .then((data) => {
        //             logger.debug("sendQueue: SUCCESS. Messages sent: {0}", countMsg);
        //             logger.debug(data);
        //         })
        //         .catch(error => {
        //             logger.error("sendQueue: ERROR. Messages count: {0}", countMsg);
        //             logger.error(error);
        //         });
        // } else {
        //     logger.debug("sendQueue: Empty queue.");
        // }
    }

}
