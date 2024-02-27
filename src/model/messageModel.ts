import { TAbstractModel } from "./abstractMode";

export type TMessageModel = TAbstractModel & {
    timeStamp: Date;
    author: string;
    message: string;
    actions?: any[];
}

