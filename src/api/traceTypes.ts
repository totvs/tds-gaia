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
import { randomUUID } from "crypto";
import { PREFIX_GAIA } from "../logger";

export enum TypeFeedbackEnum {
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

interface ITraceElement {
    toJSON(): {};
}

export class TraceElement implements ITraceElement {
    readonly id: string = `trace_id_${randomUUID()}`;

    name: string = "";
    userId: string = "";
    input: string = "";
    output: string = "";
    metadata: {} | undefined = undefined;

    /**
    * Gets the current session ID.
    * @returns {string} The current session ID.
    */
    get sessionId(): string {
        return vscode.env.sessionId;
    };

    toJSON(): {} {

        return {
            "type": "trace-create",
            "id": `trace_id_${randomUUID()}`, //ID de envio
            "timestamp": new Date().toISOString(),
            "body": {
                "id": this.id,
                "sessionId": this.sessionId,
                "name": this.name,
                "userId": this.userId,
                "input": this.input == "" ? undefined : this.input,
                "output": this.output == "" ? undefined : this.output,
                "metadata": this.metadata === undefined ? undefined : this.metadata,
            }
        }
    }
}

export class EventElement implements ITraceElement {
    readonly trace: TraceElement;
    readonly id: string = `event_id_${randomUUID()}`;
    readonly timeStamp: Date = new Date();

    name: string = "";
    input: string = "";
    output: string = "";

    constructor(trace: TraceElement) {
        this.trace = trace;
    }

    toJSON(): {} {

        return {
            "type": "event-create",
            "id": `event_id_${randomUUID()}`, //ID de envio
            "timestamp": this.timeStamp.toISOString(),
            "body": {
                "id": this.id,
                "traceId": this.trace.id,
                "name": this.name,
                "input": this.input == "" ? undefined : this.input,
                "output": this.output == "" ? undefined : this.output,
            }
        };
    }
}

export class ScoreElement implements ITraceElement {
    readonly trace: TraceElement;
    readonly id: string = `score_id_${randomUUID()}`;
    readonly timeStamp: Date = new Date();
    value: number = -1;
    comment: string = "";
    name: string = "";

    constructor(trace: TraceElement) {
        this.trace = trace;
    }

    toJSON(): {} {

        return {
            "type": "score-create",
            "id": `score_id_${randomUUID()}`, //ID de envio
            "timestamp": this.timeStamp.toISOString(),
            "body": {
                "id": this.id,
                "traceId": this.trace.id,
                "name": this.name,
                "value": this.value,
                "comment": this.comment == "" ? undefined : this.comment,
            }
        };
    }
}