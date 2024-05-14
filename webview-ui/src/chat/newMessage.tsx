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

import React from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { TdsTextField, tdsVscode } from "@totvs/tds-webtoolkit";

export default function NewMessage(props: { methods: any }): JSX.Element {

    return (
        <>
            <TdsTextField name="newMessage"
                methods={props.methods}
                label={""}
                textArea={true}
                placeholder={tdsVscode.l10n.t("Tell me what you need...")}
                cols={45}
                rows={2}
                rules={{
                    required: "Required"
                }}
            />

            <VSCodeButton
                name="btnSend"
                type="submit"
                appearance="icon"
                className={`tds-button-button`}
            >
                <span className="codicon codicon-send"></span>
            </VSCodeButton>
        </>
    )
}