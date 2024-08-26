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
import { GenerateCodePanel } from "../../panels/generateCodePanel";

export function registerGenerateCode(context: vscode.ExtensionContext): void {

  vscode.commands.registerCommand("tds-gaia.generateCode", () => {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    let description: string = "";

    if (editor !== undefined) {
      const selection: vscode.Selection = editor.selection;
      let whatDescription: string = "";

      if (selection && !selection.isEmpty) {
        const selectionRange: vscode.Range = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);

        description = editor.document.getText(selectionRange).trim();
        whatDescription = chatApi.linkToSource(editor.document.uri, selectionRange);
      } else {
        const curPos: vscode.Position = selection.start;
        const contentLine: string = editor.document.lineAt(curPos.line).text.trim();
        const re: RegExp = /^\/\//gi;

        if (contentLine.match(re)) {
          const firstLine: number = getLine(curPos.line, editor.document, -1);
          const lastLine: number = getLine(curPos.line, editor.document, 1);
          const range: vscode.Range = new vscode.Range(firstLine, 0, lastLine, 0);

          whatDescription = chatApi.linkToSource(editor.document.uri, range);
          description = editor.document.getText(range).replace("//", "").trim()
        }
      }

      if (description.length > 0) {
        vscode.commands.executeCommand("tds-gaia.processGenerateCode", description, whatDescription);
        return;
      };
    }

    GenerateCodePanel.render(context);
  });

  context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.processGenerateCode', (description: string, whatDescription: string) => {
    if (description.length > 0) {
      const messageId: string = chatApi.gaia(
        vscode.l10n.t("Generating the code as requested.{0}", whatDescription || ""), { inProgress: true });

      return llmApi.generateCode(description).then((generateCode: string[]) => {
        const responseId: string = chatApi.nextMessageId();

        feedbackApi.traceGenerateCode(responseId, description, generateCode);

        if (whatDescription) {
          chatApi.gaia(`@code-box{${generateCode.join("\\n")}}`, { canFeedback: true, answeringId: messageId });
        } else {
          chatApi.gaia(vscode.l10n.t("Code generated with {0} lines.", generateCode.length), { canFeedback: true, answeringId: messageId });
        }

        return generateCode
      });
    } else {
      chatApi.gaiaWarning(vscode.l10n.t("A description was not informed."));

      return [];
    }
  }));
}

function getLine(line: number, document: vscode.TextDocument, step: number): number {
  const re: RegExp = /^\/\//gi;
  let contentLine: string = document.lineAt(line).text.trim();

  while ((line > -1) && (line < document.lineCount) && contentLine.match(re)) {
    line += step;
    contentLine = document.lineAt(line).text.trim();
  }

  return line - (step == 1 ? 0 : step);
}
