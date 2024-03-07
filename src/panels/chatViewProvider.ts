
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

enum ChatCommandEnum {

}

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
            chatApi.user(data.command, true);
            break;
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

