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
import { CommonCommandFromWebViewEnum, CommonCommandToWebViewEnum, ReceiveMessage } from './utilities/common-command-panel';
import { TChatModel } from '../model/chatModel';
import { getExtraPanelConfigurations, getWebviewContent } from './utilities/webview-utils';
import { TMessageModel } from '../model/messageModel';
import { TFieldErrors } from '../model/abstractMode';
import { chatApi } from '../extension';
import { TQueueMessages } from '../api/chatApi';
import { getDitoUser } from '../config';
import { logger } from '../logger';
import { highlightCode } from '../decoration';

enum ChatCommandEnum {

}

/**
 * Regular expressions to match chat message formatting for links.
 * 
 */
const LINK_COMMAND_RE = /\[([^\]]+)\]\(command:([^\)]+)\)/i
const LINK_SOURCE_RE = /\[([^\]]+)\]\(link:([^\)]+)\)/i
const LINK_POSITION_RE = /([^&]+)&(\d+)(:(\d+)?(\-(\d+):(\d+)))?/i

/**
 * Type alias for chat commands that are both CommonCommandFromWebViewEnum 
 * and ChatCommandEnum. Allows handling commands from both enums in one type.
 */
type ChatCommand = CommonCommandFromWebViewEnum & ChatCommandEnum;

/**
 * ChatViewProvider implements the webview for the chat panel. 
 * It handles initializing the webview, sending messages between
 * VS Code and the webview, and routing commands from the webview.
 */
export class ChatViewProvider implements vscode.WebviewViewProvider {

  public static readonly viewType = 'tds-dito-view';

  private _view?: vscode.WebviewView;
  private chatModel: TChatModel = {
    lastPublication: new Date(),
    loggedUser: getDitoUser()?.displayName || "<Not logged>",
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
        }

        this.chatModel.messages.push(message);
      }

      this.sendUpdateModel(this.chatModel, undefined);
    })

    this._view = webviewView;

    webviewView.webview.options = getExtraPanelConfigurations(this._extensionUri);
    // {
    //   // Allow scripts in the webview
    //   enableScripts: true,
    //   localResourceRoots: [this._extensionUri]
    // };

    const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension('TOTVS.tds-dito-vscode');
    const extensionUri: vscode.Uri = ext!.extensionUri;

    webviewView.webview.html = getWebviewContent(webviewView.webview, extensionUri, "chatView", { title: "Dito: Chat" });
    webviewView.webview.onDidReceiveMessage(this._getWebviewMessageListener(webviewView.webview));
  }

  /**
   * Return  an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is received.
   *
   * @param webview A reference to the extension webview
   */
  private _getWebviewMessageListener(webview: vscode.Webview) {
    return (
      async (message: ReceiveMessage<CommonCommandFromWebViewEnum, TChatModel>) => {
        const command: ChatCommand = message.command as ChatCommand;
        const data = message.data;
        let matches: string = "";

        switch (command) {
          case CommonCommandFromWebViewEnum.Ready:
            if (data.model == undefined) {
              this.sendUpdateModel(this.chatModel, undefined);
            }

            break;
          case CommonCommandFromWebViewEnum.Save:
            if (data.model.newMessage.trim() !== "") {
              chatApi.user(data.model.newMessage, true);
            }

            break;
          case CommonCommandFromWebViewEnum.Execute:
            matches = data.command.match(LINK_COMMAND_RE);

            if (matches && matches.length > 1) {
              chatApi.user(matches[2], true);
            } else {
              matches = data.command.match(LINK_SOURCE_RE);

              if (matches && matches.length > 1) {
                const positionMatches: RegExpMatchArray | null = matches[2].match(LINK_POSITION_RE);

                if (positionMatches) {
                  const fileName: string = positionMatches[1];

                  vscode.workspace.openTextDocument(fileName).then(d => {
                    const startLine: number = parseInt(positionMatches[2]);
                    const startColumn: number = parseInt(positionMatches[4] || "0");
                    const position: vscode.Position = new vscode.Position(startLine - 1, startColumn - 1);

                    if (!d) {
                      if (vscode.window.activeTextEditor !== undefined) {
                        vscode.window.activeTextEditor.revealRange(
                          new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                        vscode.window.activeTextEditor.selection = new vscode.Selection(position, position);
                      }
                    } else {
                      vscode.window.showTextDocument(d, undefined, false).then((e: vscode.TextEditor) => {
                        e.revealRange(
                          new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                        e.selection = new vscode.Selection(position, position);
                      });
                    }
                  });
                }
              }
            }

            break;
          case CommonCommandFromWebViewEnum.LinkMouseOver:
            let ok: boolean = false;

            matches = data.command.match(LINK_SOURCE_RE);
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

                  chatApi.dito([
                    "Sorry.I didn't understand this command.",
                    `\`${msg}\``,
                    vscode.l10n.t("Favor abrir um {0}. Assim posso investigar melhor esse problema.", chatApi.commandText("open_issue"))
                  ], "");
                  logger.warn(msg);
                }
              }

              break;
            }
        }
      }
    );

  }

  protected sendUpdateModel(model: TChatModel, errors: TFieldErrors<TChatModel> | undefined): void {
    let messagesToSend: TMessageModel[] = [];

    //model.loggedUser = getDitoUser()!.displayName || "<Not logged>";
    model.newMessage = "";

    if (this.chatModel.messages.length > 0) {
      let oldAuthor: string | undefined;
      let oldTimestamp: string | undefined;

      this.chatModel.messages.forEach((message: TMessageModel) => {
        if (message.answering.length > 0) {
          this.chatModel.messages.filter((answered: TMessageModel) => answered.id == message.answering)
            .forEach((answered: TMessageModel) => {
              answered.inProcess = false;
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
      command: CommonCommandToWebViewEnum.UpdateModel,
      data: {
        model: { ...model, messages: messagesToSend },
        errors: errors
      }
    });
  }

  private logWarning(message: string) {
    // Utils.logMessage(message, MESSAGE_TYPE.Warning, false);
  }

  private logInfo(message: string) {
    //Utils.logMessage(message, MESSAGE_TYPE.Info, false);
  }

  private logError(message: string) {
    // Utils.logMessage(message, MESSAGE_TYPE.Error, false);
  }
}