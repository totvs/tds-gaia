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

interface ITraceElement {
    toJson(): {};
}

export class TraceElement implements ITraceElement {
    readonly id: string = randomUUID();

    name: string = "";
    userId: string = "";
    input: string = "";
    output: string = "";
    metadata: Record<string, any> | undefined = undefined;
    tags: string[] = []

    /**
    * Gets the current session ID.
    * @returns {string} The current session ID.
    */
    get sessionId(): string {
        return vscode.env.sessionId;
    };

    toJson(): {} {
        // id ?: string | null;
        // timestamp ?: string | null;
        // name ?: string | null;
        // userId ?: string | null;
        // input ?: unknown;
        // output ?: unknown;
        // sessionId ?: string | null;
        // release ?: string | null;
        // version ?: string | null;
        // metadata ?: unknown;
        // tags ?: string[] | null;
        // public ?: boolean | null;
        return {
            "id": this.id,
            "sessionId": this.sessionId,
            "name": this.name,
            "userId": this.userId,
            "input": this.input == "" ? undefined : this.input,
            "output": this.output == "" ? undefined : this.output,
            "metadata": this.metadata === undefined ? undefined : this.metadata,
            "tags": this.tags
        }
    }
}

export class EventElement implements ITraceElement {
    readonly trace: TraceElement;
    readonly id: string = randomUUID();

    name: string = "";
    input: {} = {};
    output: {} = {};
    level: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR" | "" = "";
    statusMessage: string = "";

    constructor(trace: TraceElement) {
        this.trace = trace;
    }

    toJson(): {} {
        return {
            //"id": this.id,
            "traceId": this.trace.id,
            "name": this.name,
            "input": this.input,
            "output": this.output,
            "level": this.level == "" ? undefined : this.level,
            "statusMessage": this.statusMessage == "" ? undefined : this.statusMessage,
        }
    }
}

export class ScoreElement implements ITraceElement {
    readonly trace: TraceElement;
    readonly id: string = randomUUID();

    value: number = -1;
    comment: string = "";
    name: string = "";

    constructor(trace: TraceElement) {
        this.trace = trace;
    }

    toJson(): {} {
        return {
            //"id": this.id,
            "traceId": this.trace.id,
            "name": this.name,
            "value": this.value,
            "comment": this.comment == "" ? undefined : this.comment,
        }
    }
}