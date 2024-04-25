import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { useState, useCallback } from "react";


/**
* Defines the props for the `Feedback` component.
*
* @property {boolean} [disabled] - Indicates whether the feedback buttons should be disabled.
* @property {(text: string) => void} feedbacksOnSubmit - A callback function that is called when the user submits feedback.
*/
export interface IFeedbackProps { //extends TMessageModel {
    disabled?: boolean
    feedbacksOnSubmit: (text: string, value: string) => void
}

export default function Feedback(props: IFeedbackProps): any {
    const [feedbackSubmitted, setFeedbackSubmitted] = useState('')

    const onFeedbackBtnSubmit = useCallback(
        (text: string, value: string) => {
            props.feedbacksOnSubmit(text, value)
            setFeedbackSubmitted(value)
        },
        [props.feedbacksOnSubmit]
    )

    return (
        <div className="tds-feedback">
            <div id="buttons">&nbsp;</div>
            <VSCodeButton
                appearance="icon"
                type="button"
                onClick={() => onFeedbackBtnSubmit('positive', '5')}
            >
                <i className="codicon codicon-thumbsup" />
            </VSCodeButton>
            <VSCodeButton
                appearance="icon"
                type="button"
                onClick={() => onFeedbackBtnSubmit('negative', '0')}
            >
                <i className="codicon codicon-thumbsdown" />
            </VSCodeButton>
            {
                // <VSCodeLink id="comment" href="#" onClick={() => onFeedbackBtnSubmit('comment', '')}>
                //     Comment
                // </VSCodeLink>
            }
        </div>
    )
}

