import * as vscode from 'vscode';
import winston = require('winston');

let customConfig: TDitoCustomConfig = {};

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

//deve ser espelho do definido no package.json
//outras configurações, de preferência não persistentes, devem ser efetuadas em TDitoCustomConfig
export type TDitoConfig = {
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

const EMPTY_USER: LoggedUser = {
  id: "",
  email: "<not logged>",
  name: "<not logged>",
  fullname: "<not logged>",
  displayName: "<not logged>",
  avatarUrl: "",
  expiration: undefined,
  expiresAt: undefined,
}

export type TDitoCustomConfig = {
  currentUser?: LoggedUser
  ready?: boolean;
}

export function getDitoConfiguration(): TDitoConfig {
  const config: any = vscode.workspace.getConfiguration("tds-dito");

  return config;
}

//Informar key sem prefixo 'tds-dito'
function setDitoConfiguration(key: keyof TDitoConfig, newValue: string | boolean | number | []): void {
  const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("tds-dito");

  config.update(key, newValue);//, vscode.ConfigurationTarget.Global);

  return;
}

function setDitoCustomConfiguration(key: keyof TDitoCustomConfig, newValue: any): void {
  customConfig[key] = newValue;
}

export function setDitoUser(user: LoggedUser | undefined) {

  setDitoCustomConfiguration("currentUser", user);
  setDitoConfiguration("lastLogin", new Date().toUTCString()); //forçar modificação em settings.json
}

export function getDitoUser(): LoggedUser | undefined {

  return customConfig["currentUser"]; //|| EMPTY_USER;
}

export function isDitoLogged(): boolean {

  return getDitoUser() !== undefined;
}

export function isDitoShowBanner(): boolean {

  return getDitoConfiguration().showBanner;
}

export function getDitoLogLevel(): string {

  return getDitoConfiguration().logLevel;
}

export function isDitoReady(): boolean {

  return customConfig["ready"] || false;
}

export function setDitoReady(ready: boolean) {

  setDitoCustomConfiguration("ready", ready);
}
