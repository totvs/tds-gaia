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
 * A extra options interface.
 *
 * @property data JSON structure with initial data
 * @property title View Title
 *
 * @remarks Extra files is add after de main files and storage in 'webview-ui/src/js' or 'webview-ui/src/css'
 */
export interface IWebviewContent {
  title?: string;
  data?: {}
}

const BASE_FOLDER: string[] = [
  "webview-ui",
  "build",
];

const CSS_BASE_FOLDER: string[] = [
  ...BASE_FOLDER,
  "css"
];

const JS_BASE_FOLDER: string[] = [
  ...BASE_FOLDER,
  "js"
];

/**
 * A helper function which will get the webview content..
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param entryPointName The entry point name
 * @param options An json with extra options
 * @returns A template string literal containing the HTML that should be
 * rendered within the webview panel
 */
export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, entryPointName: string, options?: IWebviewContent): string {
  // The CSS file from the React build output
  const stylesUri: vscode.Uri[] = [];
  const codIconsUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'webview-ui', 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css'));
  stylesUri.push(codIconsUri);

  // The JS file from the React build output
  const scriptsUri: vscode.Uri[] = [];
  scriptsUri.push(getUri(webview, extensionUri, [
    ...BASE_FOLDER,
    `${entryPointName}.js`,
  ]))

  const nonce = getNonce();

  return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
          <meta name="theme-color" content="#000000">
          <meta http-equiv="Content-Security-Policy"
              content="default-src 'none';
                      img-src https: ${webview.cspSource} 'unsafe-inline';
                      font-src ${webview.cspSource};
                      style-src ${webview.cspSource} 'unsafe-inline' https:;
                      script-src 'nonce-${nonce}';"
          >
          ${stylesUri.map((uri: vscode.Uri) => {
    return `<link rel="stylesheet" type="text/css" href="${stylesUri}">\n`;
  })}
          <link href="${codIconsUri}" rel="stylesheet" />
          <title>${options!.title || "Webview Title"}</title>
        </head>
        <body>
          <noscript>You need to enable JavaScript to run this app.</noscript>
          <div id="root"></div>
          ${scriptsUri.map((uri: vscode.Uri) => {
    return `<script nonce="${nonce}" src="${uri}"></script>\n`;
  })}
        </body>
      </html>
    `;
}

/**
 * A helper function which will get the webview URI of a given file or resource.
 *
 * @remarks This URI can be used within a webview's HTML as a link to the
 * given file/resource.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param pathList An array of strings representing the path to a file/resource
 * @returns A URI pointing to the file/resource
 */
export function getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]) {

  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

/**
 * A helper function for request signature generation.
 *
 */
export function getNonce() {
  let text = "";

  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

// Extra panel configurations
export function getExtraPanelConfigurations(extensionUri: vscode.Uri): {} {
  return {
    // Enable JavaScript in the webview
    enableScripts: true,
    // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
    localResourceRoots: getCspSource(extensionUri)
  };
}

// Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
export function getCspSource(extensionUri: vscode.Uri) {
  return [
    vscode.Uri.joinPath(extensionUri, "out"),
    vscode.Uri.joinPath(extensionUri, "webview-ui/build"),
    vscode.Uri.joinPath(extensionUri, "webview-ui/node_modules/@vscode"),
    vscode.Uri.joinPath(extensionUri, "webview-ui/media")
  ];
}
