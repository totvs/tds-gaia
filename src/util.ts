import * as vscode from "vscode";

export function capitalize(text: string) {
    const texts: string[] = text.split(" ").map((value: string) => {
        return text.substring(0, 1).toUpperCase() + text.substring(1).toLocaleLowerCase();
    });

    return texts.join(" ");
}
export async function delay(milliseconds: number, token: vscode.CancellationToken): Promise<boolean> {
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