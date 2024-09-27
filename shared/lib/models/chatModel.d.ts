import { TAbstractModelPanel } from "../panels/panelInterface";
import { TMessageModel } from "./messageModel";
/**
 * Defines the shape of the chat model interface which extends
 * TAbstractModel and contains properties for lastPublication,
 * loggedUser, newMessage, and messages.
 */
export type TChatModel = TAbstractModelPanel & {
    command: string;
    lastPublication: Date;
    loggedUser: string;
    newMessage: string;
    messages: TMessageModel[];
};
//# sourceMappingURL=chatModel.d.ts.map