import { TAbstractModel } from "./abstractMode";

export type TMessageActionModel = {
    caption: string;
    command: string;
}

export type TMessageModel = TAbstractModel & {
    messageId: number;
    timeStamp: Date;
    author: string;
    message: string;
    actions?: TMessageActionModel[];
}

