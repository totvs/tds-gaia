import * as vscode from "vscode";
import { ChatApi, TCommand } from '../../api/chatApi';
import { registerClear } from "./cmdClear";
import { registerOpenManual } from "./cmdOpenManual";

export function registerChatCommands(context: vscode.ExtensionContext, chatApi: ChatApi): void {

    completeCommandsMap(context.extension);
    registerClear(context, chatApi);
    registerOpenManual(context, chatApi);
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