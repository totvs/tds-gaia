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