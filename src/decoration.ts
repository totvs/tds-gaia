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

import * as vscode from 'vscode';

const processCodeDecorationType = vscode.window.createTextEditorDecorationType({
    borderWidth: '1px',
    borderStyle: 'solid',
    overviewRulerColor: 'blue',
    overviewRulerLane: vscode.OverviewRulerLane.Left,
    light: {
        // this color will be used in light color themes
        borderColor: 'darkblue'
    },
    dark: {
        // this color will be used in dark color themes
        borderColor: 'lightblue'
    }
});

/**
 * Highlights the given range of code in the active text editor, if it matches the provided file name.
 * Creates a decoration with the given message that highlights the specified range.
 * 
 * @param source - The file name to match against the active editor's document.
 * @param startLine - The start line of the range to highlight.
 * @param startChar - The start character of the range to highlight. 
 * @param endLine - The end line of the range to highlight.
 * @param endChar - The end character of the range to highlight.
 * @returns The decoration type used to highlight the code.
 */
export function highlightCode(source: string, startLine: number, startChar: number, endLine: number, endChar: number): vscode.TextEditorDecorationType {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

    if (editor && (editor.document.fileName === source)) {
        let startPosition: vscode.Position | undefined = undefined;
        let endPosition: vscode.Position | undefined = undefined;

        if (startChar === 0) {
            startLine = startLine - 1;
            endLine = startLine;
            endChar = editor.document.lineAt(endLine).text.length;
        } else {
            startLine = startLine - 1;
            startChar = startChar - 1;
            endLine = endLine - 1;
            endChar = endChar - 1;
        }

        startPosition = editor.document.validatePosition(new vscode.Position(startLine, startChar));
        endPosition = editor.document.validatePosition(new vscode.Position(endLine, endChar));

        if (startPosition && endPosition) {
            const range: vscode.Range = new vscode.Range(startPosition, endPosition);
            const decorations: vscode.DecorationOptions[] = [{ range: range, hoverMessage: "Process block!" }];

            editor.setDecorations(processCodeDecorationType, decorations);
        }
    }

    return processCodeDecorationType;
}
