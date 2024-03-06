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

				chatApi.checkUser();
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

		chatApi.dito("Verificando disponibilidade do serviço.");

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
				chatApi.dito(message);
				vscode.window.showErrorMessage(`${PREFIX_DITO} ${message}`);

				if (error.message.includes("502: Bad Gateway")) {
					const parts: string = error.message.split("\n");
					chatApi.dito(parts[1]);
				}

				if (detail) {
					chatApi.ditoInfo(JSON.stringify(error, undefined, 2));
				}
			} else {
				vscode.commands.executeCommand("tds-dito.login", [true]).then(() => {
					chatApi.checkUser();
				});
			}
		});
	});
	context.subscriptions.push(detailHealth);

	const clear = vscode.commands.registerCommand('tds-dito.clear', async () => {
		chatApi.user("clear", true);
	});
	context.subscriptions.push(clear);

	const openManual = vscode.commands.registerCommand('tds-dito.open-manual', async () => {
		const url: string = "https://github.com/brodao2/tds-dito/blob/main/README.md";
		vscode.env.openExternal(vscode.Uri.parse(url));
	});
	context.subscriptions.push(openManual);

	const generateCode = vscode.commands.registerTextEditorCommand('tds-dito.generate-code', () => {
		const text: string = "Gerar código para varrer um array";
		// hf.HuggingFaceApi.generateCode(vscode.window.activeTextEditor!.selection.active.lineText);
		// hf.HuggingFaceApi.generateCode(vscode.window.activeTextEditor!.document.getText());
		iaApi.generateCode(text);
	});
	context.subscriptions.push(generateCode);

	const explainCode = vscode.commands.registerTextEditorCommand('tds-dito.explain', () => {
		const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
		let codeToExplain: string = "";

		if (editor !== undefined) {
			const selection: vscode.Selection = editor.selection;

			if (selection && !selection.isEmpty) {
				const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
				codeToExplain = editor.document.getText(selectionRange);
			} else {
				const curPos: vscode.Position = selection.start;
				const curLineStart = new vscode.Position(curPos.line, 0);
				const nextLineStart = new vscode.Position(curPos.line + 1, 0);
				const rangeWithFirstCharOfNextLine = new vscode.Range(curLineStart, nextLineStart);
				const contentWithFirstCharOfNextLine = editor.document.getText(rangeWithFirstCharOfNextLine).trim();

				codeToExplain = contentWithFirstCharOfNextLine.trim();
			}

			if (codeToExplain.length > 0) {
				if (getDitoConfiguration().clearBeforeExplain) {
					chatApi.dito("clear");
				}
				iaApi.explainCode(codeToExplain).then((value: string) => {
					chatApi.dito(value);
				});
			} else {
				chatApi.dito("Empty code to explain");
			}
		} else {
			chatApi.dito("Editor undefined");
		}
	});
	context.subscriptions.push(explainCode);

	const typify = vscode.commands.registerCommand('tds-dito.typify', async (...args) => {
		const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
		let codeToTypify: string = "";

		if (editor !== undefined) {
			if (getDitoConfiguration().clearBeforeExplain) {
				chatApi.dito("clear");
			}

			const selection: vscode.Selection = editor.selection;
			const function_re: RegExp = /(function|method(...)class)/i
			const curPos: vscode.Position = selection.start;
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

				if (contentWithFirstCharOfNextLine.match(function_re)) {
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
			}

			try {
				const response: TypifyResponse = await iaApi.typify(codeToTypify);
				let text: string[] = [];

				if (response !== undefined && response.types.length) {
					for (const varType of response.types) {
						text.push(`- **${varType.var}** as **${varType.type}** ${chatApi.commandText("update")}`);
					}

					chatApi.dito(text);
				}
			} catch (e) {
				const err_msg = (e as Error);

				if (err_msg.message.includes("is currently loading")) {
					vscode.window.showWarningMessage(err_msg.message);
				} else if (err_msg.message !== "Canceled") {
					vscode.window.showErrorMessage(err_msg.message);
				}

				console.error(e);
			}
		} else {
			chatApi.dito("Editor undefined");
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

// TODO: refactor to select only highlighted code
export default async function highlightStackAttributions(): Promise<void> {
	const document = vscode.window.activeTextEditor?.document
	if (!document) return;

	const config = vscode.workspace.getConfiguration("llm");
	const attributionWindowSize = config.get("attributionWindowSize") as number;
	const attributionEndpoint = config.get("attributionEndpoint") as string;

	// get cursor position and offset
	const cursorPosition = vscode.window.activeTextEditor?.selection.active;
	if (!cursorPosition) return;
	const cursorOffset = document.offsetAt(cursorPosition);

	const start = Math.max(0, cursorOffset - attributionWindowSize);
	const end = Math.min(document.getText().length, cursorOffset + attributionWindowSize);

	// Select the start to end span
	if (!vscode.window.activeTextEditor) return;
	vscode.window.activeTextEditor.selection = new vscode.Selection(document.positionAt(start), document.positionAt(end));
	// new Range(document.positionAt(start), document.positionAt(end));

	const text = document.getText();
	const textAroundCursor = text.slice(start, end);

	const body = { document: textAroundCursor };

	// notify user request has started
	void vscode.window.showInformationMessage("Searching for nearby code in the stack...");

	const resp: any = {};
	// const resp = hf.nearestCodeSearch(body);
	// if (!resp.ok) {
	// 	return;
	// }

	const json = await resp.json() as any as { spans: [number, number][] }
	const { spans } = json

	if (spans.length === 0) {
		void vscode.window.showInformationMessage("No code found in the stack");
		return;
	}

	void vscode.window.showInformationMessage("Highlighted code was found in the stack.",
		"Go to stack search"
	).then(clicked => {
		if (clicked) {
			// open stack search url in browser
			void vscode.env.openExternal(vscode.Uri.parse("https://huggingface.co/spaces/bigcode/search"));
		}
	});

	// combine overlapping spans
	const combinedSpans: [number, number][] = spans.reduce((acc, span) => {
		const [s, e] = span;
		if (acc.length === 0) return [[s, e]];
		const [lastStart, lastEnd] = acc[acc.length - 1];
		if (s <= lastEnd) {
			acc[acc.length - 1] = [lastStart, Math.max(lastEnd, e)];
		} else {
			acc.push([s, e]);
		}
		return acc;
	}, [] as [number, number][]);

	const decorations = combinedSpans.map(([startChar, endChar]) => ({ range: new vscode.Range(document.positionAt(startChar + start), document.positionAt(endChar + start)), hoverMessage: "This code might be in the stack!" }))

	// console.log("Highlighting", decorations.map(d => [d.range.start, d.range.end]));

	const decorationType = vscode.window.createTextEditorDecorationType({
		color: 'red',
		textDecoration: 'underline',

	});

	vscode.window.activeTextEditor?.setDecorations(decorationType, decorations);

	setTimeout(() => {
		vscode.window.activeTextEditor?.setDecorations(decorationType, []);
	}, 5000);
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
