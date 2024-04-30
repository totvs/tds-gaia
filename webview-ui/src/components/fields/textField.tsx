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

import { VSCodeTextArea, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { useController, useFormContext } from "react-hook-form";
import PopupMessage from "../popup-message";
import { TdsFieldProps } from "../form";

type TdsTextFieldProps = TdsFieldProps & {
    textArea?: boolean
    placeholder?: string;
    size?: number;
    cols?: number;
    rows?: number;
};

/**
 *
 * - Uso de _hook_ ``useFieldArray`` e propriedade ``disabled``:
 *   Por comportamento do _hook_, campos com ``disabled`` ativo não são armazenados
 *   no _array_ associado ao _hook_.
 *   Caso seja necessário sua manipulação, use ``readOnly`` como alternativa.
 *
 * @param props
 *
 * @returns
 */
export function TdsTextField(props: TdsTextFieldProps): JSX.Element {
    const {
        register
    } = useFormContext();
    const { field, fieldState } = useController(props);
    const registerField = register(props.name, props.rules);

    // // https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/src/react/README.md#use-oninput-instead-of-onchange-to-handle-keystrokes
    //  if (props.onInput) {
    // //     registerField.onInput = props.onInput;
    // // }

    return (
        <section
            className={`tds-field-container tds-text-field ${props.className ? props.className : ''}`}
        >
            <label
                htmlFor={field.name}
            >
                {props.label}
                {props.rules?.required && <span className="tds-required" />}
            </label>
            {props.textArea ?? false ? (
                <VSCodeTextArea
                    readOnly={props.readOnly || false}
                    {...registerField}
                    placeholder={props.placeholder}
                    resize="vertical"
                    cols={props.cols ?? 30}
                    rows={props.rows ?? 15}
                    onInput={props.onInput}
                >
                    <PopupMessage field={props} fieldState={fieldState} />
                </VSCodeTextArea>
            ) : (
                <VSCodeTextField
                    readOnly={props.readOnly || false}
                    {...registerField}
                    placeholder={props.placeholder}
                    size={props.size ?? 30}
                    onInput={props.onInput}
                >
                    <PopupMessage field={props} fieldState={fieldState} />
                </VSCodeTextField>
            )}
        </section>
    )
}