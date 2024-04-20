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
* Defines the possible operations that can be performed on a message.
* - Add: Indicates a new message is being created.
* - Update: Indicates an existing message is being updated.
* - Remove: Indicates an existing message is being deleted.
* 
* As the operation the attributes can be ignored. See {@link TMessageModel}.
*/
export enum MessageOperationEnum {
  Add,
  Update,
  Remove
}

/**
 * Defines the shape of the message model, extending TAbstractModel.
 * Contains properties like id, author, message text, timestamp, etc.
 * Can optionally contain an array of action models.
 * 
 * UNMARKED attributes are ignored in the operation.
 */
export type TMessageModel = TAbstractModel & {
  operation: MessageOperationEnum, // Add | Update | Delete
  messageId: string;               //  X  |   X    |   X
  answering: string;               //  X  |        |   
  inProcess: boolean;              //  X  |        |   
  timeStamp: Date;                 //  X  |        |   
  author: string;                  //  X  |        |   
  message: string;                 //  X  |   X    |   
}
