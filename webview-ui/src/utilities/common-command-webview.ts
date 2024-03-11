import { TAbstractModel } from "../../../src/model/abstractMode";
import { vscode } from "./vscodeWrapper";

export enum CommonCommandFromPanelEnum {
	InitialData = "INITIAL_DATA",
	UpdateModel = "UPDATE_MODEL",
	//Configuration = "CONFIGURATION",
}

export type CommonCommandFromPanel = CommonCommandFromPanelEnum;

export type ReceiveMessage<C extends CommonCommandFromPanel, T = any> = {
	command: C,
	data: {
		model: T,
		[key: string]: any,
	}
}

export enum CommonCommandToPanelEnum {
	Save = "SAVE",
	SaveAndClose = "SAVE_AND_CLOSE",
	Close = "CLOSE",
	Execute = "EXECUTE",
	Ready = "READY",
	Reset = "RESET",
	Validate = "VALIDATE",
	UpdateModel = "UPDATE_MODEL",
	LinkMouseOver = "LINK_MOUSE_OVER"
}

export type CommonCommandToPanel = CommonCommandToPanelEnum;

export type CommandFromPanel<C extends CommonCommandFromPanel, T = TAbstractModel> = {
	readonly command: C,
	data: {
		model: T,
		[key: string]: any,
	}
}

export type SendMessage<C extends CommonCommandToPanel, T = any> = {
	command: C,
	data: {
		model: T | undefined,
		[key: string]: any,
	}
}

export function sendReady() {
	const message: SendMessage<CommonCommandToPanelEnum, any> = {
		command: CommonCommandToPanelEnum.Ready,
		data: {
			model: undefined
		}
	}

	vscode.postMessage(message);
}

export function sendReset(model: TAbstractModel) {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.Reset,
		data: {
			model: model
		}
	}

	vscode.postMessage(message);
}

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

export function sendValidateModel(model: TAbstractModel) {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.Validate,
		data: {
			model: model
		}
	}

	vscode.postMessage(message);
}

export function sendSave(model: TAbstractModel) {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.Save,
		data: {
			model: model
		}
	}

	vscode.postMessage(message);
}

export function sendSaveAndClose(model: any) {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.SaveAndClose,
		data: {
			model: model
		}
	}

	vscode.postMessage(message);
}

export function sendUpdateModel(model: any) {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.UpdateModel,
		data: {
			model: model
		}
	}

	vscode.postMessage(message);
}

export function sendClose() {
	const message: SendMessage<CommonCommandToPanelEnum, TAbstractModel> = {
		command: CommonCommandToPanelEnum.Close,
		data: {
			model: undefined
		}
	}

	vscode.postMessage(message);
}
