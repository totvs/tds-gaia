import * as vscode from 'vscode';
import { initStatusBarItems, updateStatusBarItems } from './statusBar';
import { TDitoConfig, getDitoConfiguration, getDitoLogLevel, isDitoLogged, isDitoShowBanner, setDitoReady, setDitoUser } from './config';
import { inlineCompletionItemProvider } from './completionItemProvider';
import { CompletionResponse, IaApiInterface, TypifyResponse } from './api/interfaceApi';
import { CarolApi } from './api/carolApi';
import { PREFIX_DITO, logger } from './logger';
import { ChatViewProvider } from './panels/chatViewProvider';
import { ChatApi, completeCommandsMap } from './api/chatApi';

let ctx: vscode.ExtensionContext;

export const iaApi: IaApiInterface = new CarolApi();
export const chatApi: ChatApi = new ChatApi();

/**
 * Initializes the status bar items that will be displayed in VS Code. 
 * Registers callbacks to update the items when necessary.
*/
export function activate(context: vscode.ExtensionContext) {
	logger.info(
		vscode.l10n.t('Congratulations, your extension "tds-dito" is now active!')
	);

	// Get the TS extension
	const tsExtension = vscode.extensions.getExtension('TOTVS.tds-vscode');

	if (!tsExtension) {
		return;
	}

	// Get the API from the TS extension
	//if (!tsExtension.exports || !tsExtension.exports.getAPI) {
	//	return;
	//}

	// const api = tsExtension.exports.getAPI(0);
	// if (!api) {
	// 	return;
	// }

	completeCommandsMap(context.extension);

	ctx = context;
	handleConfigChange(context);
	const config: TDitoConfig = getDitoConfiguration();
	context.subscriptions.push(...initStatusBarItems());

	showBanner()
	//args[0], bool, quando true, ignora processamento se login automático falhar
	const login = vscode.commands.registerCommand('tds-dito.login', async (...args) => {
		let apiToken = await context.secrets.get('apiToken');

		if (apiToken !== undefined) {
			iaApi.start(apiToken).then(async (value: boolean) => {
				if (await iaApi.login()) {
					logger.info('Logged in successfully');
					return;
				}
			});
		}

		if (args.length > 0) {
			if (args[0]) { //indica que login foi acionado automaticamente
				return;
			}
		}

		const input = await vscode.window.showInputBox({
			prompt: 'Please enter your API token or @your name):',
			placeHolder: 'Your token goes here ...'
		});
		if (input !== undefined) {
			if (await iaApi.start(input)) {
				if (await iaApi.login()) {
					await context.secrets.store('apiToken', input);
					vscode.window.showInformationMessage(`${PREFIX_DITO} Logged in successfully`);
				} else {
					await context.secrets.delete('apiToken');
					vscode.window.showErrorMessage(`${PREFIX_DITO} Login failure`);
				}

				chatApi.checkUser("");
			}
		}
	});
	context.subscriptions.push(login);

	const logout = vscode.commands.registerCommand('tds-dito.logout', async (...args) => {
		iaApi.logout();
		await context.secrets.delete('apiToken');
		vscode.window.showInformationMessage(`${PREFIX_DITO} Logged out`);
	});
	context.subscriptions.push(logout);

	const detailHealth = vscode.commands.registerCommand('tds-dito.health', async (...args) => {
		let detail: boolean = true;
		const messageId = chatApi.dito("Verificando disponibilidade do serviço.");

		return new Promise((resolve, reject) => {
			if (args.length > 0) {
				if (!args[0]) { //solicitando verificação sem  detalhes
					detail = false;
				}
			}

			iaApi.checkHealth(detail).then((error: any) => {
				updateContextKey("readyForUse", error === undefined);
				setDitoReady(error === undefined);

				if (error !== undefined) {
					const message: string = `Desculpe, estou com dificuldades técnicas. ${chatApi.commandText("health")}`;
					chatApi.dito(message, messageId);
					vscode.window.showErrorMessage(`${PREFIX_DITO} ${message}`);

					if (error.message.includes("502: Bad Gateway")) {
						const parts: string = error.message.split("\n");
						chatApi.ditoInfo(parts[1]);
					}

					if (detail) {
						chatApi.ditoInfo(JSON.stringify(error, undefined, 2));
					}
				} else {
					vscode.commands.executeCommand("tds-dito.login", true).then(() => {
						chatApi.checkUser(messageId);
					});
				}
			})
		});
	});
	context.subscriptions.push(detailHealth);

	const clear = vscode.commands.registerCommand('tds-dito.clear', async () => {
		chatApi.user("clear", true);
	});
	context.subscriptions.push(clear);

	const openManual = vscode.commands.registerCommand('tds-dito.open-manual', async () => {
		const messageId: string = chatApi.dito("Abrindo manual do **TDS-Dito**.");
		const url: string = "https://github.com/brodao2/tds-dito/blob/main/README.md";

		return vscode.env.openExternal(vscode.Uri.parse(url)).then(() => {
			chatApi.dito("Manual do Dito aberto.", messageId);
		}, (reason) => {
			chatApi.dito("Não foi possível abrir manual do **TDS-Dito**.", messageId);
			logger.error(reason);
		});
	});
	context.subscriptions.push(openManual);

	const generateCode = vscode.commands.registerTextEditorCommand('tds-dito.generate-code', () => {
		const text: string = "Gerar código para varrer um array";
		iaApi.generateCode(text);
	});
	context.subscriptions.push(generateCode);

	const explainCode = vscode.commands.registerTextEditorCommand('tds-dito.explain', () => {
		const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
		let codeToExplain: string = "";

		if (editor !== undefined) {
			const selection: vscode.Selection = editor.selection;
			let whatExplain: string = "";

			if (selection && !selection.isEmpty) {
				const selectionRange: vscode.Range = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
				codeToExplain = editor.document.getText(selectionRange);
				whatExplain = chatApi.linkToSource(editor.document.uri, selectionRange);

			} else {
				const curPos: vscode.Position = selection.start;
				const contentLine: string = editor.document.lineAt(curPos.line).text;

				whatExplain = chatApi.linkToSource(editor.document.uri, curPos.line);
				codeToExplain = contentLine.trim();
			}

			if (codeToExplain.length > 0) {
				const messageId: string = chatApi.dito(
					`Explicando o código ${whatExplain}`
				);

				return iaApi.explainCode(codeToExplain).then((value: string) => {
					if (getDitoConfiguration().clearBeforeExplain) {
						chatApi.dito("clear");
					}
					chatApi.dito(value, messageId);
				});
			} else {
				chatApi.ditoWarning("Não consegui identificar um código para explica-lo.");
			}
		} else {
			chatApi.ditoWarning("Editor corrente não é valido para essa operação.");
		}
	});
	context.subscriptions.push(explainCode);

	const explainWord = vscode.commands.registerTextEditorCommand('tds-dito.explain-word', () => {
		const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

		if (editor !== undefined) {
			const selection: vscode.Selection = editor.selection;
			const selectionRange: vscode.Range | undefined = editor.document.getWordRangeAtPosition(selection.start);

			if (selectionRange !== undefined) {
				let wordToExplain: string = editor.document.getText(selectionRange).trim();
				let whatExplain = chatApi.linkToSource(editor.document.uri, selectionRange);

				if (wordToExplain.length > 0) {
					//const workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.getWorkspaceFolder(editor.document.uri);

					const messageId: string = chatApi.dito(
						`Explicando palavra ${whatExplain}`
					);

					return iaApi.explainCode(wordToExplain).then((value: string) => {
						if (getDitoConfiguration().clearBeforeExplain) {
							chatApi.dito("clear");
						}
						chatApi.dito(value, messageId);
					});
				} else {
					chatApi.ditoWarning("Não consegui identificar uma palavra para explica-la.");
				}
			} else {
				chatApi.ditoWarning("Não consegui identificar uma palavra para explica-la.");
			}
		} else {
			chatApi.ditoWarning("Editor corrente não é valido para essa operação.");
		}
	});
	context.subscriptions.push(explainWord);

	/**
	 * Registers a command to infer types for a selected function in the active text editor. 
	 * Finds the enclosing function based on the cursor position, extracts the function code, and sends it to an API to infer types.
	 * Displays the inferred types in the chat window.
	*/
	const typify = vscode.commands.registerCommand('tds-dito.typify', async (...args) => {
		const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
		let codeToTypify: string = "";

		if (editor !== undefined) {
			if (getDitoConfiguration().clearBeforeExplain) {
				chatApi.dito("clear");
			}

			const selection: vscode.Selection = editor.selection;
			const function_re: RegExp = /(function|method(...)class)\s*(\w+)/i
			const curPos: vscode.Position = selection.start;
			let whatExplain: string = "";
			let curLine = curPos.line;
			let startFunction: vscode.Position | undefined = undefined;
			let endFunction: vscode.Position | undefined = undefined;

			//começo da função
			while ((curLine > 0) && (!startFunction)) {
				const lineStart = new vscode.Position(curLine - 1, 0);
				const curLineStart = new vscode.Position(lineStart.line, 0);
				const nextLineStart = new vscode.Position(lineStart.line + 1, 0);
				const rangeWithFirstCharOfNextLine = new vscode.Range(curLineStart, nextLineStart);
				const contentWithFirstCharOfNextLine = editor.document.getText(rangeWithFirstCharOfNextLine);

				if (contentWithFirstCharOfNextLine.match(function_re)) {
					startFunction = new vscode.Position(curLine, 0);
				}

				curLine--;
			}

			curLine = curPos.line;

			while ((curLine < editor.document.lineCount) && (!endFunction)) {
				const lineStart = new vscode.Position(curLine + 1, 0);
				const curLineStart = new vscode.Position(lineStart.line, 0);
				const nextLineStart = new vscode.Position(lineStart.line + 1, 0);
				const rangeWithFirstCharOfNextLine = new vscode.Range(curLineStart, nextLineStart);
				const contentWithFirstCharOfNextLine = editor.document.getText(rangeWithFirstCharOfNextLine);
				const matches = contentWithFirstCharOfNextLine.match(function_re);

				if (matches) {
					endFunction = new vscode.Position(curLine, 0);
				}

				curLine++;
			}

			if (startFunction) {
				if (!endFunction) {
					endFunction = new vscode.Position(editor.document.lineCount - 1, 0);
				}

				const rangeForTypify = new vscode.Range(startFunction, endFunction);
				codeToTypify = editor.document.getText(rangeForTypify);

				if (codeToTypify.length > 0) {
					const rangeBlock = new vscode.Range(startFunction, endFunction);

					whatExplain = chatApi.linkToSource(editor.document.uri, rangeBlock);

					const messageId: string = chatApi.dito(
						`Tipificando o código ${whatExplain}`
					);

					return iaApi.typify(codeToTypify).then((response: TypifyResponse) => {
						let text: string[] = [];

						if (response !== undefined && response.types.length) {
							for (const varType of response.types) {
								text.push(`- **${varType.var}** as **${varType.type}** ${chatApi.commandText("update")}`);
							}

							chatApi.dito(text, messageId);
						}
					});
				}
			} else {
				chatApi.ditoWarning([
					"Não consegui identificar uma função/método para tipificar.",
					"Experimente posicionar o cursor em outra linha da implementação."
				]);
			}
		} else {
			chatApi.ditoWarning("Editor corrente não é valido para essa operação.");
		}
	});
	context.subscriptions.push(typify);

	const provider: vscode.InlineCompletionItemProvider = inlineCompletionItemProvider(context);
	const documentFilter = config.documentFilter;
	const inlineRegister: vscode.Disposable = vscode.languages.registerInlineCompletionItemProvider(documentFilter, provider);
	context.subscriptions.push(inlineRegister);

	const afterInsert = vscode.commands.registerCommand('tds-dito.afterInsert', async (response: CompletionResponse) => {
		const { request_id, completions } = response;
		const params = {
			requestId: request_id,
			acceptedCompletion: 0,
			shownCompletions: [0],
			completions,
		};
		logger.debug("Params: %s", JSON.stringify(params, undefined, 2));

		//await client.sendRequest("llm-ls/acceptCompletion", params);
	});
	ctx.subscriptions.push(afterInsert);

	//Chat DITO
	const chat: ChatViewProvider = new ChatViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chat));

	//aciona a verificação do serviço no ar e posterior login
	vscode.commands.executeCommand("tds-dito.health", false);
}

export function deactivate() {

	return iaApi.stop();
}

function updateContextKey(key: string, value: boolean | string | number) {
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
