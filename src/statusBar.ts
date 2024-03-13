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
import { LoggedUser, UserOrganization, getDitoUser, isDitoLogged } from "./config";

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
