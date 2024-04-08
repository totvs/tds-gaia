import * as vscode from "vscode";
import { IaApiInterface } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { registerTypify } from './cmdTypify';
import { registerExplain } from './cmdExplain';
import { registerHealth } from "./cmdHealth";
import { registerLogin } from "./cmLogin";
import { registerExplainWord } from "./cmdExplainWord";
import { registerLogout } from "./cmdLogout";
import { registerGenerateCode } from "./cmdGenerateCode";

export function registerIaCommands(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {

    registerTypify(context, iaApi, chatApi);
    registerExplain(context, iaApi, chatApi);
    registerHealth(context, iaApi, chatApi);
    registerLogin(context, iaApi, chatApi);
    registerExplainWord(context, iaApi, chatApi);
    registerLogout(context, iaApi, chatApi);
    registerGenerateCode(context, iaApi, chatApi);

}