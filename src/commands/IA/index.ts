import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
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
* @param iaApi - The IA API interface.
* @param chatApi - The chat API.
*/
export function registerIaCommands(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {

    registerInfer(context);
    registerUpdateType(context);

    registerExplain(context, iaApi, chatApi);
    registerHealth(context, iaApi, chatApi);
    registerLogin(context, iaApi, chatApi);
    registerExplainWord(context, iaApi, chatApi);
    registerLogout(context, iaApi, chatApi);
    registerGenerateCode(context, iaApi, chatApi);
}