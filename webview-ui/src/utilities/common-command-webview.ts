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

import { TAbstractModel } from "../../../src/model/abstractMode";
import Feedback from "../chat/feedback";
import { vscode } from "./vscodeWrapper";

/**
 * Enumeration of common command names used for communication 
 * between the webview and the extension.
 */
export enum CommonCommandFromPanelEnum {
	InitialData = "INITIAL_DATA",
	UpdateModel = "UPDATE_MODEL",
	//Configuration = "CONFIGURATION",
}

/**
 * Enumeration of common command names used for communication
 * between the webview and the extension.
 */
export type CommonCommandFromPanel = CommonCommandFromPanelEnum;

/**
 * Type for messages received from the webview panel. 
 * Contains the command name and data payload.
 * The data payload contains the updated model and any other data.
*/
export type ReceiveMessage<C extends CommonCommandFromPanel, T = any> = {
	command: C,
	data: {
		model: T,
		[key: string]: any,
	}
}

/**
 * Enumeration of command names used for communication 
 * from the extension to the webview.
 */
export enum CommonCommandToPanelEnum {
	Save = "SAVE",
	SaveAndClose = "SAVE_AND_CLOSE",
	Close = "CLOSE",
	Ready = "READY",
	Reset = "RESET",
	Validate = "VALIDATE",
	UpdateModel = "UPDATE_MODEL",
	LinkMouseOver = "LINK_MOUSE_OVER",
	Feedback = "FEEDBACK"
}

export type CommonCommandToPanel = CommonCommandToPanelEnum;

/**
 * Type for messages received from the webview panel. 
 * Contains the command name and data payload.
 * The data payload contains the updated model and any other data.
*/
export type CommandFromPanel<C extends CommonCommandFromPanel, T = TAbstractModel> = {
	readonly command: C,
	data: {
		model: T,
		[key: string]: any,
	}
}

/**
 * Type for messages sent from the extension to the webview panel. 
 * Contains the command name and data payload.
 * The data payload contains the model and any other data.
*/
export type SendMessage<C extends CommonCommandToPanel, T = any> = {
	command: C,
	data: {
		model: T | undefined,
		[key: string]: any,
	}
}

/**
 * Sends a ready message to the webview panel 
 * indicating the extension is ready for communication.
 */
export function sendReady() {
	const message: SendMessage<CommonCommandToPanelEnum, any> = {
		command: CommonCommandToPanelEnum.Ready,
		data: {
			model: undefined
		}
	}

	vscode.postMessage(message);
}

/**
 * Sends a reset message to the webview panel 
 * with the provided model to reset the state.
 */
export function sendReset(model: TAbstractModel) {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.Reset,
		data: {
			model: model
		}
	}

	vscode.postMessage(message);
}

/**
 * Type for props to send when requesting the user to select resources.
 * 
 * @param canSelectMany - Whether multiple resources can be selected. 
 * @param canSelectFiles - Whether files can be selected.
 * @param canSelectFolders - Whether folders can be selected.
 * @param currentFolder - The current folder path.
 * @param title - The title for the resource selection dialog.
 * @param openLabel - The label for the open button. 
 * @param filters - The allowed file filters.
 */
export type TSendSelectResourceProps = {
	canSelectMany: boolean,
	canSelectFiles: boolean,
	canSelectFolders: boolean,
	currentFolder: string,
	title: string,
	openLabel: string,
	filters: {
		[key: string]: string[]
	}
}

/**
 * Sends a validate model message to the webview panel
 * containing the provided model to validate.
 */
export function sendValidateModel(model: TAbstractModel) {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.Validate,
		data: {
			model: model
		}
	}

	vscode.postMessage(message);
}

/**
 * Sends a save model message to the webview panel
 * containing the provided model to save.
 */
export function sendSave(model: TAbstractModel) {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.Save,
		data: {
			model: model
		}
	}

	vscode.postMessage(message);
}

/**
 * Sends a save and close message to the webview panel
 * containing the provided model to save and close.
 */
export function sendSaveAndClose(model: any) {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.SaveAndClose,
		data: {
			model: model
		}
	}

	vscode.postMessage(message);
}

/**
 * Sends an update model message to the webview panel
 * containing the provided model to update.
 */
export function sendUpdateModel(model: any) {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.UpdateModel,
		data: {
			model: model
		}
	}

	vscode.postMessage(message);
}

/**
 * Sends a close message to the webview panel.
 */
export function sendClose() {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.Close,
		data: {
			model: undefined
		}
	}

	vscode.postMessage(message);
}
