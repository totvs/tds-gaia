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
import { logger } from "../../logger";
import { chatApi } from "../../api";

export function registerOpenManual(context: vscode.ExtensionContext): void {

    const openManual = vscode.commands.registerCommand('tds-gaia.external-open', async (...args) => {
        const baseUrl: string = "https://github.com/totvs/tds-gaia/blob/main";
        let url: string = `${baseUrl}/${args[0].target}`;
        const title: string = args[0].title;

        if (vscode.env.language != "pt-br") {
            url = url.replace(/\.md/gi, `-${vscode.env.language}.md`);
        }

        return vscode.env.openExternal(vscode.Uri.parse(url)).then(() => {
            chatApi.gaia(vscode.l10n.t("**{0}** opened.", title), {});
        }, (reason) => {
            chatApi.gaia(vscode.l10n.t("It was not possible to open **{0}**.", title), {});
            logger.error(reason);
        });
    });

    context.subscriptions.push(openManual);
}