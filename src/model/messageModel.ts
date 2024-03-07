import { TAbstractModel } from "./abstractMode";
import { Response } from 'undici';

export type TMessageActionModel = {
    caption: string;
    command: string;
}

export type TMessageModel = TAbstractModel & {
    id: string;
    answering: string;
    inProcess: boolean;
    timeStamp: Date;
    author: string;
    message: string;
    actions?: TMessageActionModel[];
}

