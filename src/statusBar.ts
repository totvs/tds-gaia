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
import { LoggedUser, UserOrganization, getGaiaUser, isGaiaLogged } from "./config";

let statusBarItem: vscode.StatusBarItem;
const priorityStatusBarItem: number = 200;

/**
 * Initializes the status bar items and returns them.
 * Creates a new status bar item via initStatusBarItem()
 * and adds it to the result array.
 */
export function initStatusBarItems(): vscode.StatusBarItem[] {
  const result: vscode.StatusBarItem[] = [];

  result.push(initStatusBarItem());

  return result;
}

/**
 * Updates the status bar items by calling updateStatusBarItem().
 */
export function updateStatusBarItems() {
  updateStatusBarItem();
}

function initStatusBarItem(): vscode.StatusBarItem {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    priorityStatusBarItem
  );

  updateStatusBarItem();

  return statusBarItem;
}

function updateStatusBarItem(): void {
  statusBarItem.text = "TDS-Gaia: ";

  if (isGaiaLogged()) {
    const user: LoggedUser | undefined = getGaiaUser();

    statusBarItem.text += `$(account) ${user!.displayName} `;
    statusBarItem.command = "tds-gaia.logout";
    statusBarItem.tooltip = buildTooltip(user!);
  } else {
    statusBarItem.text += vscode.l10n.t("Need login");
    statusBarItem.command = "tds-gaia.login";
    statusBarItem.tooltip = vscode.l10n.t("Trigger to make the identification");
  }

  statusBarItem.show();
}

function buildTooltip(user: LoggedUser) {
  let result: string = "";

  result += vscode.l10n.t("Name: {0} [{1}]", user.fullname, user.name);
  result += "\n";
  result += vscode.l10n.t("ID: {0}", user.id);
  result += "\n";

  if (user.orgs) {
    if (user.orgs.length) {
      result += vscode.l10n.t("Organizations");
      result += "\n";
      user.orgs.forEach((org: UserOrganization) => {
        result += `${org.name}\n`;
      })
    }
  }

  return result;
}
