import { VSCodeTextArea, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { useController, useFormContext } from "react-hook-form";
import PopupMessage from "../popup-message";
import { TdsFieldProps } from "../form";

type TdsTextFieldProps = TdsFieldProps & {
    textArea?: boolean
    placeholder?: string;
    size?: number;
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

    // https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/src/react/README.md#use-oninput-instead-of-onchange-to-handle-keystrokes
    // if (props.onChange) {
    //     registerField.onChange = props.onChange;
    // }

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
                    cols={props.size ?? 30}
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