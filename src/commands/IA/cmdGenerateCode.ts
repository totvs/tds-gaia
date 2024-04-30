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
import { chatApi, feedbackApi, llmApi } from "../../api";
import { getGaiaConfiguration } from "../../config";
import { GenerateCodePanel } from "../../panels/generateCodePanel";

export function registerGenerateCode(context: vscode.ExtensionContext): void {

  vscode.commands.registerCommand("tds-gaia.generateCode", () => {
    GenerateCodePanel.render(context);
  });

  context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.processGenerateCode', (description: string) => {
    if (description.length > 0) {
      // chatApi.user(
      //   vscode.l10n.t("Generate code for description `{0}...`", description.substring(0, 20)), true);
      const messageId: string = chatApi.gaia(
        vscode.l10n.t("Generating the code as requested."), {});

      return llmApi.generateCode(description).then((generateCode: string[]) => {
        const responseId: string = chatApi.nextMessageId();
        if (getGaiaConfiguration().clearBeforeExplain) {
          chatApi.user("clear", true);
        }

        chatApi.gaia(vscode.l10n.t("Code generated with {0} lines.", generateCode.length), { canFeedback: true, answeringId: messageId });
        feedbackApi.traceGenerateCode(responseId, description, generateCode);

        return generateCode
      });
    } else {
      chatApi.gaiaWarning(vscode.l10n.t("A description was not informed."));

      return [];
    }
  }));
}