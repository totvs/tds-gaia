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

        if (generateCode.length == 0) {
          chatApi.gaia(vscode.l10n.t("Sorry. I could not generate the code with the information past. See log for details."), { canFeedback: true, answeringId: messageId });
          generateCode = [
            "//line 1\n",
            "//line 2\n",
            "//line 3\n",
            "//line 4\n",
            "//line 5\n",
          ];
        }// else 
        {
          if (whatDescription) {
            chatApi.gaia([
              vscode.l10n.t("Code generated with {0} lines.", generateCode.length),
              `${chatApi.codeBox(generateCode)}`,
              chatApi.commandText("generateEdit",
                {
                  cacheId: messageId,
                  code: Buffer.from(generateCode.join("\n")).toString("base64"),
                }).concat(" ").concat(chatApi.commandText("generateCopy",
                  {
                    cacheId: messageId,
                    code: Buffer.from(generateCode.join("\n")).toString("base64"),
                  }))
            ], { canFeedback: true, answeringId: messageId });
          } else {
            chatApi.gaia(vscode.l10n.t("Code generated with {0} lines.", generateCode.length), { canFeedback: true, answeringId: messageId });
          }
        }

        return generateCode
      });
    } else {
      chatApi.gaiaWarning(vscode.l10n.t("A description was not informed."));

      return [];
    }
  }));

  vscode.commands.registerCommand("tds-gaia.generateEditCode", (args: any) => {
    const code: string = Buffer.from(args.code, "base64").toString("utf8");

    vscode.workspace.openTextDocument({
      language: "advpl",
      content: code,
    }).then((document: vscode.TextDocument) => {
      vscode.window.showTextDocument(document);
    });

  });

  vscode.commands.registerCommand("tds-gaia.generateCopyCode", (args: any) => {
    const messageId: string = args.cacheId;
    const code: string = Buffer.from(args.code, "base64").toString("utf8");

    vscode.env.clipboard.writeText(code);

    chatApi.gaia(vscode.l10n.t("Its code was copied to the clipboard. Bytes: {%0}", code.length), { answeringId: messageId });
  });
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
