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
import { PREFIX_GAIA, logger } from "../../logger";
import { getGaiaConfiguration, setGaiaReady } from "../../config";
import { promiseFromEvent, updateContextKey } from "../../util";
import { chatApi, llmApi } from "../../api";

export function registerHealth(context: vscode.ExtensionContext): void {

    /**
     * Registers a health check command that checks the health of the Gaia service. 
     * Shows a detailed error message if the health check fails.
     * On success, logs in the user automatically.
    */
    context.subscriptions.push(vscode.commands.registerCommand('tds-gaia.health', async (...args) => {
        let detail: boolean = true;
        let attempt: number = 1;

        if (args.length > 0) {
            if (!args[0]) { //solicitando verificação sem detalhes
                detail = false;
            }
            if (args[1]) { //numero da tentativa de auto-reconexão
                attempt = args[1];
            }
        }

        let messageId: string = "";
        if (attempt == 1) {
            messageId = chatApi.gaia(vscode.l10n.t("Verifying service availability."), {});
        }

        return new Promise((resolve, reject) => {
            const totalAttempts: number = getGaiaConfiguration().tryAutoReconnection;

            llmApi.checkHealth(detail).then(async (error: any) => {
                updateContextKey("readyForUse", error === undefined);
                setGaiaReady(error === undefined);

                if (error !== undefined) {
                    let message: string[] = [
                        vscode.l10n.t("Sorry, I have technical difficulties."),
                        vscode.l10n.t("See console log for more details."),
                    ];
                    vscode.window.showErrorMessage(`${PREFIX_GAIA} ${message.join(" ")}`);
                    logger.error(error);

                    if (error.message.includes("502: Bad Gateway")) {
                        const parts: string = error.message.split("\n");
                        const time: RegExpMatchArray | null = parts[1].match(/(\d+) seconds/i);
                        if (attempt == 1) {
                            message.push(`\'${parts[1]}\'`);
                        }
                        chatApi.gaia(message, {});

                        if ((attempt <= totalAttempts) && (time !== null)) {
                            tryAgain(attempt, totalAttempts, Number.parseInt(time[1])).then(
                                () => {
                                    vscode.commands.executeCommand("tds-gaia.health", false, ++attempt);
                                },
                                (reason: string) => {
                                    vscode.window.showErrorMessage(`${PREFIX_GAIA} ${reason}`);
                                    logger.info(reason)
                                }
                            );
                        } else if (totalAttempts != 0) {
                            chatApi.gaia([
                                vscode.l10n.t("Sorry, even after **{0} attempts**, I still have technical difficulties.", totalAttempts),
                                vscode.l10n.t("To restart the validation of the service, execute {0}.", chatApi.commandText("health"))
                            ], { answeringId: messageId });
                        }
                    } else {
                        chatApi.gaia(vscode.l10n.t("Available service!"), { answeringId: messageId });
                        vscode.window.showInformationMessage(`${PREFIX_GAIA} Available service!`);
                    }
                } else {
                    vscode.commands.executeCommand("tds-gaia.login", true).then(() => {
                        chatApi.checkUser(messageId);
                    });
                }
            })
        });
    }));

}

function tryAgain(attempt: number, totalAttempt: number, time: number): Promise<void> {

    return new Promise<void>((resolve, reject) => {
        vscode.window.withProgress<string>({
            location: vscode.ProgressLocation.Notification,
            title: `${PREFIX_GAIA.trim()}`,
            cancellable: true
        }, async (progress, token) => {
            const timeoutPromise = new Promise<string>((_, reject) => setTimeout(() => reject('Timeout'), 60000));
            const cancelPromise = promiseFromEvent<any, any>(token.onCancellationRequested, (_, __, reject) => { reject(vscode.l10n.t('User Cancelled')); }).promise;
            const delayPromise = new Promise<string>((resolve, _) => {

                const interval = setInterval(() => {
                    const msg: string = vscode.l10n.t("Checking availability in {0} seconds. ({1}/{2})", time, attempt, totalAttempt);
                    progress.report({ message: msg });
                    if (time % 10 === 0) {
                        logger.info(msg);
                    }
                    if (token.isCancellationRequested) {
                        clearInterval(interval);
                    } else {
                        time--;
                        if (time < 1) {
                            clearInterval(interval);
                            resolve('');
                        }
                    }
                }, 1000);
            });

            await Promise.race([timeoutPromise, cancelPromise, delayPromise])
                .then(resolve)
                .catch(reject);

            return "";
        });
    });
}
