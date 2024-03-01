import { CommonCommandToPanelEnum, SendMessage } from "../utilities/common-command-webview";
import { vscode } from "../utilities/vscodeWrapper";

export function sendExecute(messageId: number, command: string) {
	vscode.postMessage({
		command: CommonCommandToPanelEnum.Execute,
		data: {
			model: undefined,
			messageId: messageId,
			command: command
		}
	});
}

