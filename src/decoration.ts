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
        //const curPos: number = range.start.line;

        // const curLineStart = new vscode.Position(curPos.line, 0);
        // const nextLineStart = new vscode.Position(curPos.line + 1, 0);
        // const rangeWithFirstCharOfNextLine = new vscode.Range(curLineStart, nextLineStart);
        // const contentWithFirstCharOfNextLine = editor.document.getText(rangeWithFirstCharOfNextLine).trim();
        if (startPosition && endPosition) {
            const range: vscode.Range = new vscode.Range(startPosition, endPosition);
            const decorations: vscode.DecorationOptions[] = [{ range: range, hoverMessage: "Process block!" }];

            editor.setDecorations(processCodeDecorationType, decorations);
        }
    }

    return processCodeDecorationType;
}
