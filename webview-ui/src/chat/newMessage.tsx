import { useController } from "react-hook-form";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { TdsTextField } from "../components/form";

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
                size={40}
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