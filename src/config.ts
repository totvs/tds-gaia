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

let customConfig: TGaiaCustomConfig = {};

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
 * Interface for TGaia configuration options.
 
 * Must be a mirror of what is defined in package.json
 * Other settings, preferably non-persistent, must be made in TGaiaCustomConfig
*/
export type TGaiaConfig = {
  enable: boolean;
  clearBeforeExplain: boolean;
  clearBeforeInfer: boolean;
  showBanner: boolean;
  logLevel: "off" | "error" | "warn" | "info" | "http" | "verbose" | "debug";
  endPoint: string;
  endPointEvent: string;
  apiVersion: string;
  documentFilter: {
    [key: string]: string;
  }
  enableAutoSuggest: boolean;
  requestDelay: number;
  maxLine: number;
  maxSuggestions: number;
  tryAutoReconnection: number;

  // trace: {
  //   server: string | undefined
  // }
}

export type TGaiaCustomConfig = {
  currentUser?: LoggedUser
  ready?: boolean;
}

/**
 * Gets the TGaia configuration from the VS Code workspace.
 *
 * @returns The TGaia configuration object.
 */
export function getGaiaConfiguration(): TGaiaConfig {
  const config: any = vscode.workspace.getConfiguration("tds-gaia");

  return config;
}

//Enter key without prefix 'tds-gaia'
function setGaiaConfiguration(key: keyof TGaiaConfig, newValue: string | boolean | number | []): void {
  const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("tds-gaia");

  config.update(key, newValue);//, vscode.ConfigurationTarget.Global);

  return;
}

function setGaiaCustomConfiguration(key: keyof TGaiaCustomConfig, newValue: any): void {
  customConfig[key] = newValue;
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
export function getGaiaUser(): LoggedUser | undefined {

  return customConfig["currentUser"]; //|| EMPTY_USER;
}

/**
 * Checks if there is a user currently logged in to TGaia.
 * 
 * @returns True if a user is logged in, false otherwise.
 */
export function isGaiaLogged(): boolean {

  return getGaiaUser() !== undefined;
}

/**
 * Checks if the banner is enabled in the TGaia configuration.
 * 
 * @returns True if the banner is enabled, false otherwise.
 */
export function isGaiaShowBanner(): boolean {

  return getGaiaConfiguration().showBanner;
}

/**
 * Gets the log level from the TGaia configuration.
 * 
 * @returns The configured log level.
 */
export function getGaiaLogLevel(): string {

  return getGaiaConfiguration().logLevel;
}

/**
 * Checks if TGaia is ready by looking at the "ready" value in the custom configuration.
 * 
 * @returns True if TGaia is ready, false otherwise.
 */
export function isGaiaReady(): boolean {

  return customConfig["ready"] || false;
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
