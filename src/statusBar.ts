import * as vscode from "vscode";
import { TDitoConfig, getDitoConfiguration, getDitoUser } from "./config";
import { WhoAmI, WhoAmIOrg, WhoAmIUser } from "@huggingface/hub";

let statusBarItem: vscode.StatusBarItem;

const priorityStatusBarItem: number = 200;

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
  const user: WhoAmI | undefined = getDitoUser();
  statusBarItem.text = "Dito: ";

  if (user) {
    statusBarItem.text += `User: $(config.userLogin) `;
    statusBarItem.command = "tds-dito.logout";
    statusBarItem.tooltip = buildTooltip(user as WhoAmIUser);
  } else {
    statusBarItem.text += `Need login`;
    statusBarItem.command = "tds-dito.login";
    statusBarItem.tooltip = "Acione para efetuar a identificação";
  }

  statusBarItem.show();
}

function buildTooltip(user: WhoAmIUser) {
  let result: string = "";

  result += `Tipo: ${user.type}\n`;
  result += `Nome: ${user.fullname} [${user.name}]\n`;
  result += `Id: ${user.id}\n`;

  if (user.orgs.length) {
    result += `Organizações\n`;
    user.orgs.forEach((org: WhoAmIOrg) => {
      result += `${org.name}\n`;
    })
  }

  return result;
}
