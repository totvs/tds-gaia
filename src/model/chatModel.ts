import { TAbstractModel } from "./abstractMode";
import { TMessageModel } from "./messageModel";

export type TChatModel = TAbstractModel & {
    lastPublication: Date;
    loggedUser: string;
    newMessage: string;
    messages: TMessageModel[];
}
