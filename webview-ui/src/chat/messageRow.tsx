import { useController } from "react-hook-form";
import { MessageOperationEnum, TMessageModel } from "./chatModels";
import { VSCodeDataGridCell, VSCodeDataGridRow, VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { vsCodeDataGrid } from "@vscode/webview-ui-toolkit";
import { sendLinkMouseOver } from "./sendCommand";
import { feedback } from './../../../src/extension';
import Message from "./message";
import Feedback from "./feedback";

const PARAGRAPH_RE = /\n\n/i
const PHRASE_RE = /\n/i
const LINK_COMMAND_RE = /\[([^\]]+)\]\((command:[^\)]+)\)/i
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
            //A ordem de teste deve ser: Code, Link e demais tags (cuidado ao alterar)
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
                        <VSCodeLink key={spanSeq++} href={matchesLink[2]}
                            onClick={() => {
                                (document.getElementsByName("newMessage")[0] as any).control.value = caption;
                            }
                            }>{matchesLink[1]}
                        </VSCodeLink>
                    );
                } else if (matchesLink = link.match(LINK_SOURCE_RE)) {
                    console.log(matchesLink);

                    children.push(
                        <span key={spanSeq++}
                            onMouseOver={(e) => {
                                console.log(matchesLink!.input);
                                sendLinkMouseOver(matchesLink!.input);
                            }}>
                            <VSCodeLink key={spanSeq++} href={matchesLink[2]}
                                onClick={() => {
                                    (document.getElementsByName("newMessage")[0] as any).control.value = caption;
                                }}>{matchesLink[1]}
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
        <div className="tds-message" key={spanSeq++} >
            {...children}
        </div>
    )
}

export interface IMessageRowProps {
    index: number;
    message: TMessageModel;
    messages: TMessageModel[]
}

export default function MessageRow(props: IMessageRowProps): any {
    const row: TMessageModel = props.message;
    let children: any[] = [];

    if (row.author.length > 0) {
        let timeStamp: string = new Date(row.timeStamp).toTimeString().substring(0, 5);

        children.push(
        )
    }

    //children.push(ShowMessage(row));

    //{ ...children }
    return (
        <VSCodeDataGridRow key={row.messageId.toString()} className={`tds-message-row ${row.className}`}>
            <VSCodeDataGridCell grid-column="1">
                <>
                    <Message {...row} isHovering={false} />
                    {row.feedback && <Feedback />}
                </>
                {
                    // data - message - id= {row.messageId.toString()}
                    // data - answering={ row.answering.toString() }
                    // className = "tds-message-row"
                    // onMouseOver = {(e) => flashMessage(row, messages)
                }

                {...children}
            </VSCodeDataGridCell>
        </VSCodeDataGridRow >
    )
}
