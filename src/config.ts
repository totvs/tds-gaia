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

let customConfig: TGaiaCustomConfig = {
  currentUser: undefined,
  ready: false,
  isGaiaLogged: false,
  gaiaVersion: "",
  tdsVersion: ""

};

/**
 * Interface for a logged in user. 
 * Contains user info like id, email, name, avatar, etc.
 * Also contains optional expiration info.
*/
export type LoggedUser = {
  id: string;
  email: string;
  name: string;
  fullname: string;
  displayName: string;
  avatarUrl: string;
  expiration?: Date;
  expiresAt?: Date;
  orgs?: UserOrganization[]
}

export type UserOrganization = LoggedUser & Omit<LoggedUser, "orgs">;

/**
 * Represents the standard configuration properties for the TDS-Gaia package.
 */
type TPackageConfig = {
  /**
   * Indicates whether the TDS-Gaia package is enabled.
   */
  enable: boolean;
  /**
   * Indicates whether the editor should be cleared before explaining a code snippet.
   */
  clearBeforeExplain: boolean;
  /**
   * Indicates whether the editor should be cleared before inferring a code snippet.
   */
  clearBeforeInfer: boolean;
  /**
   * Indicates whether the TDS-Gaia banner should be shown.
   */
  showBanner: boolean;
  /**
   * The log level for the TDS-Gaia package, which can be one of "off", "error", "warn", "info", "http", "verbose", or "debug".
   */
  logLevel: "off" | "error" | "warn" | "info" | "http" | "verbose" | "debug";
  /**
   * The endpoint URL for the TDS-Gaia service.
   */
  endPoint: string;
  /**
   * The endpoint URL for the TDS-Gaia event service.
   */
  endPointEvent: string;
  /**
   * The API version for the TDS-Gaia service.
   */
  apiVersion: string;
  /**
   * The event version for the TDS-Gaia service.
   */
  eventVersion: string;
  /**
   * A set of document filters for the TDS-Gaia package.
   */
  documentFilter: {
    [key: string]: string;
  };
  /**
   * Indicates whether auto-suggest functionality is enabled for the TDS-Gaia package.
   */
  enableAutoSuggest: boolean;
  /**
   * The delay (in milliseconds) between requests to the TDS-Gaia service.
   */
  requestDelay: number;
  /**
   * The maximum number of lines to be displayed in the TDS-Gaia editor.
   */
  maxLine: number;
  /**
   * The maximum number of suggestions to be displayed in the TDS-Gaia editor.
   */
  maxSuggestions: number;
  /**
   * The number of times to attempt auto-reconnection to the TDS-Gaia service.
   */
  tryAutoReconnection: number;
  /**
   * The maximum size (in characters) of the auto-complete suggestions in the TDS-Gaia editor.
   */
  maxSizeAutoComplete: number;
}

/**
 * Represents additional custom configuration properties for the TDS-Gaia.
 */
type TGaiaCustomConfig = {
  currentUser: LoggedUser | undefined;
  ready: boolean;
  isGaiaLogged: boolean;
  gaiaVersion: string;
  tdsVersion: string;
}

/**
 * Represents the combined configuration for the TDS-Gaia package, including both the standard package configuration 
 * and any custom configuration.
 */
export type TGaiaConfig = TPackageConfig & TGaiaCustomConfig;

/**
 * Gets the TDS-Gaia configuration from the VS Code workspace or a custom configuration.
 *
 * @returns The TDS-Gaia configuration object.
 */
export function getGaiaConfiguration(): TGaiaConfig {
  return {
    enable: vscode.workspace.getConfiguration('tds-gaia').get('enable') ?? true,
    clearBeforeExplain: vscode.workspace.getConfiguration('tds-gaia').get('clearBeforeExplain') ?? false,
    clearBeforeInfer: vscode.workspace.getConfiguration('tds-gaia').get('clearBeforeInfer') ?? false,
    showBanner: vscode.workspace.getConfiguration('tds-gaia').get('showBanner') ?? true,
    logLevel: vscode.workspace.getConfiguration('tds-gaia').get('logLevel') ?? "info",
    endPoint: vscode.workspace.getConfiguration('tds-gaia').get('endPoint') ?? "<not informed>",
    apiVersion: vscode.workspace.getConfiguration('tds-gaia').get('apiVersion') ?? "<not informed>",
    endPointEvent: vscode.workspace.getConfiguration('tds-gaia').get('endPointEvent') ?? "<not informed>",
    eventVersion: vscode.workspace.getConfiguration('tds-gaia').get('eventVersion') ?? "<not informed>",
    documentFilter: vscode.workspace.getConfiguration('tds-gaia').get('documentFilter') ?? {},
    enableAutoSuggest: vscode.workspace.getConfiguration('tds-gaia').get('enableAutoSuggest') ?? true,
    requestDelay: vscode.workspace.getConfiguration('tds-gaia').get('requestDelay') ?? 400,
    maxLine: vscode.workspace.getConfiguration('tds-gaia').get('maxLine') ?? 5,
    maxSuggestions: vscode.workspace.getConfiguration('tds-gaia').get('maxSuggestions') ?? 1,
    tryAutoReconnection: vscode.workspace.getConfiguration('tds-gaia').get('tryAutoReconnection') ?? 3,
    maxSizeAutoComplete: vscode.workspace.getConfiguration('tds-gaia').get('maxSizeAutoComplete') ?? 15,
    currentUser: getGaiaUser(),
    isGaiaLogged: isGaiaLogged(),
    ready: isGaiaReady(),
    gaiaVersion: getGaiaVersion(),
    tdsVersion: getTdsVersion(),
  }
}

/**
 * Sets a value in the TGaia custom configuration.
 *
 * @param key - The key to set in the custom configuration.
 * @param newValue - The new value to set for the specified key.
 */
function setGaiaCustomConfiguration(key: keyof TGaiaCustomConfig, newValue: TGaiaCustomConfig[keyof TGaiaCustomConfig]): void {
  //customConfig[key] = newValue;
  if (key == "currentUser") {
    customConfig[key] = newValue as TGaiaCustomConfig["currentUser"];
  } else if (key == "ready") {
    customConfig[key] = newValue as TGaiaCustomConfig["ready"]
  } else if (key == "isGaiaLogged") {
    customConfig[key] = newValue as TGaiaCustomConfig["isGaiaLogged"]
  } else if (key == "gaiaVersion") {
    customConfig[key] = newValue as TGaiaCustomConfig["gaiaVersion"]
  } else if (key == "tdsVersion") { customConfig[key] = newValue as TGaiaCustomConfig["tdsVersion"] }
  else {
    throw new Error(`Invalid key: ${key} or invalid new value type: ${typeof newValue}`);
  }
}

/**
 * Sets the current user in the TGaia custom configuration 
 * and updates the last login time in the TGaia configuration.
 */
export function setGaiaUser(user: LoggedUser | undefined) {

  setGaiaCustomConfiguration("currentUser", user);
}

/**
 * Gets the current logged in user from the TGaia custom configuration.
 * 
 * @returns The current logged in user, or undefined if no user is logged in.
 */
function getGaiaUser(): LoggedUser | undefined {

  return customConfig["currentUser"]; //|| EMPTY_USER;
}

/**
 * Checks if there is a user currently logged in to TGaia.
 * 
 * @returns True if a user is logged in, false otherwise.
 */
function isGaiaLogged(): boolean {

  return getGaiaUser() !== undefined;
}


/**
 * Checks if TGaia is ready by looking at the "ready" value in the custom configuration.
 * 
 * @returns True if TGaia is ready, false otherwise.
 */
function isGaiaReady(): boolean {

  return customConfig["ready"] || false;
}

/**
 * Gets the version of the TDS-Gaia extension.
 * 
 * @returns The version of the TDS-Gaia extension, or "NA" if the extension is not found.
 */
function getGaiaVersion(): string {
  const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension("TOTVS.tds-gaia");

  return ext!.packageJSON.version ?? "";
}

/**
 * Gets the version of the TDS-VSCode extension.
 * 
 * @returns The version of the TDS-VSCode extension, or "<Unavailable>" if the extension is not found.
 */
function getTdsVersion(): string {
  const ext: vscode.Extension<any> | undefined = vscode.extensions.getExtension("TOTVS.tds-vscode");

  return ext!.packageJSON.version ?? "";
}

/**
 * Sets the "ready" value in the TGaia custom configuration to indicate
 * if TGaia is ready for use.
 * 
 * @param ready - The ready state to set.
 */
export function setGaiaReady(ready: boolean) {

  setGaiaCustomConfiguration("ready", ready);
}
