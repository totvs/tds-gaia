export enum MessageOperationEnum {
    Add,
    Update,
    Remove
}

export type TMessageModel = {
    _id: string; //utilizado pelo React.UseArray;
    operation: MessageOperationEnum;
    messageId: string;
    answering: string;
    inProcess: boolean;
    timeStamp: Date;
    author: string;
    message: string;
    feedback: boolean
    className: string;
}
