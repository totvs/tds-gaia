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

import { CommonCommandToPanelEnum } from "../utilities/common-command-webview";
import { vscode } from "../utilities/vscodeWrapper";

/**
 * Sends a link mouse over event to the webview panel.
 * 
 * @param command - The command string associated with the link mouse over event.
 */
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

/**
* Sends a feedback message to the webview panel.
* 
* @param messageId - The unique identifier of the message.
* @param text - The text content of the feedback.
* @param value - The value associated with the feedback.
* @param comment - Any additional comments for the feedback.
*/
export function sendFeedback(messageId: string, text: string, value: string, comment: string) {
	vscode.postMessage({
		command: CommonCommandToPanelEnum.Feedback,
		data: {
			model: undefined,
			messageId: messageId,
			text: text,
			value: value,
			comment: comment
		}
	});
}

