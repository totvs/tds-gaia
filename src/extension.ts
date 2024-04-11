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
import { initStatusBarItems, updateStatusBarItems } from './statusBar';
import { getDitoLogLevel, isDitoLogged, isDitoShowBanner } from './config';
import { IaApiInterface } from './api/interfaceApi';
import { CarolApi } from './api/carolApi';
import { ChatViewProvider } from './panels/chatViewProvider';
import { ChatApi } from './api/chatApi';
import { DitoCodeLensProvider } from './codeLens';
import { logger } from './logger';
import { InlineCompletionItemProvider } from './completionItemProvider';
import { registerIaCommands } from './commands/IA/index';
import { registerChatCommands } from './commands/chat';
import { registerAuthentication } from './authenticationProvider';

let ctx: vscode.ExtensionContext;

export const chatApi: ChatApi = new ChatApi();
export const iaApi: IaApiInterface = new CarolApi(chatApi);

/**
 * Activates the extension by recording the handling of commands, events and others.
*/
export function activate(context: vscode.ExtensionContext) {
	logger.info(
		vscode.l10n.t('Congratulations, your extension "tds-dito" is now active!')
	);

	// Get the TS extension
	// const tsExtension = vscode.extensions.getExtension('TOTVS.tds-vscode');

	// if (!tsExtension) {
	// 	return;
	// }

	// Get the API from the TS extension
	//if (!tsExtension.exports || !tsExtension.exports.getAPI) {
	//	return;
	//}

	// const api = tsExtension.exports.getAPI(0);
	// if (!api) {
	// 	return;
	// }

	ctx = context;
	handleConfigChange(context);
	context.subscriptions.push(...initStatusBarItems());

	showBanner()

	//registerAuthentication(context)
	registerIaCommands(context, iaApi, chatApi);
	registerChatCommands(context, chatApi);

	InlineCompletionItemProvider.register(context);

	// Register TDS-Dito CodeLens provider
	let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
		{
			language: "advpl",
			scheme: "file"
		},
		new DitoCodeLensProvider()
	);
	ctx.subscriptions.push(codeLensProviderDisposable);

	//Chat DITO
	const chat: ChatViewProvider = new ChatViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chat));

	//aciona a verificação do serviço no ar e posterior login
	vscode.commands.executeCommand("tds-dito.health", false);
}

/**
 * Deactivates the extension by stopping the IA API client.
 */
export function deactivate() {

	return iaApi.stop();
}

/**
 * Updates a context key value in VS Code.
 * 
 * @param key - The context key to update.
 * @param value - The new value for the context key.
 */
export function updateContextKey(key: string, value: boolean | string | number) {
	vscode.commands.executeCommand('setContext', `tds-dito.${key}`, value);
}

function handleConfigChange(context: vscode.ExtensionContext) {
	const listener: vscode.Disposable = vscode.workspace.onDidChangeConfiguration(async event => {
		if (event.affectsConfiguration('tds-dito')) {
			updateContextKey("logged", isDitoLogged());
			logger.level = getDitoLogLevel();

			updateStatusBarItems();
		}
	});

	updateContextKey("logged", isDitoLogged());

	context.subscriptions.push(listener);
}

/**
   * Shows a welcome banner on the first start of the extension.
   * The banner contains the extension name, version, info, and link to the repo.
  */
function showBanner(force: boolean = false): void {
	const showBanner: boolean = isDitoShowBanner();

	if (showBanner || force) {
		let ext = vscode.extensions.getExtension("TOTVS.tds-dito-vscode");
		// prettier-ignore
		{
			const lines: string[] = [
				"",
				"--------------------------------v---------------------------------------------",
				"     ////    //  //////  ////// |  TDS-Dito, your partner in AdvPL programming",
				`    //  //        //    //  //  |  Version ${ext?.packageJSON["version"]} (EXPERIMENTAL)`,
				`   //  //  //    //    //  //   |  TOTVS Technology`,
				"  //  //  //    //    //  //    |",
				" ////    //    //    //////     |  https://github.com/totvs/tds-dito",
				"--------------------------------^----------------------------------------------",
			];

			logger.info(lines.join("\n"));
		}
	}
}
