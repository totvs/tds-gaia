import "./chatView.css";
import React from "react";
import { Control, FormProvider, SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { CommonCommandFromPanelEnum, ReceiveMessage, sendSave } from "../utilities/common-command-webview";
import { VSCodeButton, VSCodeLink, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
import { IFormAction, TdsForm, TdsTextField, setDataModel, setErrorModel } from "../components/form";
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
  return (<VSCodeLink onClick={() => {
    (document.getElementsByName("newMessage")[0] as any).control.value = action.command;
    sendExecute(message.messageId, action.command);
  }}>
    {action.caption}
  </VSCodeLink>
  );
}

const PARAGRAPH_RE = /\n\n/i
const PHRASE_RE = /\n/i

type InlineTagName = "code" | "bold" | "italic" | "link";
type BlockTagName = "code";

//mapeamento parcial (somente as utilizadas) das marcações MD
const mdTags: Record<InlineTagName, RegExp> = {
  "code": /\`([^\\`]+)\`/g,
  "bold": /\*\*([^\*\*]+)\*\*/g,
  "italic": /_([^_])+_/g,
  "link": /\[([^\].]+)\]\(([^\).]+)\)/g
}

const allTags_re = new RegExp(`(${mdTags.code.source})|(${mdTags.bold.source})|(${mdTags.italic.source})|(${mdTags.link.source})`, "ig");

const tagsBlockMap: Record<BlockTagName, RegExp> = {
  "code": /[\`\`\`|~~~]\w*(.*)[\`\`\`|~~~]/gis
};

let spanSeq: number = 0;

function mdToHtml(text: string): any[] {
  let children: any[] = [];
  let parts: string[] | null = text.split(allTags_re);

  for (let index = 0; index < parts.length; index++) {
    const part: string = parts[index];

    if (part) {
      if (part.match(mdTags.bold)) {
        index++;
        children.push(<b key={spanSeq++}>{parts[index]}</b>);
      } else if (part.match(mdTags.code)) {
        index++;
        children.push(<code key={spanSeq++}>{parts[index]}</code>);
      } else if (part.match(mdTags.italic)) {
        index++;
        children.push(<i key={spanSeq++}>{parts[index]}</i>);
      } else if (part.match(mdTags.link)) {
        index++;
        const caption: string = parts[index];
        index++;
        const link: string = parts[index];
        const pos: number = link.indexOf(":");
        if (pos > -1) {
          children.push(<VSCodeLink key={spanSeq++} onClick={() => {
            (document.getElementsByName("newMessage")[0] as any).control.value = caption;
            sendExecute(0, link.substring(pos + 1));
          }}>{caption}</VSCodeLink>);
        } else {
          children.push(<span key={spanSeq++}>{part}</span>);
        }

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

function txtToHtml(text: string): any[] {
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

function HandleText(part: string): any[] {

  return txtToHtml(part);
}

function ShowMessage(message: TMessageModel) {
  let children: any[] = [];

  if (message.actions?.length) {
    let text: string = message.message;

    // message.actions?.forEach((action) => {
    //   const pos_s: number = text.indexOf("{command:");
    //   const pos_e: number = text.indexOf("}", pos_s);

    //   if (pos_s > -1 && pos_e > -1) {
    //     children.push(HandleText(text.substring(0, pos_s)));
    //     children.push(HandleCommand(message, action));
    //   } else {
    //     children.push(HandleText(text));
    //   }

    //   text = text.substring(pos_e + 1);
    // });

    if (text.length > 0) {
      children.push(HandleText(text));
    }
  } else {
    children.push(HandleText(message.message));
  }

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
        {row.inProcess && false && <VSCodeProgressRing />}
        <span key={spanSeq++} id="author">{author}</span><span id="timeStamp">{timeStamp}</span>
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
  const actions: IFormAction[] = [];
  actions.push({
    id: 0,
    caption: "Clear",
    type: "link",
    onClick: () => {
      (document.getElementsByName("newMessage")[0] as any).control.value = "clear";
      sendExecute(-1, "clear");
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

