
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

const LINK_COMMAND_RE = /\[([^\]]+)\]\(command:([^\)]+)\)/i
const LINK_SOURCE_RE = /\[([^\]]+)\]\(link:([^\)]+)\)/i
const LINK_POSITION_RE = /([^&]+)&(\d+)(:(\d+)?(\-(\d+):(\d+)))?/i

type ChatCommand = CommonCommandFromWebViewEnum & ChatCommandEnum;

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

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {

    chatApi.onMessage((queueMessage: TQueueMessages) => {
      logger.info(`ChatViewProvider.onMessage=> ${queueMessage.size()}`);

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
              this.sendConfiguration()
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
              chatApi.user(data.command, true);
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
                  const msg: string = `Link inválido em MouseOver: ${data.command}`;
                  chatApi.dito(["Desculpe. Não entendi esse comando.",
                    "\n",
                    `\`${msg}\``,
                    "\n",
                    `Favor abrir um ${chatApi.commandText("open_issue")}. Assim posso investigar melhor esse problema.`
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

  protected sendConfiguration(): void {
    //this._view!.webview.postMessage({
    //   command: CommonCommandToWebViewEnum.Configuration,
    //   data: {
    //     commandsMap: ChatApi.getCommandsMap()
    //   }
    // });

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

