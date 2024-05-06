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
import { ChatApi, TCommand } from '../../api/chatApi';
import { registerClear } from "./cmdClear";
import { registerOpenManual } from "./cmdOpenManual";
import { registerHelp } from "./cmdHelp";
import { registerShowHint } from "./cmdShowHint";

export function registerChatCommands(context: vscode.ExtensionContext): void {

    completeCommandsMap(context.extension);
    registerClear(context);
    registerOpenManual(context);
    registerHelp(context);
    registerShowHint(context);
}

/**
 * Completes the commands map by adding details like captions, keybindings etc. 
 * from the extension's package.json.
 * 
 * @param extension - The VS Code extension object.
 */
function completeCommandsMap(extension: vscode.Extension<any>) {
    const commands: any = extension.packageJSON.contributes.commands;
    const keybindings: any = extension.packageJSON.contributes.keybindings;

    Object.keys(commands).forEach((key: string) => {
        const command: TCommand | undefined = ChatApi.getCommand(commands[key].command);

        if (command) {
            command.caption = command.caption || commands[key].shortTitle || commands[key].title;

            Object.keys(keybindings).forEach((key2: string) => {
                if (keybindings[key2].command == command.commandId) {
                    command.key = keybindings[key2].key;
                }
            });
        }
    });
}