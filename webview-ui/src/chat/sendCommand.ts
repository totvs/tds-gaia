import { CommonCommandToPanelEnum, SendMessage } from "../utilities/common-command-webview";
import { vscode } from "../utilities/vscodeWrapper";

export function sendExecute(command: string) {
	vscode.postMessage({
		command: CommonCommandToPanelEnum.Execute,
		data: {
			model: undefined,
			messageId: "",
			command: command
		}
	});
}

export function sendLinkMouseOver(command: string) {
	vscode.postMessage({
		command: CommonCommandToPanelEnum.LinkMouseOver,
		data: {
			model: undefined,
			messageId: "",
			command: command
		}
	});
}
	
