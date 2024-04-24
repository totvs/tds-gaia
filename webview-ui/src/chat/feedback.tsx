import { useController } from "react-hook-form";
import { MessageOperationEnum, TMessageModel } from "./chatModels";
import { VSCodeDataGridCell, VSCodeDataGridRow, VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { vsCodeDataGrid } from "@vscode/webview-ui-toolkit";
import { sendLinkMouseOver } from "./sendCommand";


export interface IFeedbackProps { //extends TMessageModel {
    //isHovering: boolean;
}

export default function Feedback(props: IFeedbackProps): any {
    // const { control } = useController({
    //     name: 'feedback',
    //     control: feedback,
    //     defaultValue: feedback.defaultValue,
    // });
    //{ ...children }
    return (
        <div className="tds-feedback">
            Feedback
        </div>
    )
}
