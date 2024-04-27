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

/**
 * Enumeration of common commands that can be sent from a webview to its host panel.
 */
export enum CommonCommandFromWebViewEnum {
	AfterSelectResource = "AFTER_SELECT_RESOURCE",
	Close = "CLOSE",
	Ready = "READY",
	Reset = "RESET",
	Save = "SAVE",
	SaveAndClose = "SAVE_AND_CLOSE",
	LinkMouseOver = "LINK_MOUSE_OVER",
	Feedback = "FEEDBACK"
}

export type CommonCommandFromWebView = CommonCommandFromWebViewEnum;

/**
 * Enumeration of common commands that can be sent from the host panel to its webview.
 */
export enum CommonCommandToWebViewEnum {
	InitialData = "INITIAL_DATA",
	Configuration = "CONFIGURATION",
	UpdateModel = "UPDATE_MODEL",
}

export type ReceiveMessage<C extends CommonCommandFromWebView, T = any> = {
	command: C,
	data: {
		model: T,
		[key: string]: any,
	}
}

export type SendMessage<C, T = any> = {
	readonly command: C,
	data: {
		model: T,
		[key: string]: any,
	}
}