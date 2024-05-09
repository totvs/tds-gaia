//import { VSCodeButton, VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow } from "@vscode/webview-ui-toolkit/react";

import "./generateCode.css";
import React from "react";
import { FormProvider, SubmitHandler, useForm, useFormContext } from "react-hook-form";
import { sendCopyToClipboard, sendGenerateCode } from "./sendCommand";
import { TdsAbstractModel, TdsPage, TdsTextField } from "@totvs/tds-webtoolkit";
import { CommonCommandFromPanelEnum, ReceiveMessage, sendSaveAndClose } from "@totvs/tds-webtoolkit";
import { IFormAction, TdsForm, getDefaultActionsForm, setDataModel } from "@totvs/tds-webtoolkit";
import { setErrorModel } from "@totvs/tds-webtoolkit/dist/components/form/form";

enum ReceiveCommandEnum {
  //Generate = "GENERATE"
}
type ReceiveCommand = ReceiveMessage<CommonCommandFromPanelEnum & ReceiveCommandEnum, TFields>;

type TFields = TdsAbstractModel & {
  description: string
  generateCode: string;
}

export default function GenerateCodeView() {
  const methods = useForm<TFields>({
    defaultValues: {
      description: "",
      generateCode: "",
    },
    mode: "all"
  })

  const onSubmit: SubmitHandler<TFields> = (data) => {
    sendSaveAndClose(data);
  }

  React.useEffect(() => {
    let listener = (event: any) => {
      const command: ReceiveCommand = event.data as ReceiveCommand;

      switch (command.command) {
        case CommonCommandFromPanelEnum.UpdateModel:
          const model: TFields = command.data.model;
          const errors: any = command.data.errors;
          console.log("xxxxxxxxxxxxxxxxxxx");
          console.dir(event);
          setDataModel<TFields>(methods.setValue, model);
          setErrorModel(methods.setError, errors);

          break;
        default:
          break;
      }
    };

    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    }
  }, []);

  const actions: IFormAction[] = getDefaultActionsForm();

  actions.push({
    id: "btnGenerateCode",
    caption: "Generate",
    isProcessRing: true,
    enabled: methods.formState.isValid,
    type: "button",
    onClick: () => {
      sendGenerateCode(methods.getValues());
    }
  });

  actions.push({
    id: "btnCopyCode",
    caption: "Copy",
    isProcessRing: true,
    enabled: methods.formState.isValid,
    type: "button",
    onClick: () => {
      sendCopyToClipboard(methods.getValues());
    }
  });

  return (
    <main>
      <TdsPage title="Generate Code" linkToDoc="[Geração de Código]generateCode.md">
        <FormProvider {...methods} >
          <TdsForm<TFields>
            id="frmGenerateCode"
            methods={methods}
            onSubmit={onSubmit}
            actions={actions}>

            <section className="tds-row-container" >
              <TdsTextField
                methods={methods}
                name="description"
                label="Description"
                info="Describe what you want the generated code to do."
                textArea={true}
                cols={80}
                rows={10}
                rules={{ required: true }}
              />
            </section>

            <section className="tds-row-container" >
              <TdsTextField
                methods={methods}
                name="generateCode"
                label="Code"
                readOnly={true}
                info="Code generated from the description."
                textArea={true}
                cols={80}
                rows={10}
              />

            </section>

          </TdsForm>
        </FormProvider>
      </TdsPage>
    </main >
  );
}

