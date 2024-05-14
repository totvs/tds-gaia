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

import * as vscode from "vscode";
import { logger } from "../logger";
import { chatApi } from "../api";
import { TGenerateCodeModel } from "../model/generateCodeModel";
import { CommonCommandEnum, ReceiveMessage } from "../utilities/common-command-webview";
import { TFieldErrors, TdsPanel, isErrors } from "./panel";
import { getExtraPanelConfigurations, getWebviewContent } from "../utilities/webview-utils";

var os = require('os');
const fs = require("fs");

enum GenerateCodeCommandEnum {
  GenerateCode = "GENERATE_CODE",
  CopyToClipboard = "COPY_TO_CLIPBOARD"
}

type GenerateCodeCommand = CommonCommandEnum & GenerateCodeCommandEnum;

export class GenerateCodePanel extends TdsPanel<TGenerateCodeModel> {
  public static currentPanel: GenerateCodePanel | undefined;

  public static render(context: vscode.ExtensionContext): GenerateCodePanel {
    const extensionUri: vscode.Uri = context.extensionUri;

    if (GenerateCodePanel.currentPanel) {
      // If the webview panel already exists reveal it
      GenerateCodePanel.currentPanel._panel.reveal(); //vscode.ViewColumn.One
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = vscode.window.createWebviewPanel(
        // Panel view type
        "generate-code",
        // Panel title
        vscode.l10n.t('Generate Code'),
        // The editor column the panel should be displayed in
        vscode.ViewColumn.One,
        // Extra panel configurations
        {
          ...getExtraPanelConfigurations(extensionUri)
        }
      );

      GenerateCodePanel.currentPanel = new GenerateCodePanel(panel, extensionUri);
    }

    return GenerateCodePanel.currentPanel;
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    GenerateCodePanel.currentPanel = undefined;

    super.dispose();
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  protected getWebviewContent(extensionUri: vscode.Uri) {

    return getWebviewContent(this._panel.webview, extensionUri, "generateCodeView",
      { title: this._panel.title, translations: this.getTranslations() });
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is received.
   *
   * @param webview A reference to the extension webview
   */
  protected async panelListener(message: ReceiveMessage<GenerateCodeCommand, TGenerateCodeModel>, result: any): Promise<any> {
    const command: GenerateCodeCommand = message.command;
    const data = message.data;
    const errors: TFieldErrors<TGenerateCodeModel> = {};

    switch (command) {
      case CommonCommandEnum.Ready:
        if (data.model == undefined) {
          this.sendUpdateModel({
            description: "",
            generateCode: "",
          }, {});
        }
        break;
      case GenerateCodeCommandEnum.CopyToClipboard:

        if (await this.validateModel(data.model, errors)) {
          vscode.env.clipboard.writeText(data.model.generateCode);
          chatApi.gaia("Its code was copied to the clipboard.", { answeringId: "" });
        }

        this.sendUpdateModel(message.data.model, errors);

        break;
      case GenerateCodeCommandEnum.GenerateCode:

        if (await this.validateModel(data.model, errors)) {
          message.data.model.generateCode = vscode.l10n.t("Generating code...");
          this.sendUpdateModel(message.data.model, errors);

          vscode.window.setStatusBarMessage(
            `$(gear~spin) ${vscode.l10n.t("Generating code...")}`);
          const generateCode: any = await vscode.commands.executeCommand("tds-gaia.processGenerateCode", data.model.description);
          if (generateCode && generateCode.length > 0) {
            message.data.model.generateCode = generateCode.join("\n").replace(/\t/g, "  ");
          } else {
            errors.root = { type: "validate", message: vscode.l10n.t("Error generating code. See log for details.") };
          }
          vscode.window.setStatusBarMessage("");
        }

        this.sendUpdateModel(message.data.model, errors);
        break;
    }
  }

  async validateModel(model: TGenerateCodeModel, errors: TFieldErrors<TGenerateCodeModel>): Promise<boolean> {
    model.description = model.description.trim()

    if (model.description.length == 0) {
      errors.description = { type: "required" };
    }

    return !isErrors(errors);
  }

  async saveModel(model: TGenerateCodeModel): Promise<boolean> {
    const fileUri: vscode.Uri | undefined = await vscode.window.showSaveDialog({ filters: { "AdvPL++": ["tlpp"] } });

    if (fileUri) {
      let savePath = fileUri.path;
      if (os.platform() === "win32") {
        savePath = savePath.substring(1);
      }

      const writeStream = fs.createWriteStream(savePath);
      writeStream.write(model.generateCode)

      // handle the errors on the write process
      writeStream.on('error', (err: any) => {
        let fullErrMsg = `There is an error writing the file ${savePath} => ${err}`;
        logger.error(fullErrMsg);
      });

      writeStream.end();

      vscode.workspace.openTextDocument(fileUri);

      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }

  /**
   * Provides translations for the "Generate Code" webview.
   * @returns An object containing the translated strings for the panel.
   */
  protected getTranslations(): Record<string, string> {
    return {
      "Generate Code": vscode.l10n.t("Generate Code"),
      "[Code generation]generateCode.md": vscode.l10n.t("[Code generation]generateCode.md"),
      "Description": vscode.l10n.t("Description"),
      "Describe what you want the generated code to do.": vscode.l10n.t("Describe what you want the generated code to do."),
      "Code": vscode.l10n.t("Code"),
      "Code generated from the description.": vscode.l10n.t("Code generated from the description.")
    };
  }
}
