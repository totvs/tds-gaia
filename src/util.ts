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
import { Disposable, EventEmitter } from "vscode";
import { GaiaAuthenticationProvider } from './authenticationProvider';

/**
 * Capitalizes the first letter of each word in the provided text string.
 * 
 * Splits the text into an array of words using space as delimiter. 
 * Maps over each word, capitalizing the first letter and lowercasing the rest.
 * Joins the capitalized words back into a string.
 * 
 * @param text - The text to capitalize.
 * @returns The capitalized text.
 */
export function capitalize(text: string) {
    const texts: string[] = text.split(" ").map((value: string) => {
        return text.substring(0, 1).toUpperCase() + text.substring(1).toLocaleLowerCase();
    });

    return texts.join(" ");
}

/**
 * Wait for a number of milliseconds, unless the token is cancelled.
 * It is used to delay the request to the server, so that the user has time to type.
*
* @param milliseconds number of milliseconds to wait
* @param token cancellation token
* @returns a promise that resolves with false after N milliseconds, or true if the token is cancelled.
*
* @remarks This is a workaround for the lack of a debounce function in vscode.
*/
export async function delay(milliseconds: number, token: vscode.CancellationToken): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        const interval = setInterval(() => {
            if (token.isCancellationRequested) {
                clearInterval(interval);
                resolve(true)
            }
        }, 10); // Check every 10 milliseconds for cancellation

        setTimeout(() => {
            clearInterval(interval);
            resolve(token.isCancellationRequested)
        }, milliseconds);
    });
}

export interface PromiseAdapter<T, U> {
    (
        value: T,
        resolve:
            (value: U | PromiseLike<U>) => void,
        reject:
            (reason: any) => void
    ): any;
}

const passthrough = (value: any, resolve: (value?: any) => void) => resolve(value);

/**
 * Return a promise that resolves with the next emitted event, or with some future
 * event as decided by an adapter.
 *
 * If specified, the adapter is a function that will be called with
 * `(event, resolve, reject)`. It will be called once per event until it resolves or
 * rejects.
 *
 * The default adapter is the passthrough function `(value, resolve) => resolve(value)`.
 *
 * @param event the event
 * @param adapter controls resolution of the returned promise
 * @returns a promise that resolves or rejects as specified by the adapter
 */
export function promiseFromEvent<T, U>(event: vscode.Event<T>, adapter: PromiseAdapter<T, U> = passthrough): { promise: Promise<U>; cancel: EventEmitter<void> } {
    let subscription: Disposable;
    let cancel = new vscode.EventEmitter<void>();

    return {
        promise: new Promise<U>((resolve, reject) => {
            cancel.event(_ => reject('Cancelled'));
            subscription = event((value: T) => {
                try {
                    Promise.resolve(adapter(value, resolve, reject))
                        .catch(reject);
                } catch (error) {
                    reject(error);
                }
            });
        }).then(
            (result: U) => {
                subscription.dispose();
                return result;
            },
            error => {
                subscription.dispose();
                throw error;
            }
        ),
        cancel
    };
}

/**
 * Updates a context key value in VS Code.
 * 
 * @param key - The context key to update.
 * @param value - The new value for the context key.
 */
export async function updateContextKey(key: string, value: boolean | string | number) {
    vscode.commands.executeCommand('setContext', `tds-gaia.${key}`, value);
}
