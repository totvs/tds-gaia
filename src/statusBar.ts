import * as vscode from "vscode";
import { LoggedUser, UserOrganization, getDitoUser, isDitoLogged } from "./config";

let statusBarItem: vscode.StatusBarItem;

const priorityStatusBarItem: number = 200;

let loadingIndicator: vscode.StatusBarItem;

function createLoadingIndicator(): vscode.StatusBarItem {
  let li = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10)
  li.text = "$(loading~spin) LLM"
  li.tooltip = "Generating completions..."
  return li
}

export function initStatusBarItems(): vscode.StatusBarItem[] {
  const result: vscode.StatusBarItem[] = [];

  result.push(initStatusBarItem());

  return result;
}

export function updateStatusBarItems() {
  updateStatusBarItem();
}

function initStatusBarItem(): vscode.StatusBarItem {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    priorityStatusBarItem
  );
  statusBarItem.command = "tds-dito.login";
  statusBarItem.text = `$(gear~spin) ${vscode.l10n.t("(initializing)")}`;

  updateStatusBarItem();

  return statusBarItem;
}

function updateStatusBarItem(): void {
  statusBarItem.text = "Dito: ";

  if (isDitoLogged()) {
    const user: LoggedUser | undefined = getDitoUser();

    statusBarItem.text += `$(account) ${user!.displayName} `;
    statusBarItem.command = "tds-dito.logout";
    statusBarItem.tooltip = buildTooltip(user!);
  } else {
    statusBarItem.text += `Need login`;
    statusBarItem.command = "tds-dito.login";
    statusBarItem.tooltip = "Acione para efetuar a identificação";
  }

  statusBarItem.show();
}

function buildTooltip(user: LoggedUser) {
  let result: string = "";

  result += `Nome: ${user.fullname} [${user.name}]\n`;
  result += `Id: ${user.id}\n`;

  if (user.orgs) {
    if (user.orgs.length) {
      result += `Organizações\n`;
      user.orgs.forEach((org: UserOrganization) => {
        result += `${org.name}\n`;
      })
    }
  }

  return result;
}
