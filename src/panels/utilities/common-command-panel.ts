export enum CommonCommandFromWebViewEnum {
	AfterSelectResource = "AFTER_SELECT_RESOURCE",
	Close = "CLOSE",
	Ready = "READY",
	Reset = "RESET",
	Save = "SAVE",
	SaveAndClose = "SAVE_AND_CLOSE",
	Execute = "EXECUTE",
	LinkMouseOver = "LINK_MOUSE_OVER"
}

export type CommonCommandFromWebView = CommonCommandFromWebViewEnum;

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