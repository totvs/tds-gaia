import * as vscode from "vscode";
import { TDitoConfig, getDitoConfiguration } from "./configTemplates";

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
  const config: TDitoConfig = getDitoConfiguration();

  if (config.userLogin) {
    statusBarItem.text = `User: $(config.userLogin) `;
    statusBarItem.command = "tds-dito.logout";
  } else {
    statusBarItem.text = `Need login `;
    statusBarItem.command = "tds-dito.login";
  }

  statusBarItem.show();
}
