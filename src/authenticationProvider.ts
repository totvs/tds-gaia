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
import { Disposable } from "vscode";
import { PromiseAdapter, promiseFromEvent } from "./util";
import { LoggedUser, getGaiaUser } from "./config";
import { randomUUID } from "crypto";
import { feedbackApi, llmApi } from "./api";

const AUTH_TYPE: string = "auth-gaia";
const AUTH_NAME: string = "Gaia";
const SESSIONS_SECRET_KEY = `${AUTH_TYPE}.sessions`
const SCOPES: string[] = ["feedback"];

export class GaiaAuthenticationProvider implements vscode.AuthenticationProvider, Disposable {
    static AUTH_TYPE: string = AUTH_TYPE;
    static SCOPES: string[] = SCOPES;

    private _sessionChangeEmitter = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
    private _disposable: Disposable;
    private _codeExchangePromises = new Map<string, { promise: Promise<string>; cancel: vscode.EventEmitter<void> }>();
    private _processHandler = new vscode.EventEmitter<string>();

    constructor(private readonly context: vscode.ExtensionContext) {
        this._disposable = vscode.Disposable.from(
            vscode.authentication.registerAuthenticationProvider(AUTH_TYPE, AUTH_NAME, this, { supportsMultipleAccounts: false }),
            //vscode.window.registerUriHandler(this._processHandler)
        )
    }

    get onDidChangeSessions() {
        return this._sessionChangeEmitter.event;
    }

    /**
     * Get the existing sessions
     * @param scopes 
     * @returns 
     */
    public async getSessions(scopes?: string[]): Promise<readonly vscode.AuthenticationSession[]> {
        const allSessions = await this.context.secrets.get(SESSIONS_SECRET_KEY);

        if (allSessions) {
            return JSON.parse(allSessions) as vscode.AuthenticationSession[];
        }

        return [];
    }

    /**
     * Create a new auth session
     * @param scopes 
     * @returns 
     */
    public async createSession(scopes: string[]): Promise<vscode.AuthenticationSession> {
        try {
            const [_, accessTokens, feedbackPK, feedbackSK] = await this.login();
            if (accessTokens.length < 2) {
                throw new Error(vscode.l10n.t(`${AUTH_NAME} invalid credentials)`));
            }

            const userInfo: LoggedUser | undefined = getGaiaUser();

            const session: vscode.AuthenticationSession = {
                id: randomUUID(),
                accessToken: accessTokens,
                account: {
                    label: userInfo?.name || userInfo?.email || "Unknown",
                    id: userInfo?.email || "unknown",
                },
                scopes: [
                    //pk-lf-b1633e3c-c038-4dbe-af55-82bf21be0fd5
                    //sk-lf-bdad2a8c-f646-4ab6-886a-66401033cc48
                    `feedback:${feedbackPK}:${feedbackSK}`
                ]
            };

            await this.context.secrets.store(SESSIONS_SECRET_KEY, JSON.stringify([session]))
            this._sessionChangeEmitter.fire({ added: [session], removed: [], changed: [] });

            return session;
        } catch (e) {
            vscode.window.showErrorMessage(`Sign in failed: ${e}`);
            throw e;
        }
    }

    /**
     * Remove an existing session
     * @param sessionId 
     */
    public async removeSession(sessionId: string): Promise<void> {
        const allSessions = await this.context.secrets.get(SESSIONS_SECRET_KEY);
        if (allSessions) {
            let sessions = JSON.parse(allSessions) as vscode.AuthenticationSession[];
            const sessionIdx = sessions.findIndex(s => s.id === sessionId);
            const session = sessions[sessionIdx];
            sessions.splice(sessionIdx, 1);

            await this.context.secrets.store(SESSIONS_SECRET_KEY, JSON.stringify(sessions));

            if (session) {
                this._sessionChangeEmitter.fire({ added: [], removed: [session], changed: [] });
            }
        }
    }

    /**
     * Dispose the registered services
     */
    public async dispose() {
        this._disposable.dispose();
    }

    /**
     * Log in to auth-gaia
     */
    private async login() {
        return await vscode.window.withProgress<string[]>({
            location: vscode.ProgressLocation.Notification,
            title: vscode.l10n.t("Signing in to Gaia IA Service..."),
            cancellable: true
        }, async (_, token) => {
            const inputKeys: Thenable<string[] | undefined> = vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: vscode.l10n.t('Please enter your API token. Format: "<e-mail>:<access token>:<log public token>:<log secret token>)"'),
                placeHolder: vscode.l10n.t('Your token goes here...')
            }).then(async input => {
                if (input !== undefined) {
                    if (await llmApi.start()) {
                        const [email, accessToken, publicKey, secretKey] = input.split(":");
                        if (await llmApi.login(email, accessToken)) {
                            return [email, accessToken, publicKey, secretKey];
                        } else {
                            return ["", "", "", ""];
                        }
                    }
                }

                return;
            })

            const scopeString: string = SCOPES.join(' ');
            let codeExchangePromise = this._codeExchangePromises.get(scopeString);
            if (!codeExchangePromise) {
                codeExchangePromise = promiseFromEvent(this._processHandler.event, this.handleProcess(SCOPES));
                this._codeExchangePromises.set(scopeString, codeExchangePromise);
            }

            try {
                return await Promise.race([
                    inputKeys,
                    codeExchangePromise.promise,
                    new Promise<string[]>((_, reject) => setTimeout(() => reject(['Cancelled', "", ""]), 60000)),
                    promiseFromEvent<any, any>(token.onCancellationRequested, (_, __, reject) => { reject(['User Cancelled', "", ""]); }).promise
                ]);
            } finally {
                //this._pendingStates = this._pendingStates.filter(n => n !== stateId);
                codeExchangePromise?.cancel.fire();
                this._codeExchangePromises.delete(scopeString);
            }
        });
    }

    /**
     * Handle the redirect to VS Code (after sign in from Auth0)
     * @param scopes 
     * @returns 
     */
    private handleProcess: (scopes: readonly string[]) => PromiseAdapter<string, string> =
        (scopes) => async (access_token, resolve, reject) => {
            console.log('handleProcess', access_token);
            // const query = new URLSearchParams(uri.fragment);
            // const access_token = query.get('access_token');
            // const state = query.get('state');

            // if (!access_token) {
            //     reject(new Error('No token'));
            //     return;
            // }
            // if (!state) {
            //     reject(new Error('No state'));
            //     return;
            // }

            // Check if it is a valid auth request started by the extension
            // if (!this._pendingStates.some(n => n === state)) {
            //     reject(new Error('State not found'));
            //     return;
            // }

            resolve(access_token);
        }

}

/**
 * Registers the authentication provider for the extension.
 * This function sets up the authentication provider, subscribes to session changes, and handles the authentication flow.
 * @param context - The extension context.
 */
export function registerAuthentication(context: vscode.ExtensionContext) {
    const subscriptions = context.subscriptions;

    subscriptions.push(
        new GaiaAuthenticationProvider(context)
    );

    subscriptions.push(
        vscode.authentication.onDidChangeSessions(async e => {
            if (e.provider.id === AUTH_TYPE) {
                const session: vscode.AuthenticationSession | undefined = await getGaiaSession();

                if (session) {
                    const [_, publicKey, secretKey] = session.scopes[0].split(":");
                    feedbackApi.start(publicKey, secretKey);
                    feedbackApi.eventLogin();
                } else {
                    vscode.commands.executeCommand('tds-gaia.logout');
                }
            }
        })
    );
}

// }

// const getMsDefaultSession = async () => {
//     const session = await vscode.authentication.getSession('microsoft', [
//         "https://graph.microsoft.com/User.Read",
//         "https://graph.microsoft.com/Calendar.Read"
//     ], { createIfNone: false });

//     if (session) {
//         vscode.window.showInformationMessage(vscode.l10n.t("Welcome back {0}", session.account.label))
//     }
// }

/**
* Retrieves the current Gaia authentication session, if available.
* 
* @returns The current Gaia authentication session, or `undefined` if no session is available.
*/
export async function getGaiaSession(): Promise<vscode.AuthenticationSession | undefined> {
    return await vscode.authentication.getSession(GaiaAuthenticationProvider.AUTH_TYPE, GaiaAuthenticationProvider.SCOPES, { createIfNone: false });
}
