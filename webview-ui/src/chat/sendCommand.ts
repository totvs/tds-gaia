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
 * Sends a command to the webview panel to execute the given command string.
 * 
 * @param command - The command string to execute.
 */
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
	
