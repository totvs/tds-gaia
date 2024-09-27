import { TAbstractModelPanel } from "../panels/panelInterface";
/**
* Defines the possible operations that can be performed on a message.
* - Add: Indicates a new message is being created.
* - Update: Indicates an existing message is being updated.
* - Remove: Indicates an existing message is being deleted.
*
* As the operation the attributes can be ignored. See {@link TMessageModel}.
*/
export declare enum MessageOperationEnum {
    Add = 0,
    Update = 1,
    Remove = 2,
    NoShow = 3
}
/**
 * Defines the shape of the message model, extending TAbstractModel.
 * Contains properties like id, author, message text, timestamp, etc.
 * Can optionally contain an array of action models.
 *
 * UNMARKED attributes are ignored in the operation.
 */
export type TMessageModel = TAbstractModelPanel & {
    operation: MessageOperationEnum;
    messageId: string;
    answering: string;
    inProcess: boolean;
    timeStamp: Date;
    author: string;
    message: string;
    className: string;
    feedback: boolean;
    disabled: boolean;
};
//# sourceMappingURL=messageModel.d.ts.map