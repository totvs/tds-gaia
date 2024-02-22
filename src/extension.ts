import * as vscode from 'vscode';
import { initStatusBarItems, updateStatusBarItems } from './statusBar';
import { TDitoConfig, getDitoConfiguration, getDitoLogLevel, isDitoLogged, isDitoShowBanner } from './config';
import { inlineCompletionItemProvider } from './completionItemProvider';
import { CompletionResponse, IaApiInterface } from './api/interfaceApi';
import { CarolApi } from './api/carolApi';
import { PREFIX_DITO, logger } from './logger';

let ctx: vscode.ExtensionContext;

export const iaApi: IaApiInterface = new CarolApi();

export function activate(context: vscode.ExtensionContext) {
	logger.info(
		vscode.l10n.t('Congratulations, your extension "tds-dito" is now active!')
	);

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

		if (args) {
			if (args[0]) { //indica que login foi acionado automaticamente
				return;
			}
		}

		const input = await vscode.window.showInputBox({
			prompt: 'Please enter your API token:',
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

	const detailHealth = vscode.commands.registerCommand('tds-dito.detail-health', async () => {
		iaApi.checkHealth(true).then((error: any) => {
			updateContextKey("readyForUse", error === undefined);

			if (error !== undefined) {
				vscode.window.showErrorMessage(`${PREFIX_DITO} Desculpe. Problemas técnicos. Verifique o log.`);
			} else {
				vscode.commands.executeCommand("tds-dito.login", [true])
			}
		});
	});
	context.subscriptions.push(detailHealth);

	const attribution = vscode.commands.registerTextEditorCommand('tds-dito.generateCode', () => {
		const text: string = "Gerar código para varrer um array";
		// hf.HuggingFaceApi.generateCode(vscode.window.activeTextEditor!.selection.active.lineText);
		// hf.HuggingFaceApi.generateCode(vscode.window.activeTextEditor!.document.getText());
		iaApi.generateCode(text);
	});

	context.subscriptions.push(attribution);

	// const attribution = vscode.commands.registerTextEditorCommand('tds-dito.attribution', () => {
	// 	void highlightStackAttributions();
	// });
	// context.subscriptions.push(attribution);

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

	vscode.commands.executeCommand("tds-dito.detail-health");
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
