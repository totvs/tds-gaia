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

import * as vscode from 'vscode';

/**
* Enum representing the possible status values for a return type.
* - `Ok`: Indicates a successful operation.
* - `Info`: Indicates an informational message.
* - `Warning`: Indicates a warning condition.
* - `Error`: Indicates an error condition.
*/
export enum StatusReturnEnum {
    Ok,
    Info,
    Warning,
    Error
}

/**
* Represents the basic return type for API calls, containing a status and an optional message.
* @property {StatusReturnEnum} status - The status of the API call.
* @property {string} [message] - An optional message providing additional details about the API call.
*/
type TBasicReturn = {
    status: StatusReturnEnum;
    message?: string;
}

/**
* Represents the return type for a function that retrieves document symbols {getSymbols}.
* @property {TBasicReturn} - The basic return type, containing a status and an optional message.
* @property {vscode.DocumentSymbol[] | undefined} symbols - The document symbols retrieved, or undefined if none were found.
*/
export type TGetSymbolsReturn = TBasicReturn & {
    symbols: vscode.DocumentSymbol[] | undefined;
}

export type TBuildInferTextReturn = TBasicReturn & {
    text: string[];
}
