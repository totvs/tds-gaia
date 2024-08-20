//import { VSCodeButton, VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow } from "@vscode/webview-ui-toolkit/react";

import "./generateCode.css";
import React from "react";
import { FormProvider, SubmitHandler, useForm, useFormContext } from "react-hook-form";
import { sendCopyToClipboard, sendGenerateCode } from "./sendCommand";
import { CommonCommandEnum, TdsAbstractModel, TdsPage, TdsTextField, tdsVscode } from "@totvs/tds-webtoolkit";
import { ReceiveMessage, sendSaveAndClose } from "@totvs/tds-webtoolkit";
import { IFormAction, TdsForm, getDefaultActionsForm, setDataModel } from "@totvs/tds-webtoolkit";
import { setErrorModel } from "@totvs/tds-webtoolkit/dist/components/form/form";

enum ReceiveCommandEnum {
  //Generate = "GENERATE"
}
type ReceiveCommand = ReceiveMessage<CommonCommandEnum & ReceiveCommandEnum, TFields>;

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
        case CommonCommandEnum.UpdateModel:
          const model: TFields = command.data.model;
          const errors: any = command.data.errors;

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
      <TdsPage title={tdsVscode.l10n.t("Generate Code")} >
        <TdsForm<TFields>
          id="frmGenerateCode"
          methods={methods as any}
          onSubmit={onSubmit}
          actions={actions}>

          <section className="tds-row-container" >
            <TdsTextField
              name="description"
              label={tdsVscode.l10n.t("Description")}
              info={tdsVscode.l10n.t("Describe what you want the generated code to do.")}
              textArea={true}
              cols={80}
              rows={10}
              rules={{ required: true }}
            />
          </section>

          <section className="tds-row-container" >
            <TdsTextField
              name="generateCode"
              label={tdsVscode.l10n.t("Code")}
              info={tdsVscode.l10n.t("Code generated from the description.")}
              readOnly={true}
              textArea={true}
              cols={80}
              rows={10}
            />
          </section>

        </TdsForm>
      </TdsPage>
    </main >
  );
}

