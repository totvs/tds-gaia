/*
Copyright 2024 TOTVS S.A

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http: //www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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

    const moreProps: any = {}
    if ((props.disabled !== undefined) && (props.disabled)) {
        moreProps["disabled"] = true;
    }

    return (
        <div className="tds-feedback">
            <div id="buttons">&nbsp;</div>
            <VSCodeButton
                aria-label="Positive"
                appearance="icon"
                type="button"
                onClick={() => onFeedbackBtnSubmit('positive', '5')}
                {...moreProps}
            >
                <i className="codicon codicon-thumbsup-filled" />
            </VSCodeButton>
            <VSCodeButton
                aria-label="More or Less"
                appearance="icon"
                type="button"
                onClick={() => onFeedbackBtnSubmit('negative', '2.5')}
                {...moreProps}
            >
                <i className="codicon codicon-arrow-both" />
            </VSCodeButton>
            <VSCodeButton
                aria-label="Negative"
                appearance="icon"
                type="button"
                onClick={() => onFeedbackBtnSubmit('negative', '0')}
                {...moreProps}
            >
                <i className="codicon codicon-thumbsdown-filled" />
            </VSCodeButton>
            {
                // <VSCodeLink id="comment" href="#" onClick={() => onFeedbackBtnSubmit('comment', '')}>
                //     Comment
                // </VSCodeLink>
            }
        </div>
    )
}

