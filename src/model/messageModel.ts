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

import { TAbstractModel } from "./abstractMode";

/**
 * Defines the shape of the message action model.
 * 
 * @property caption - The caption to display for the message action.
 * @property command - The command to execute when the message action is triggered.
 */
export type TMessageActionModel = {
    caption: string;
    command: string;
}

/**
 * Defines the shape of the message model, extending TAbstractModel.
 * Contains properties like id, author, message text, timestamp, etc.
 * Can optionally contain an array of action models.
 */
export type TMessageModel = TAbstractModel & {
    id: string;
    answering: string;
    inProcess: boolean;
    timeStamp: Date;
    author: string;
    message: string;
    actions?: TMessageActionModel[];
}

