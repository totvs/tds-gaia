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
import { getGaiaLogLevel, getGaiaUser, isGaiaLogged, isGaiaShowBanner } from './config';
import { ChatViewProvider } from './panels/chatViewProvider';
import { PREFIX_GAIA, logger } from './logger';
import { registerIaCommands } from './commands/IA/index';
import { registerChatCommands } from './commands/chat';
import { registerAuthentication } from './authenticationProvider';
import { updateContextKey } from './util';
import { registerInlineCompletionItemProvider } from './completionItemProvider';
import { feedbackApi, llmApi } from './api';

let extensionContext: vscode.ExtensionContext;

/**
 * Activates the extension by recording the handling of commands, events and others.
*/
export function activate(context: vscode.ExtensionContext) {
	logger.info(
		vscode.l10n.t('Congratulations, your extension "{0}" is now active!', PREFIX_GAIA)
	);

	extensionContext = context;
	handleConfigChange(context);

	showBanner()

	registerAuthentication(context)
	registerIaCommands(context);
	registerChatCommands(context);
	registerInlineCompletionItemProvider(context);

	// Register TDS-Gaia CodeLens provider
	// let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
	// 	{
	// 		language: "advpl",
	// 		scheme: "file"
	// 	},
	// 	new GaiaCodeLensProvider()
	// );
	// ctx.subscriptions.push(codeLensProviderDisposable);

	//Chat Gaia
	const chat: ChatViewProvider = new ChatViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chat));

	//aciona a verificação do serviço no ar e posterior login
	vscode.commands.executeCommand("tds-gaia.health", false);
}

/**
 * Deactivates the extension by stopping the IA API client.
 */
export function deactivate() {

	return new Promise(async (value: any) => {
		feedbackApi.stop();
		await llmApi.stop();
	});
}


function handleConfigChange(context: vscode.ExtensionContext) {
	const listener: vscode.Disposable = vscode.workspace.onDidChangeConfiguration(async event => {
		if (event.affectsConfiguration('tds-gaia')) {
			updateContextKey("logged", isGaiaLogged());
			logger.level = getGaiaLogLevel();
		}
	});

	updateContextKey("logged", isGaiaLogged());

	context.subscriptions.push(listener);
}

/**
 * Shows a welcome banner on the first start of the extension.
 * The banner contains the extension name, version, info, and link to the repo.
 */
function showBanner(force: boolean = false): void {
	const showBanner: boolean = isGaiaShowBanner();

	if (showBanner || force) {
		let ext = vscode.extensions.getExtension("TOTVS.tds-gaia");
		// prettier-ignore
		{
			const lines: string[] = [
				"",
				"--------------------------------------v---------------------------------------------",
				"    ////////  ////////  ///  //////// |  TDS-Gaia, your partner in AdvPL programming",
				`   //        //    //       //    //  |  Version ${ext?.packageJSON["version"]} (BETA)`,
				`  //  ====  ////////  ///  ////////   |  TOTVS Technology`,
				" //    //  //    //  ///  //    //    |",
				"////////  //    //  ///  //    //     |  https://github.com/totvs/tds-gaia",
				"-----------------------------=--------^---------------------------------------------",
			];

			logger.info(lines.join("\n"));
		}
	}
}

/**
 * Checks if this is the first time TGaia has been used by checking 
 * if there is a last login date set in the configuration.
 * 
 * @returns True if this is the first time TGaia is being used, false otherwise.
 */
export async function isGaiaFirstUse(): Promise<boolean> {
	if ((getGaiaUser()?.email || "").startsWith("//")) {
		await isGaiaUpdated(true);
	}

	const information: any = JSON.parse((await extensionContext.secrets.get("tds-gaia.information") || "{}"));

	return (information.lastLogin || "").length == 0;
}

export async function isGaiaUpdated(remove: boolean): Promise<boolean> {
	if (remove) {
		await extensionContext.secrets.delete("tds-gaia.information");
		return false;
	}

	const information: any = JSON.parse((await extensionContext.secrets.get("tds-gaia.information") || "{}"));
	return (information.version || extensionContext.extension.packageJSON.version) == extensionContext.extension.packageJSON.version;
}

export async function updateGaiaLastLogin(): Promise<void> {
	const information: any = JSON.parse((await extensionContext.secrets.get("tds-gaia.information") || "{}"));

	information.version = extensionContext.extension.packageJSON.version;
	information.lastLogin = new Date().toISOString();

	await extensionContext.secrets.store("tds-gaia.information", JSON.stringify(information));
}
