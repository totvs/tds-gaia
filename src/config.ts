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

let customConfig: TDitoCustomConfig = {};

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
 * Interface for TDito configuration options.
 * Contains various settings like clearBeforeExplain, 
 * clearBeforeTypify, showBanner, log levels, endpoints, 
 * API versions, document filters, auto suggest settings, 
 * request delays, max lines/suggestions, tracing, 
 * and OpenAI API settings.

* Must be a mirror of what is defined in package.json
* Other settings, preferably non-persistent, must be made in TDitoCustomConfig
 */
export type TDitoConfig = {
  enable: boolean;
  clearBeforeExplain: boolean;
  clearBeforeTypify: boolean;
  showBanner: boolean;
  logLevel: "off" | "error" | "warn" | "info" | "http" | "verbose" | "debug";
  endPoint: string;
  apiVersion: string;
  lastLogin: string;
  documentFilter: {
    [key: string]: string;
  }
  enableAutoSuggest: boolean;
  requestDelay: number;
  maxLine: number;
  maxSuggestions: number;

  trace: {
    server: string | undefined
  }

  //deprecated: used in HF Api
  maxNewTokens: number;
  temperature: number;
  top_p: number;
  top_k: number;
}

export type TDitoCustomConfig = {
  currentUser?: LoggedUser
  ready?: boolean;
}

/**
 * Gets the TDito configuration from the VS Code workspace.
 *
 * @returns The TDito configuration object.
 */
export function getDitoConfiguration(): TDitoConfig {
  const config: any = vscode.workspace.getConfiguration("tds-dito");

  return config;
}

//Enter key without prefix 'tds-dito'
function setDitoConfiguration(key: keyof TDitoConfig, newValue: string | boolean | number | []): void {
  const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("tds-dito");

  config.update(key, newValue);//, vscode.ConfigurationTarget.Global);

  return;
}

function setDitoCustomConfiguration(key: keyof TDitoCustomConfig, newValue: any): void {
  customConfig[key] = newValue;
}

/**
 * Sets the current user in the TDito custom configuration 
 * and updates the last login time in the TDito configuration.
 */
export function setDitoUser(user: LoggedUser | undefined) {

  setDitoCustomConfiguration("currentUser", user);
  setDitoConfiguration("lastLogin", new Date().toUTCString()); //forçar modificação em settings.json
}

/**
 * Gets the current logged in user from the TDito custom configuration.
 * 
 * @returns The current logged in user, or undefined if no user is logged in.
 */
export function getDitoUser(): LoggedUser | undefined {

  return customConfig["currentUser"]; //|| EMPTY_USER;
}

/**
 * Checks if there is a user currently logged in to TDito.
 * 
 * @returns True if a user is logged in, false otherwise.
 */
export function isDitoLogged(): boolean {

  return getDitoUser() !== undefined;
}

/**
 * Checks if this is the first time TDito has been used by checking 
 * if there is a last login date set in the configuration.
 * 
 * @returns True if this is the first time TDito is being used, false otherwise.
 */
export function isDitoFirstUse(): boolean {
  return getDitoConfiguration().lastLogin.length == 0;
}

/**
 * Checks if the banner is enabled in the TDito configuration.
 * 
 * @returns True if the banner is enabled, false otherwise.
 */
export function isDitoShowBanner(): boolean {

  return getDitoConfiguration().showBanner;
}

/**
 * Gets the log level from the TDito configuration.
 * 
 * @returns The configured log level.
 */
export function getDitoLogLevel(): string {

  return getDitoConfiguration().logLevel;
}

/**
 * Checks if TDito is ready by looking at the "ready" value in the custom configuration.
 * 
 * @returns True if TDito is ready, false otherwise.
 */
export function isDitoReady(): boolean {

  return customConfig["ready"] || false;
}

/**
 * Sets the "ready" value in the TDito custom configuration to indicate
 * if TDito is ready for use.
 * 
 * @param ready - The ready state to set.
 */
export function setDitoReady(ready: boolean) {

  setDitoCustomConfiguration("ready", ready);
}
