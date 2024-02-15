import { AuthInfo, WhoAmI, WhoAmIOrg, WhoAmIUser } from '@huggingface/hub';
import * as vscode from 'vscode';


let customConfig: TDitoCustomConfig = {};

//deve ser espelho do definido no package.json
//outras configurações, de preferência não persistentes, devem ser efetuadas em TDitoCustomConfig
export type TDitoConfig = {
  showBanner: boolean;
  verbose: "off" | "messages" | "verbose"
  endPoint: string;
  apiVersion: string;
  userLogin: string;
  documentFilter: {
    [key: string]: string;
  }
  enableAutoSuggest: boolean;
  requestDelay: number;
  maxLine: number;
  maxSuggestion: number;

  //deprecated: used in HF Api
  maxNewTokens: number;
  temperature: number;
  top_p: number;
  top_k: number;
}

const EMPTY_USER: WhoAmI = {
  id: "",
  type: "user",
  email: "",
  emailVerified: false,
  isPro: false,
  orgs: [],
  name: "<not logged>",
  fullname: "<not logged>",
  canPay: false,
  avatarUrl: "",
  periodEnd: null
}

export type TDitoCustomConfig = {
  currentUser?: WhoAmI
}

export function getDitoConfiguration(): TDitoConfig {
  const config: any = vscode.workspace.getConfiguration("tds-dito");

  return config;
}

//Informar key sem prefixo 'tds-dito'
function setDitoConfiguration(key: keyof TDitoConfig, newValue: string | boolean | number | []): void {
  const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("tds-dito");

  config.update(key, newValue, vscode.ConfigurationTarget.Global);

  return;
}

function setDitoCustomConfiguration(key: keyof TDitoCustomConfig, newValue: any): void {
  customConfig[key] = newValue;
}

export function setDitoUser(info: WhoAmI & {
  auth: AuthInfo;
} | undefined) {

  setDitoCustomConfiguration("currentUser", info);
  setDitoConfiguration("userLogin", info as WhoAmI !== undefined);
}

export function getDitoUser(): WhoAmI | undefined {

  return customConfig["currentUser"] || EMPTY_USER;
}

export function isDitoLogged(): boolean {

  return getDitoUser() !== undefined;
}

export function isDitoShowBanner(): boolean {

  return getDitoConfiguration().showBanner
}
