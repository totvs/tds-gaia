import * as vscode from "vscode";
import { IaApiInterface, InferTypeResponse } from '../../api/interfaceApi';
import { ChatApi } from '../../api/chatApi';
import { getDitoConfiguration } from "../../config";


/**
* Registers a command to infer types for a selected function in the active text editor.
* Finds the enclosing function based on the cursor position, extracts the function code, and sends it to an API to infer types.
* Displays the inferred types in the chat window.
*
* @param context - The extension context.
* @param iaApi - The IA API interface.
* @param chatApi - The chat API.
*/
export function registerInfer(context: vscode.ExtensionContext, iaApi: IaApiInterface, chatApi: ChatApi): void {
/**
* Registers a command to infer types for a selected function in the active text editor. 
* Finds the enclosing function based on the cursor position, extracts the function code, and sends it to an API to infer types.
* Displays the inferred types in the chat window.
*/
context.subscriptions.push(vscode.commands.registerCommand('tds-dito.infer', async (...args) => {
const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
let codeToAnalyze: string = "";

if (editor !== undefined) {
if (getDitoConfiguration().clearBeforeExplain) {
chatApi.dito("clear");
}

const selection: vscode.Selection = editor.selection;
const function_re: RegExp = /(function|method(...)class)\s*(\w+)/i
const return_re: RegExp = /^\s*(Return|EndClass)/i
const curPos: vscode.Position = selection.start;
let whatAnalyze: string = "";
let curLine = curPos.line;
let startFunction: vscode.Position | undefined = undefined;
let endFunction: vscode.Position | undefined = undefined;

//começo da função
while ((curLine > 0) && (!startFunction)) {
const lineStart = new vscode.Position(curLine - 1, 0);
const curLineStart = new vscode.Position(lineStart.line, 0);
const nextLineStart = new vscode.Position(lineStart.line + 1, 0);
const rangeWithFirstCharOfNextLine = new vscode.Range(curLineStart, nextLineStart);
const contentWithFirstCharOfNextLine = editor.document.getText(rangeWithFirstCharOfNextLine);

if (contentWithFirstCharOfNextLine.match(function_re)) {
startFunction = new vscode.Position(curLine, 0);
}

curLine--;
}

curLine = curPos.line;

while ((curLine < editor.document.lineCount) && (!endFunction)) {
const lineStart = new vscode.Position(curLine + 1, 0);
const curLineStart = new vscode.Position(lineStart.line, 0);
const nextLineStart = new vscode.Position(lineStart.line + 1, 0);
const rangeWithFirstCharOfNextLine = new vscode.Range(curLineStart, nextLineStart);
const contentWithFirstCharOfNextLine = editor.document.getText(rangeWithFirstCharOfNextLine);
const matches = contentWithFirstCharOfNextLine.match(return_re);

if (matches) {
//endFunction = new vscode.Position(curLine, contentWithFirstCharOfNextLine.length-1);
const textLine: vscode.TextLine = editor.document.lineAt(curLine);
endFunction = textLine.range.end;
}

curLine++;
}

if (startFunction) {
if (!endFunction) {
const textLine: vscode.TextLine = editor.document.lineAt(editor.document.lineCount - 1);
endFunction = textLine.range.end;
}

const rangeForAnalyze = new vscode.Range(startFunction, endFunction);
codeToAnalyze = editor.document.getText(rangeForAnalyze);

if (codeToAnalyze.length > 0) {
const rangeBlock = new vscode.Range(startFunction, endFunction);

whatAnalyze = chatApi.linkToSource(editor.document.uri, rangeBlock);

const messageId: string = chatApi.dito(
vscode.l10n.t("Analyzing the code block for infer. {0} ", whatAnalyze)
);

return iaApi.inferType(codeToAnalyze).then((response: InferTypeResponse) => {
let text: string[] = [];

if (response !== undefined && response.types !== undefined && response.types.length) {
text.push(vscode.l10n.t("The following variables were inferred:"));

for (const varType of response.types) {
//if (varType.type !== "function") {
text.push(vscode.l10n.t("- **{0}** as **{1}**", varType.var, varType.type));
//}
}
text.push(vscode.l10n.t("To update the type of the all variables, use the command: {0} or click om variable name.",
`${chatApi.commandText("tds-dito.updateTypify")}`));

chatApi.dito(text.join("\n"), messageId);

//const ss: vscode.SnippetString = new vscode.SnippetString;
//ss.appendText("TEST");
//editor.insertSnippet(ss, rangeForAnalyze);

} else {
chatApi.dito(vscode.l10n.t("Sorry, I couldn't make the typification because of an internal problem."), messageId);
}
});
}
} else {
chatApi.ditoWarning([
vscode.l10n.t("I could not identify a function/method for analyzing."),
vscode.l10n.t("Try positioning the cursor in another line of implementation.")
]);
}
} else {
chatApi.ditoWarning(vscode.l10n.t("Current editor is not valid for this operation."));
}
}));
}