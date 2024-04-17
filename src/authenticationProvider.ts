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

//import { v4 as uuid } from 'uuid';
import { PromiseAdapter, promiseFromEvent } from "./util";
//import fetch from 'node-fetch';

const AUTH_TYPE: string = "auth-gaia0";
const AUTH_NAME: string = "Gaia Authentication";
const CLIENT_ID: string = "3GUryQ7ldAeKEuD2obYnppsnmj58eP5u";
const AUTH0_DOMAIN = "totvs.fluigidentity.com/cloudpass";
const SESSIONS_SECRET_KEY = `${AUTH_TYPE}.sessions`

class UriEventHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
    public handleUri(uri: vscode.Uri) {
        this.fire(uri);
    }
}

export class GaiaAuthenticationProvider implements vscode.AuthenticationProvider, Disposable {
    static AUTH_TYPE: string = AUTH_TYPE;

    private _sessionChangeEmitter = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
    private _disposable: Disposable;
    private _pendingStates: string[] = [];
    private _codeExchangePromises = new Map<string, { promise: Promise<string>; cancel: vscode.EventEmitter<void> }>();
    private _uriHandler = new UriEventHandler();

    constructor(private readonly context: vscode.ExtensionContext) {
        this._disposable = vscode.Disposable.from(
            vscode.authentication.registerAuthenticationProvider(AUTH_TYPE, AUTH_NAME, this, { supportsMultipleAccounts: false }),
            vscode.window.registerUriHandler(this._uriHandler)
        )
    }

    get onDidChangeSessions() {
        return this._sessionChangeEmitter.event;
    }

    get redirectUri() {
        const publisher = this.context.extension.packageJSON.publisher;
        const name = this.context.extension.packageJSON.name;

        return `${vscode.env.uriScheme}://${publisher}.${name}`;
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
            const token = await this.login(scopes);
            if (!token) {
                throw new Error(`Auth0 login failure`);
            }

            const userInfo: { name: string, email: string } = await this.getUserInfo(token);

            const session: vscode.AuthenticationSession = {
                id: "uuid()",
                accessToken: token,
                account: {
                    label: userInfo.name,
                    id: userInfo.email
                },
                scopes: []
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
     * Log in to Auth0
     */
    private async login(scopes: string[] = []) {
        return await vscode.window.withProgress<string>({
            location: vscode.ProgressLocation.Notification,
            title: "Signing in to IA Service...",
            cancellable: true
        }, async (_, token) => {
            const stateId = "uuid()";

            this._pendingStates.push(stateId);

            const scopeString = scopes.join(' ');

            if (!scopes.includes('openid')) {
                scopes.push('openid');
            }
            if (!scopes.includes('profile')) {
                scopes.push('profile');
            }
            if (!scopes.includes('email')) {
                scopes.push('email');
            }

            const searchParams = new URLSearchParams([
                ['response_type', "token"],
                ['client_id', CLIENT_ID],
                ['redirect_uri', this.redirectUri],
                ['state', stateId],
                ['scope', scopes.join(' ')],
                ['prompt', "login"]
            ]);
            const uri = vscode.Uri.parse(`https://${AUTH0_DOMAIN}/authorize?${searchParams.toString()}`);
            await vscode.env.openExternal(uri);

            let codeExchangePromise = this._codeExchangePromises.get(scopeString);
            if (!codeExchangePromise) {
                codeExchangePromise = promiseFromEvent(this._uriHandler.event, this.handleUri(scopes));
                this._codeExchangePromises.set(scopeString, codeExchangePromise);
            }

            try {
                return await Promise.race([
                    codeExchangePromise.promise,
                    new Promise<string>((_, reject) => setTimeout(() => reject('Cancelled'), 60000)),
                    promiseFromEvent<any, any>(token.onCancellationRequested, (_, __, reject) => { reject('User Cancelled'); }).promise
                ]);
            } finally {
                this._pendingStates = this._pendingStates.filter(n => n !== stateId);
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
    private handleUri: (scopes: readonly string[]) => PromiseAdapter<vscode.Uri, string> =
        (scopes) => async (uri, resolve, reject) => {
            const query = new URLSearchParams(uri.fragment);
            const access_token = query.get('access_token');
            const state = query.get('state');

            if (!access_token) {
                reject(new Error('No token'));
                return;
            }
            if (!state) {
                reject(new Error('No state'));
                return;
            }

            // Check if it is a valid auth request started by the extension
            if (!this._pendingStates.some(n => n === state)) {
                reject(new Error('State not found'));
                return;
            }

            resolve(access_token);
        }

    /**
     * Get the user info from Auth0
     * @param token 
     * @returns 
     */
    private async getUserInfo(token: string) {
        const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return await response.json();
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

    // getSession();
    // getMsSession();
    // getMsDefaultSession();

    //getAuthSession();

    subscriptions.push(
        vscode.authentication.onDidChangeSessions(async e => {
            console.log(e);

            if (e.provider.id === AUTH_TYPE) {
                getSession();
            } else if (e.provider.id === "auth0") {
                //getAuth0Session();
            }
        })
    );
}

const getSession = async () => {
    const session = await vscode.authentication.getSession(AUTH_TYPE, [], { createIfNone: false });
    if (session) {
        vscode.window.showInformationMessage(`Welcome back ${session.account.label}`)
    }
}

const getMsSession = async () => {
    const session = await vscode.authentication.getSession('microsoft', [
        "VSCODE_CLIENT_ID:f3164c21-b4ca-416c-915c-299458eba95b",
        "VSCODE_TENANT:common",
        "https://graph.microsoft.com/User.Read"
    ], { createIfNone: false });

    if (session) {
        vscode.window.showInformationMessage(vscode.l10n.t("Welcome back {0}", session.account.label))
    }
}

const getMsDefaultSession = async () => {
    const session = await vscode.authentication.getSession('microsoft', [
        "https://graph.microsoft.com/User.Read",
        "https://graph.microsoft.com/Calendar.Read"
    ], { createIfNone: false });

    if (session) {
        vscode.window.showInformationMessage(vscode.l10n.t("Welcome back {0}", session.account.label))
    }
}
