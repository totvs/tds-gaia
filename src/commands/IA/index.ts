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
import { registerInfer } from './cmdInferType';
import { registerExplain } from './cmdExplain';
import { registerHealth } from "./cmdHealth";
import { registerLogin } from "./cmdLogin";
import { registerExplainWord } from "./cmdExplainWord";
import { registerLogout } from "./cmdLogout";
import { registerGenerateCode } from "./cmdGenerateCode";
import { registerUpdateType } from "./cmdUpdateType";

/**
* Registers all the IA-related commands with the VS Code extension context.
*
* @param context - The VS Code extension context.
*/
export function registerIaCommands(context: vscode.ExtensionContext): void {

    registerInfer(context);
    registerUpdateType(context);

    registerExplain(context);
    registerHealth(context);
    registerLogin(context);
    registerExplainWord(context);
    registerLogout(context);
    registerGenerateCode(context);
}