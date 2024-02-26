import "./chatView.css";
import React from "react";
import { FormProvider, SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { CommonCommandFromPanelEnum, ReceiveMessage, sendReady, sendSaveAndClose } from "../utilities/common-command-webview";
import { VSCodeButton, VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow } from "@vscode/webview-ui-toolkit/react";
import { TdsForm, setDataModel, setErrorModel } from "../components/form";
import TdsPage from "../components/page";
import TdsHeader from "../components/header";
import TdsContent from "../components/content";
import TdsFooter from "../components/footer";

enum ReceiveCommandEnum {
}

type ReceiveCommand = ReceiveMessage<CommonCommandFromPanelEnum & ReceiveCommandEnum, TFields>;

type TFields = {
  serverName: string;
}

const ROWS_LIMIT: number = 5;

export default function AddServerView() {
  const methods = useForm<TFields>({
    defaultValues: {
      serverName: "",
    },
    mode: "all"
  })

  // const { fields, remove, insert } = useFieldArray(
  //   {
  //     control: methods.control,
  //     name: "includePaths"
  //   });

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

  const model: TFields = methods.getValues();
  /*
              <VSCodeDataGrid id="includeGrid" grid-template-columns="30px">
                {model && model.includePaths.map((row: TIncludeData, index: number) => (
                  <VSCodeDataGridRow key={index}>
                    {row.path !== "" &&
                      <>
                        <VSCodeDataGridCell grid-column="1">
                          <VSCodeButton appearance="icon"
                            onClick={() => removeIncludePath(index)} >
                            <span className="codicon codicon-close"></span>
                          </VSCodeButton>
                        </VSCodeDataGridCell>
                        <VSCodeDataGridCell grid-column="2">
                          <TdsSimpleTextField
                            name={`includePaths.${index}.path`}
                            readOnly={true}
                          />
                        </VSCodeDataGridCell>
                      </>
                    }
                    {((row.path == "") && (index !== indexFirstPathFree)) &&
                      <>
                        <VSCodeDataGridCell grid-column="1">
                          &nbsp;
                        </VSCodeDataGridCell>
                        <VSCodeDataGridCell grid-column="2">
                          &nbsp;
                        </VSCodeDataGridCell>
                      </>
                    }
                    {(index === indexFirstPathFree) &&
                      <>
                        <VSCodeDataGridCell grid-column="1">
                          &nbsp;
                        </VSCodeDataGridCell>
                        <VSCodeDataGridCell grid-column="2">
                          <TdsSelectionFolderField
                            name={`btnSelectFolder.${index}`}
                            info={"Selecione uma pasta que contenha arquivos de definição"}
                            title="Select folder with define files"
                          />
                        </VSCodeDataGridCell>
                      </>
                    }
                  </VSCodeDataGridRow>
                ))}
              </VSCodeDataGrid>
  */
  return (
    <section className="tds-chat">
      <section className="tds-header">
        <p>Header com a comandos</p>
      </section>
      <div className="tds-content">
        <p>Grid com a conversa</p>
      </div>
      <section className="tds-footer">
        <FormProvider {...methods} >
          <TdsForm<TFields>
            onSubmit={onSubmit}
            methods={methods} children={undefined}>


          </TdsForm>
        </FormProvider>
      </section>
    </section>
  );
}

