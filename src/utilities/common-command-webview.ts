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

/**
 * Enumeration of command names used for communication 
 * from the extension to the webview.
 */
export enum CommonCommandEnum {
  Save = "SAVE",
  SaveAndClose = "SAVE_AND_CLOSE",
  Close = "CLOSE",
  Ready = "READY",
  Reset = "RESET",
  Validate = "VALIDATE",
  UpdateModel = "UPDATE_MODEL",
  LinkMouseOver = "LINK_MOUSE_OVER",
  SelectResource = "SELECT_RESOURCE",
  AfterSelectResource = "AFTER_SELECT_RESOURCE",
  CopyToClipboard = "COPY_TO_CLIPBOARD"
}

export type TCommonCommand = CommonCommandEnum;

/**
 * Type for messages received from the webview panel. 
 * Contains the command name and data payload.
 * The data payload contains the updated model and any other data.
*/
export type ReceiveMessage<C extends TCommonCommand, T = any> = {
  command: C,
  data: {
    model: T,
    errors: any
    [key: string]: any,
  }
}

/**
 * Type for messages received from the webview panel. 
 * Contains the command name and data payload.
 * The data payload contains the updated model and any other data.
*/
export type CommandFromPanel<C extends TCommonCommand, T = any> = {
  readonly command: C,
  data: {
    model: T,
    [key: string]: any,
  }
}

/**
 * Type for messages sent from the extension to the webview panel. 
 * Contains the command name and data payload.
 * The data payload contains the model and any other data.
*/
export type SendMessage<C extends TCommonCommand, T = any> = {
  command: C,
  data: {
    model: T | undefined,
    [key: string]: any,
  }
}

/**
 * Type for props to send when requesting the user to select resources.
 * 
 * @param canSelectMany - Whether multiple resources can be selected. 
 * @param canSelectFiles - Whether files can be selected.
 * @param canSelectFolders - Whether folders can be selected.
 * @param currentFolder - The current folder path.
 * @param title - The title for the resource selection dialog.
 * @param openLabel - The label for the open button. 
 * @param filters - The allowed file filters.
 */
export type TSendSelectResourceOptions = {
  canSelectMany: boolean,
  canSelectFiles: boolean,
  canSelectFolders: boolean,
  currentFolder: string,
  title: string,
  openLabel: string,
  filters: {
    [key: string]: string[]
  }
}

