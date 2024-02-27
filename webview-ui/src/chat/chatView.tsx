import "./chatView.css";
import React from "react";
import { Control, FieldArrayWithId, FormProvider, SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { CommonCommandFromPanelEnum, ReceiveMessage, sendReady, sendSave, sendSaveAndClose } from "../utilities/common-command-webview";
import { VSCodeButton, VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow } from "@vscode/webview-ui-toolkit/react";
import { TdsForm, TdsTextField, setDataModel, setErrorModel } from "../components/form";
import TdsPage from "../components/page";
import TdsHeader from "../components/header";
import TdsContent from "../components/content";
import TdsFooter from "../components/footer";
import { time } from "console";

enum ReceiveCommandEnum {
}

type ReceiveCommand = ReceiveMessage<CommonCommandFromPanelEnum & ReceiveCommandEnum, TFields>;

export type TMessageModel = {
  timeStamp: Date;
  author: string;
  message: string;
  actions?: any[];
}

type TFields = {
  lastPublication: Date;
  loggedUser: string;
  newMessage: string;
  messages: TMessageModel[];
}

let oldAuthor: string | undefined = "";
let oldTimeStamp: string | undefined = "";

function MessageRow(row: any, index: number, control: Control<TFields, any, TFields>): any {
  let timeStamp: string | undefined = new Date(row.timeStamp).toTimeString().substring(0, 5);
  let author: string | undefined = row.author;
  let show: boolean = true;

  console.log("***************************************");
  console.log(timeStamp, author);
  console.log(oldTimeStamp, oldAuthor);
  if ((timeStamp === oldTimeStamp) && (oldAuthor === row.author)) {
    show = false;
  } else {
    oldTimeStamp = timeStamp;
    oldAuthor = author;
  }
  console.log(show);

  return (
    <div key={row.id} className="tds-message-row">
      {true &&
        <div className="tds-message-author">
          <span id="author">{author}</span><span id="timeStamp">{timeStamp}</span>
        </div>
      }
      <div className="tds-message">{row.message}</div>
    </div>
  )
}

export default function ChatView() {
  const methods = useForm<TFields>({
    defaultValues: {
      lastPublication: new Date(),
      loggedUser: "",
      messages: []
    },
    mode: "all"
  })

  const { fields, remove, insert } = useFieldArray(
    {
      control: methods.control as any,
      name: "messages"
    });

  const onSubmit: SubmitHandler<TFields> = (data) => {
    sendSave(data);
  }

  React.useEffect(() => {
    let listener = (event: any) => {
      const command: ReceiveCommand = event.data as ReceiveCommand;
      console.log(event);

      switch (command.command) {
        case CommonCommandFromPanelEnum.UpdateModel:
          const model: TFields = command.data.model;
          const errors: any = command.data.errors;

          console.log("************************");
          console.dir(model);

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
    <main>
      <section className="tds-chat">
        <section className="tds-content">
          {fields.map((row: any, index: number) => MessageRow(row, index, methods.control))}
        </section >
        <section className="tds-footer">
          <FormProvider {...methods} >
            <TdsForm<TFields>
              id="chatForm"
              onSubmit={onSubmit}
              methods={methods}
              actions={[]}
              
            >
              {model.loggedUser &&
                <section className="tds-row-container" >
                  <TdsTextField name="newMessage" label={model.loggedUser} />
                  <VSCodeButton
                    type="submit"
                    appearance="icon"
                    className={`tds-button-button`}
                  >
                    <span className="codicon codicon-send"></span>
                  </VSCodeButton>
                </section>
              }
            </TdsForm>
          </FormProvider>
        </section>
      </section>
    </main >
  );
}

