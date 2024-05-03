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

import { useController } from "react-hook-form";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { TdsTextField } from "@totvs/tds-webtoolkit";

export default function NewMessage(): JSX.Element {
    const { field, fieldState } = useController({
        name: "newMessage",
        defaultValue: "",
        rules: {
            required: "Required"
        }
    });

    // field.onChange = (e: any) => {
    //     //necessário usar OnInput, pois o ENTER aciona submit e
    //     //não há tempo de processar mensagens internas do React
    //     field.setValue(e.target.name, e.target.value);
    // };
    return (
        <>
            <TdsTextField name="newMessage"
                label={""}
                textArea={true}
                placeholder={"Tell me what you need.."}
                cols={45}
                rows={2}
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