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
import { logger } from "../../logger";
import { chatApi } from "../../api";
import { ChatApi, TCommand } from "../../api/chatApi";

export function registerShowHint(context: vscode.ExtensionContext): void {

    const showHint = vscode.commands.registerCommand('tds-gaia.showHint', async (...args: any) => {
        const hint: string = `hint_${args[0].hint || ""}`;
        const command: TCommand | undefined = ChatApi.getCommand(hint);

        if (command && command.process) {
            command.process(chatApi);
        } else {
            logger.error(`Command '${hint}' not found`);
        }

    });

    context.subscriptions.push(showHint);
}