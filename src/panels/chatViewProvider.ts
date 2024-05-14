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

import * as vscode from 'vscode';
import { TQueueMessages } from '../api/chatApi';
import { getGaiaUser } from '../config';
import { logger } from '../logger';
import { highlightCode } from '../decoration';
import { dataCache } from '../dataCache';
import { chatApi, feedbackApi } from '../api';
import { TChatModel } from '../model/chatModel';
import { MessageOperationEnum, TMessageModel } from '../model/messageModel';
import { CommonCommandEnum, ReceiveMessage } from '../utilities/common-command-webview';
import { getExtraPanelConfigurations, getWebviewContent } from '../utilities/webview-utils';
import { TFieldErrors } from './panel';

export enum ChatCommandEnum {
  Feedback = "FEEDBACK",
}

/**
 * Regular expressions to match chat message formatting for links.
 * 
 */
//const LINK_COMMAND_RE = /\[([^\]]+)\]\(command:([^\)]+)\)/i
const LINK_SOURCE_RE = /\[([^\]]+)\]\(link:([^\)]+)\)/i
const LINK_POSITION_RE = /([^&]+)&(\d+)(:(\d+)?(\-(\d+):(\d+)))?/i

/**
 * Type alias for chat commands that are both CommonCommandFromWebViewEnum 
 * and ChatCommandEnum. Allows handling commands from both enums in one type.
 */
type ChatCommand = CommonCommandEnum & ChatCommandEnum;

/**
 * ChatViewProvider implements the webview for the chat panel. 
 * It handles initializing the webview, sending messages between
 * VS Code and the webview, and routing commands from the webview.
 */
export class ChatViewProvider implements vscode.WebviewViewProvider {

  public static readonly viewType = 'tds-gaia-view';

  private _view?: vscode.WebviewView;
  private chatModel: TChatModel = {
    command: "",
    lastPublication: new Date(),
    loggedUser: getGaiaUser()?.displayName || "<Not logged>",
    newMessage: "",
    messages: []
  };
  private oldMouseOverPosition: string = "";

  /**
 * Constructor for ChatViewProvider class.
 * 
 * @param _extensionUri - The URI of the VS Code extension. Used to resolve resources 
 *                        like images from the webview.
 */
  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) { }

  /**
 * Initializes the webview by setting options, registering listeners, and loading HTML.
 * 
 * Sets up communication between the webview and VS Code by registering a listener for 
 * messages from the webview and sending the initial state. Loads the HTML content.
 */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {

    chatApi.onMessage((queueMessage: TQueueMessages) => {
      logger.debug(`ChatViewProvider.onMessage=> ${queueMessage.size()}`);

      while (queueMessage.size() > 0) {
        const message: TMessageModel = queueMessage.dequeue() as TMessageModel;

        if (message.message == "clear") {
          this.chatModel.messages = [];
          dataCache.clear();
        }

        if (message.operation === MessageOperationEnum.Add) {
          this.chatModel.messages.push(message);
        } else {
          const index: number = this.chatModel.messages.findIndex(m => m.messageId === message.messageId);

          if (index !== -1) {
            if (message.operation === MessageOperationEnum.Update) {
              this.chatModel.messages[index] = message;
            } else {
              this.chatModel.messages.splice(index, 1);
            }
          } else {
            logger.error(`ChatViewProvider.onMessage=> Message not found: ${message.messageId}`);
          }
        }
      }

      this.sendUpdateModel(this.chatModel, undefined);
    })

    this._view = webviewView;

    webviewView.webview.options = {
      ...getExtraPanelConfigurations(this._extensionUri),
      enableCommandUris: true
    };

    const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension('TOTVS.tds-gaia');
    const extensionUri: vscode.Uri = ext!.extensionUri;

    webviewView.webview.html = getWebviewContent(webviewView.webview, extensionUri, "chatView",
      { title: "Gaia: Chat", translations: this.getTranslations() });
    webviewView.webview.onDidReceiveMessage(this._getWebviewMessageListener(webviewView.webview));
  }

  /**
 * Provides translations for the "Chat View" webview.
 * @returns An object containing the translated strings for the panel.
 */
  protected getTranslations(): Record<string, string> {
    return {
      "Clear": vscode.l10n.t("Clear"),
      "Help": vscode.l10n.t("Help"),
      "Tell me what you need...": vscode.l10n.t("Tell me what you need...")
    };
  }

  /**
   * Return  an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is received.
   *
   * @param webview A reference to the extension webview
   */
  private _getWebviewMessageListener(webview: vscode.Webview) {
    return (
      async (message: ReceiveMessage<ChatCommand, TChatModel>) => {
        const command: ChatCommand = message.command;
        const data = message.data;
        let matches: RegExpMatchArray | null = null;

        switch (command) {
          case CommonCommandEnum.Ready:
            if (data.model == undefined) {
              this.sendUpdateModel(this.chatModel, undefined);
            }

            break;
          case CommonCommandEnum.Save:
            if (data.model.newMessage.trim() !== "") {
              chatApi.user(data.model.newMessage, true);
              data.model.newMessage = "";
            }

            break;
          case CommonCommandEnum.LinkMouseOver:
            let ok: boolean = false;

            matches = data.model.command.match(LINK_SOURCE_RE);
            if (matches && matches.length > 1) {
              if (matches[2] !== this.oldMouseOverPosition) {
                const positionMatches: RegExpMatchArray | null = matches[2].match(LINK_POSITION_RE);

                if (positionMatches) {
                  ok = true;
                  const source: string = positionMatches[1];
                  const startLine: number = parseInt(positionMatches[2]);
                  const startColumn: number = parseInt(positionMatches[4] || "0");
                  const endLine: number = parseInt(positionMatches[6] || "0");
                  const endColumn: number = parseInt(positionMatches[7] || "0");
                  const decorationType: vscode.TextEditorDecorationType = highlightCode(source, startLine, startColumn, endLine, endColumn);

                  setTimeout(() => {
                    this.oldMouseOverPosition = ""
                    vscode.window.activeTextEditor?.setDecorations(decorationType, []);
                  }, 5000);

                }

                if (!ok) {
                  const msg: string = vscode.l10n.t("invalid link in MouseOver: {0}", data.command);

                  chatApi.gaia([
                    "Sorry.I didn't understand this command.",
                    `\`${msg}\``,
                    vscode.l10n.t("Please open a {0}. That way I can investigate this issue better.", chatApi.commandText("open_issue"))
                  ], {});
                  logger.warn(msg);
                }
              }

              break;
            }
          case ChatCommandEnum.Feedback:
            this.chatModel.messages
              .filter((msg: TMessageModel) => msg.messageId == data.messageId)
              .forEach((msg: TMessageModel) => {
                msg.disabled = true;
                feedbackApi.scoreMessage(msg.messageId, Number.parseInt(data.value));
              });

            this.sendUpdateModel(this.chatModel, undefined);
            break;
        }
      }
    );
  }

  protected sendUpdateModel(model: TChatModel, errors: TFieldErrors<TChatModel> | undefined): void {
    let messagesToSend: TMessageModel[] = [];

    model.newMessage = "";

    if (this.chatModel.messages.length > 0) {
      let oldAuthor: string | undefined;
      let oldTimestamp: string | undefined;

      this.chatModel.messages.forEach((message: TMessageModel) => {
        if (message.answering.length > 0) {
          this.chatModel.messages.filter((answered: TMessageModel) => answered.messageId == message.answering)
            .forEach((answered: TMessageModel) => {
              answered.inProcess = false;
              answered.answering = message.answering;
            });
        }
      });

      this.chatModel.messages.forEach((message: TMessageModel) => {
        let formattedMessage: TMessageModel = { ...message };

        if ((oldAuthor != formattedMessage.author)
          || (oldTimestamp != formattedMessage.timeStamp.toTimeString().substring(0, 5))
          || (message.inProcess)) {
          oldAuthor = formattedMessage.author;
          oldTimestamp = formattedMessage.timeStamp.toTimeString().substring(0, 5);
        } else {
          formattedMessage.author = "";
        }

        messagesToSend.push(formattedMessage);
      });
    }

    this._view!.webview.postMessage({
      command: CommonCommandEnum.UpdateModel,
      data: {
        model: { ...model, messages: messagesToSend },
        errors: errors
      }
    });
  }
}