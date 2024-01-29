import * as vscode from 'vscode';
import * as hf from './huggingfaceApi';
import { initStatusBarItems, updateStatusBarItems } from './statusBar';
import { TDitoConfig, getDitoConfiguration, getDitoUser } from './config';
import { inlineCompletionItemProvider } from './completionItemProvider';
import { capitalize } from './util';

let ctx: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {

	console.log(
		vscode.l10n.t('Congratulations, your extension "tds-dito" is now active!')
	);

	ctx = context;
	handleConfigChange(context);
	const config: TDitoConfig = getDitoConfiguration();
	context.subscriptions.push(...initStatusBarItems());

	//args[0], bool, quando true, ignora processamento se  login automático falhar
	const login = vscode.commands.registerCommand('tds-dito.login', async (...args) => {
		let apiToken = await context.secrets.get('apiToken');

		if (apiToken !== undefined) {
			hf.HuggingFaceApi.start(apiToken);
			if (await hf.HuggingFaceApi.login()) {
				//vscode.window.showInformationMessage(`TDS-Dito: Logged in successfully`);
				vscode.window.showInformationMessage(`TDS-Dito: Hi ${capitalize(getDitoUser()?.name || "<not logged>")}. I am ready to help you in any way possible.`);
				return;
			}
		}

		if (args) {
			if (args[0]) { //indica que login automático
				return;
			}
		}

		const input = await vscode.window.showInputBox({
			prompt: 'Please enter your API token:',
			placeHolder: 'Your token goes here ...'
		});
		if (input !== undefined) {
			hf.HuggingFaceApi.start(input);
			if (await hf.HuggingFaceApi.login()) {
				await context.secrets.store('apiToken', input);
				vscode.window.showInformationMessage('TDS-Dito: Logged in successfully');
			} else {
				await context.secrets.delete('apiToken');
				vscode.window.showErrorMessage('TDS-Dito: Login failure');
			}
		}
	});
	context.subscriptions.push(login);

	const logout = vscode.commands.registerCommand('tds-dito.logout', async (...args) => {
		hf.HuggingFaceApi.logout();
		await context.secrets.delete('apiToken');
		vscode.window.showInformationMessage('TDS-Dito: Logged out');
	});
	context.subscriptions.push(logout);


	const attribution = vscode.commands.registerTextEditorCommand('tds-dito.generateCode', () => {
		const text: string = "Gerar código para varrer um array";
		// hf.HuggingFaceApi.generateCode(vscode.window.activeTextEditor!.selection.active.lineText);
		// hf.HuggingFaceApi.generateCode(vscode.window.activeTextEditor!.document.getText());
		hf.HuggingFaceApi._generateCode(text);
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

	vscode.commands.executeCommand("tds-dito.login", [true])
}

export function deactivate() {
	if (!hf) {
		return undefined;
	}
	return hf.HuggingFaceApi.stop();
}

function handleConfigChange(context: vscode.ExtensionContext) {
	const listener = vscode.workspace.onDidChangeConfiguration(async event => {
		if (event.affectsConfiguration('tds-dito')) {
			updateStatusBarItems();
			// const config = vscode.workspace.getConfiguration("llm");
			// const configKey = config.get("configTemplate") as TemplateKey;
			// const template = templates[configKey];
			// if (template) {
			// 	const updatePromises = Object.entries(template).map(([key, val]) => config.update(key, val, vscode.ConfigurationTarget.Global));
			// 	await Promise.all(updatePromises);
			// }
		}
	});

	context.subscriptions.push(listener);
}

// TODO: refactor to select only highlighted code
export default async function highlightStackAttributions(): Promise<void> {
	const document = vscode.window.activeTextEditor?.document
	if (!document) return;

	const config = vscode.workspace.getConfiguration("llm");
	const attributionWindowSize = config.get("attributionWindowSize") as number;
	const attributionEndpoint = config.get("attributionEndpoint") as string;

	// get cursor postion and offset
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
