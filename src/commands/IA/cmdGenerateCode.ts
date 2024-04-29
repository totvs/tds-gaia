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

export function registerGenerateCode(context: vscode.ExtensionContext): void {

  context.subscriptions.push(vscode.commands.registerTextEditorCommand('tds-gaia.generateCode', () => {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    let generateText: string = "";

    if (editor !== undefined) {
      const selection: vscode.Selection = editor.selection;
      let whatGenerate: string = "";

      if (selection && !selection.isEmpty) {
        const selectionRange: vscode.Range = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);

        generateText = editor.document.getText(selectionRange);
        whatGenerate = chatApi.linkToSource(editor.document.uri, selectionRange);
      }

      if (generateText.length > 0) {
        const messageId: string = chatApi.gaia(
          vscode.l10n.t("Generating code using descriptive in {0}", whatGenerate), {});

        return llmApi.generateCode(generateText).then((generateCode: string[]) => {
          const responseId: string = chatApi.nextMessageId();
          if (getGaiaConfiguration().clearBeforeExplain) {
            chatApi.user("clear", true);
          }

          //chatApi.gaia(`\`\`\`\n${generateCode.join("\n")}\n\`\`\``, { canFeedback: true, answeringId: messageId });
          chatApi.gaia(generateCode.join("\n"), { canFeedback: true, answeringId: messageId });
          feedbackApi.traceGenerateCode(responseId, generateText, generateCode.join("\n"));
        });
      } else {
  chatApi.gaiaWarning([
    "I couldn't identify a description of the code to generate.",
    "Select the block with the description of the code to be generated."
  ]);
}
    } else {
  chatApi.gaiaWarning("Current editor is not valid for this operation.");
}

  }));
}
