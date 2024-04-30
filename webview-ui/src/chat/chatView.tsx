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

import "./chatView.css";
import React from "react";
import { FormProvider, SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { CommonCommandFromPanelEnum, ReceiveMessage, sendSave } from "../utilities/common-command-webview";
import { VSCodeButton, VSCodeDataGrid, VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { IFormAction, TdsForm, TdsTextField, setDataModel, setErrorModel } from "../components/form";
import { sendLinkMouseOver } from "./sendCommand";
import NewMessage from "./newMessage";
import MessageRow from "./messageRow";
import { TMessageModel } from "./chatModels";

enum ReceiveCommandEnum {
}

type ReceiveCommand = ReceiveMessage<CommonCommandFromPanelEnum & ReceiveCommandEnum, TFields>;

type TFields = {
  lastPublication: Date;
  loggedUser: string;
  newMessage: string;
  messages: TMessageModel[];
}


function flashMessage(row: TMessageModel, messages: TMessageModel[]) {
  if (row.answering.length == 0) {
    return;
  }

  const elements = document.getElementsByClassName("tds-message-row");

  for (let index = 0; index < elements.length; index++) {
    const element: Element = elements[index];

    if ((element.getAttribute("data-message-id") == row.answering) ||
      ((element.getAttribute("data-answering") == row.answering))) {
      element.classList.add("tds-message-row-flash");
      setTimeout(() => {
        element.classList.remove("tds-message-row-flash");
      }, 2000);
    }
  }
}

function findLastIndex<T>(array: T[], predicate: (value: T) => boolean): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      return i
    }
  }
  return -1
}

/**
 * ChatView renders the chat interface. 
 * 
 * It uses React hooks to manage form state and field arrays. 
 * Handles receiving updates from the panel via postMessage.
 * Renders messages, form, and buttons.
 */
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

  React.useEffect(() => {
    if (model.messages.length > 0) {
      const lastMessage: TMessageModel = model.messages[model.messages.length - 1];
      //const lastMessageIndex: number = findLastIndex(model.messages, 
      //  (message: TMessageModel) => message.author !== "Gaia");

      //document.getElementById(lastMessage.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      //scrollIntoView({
      //  behavior: 'auto',
      //  block: 'start',
      //  inline: 'nearest',
      //})

      flashMessage(lastMessage, model.messages);
    }
  }, ["messages"]);

  const onSubmit: SubmitHandler<TFields> = (data) => {
    data.newMessage = data.newMessage.trim().toLowerCase();

    sendSave(data);
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
  const actions: IFormAction[] = [];
  actions.push({
    id: 0,
    caption: "Clear",
    type: "link",
    href: "command:tds-gaia.clear",
    onClick: (sender: any) => {
      (document.getElementsByName("newMessage")[0] as any).control.value = "Clear";
    }
  });
  actions.push({
    id: 1,
    caption: "Help",
    type: "link",
    href: "command:tds-gaia.help",
    onClick: (sender: any) => {
      model.newMessage = "Help";
      (document.getElementsByName("newMessage")[0] as any).control.value = "Help";
    }
  });

  return (
    <main>
      <section className="tds-chat">
        <section className="tds-content">
          {
            //fields.map((row: any, index: number) => MessageRow(row, model.messages))
          }
          <VSCodeDataGrid id="messagesGrid"> {/*grid-template-columns=""*/}
            {model.messages.map((row: TMessageModel, index: number) => (
              <MessageRow key={`msgRow_${index}`} index={index} message={row} messages={model.messages} />
            ))}
          </VSCodeDataGrid>
        </section >
        <section className="tds-footer">
          <FormProvider {...methods} >
            <TdsForm<TFields>
              id="chatForm"
              onSubmit={onSubmit}
              methods={methods}
              actions={actions}
              isProcessRing={false}
            >
              <section className="tds-row-container" >
                <NewMessage />
              </section>
            </TdsForm>
          </FormProvider>
        </section>
      </section>
    </main >
  );
}

