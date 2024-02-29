import "./chatView.css";
import React from "react";
import { Control, FormProvider, SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { CommonCommandFromPanelEnum, ReceiveMessage, sendSave } from "../utilities/common-command-webview";
import { VSCodeButton, VSCodeLink, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
import { TdsForm, TdsTextField, setDataModel, setErrorModel } from "../components/form";
import { sendExecute } from "./sendCommand";

enum ReceiveCommandEnum {
}

type ReceiveCommand = ReceiveMessage<CommonCommandFromPanelEnum & ReceiveCommandEnum, TFields>;

type TMessageActionModel = {
  caption: string;
  command: string;
}

type TMessageModel = {
  inProcess: boolean
  messageId: number;
  timeStamp: Date;
  author: string;
  message: string;
  actions?: TMessageActionModel[];
}

type TFields = {
  lastPublication: Date;
  loggedUser: string;
  newMessage: string;
  messages: TMessageModel[];
}

function HandleCommand(message: TMessageModel, action: TMessageActionModel) {
  return (<VSCodeLink onClick={() => sendExecute(message.messageId, action.command)}>
    {action.caption}
  </VSCodeLink>
  );
}

function HandleText(part: string) {

  return <span>{part}</span>
}

function ShowMessage(message: TMessageModel) {
  let children: any[] = [];

  if (message.actions?.length) {
    let text: string = message.message;

    message.actions?.forEach((action) => {
      const pos_s: number = text.indexOf("{command:");
      const pos_e: number = text.indexOf("}", pos_s);

      if (pos_s > -1 && pos_e > -1) {
        children.push(HandleText(text.substring(0, pos_s)));
        children.push(HandleCommand(message, action));
      } else {
        children.push(HandleText(text));
      }

      text = text.substring(pos_e + 1);
    });

    if (text.length > 0) {
      children.push(HandleText(text));
    }
  } else {
    children.push(HandleText(message.message));
  }

  return (
    <div className="tds-message">
      {...children}
    </div>
  )
}

function MessageRow(row: TMessageModel, index: number, control: Control<TFields, any, TFields>): any {
  let children: any[] = [];
  let timeStamp: string | undefined = new Date(row.timeStamp).toTimeString().substring(0, 5);
  let author: string | undefined = row.author;

  if (row.author.length > 0) {
    children.push(
      <div className="tds-message-author">
        {row.inProcess && <VSCodeProgressRing />}
        <span id="author">{author}</span><span id="timeStamp">{timeStamp}</span>
      </div>
    )
  }

  children.push(ShowMessage(row));

  return (
    <div key={row.messageId.toString()} className="tds-message-row">
      {...children}
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

      switch (command.command) {
        case CommonCommandFromPanelEnum.UpdateModel:
          const model: TFields = command.data.model;
          const errors: any = command.data.errors;

          console.log("************************");
          console.dir(model);

          setDataModel<TFields>(methods.setValue, model);
          setErrorModel(methods.setError, errors);

          break;
        // case CommonCommandFromPanelEnum.Configuration,
        //   const model: TFields = command.data.commandsMap;
        //     commandsMap: ChatApi.getCommandsMap()
        //}
        //});

        default:
          console.error("Unknown command received: " + command.command);
          console.dir(event);
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

  // model.loggedUser
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
              <section className="tds-row-container" >
                <TdsTextField name="newMessage" label={""} />
                <VSCodeButton
                  name="btnSend"
                  type="submit"
                  appearance="icon"
                  className={`tds-button-button`}
                >
                  <span className="codicon codicon-send"></span>
                </VSCodeButton>
              </section>
            </TdsForm>
          </FormProvider>
        </section>
      </section>
    </main >
  );
}

