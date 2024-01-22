import * as vscode from 'vscode';
import {
	DocumentFilter,
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { readFile } from 'fs';
import { homedir } from 'os';
import * as path from 'path';
import * as hf from './huggingfaceApi';
import { CancellationToken } from 'vscode';
import { initStatusBarItems, updateStatusBarItems } from './statusBar';
import { TDitoConfig, getDitoConfiguration } from './configTemplates';

interface Completion {
	generated_text: string;
}

interface CompletionResponse {
	request_id: String,
	completions: Completion[],
}

let ctx: vscode.ExtensionContext;
//let client: HuggingfaceApi;

export function activate(context: vscode.ExtensionContext) {

	console.log(
		vscode.l10n.t('Congratulations, your extension "tds-dito" is now active!')
	);

	ctx = context;
	handleConfigChange(context);
	const config: TDitoConfig = getDitoConfiguration();
	context.subscriptions.push(...initStatusBarItems());

	// const afterInsert = vscode.commands.registerCommand('tds-dito.afterInsert', async (response: CompletionResponse) => {
	// 	const { request_id, completions } = response;
	// 	const params = {
	// 		request_id,
	// 		accepted_completion: 0,
	// 		shown_completions: [0],
	// 		completions,
	// 	};
	// 	await client.sendRequest("llm-ls/acceptCompletion", params);
	// });
	// context.subscriptions.push(afterInsert);

	const login = vscode.commands.registerCommand('tds-dito.login', async (...args) => {
		const apiToken = await context.secrets.get('apiToken');
		if (apiToken !== undefined) {
			vscode.window.showInformationMessage('TDS-Dito: Already logged in');
			return;
		}
		const tokenPath = path.join(homedir(), ".totvsls", "token");
		const token: string | undefined = await new Promise((res) => {
			readFile(tokenPath, (err, data) => {
				if (err) {
					res(undefined);
				}
				const content = data.toString();
				res(content.trim());
			});
		});
		if (token !== undefined) {
			hf.HuggingFaceApi.start(token);
			await hf.HuggingFaceApi.login();
			await context.secrets.store('apiToken', token);
			vscode.window.showInformationMessage(`TDS-Dito: Logged in from cache: ~/.totvsls/token ${tokenPath}`);
			return;
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
		hf.HuggingFaceApi.generateCode(text);
	});

	context.subscriptions.push(attribution);

	// const attribution = vscode.commands.registerTextEditorCommand('tds-dito.attribution', () => {
	// 	void highlightStackAttributions();
	// });
	// context.subscriptions.push(attribution);

	const provider: vscode.InlineCompletionItemProvider = {
		async provideInlineCompletionItems(document, position, context, token) {
			const config = vscode.workspace.getConfiguration("llm");
			const autoSuggest = config.get("enableAutoSuggest") as boolean;
			const requestDelay = config.get("requestDelay") as number;
			if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic && !autoSuggest) {
				return;
			}
			if (position.line < 0) {
				return;
			}
			if (requestDelay > 0) {
				const cancelled = await delay(requestDelay, token);
				if (cancelled) {
					return
				}
			}
			let params = {
				position,
				//textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(document),
				model: config.get("modelIdOrEndpoint") as string,
				tokens_to_clear: config.get("tokensToClear") as string[],
				api_token: await ctx.secrets.get('apiToken'),
				request_params: {
					max_new_tokens: config.get("maxNewTokens") as number,
					temperature: config.get("temperature") as number,
					do_sample: true,
					top_p: 0.95,
				},
				fim: config.get("fillInTheMiddle") as number,
				context_window: config.get("contextWindow") as number,
				tls_skip_verify_insecure: config.get("tlsSkipVerifyInsecure") as boolean,
				ide: "vscode",
				tokenizer_config: config.get("tokenizer") as object | null,
			};
			try {
				const response: CompletionResponse = await hf.HuggingFaceApi.getCompletions(params, token);

				const items = [];
				for (const completion of response.completions) {
					items.push({
						insertText: completion.generated_text,
						range: new vscode.Range(position, position),
						command: {
							title: 'afterInsert',
							command: 'tds-dito.afterInsert',
							arguments: [response],
						}
					});
				}

				return {
					items,
				};
			} catch (e) {
				const err_msg = (e as Error).message;
				if (err_msg.includes("is currently loading")) {
					vscode.window.showWarningMessage(err_msg);
				} else if (err_msg !== "Canceled") {
					vscode.window.showErrorMessage(err_msg);
				}
			}

		},

	};

	const documentFilter = config.documentFilter;
	vscode.languages.registerInlineCompletionItemProvider(documentFilter, provider);
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

async function delay(milliseconds: number, token: vscode.CancellationToken): Promise<boolean> {
	/**
	 * Wait for a number of milliseconds, unless the token is cancelled.
	 * It is used to delay the request to the server, so that the user has time to type.
	 *
	 * @param milliseconds number of milliseconds to wait
	 * @param token cancellation token
	 * @returns a promise that resolves with false after N milliseconds, or true if the token is cancelled.
	 *
	 * @remarks This is a workaround for the lack of a debounce function in vscode.
	*/
	return new Promise<boolean>((resolve) => {
		const interval = setInterval(() => {
			if (token.isCancellationRequested) {
				clearInterval(interval);
				resolve(true)
			}
		}, 10); // Check every 10 milliseconds for cancellation

		setTimeout(() => {
			clearInterval(interval);
			resolve(token.isCancellationRequested)
		}, milliseconds);
	});
}