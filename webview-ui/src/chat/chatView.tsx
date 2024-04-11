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
import { Control, FormProvider, SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { CommonCommandFromPanelEnum, ReceiveMessage, sendSave } from "../utilities/common-command-webview";
import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { IFormAction, TdsForm, TdsTextField, setDataModel, setErrorModel } from "../components/form";
import { sendExecute, sendLinkMouseOver } from "./sendCommand";

enum ReceiveCommandEnum {
}

type ReceiveCommand = ReceiveMessage<CommonCommandFromPanelEnum & ReceiveCommandEnum, TFields>;

type TMessageActionModel = {
  caption: string;
  command: string;
}

type TMessageModel = {
  id: string;
  answering: string;
  inProcess: boolean;
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

const PARAGRAPH_RE = /\n\n/i
const PHRASE_RE = /\n/i
const LINK_COMMAND_RE = /\[([^\]]+)\]\(command:([^\)]+)\)/i
const LINK_SOURCE_RE = /\[([^\]]+)\]\(link:([^\)]+)\)/i

type InlineTagName = "code" | "bold" | "italic" | "link" | "blockquote";
type BlockTagName = "code";

//mapeamento parcial (somente as utilizadas) das marcações MD
const mdTags: Record<InlineTagName, RegExp> = {
  "code": /\`([^\`]+)\`/g,
  "bold": /\*\*([^\*\*]+)\*\*/g,
  "italic": /_([^_])+_/g,
  "link": /\[([^\]]+)\]\(([^\)]+)\)/g,
  "blockquote": /^>/gs,
}

const allTags_re = new RegExp(`(${mdTags.code.source})|(${mdTags.bold.source})|(${mdTags.italic.source})|(${mdTags.link.source})|(${mdTags.blockquote.source})`, "ig");

const tagsBlockMap: Record<BlockTagName, RegExp> = {
  "code": /[\`\`\`|~~~]\w*(.*)[\`\`\`|~~~]/gis
};

let spanSeq: number = 0;

/**
 * Converts Markdown-formatted text to HTML elements.
 *
 * This function takes a string of Markdown-formatted text and converts it to an array of React elements that can be rendered in the UI. It supports the following Markdown syntax:
 *
 * - `code`: Inline code blocks
 * - `**bold**`: Bold text
 * - `_italic_`: Italic text
 * - `[link text](command:link)`: Links that execute a command when clicked
 * - `[link text](link:url)`: Links that open a URL when clicked
 * - `> blockquote`: Blockquotes (warning)
 *
 * The function returns an array of React elements that can be directly rendered in the UI.
 *
 * @param text - The Markdown-formatted text to be converted to HTML.
 * @returns An array of React elements representing the HTML equivalent of the input Markdown text.
 */
function mdToHtml(text: string): any[] {
  let children: any[] = [];
  let parts: string[] | null = text.split(allTags_re);

  for (let index = 0; index < parts.length; index++) {
    const part: string = parts[index];

    if (part) {
      //A ordem de teste deve ser:  Code, Link e demais tags (cuidado ao alterar)
      if (part.match(mdTags.code)) {
        index++;
        children.push(<code key={spanSeq++}>{parts[index]}</code>);
      } else if (part.match(mdTags.link)) {
        index++;
        const caption: string = parts[index];
        index++;
        const link: string = part;
        let matchesLink: any;  //RegExpMatchArray | null;
        if (matchesLink = link.match(LINK_COMMAND_RE)) {
          children.push(
            <VSCodeLink key={spanSeq++}
              onClick={() => {
                (document.getElementsByName("newMessage")[0] as any).control.value = caption;
                sendExecute(matchesLink!.input);
              }
              }>{matchesLink[1]}
            </VSCodeLink>);
        } else if (matchesLink = link.match(LINK_SOURCE_RE)) {
          children.push(
            <span key={spanSeq++}
              onMouseOver={(e) => {
                sendLinkMouseOver(matchesLink!.input);
              }}>
              <VSCodeLink key={spanSeq++}
                onClick={() => {
                  (document.getElementsByName("newMessage")[0] as any).control.value = caption;
                  sendExecute(matchesLink!.input);
                }
                }>{matchesLink[1]}
              </VSCodeLink>
            </span>);
        } else {
          children.push(<span key={spanSeq++}>{part}</span>);
        }
      } else if (part.match(mdTags.bold)) {
        index++;
        children.push(<b key={spanSeq++}>{parts[index]}</b>);
      } else if (part.match(mdTags.italic)) {
        index++;
        children.push(<i key={spanSeq++}>{parts[index]}</i>);
      } else if (part.match(mdTags.blockquote)) {
        index++;
        children.push(<blockquote key={spanSeq++}>{parts[index]}</blockquote>);
      } else {
        children.push(<span key={spanSeq++}>{part}</span>);
      }
    }
  }

  if (children.length == 0) {
    children.push(<span>{text}</span>);
  }

  return children;
}

function mdTextToHtml(text: string): any[] {
  const children: any[] = [];
  const blocks: string[] = [text]; //text.split(tagsBlockMap["code"]);

  for (let index = 0; index < blocks.length; index++) {
    const block: string = blocks[index];

    // if (block.match(tagsBlockMap["code"])) {
    //   children.push(<code>{block}</code>);
    // } else {
    const paragraphs: string[] = text.split(PARAGRAPH_RE);

    paragraphs.forEach((paragraph: string) => {
      const phrases: string[] = paragraph.split(PHRASE_RE);

      phrases.forEach((phrase: string, index: number) => {
        phrase = phrase.trim();
        if (phrase.length > 0) {
          //if (index == (phrases.length - 1)) {
          if (phrases.length == 1) {
            children.push(<p key={spanSeq++}>{mdToHtml(phrase)}</p>);
          } else if (index > 0) {
            children.push(mdToHtml(phrase));
            children.push(<br key={spanSeq++} />);
          } else {
            children.push(<>{mdToHtml(phrase)}</>);
          }
        }
      });
    });
  };

  return children;
}

function ShowMessage(message: TMessageModel) {
  let children: any[] = mdTextToHtml(message.message);

  return (
    <div className="tds-message" key={spanSeq++}>
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
      <div className="tds-message-author" key={spanSeq++}>
        <span key={spanSeq++} id="author">{author}</span>
        {row.inProcess && <span id="inProcess" key={spanSeq++}>Processing..</span>}
        <span id="timeStamp">{timeStamp}</span>
      </div>
    )
  }

  children.push(ShowMessage(row));

  return (
    <div key={row.id.toString()} className="tds-message-row">
      {...children}
    </div>
  )
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

          // console.log("************************");
          // console.dir(model);

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
    onClick: () => {
      (document.getElementsByName("newMessage")[0] as any).control.value = "clear";
      sendExecute("clear");
    }
  });

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
              actions={actions}
              isProcessRing={false}
            >

              <section className="tds-row-container" >
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
              </section>
            </TdsForm>
          </FormProvider>
        </section>
      </section>
    </main >
  );
}

