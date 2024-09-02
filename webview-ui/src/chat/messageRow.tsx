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

import { TMessageModel } from "./chatModels";
import { VSCodeDataGridCell, VSCodeDataGridRow } from "@vscode/webview-ui-toolkit/react";
import { sendFeedback } from "./sendCommand";
import Message from "./message";
import Feedback from "./feedback";

/**
 * Defines the props for the `MessageRow` component.
 *
 * @property index - The index of the message in the messages array.
 * @property message - The message model for the current row.
 * @property messages - The array of all messages in the chat.
 */
export interface IMessageRowProps {
    index: number;
    message: TMessageModel;
    messages: TMessageModel[]
}

/**
 * Renders a single message row in the chat UI.
 *
 * @param props - The props for the message row component.
 * @param props.index - The index of the message in the messages array.
 * @param props.message - The message model for the current row.
 * @param props.messages - The array of all messages in the chat.
 * @returns The rendered message row.
 */
export default function MessageRow(props: IMessageRowProps): any {
    const row: TMessageModel = props.message;

    return (
        <VSCodeDataGridRow
            id={row.messageId.toString()}
            key={row.messageId.toString()}
            className={`tds-message-row ${row.className}`}>
            <VSCodeDataGridCell grid-column="1">
                <>
                    <Message {...row} isHovering={false} />
                    {row.feedback && <Feedback
                        disabled={row.disabled}
                        feedbacksOnSubmit={(text: string, value: string) => {
                            sendFeedback(row.messageId, text, value, "");
                        }} />}
                </>
            </VSCodeDataGridCell>
        </VSCodeDataGridRow >
    )
}
