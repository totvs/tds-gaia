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
import { PREFIX_GAIA } from "../../logger";
import { isGaiaLogged } from "../../config";
import { chatApi, feedbackApi, llmApi } from "../../api";

export function registerLogout(context: vscode.ExtensionContext): void {

    /**
     * Registers a command to log out the user by deleting the stored API token.
     * Logs the user out, deletes the stored API token and shows an informational message.
    */
    context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.logout', async (...args) => {
        if (isGaiaLogged()) {
            feedbackApi.eventLogout();
            chatApi.logout();
            llmApi.logout();

            vscode.window.showInformationMessage(vscode.l10n.t("{0} Logged out", PREFIX_GAIA));
            chatApi.checkUser("");
        }
    }));

}