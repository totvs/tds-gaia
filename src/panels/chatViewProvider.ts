
import * as vscode from 'vscode';
import { CommonCommandFromWebViewEnum, CommonCommandToWebViewEnum, ReceiveMessage } from './utilities/common-command-panel';
import { TChatModel } from '../model/chatModel';
import { getWebviewContent } from './utilities/webview-utils';
import { TMessageModel } from '../model/messageModel';
import { TFieldErrors } from '../model/abstractMode';
import { chatApi } from '../extension';
import { ChatApi, TQueueMessages } from '../api/chatApi';
import { getDitoUser } from '../config';

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
      while (queueMessage.size() > 0) {
        const message: TMessageModel = queueMessage.dequeue() as TMessageModel;

        this.chatModel.messages.push(message);
      }

      this.sendUpdateModel(this.chatModel, undefined);
    })

    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension('TOTVS.tds-dito-vscode');
    const extensionUri: vscode.Uri = ext!.extensionUri;

    webviewView.webview.html = getWebviewContent(webviewView.webview, extensionUri, "chatView", { title: "Dito: Chat" });
    webviewView.webview.onDidReceiveMessage(this._getWebviewMessageListener(webviewView.webview));
  }

  // private _getHtmlForWebview(webview: vscode.Webview) {

  //   const getUri = (pathList: string[]): vscode.Uri => {
  //     return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
  //   }

  //   const getNonce = (): string => {
  //     let text = '';
  //     const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  //     for (let i = 0; i < 32; i++) {
  //       text += possible.charAt(Math.floor(Math.random() * possible.length));
  //     }
  //     return text;
  //   }

  //   const BASE_FOLDER: string[] = [
  //     "webview-ui",
  //     "build",
  //   ];

  //   // The CSS file from the React build output
  //   const stylesUri: vscode.Uri[] = [];

  //   // const cssFiles: string[] = options.cssExtraFiles || [];

  //   // The JS file from the React build output
  //   const scriptsUri: vscode.Uri[] = [];
  //   scriptsUri.push(getUri([
  //     ...BASE_FOLDER,
  //     `chatView.js`,
  //   ]))

  //   const nonce = getNonce();

  //   return /*html*/ `
  //     <!DOCTYPE html>
  //     <html lang="en">
  //       <head>
  //         <meta charset="utf-8">
  //         <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
  //         <meta name="theme-color" content="#000000">
  //         <meta http-equiv="Content-Security-Policy"
  //             content="default-src 'none';
  //                     img-src https: 'unsafe-inline' ${webview.cspSource};
  //                     font-src ${webview.cspSource};
  //                     style-src 'unsafe-inline' ${webview.cspSource};
  //                     script-src 'nonce-${nonce}';"
  //         >
  //         ${stylesUri.map((uri: vscode.Uri) => {
  //     return `<link rel="stylesheet" type="text/css" href="${stylesUri}">\n`;
  //   })}
  //         <title>${"Dito: Chat"}</title>
  //       </head>
  //       <body>
  //         <noscript>You need to enable JavaScript to run this app.</noscript>
  //         <div id="root"></div>
  //         ${scriptsUri.map((uri: vscode.Uri) => {
  //     return `<script nonce="${nonce}" src="${uri}"></script>\n`;
  //   })}
  //       </body>
  //     </html>
  //   `;
  // }

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
            chatApi.user(data.model.newMessage);

            break;
          case CommonCommandFromWebViewEnum.Execute:
            chatApi.user(data.command);

            if (data.command == "clear") {
              this.chatModel.messages = [];
              this.sendUpdateModel(this.chatModel, undefined);
            }

            //TODO: limpar comando da mensagem original (messageId)? 
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
    //model.loggedUser = getDitoUser()!.displayName || "<Not logged>";
    //model.newMessage = "";

    if (this.chatModel.messages.length > 0) {
      let oldAuthor: string | undefined;
      let oldTimestamp: string | undefined;
      const countMessages: number = this.chatModel.messages.length;

      this.chatModel.messages = this.chatModel.messages.map((message: TMessageModel) => {
        if ((oldAuthor != message.author) || (oldTimestamp != message.timeStamp.toTimeString().substring(0, 5))) {
          oldAuthor = message.author;
          oldTimestamp = message.timeStamp.toTimeString().substring(0, 5);
        } else {
          message.author = "";
        }

        if ((countMessages > 1) && message.inProcess) {
          message.inProcess = false;
        }

        return message;
      });
    }

    this._view!.webview.postMessage({
      command: CommonCommandToWebViewEnum.UpdateModel,
      data: {
        model: model,
        errors: errors
      }
    });

    this.chatModel.messages.forEach((message: TMessageModel, index: number) => {
      message.inProcess = false;
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

