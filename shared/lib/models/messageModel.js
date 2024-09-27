"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageOperationEnum = void 0;
/**
* Defines the possible operations that can be performed on a message.
* - Add: Indicates a new message is being created.
* - Update: Indicates an existing message is being updated.
* - Remove: Indicates an existing message is being deleted.
*
* As the operation the attributes can be ignored. See {@link TMessageModel}.
*/
var MessageOperationEnum;
(function (MessageOperationEnum) {
    MessageOperationEnum[MessageOperationEnum["Add"] = 0] = "Add";
    MessageOperationEnum[MessageOperationEnum["Update"] = 1] = "Update";
    MessageOperationEnum[MessageOperationEnum["Remove"] = 2] = "Remove";
    MessageOperationEnum[MessageOperationEnum["NoShow"] = 3] = "NoShow";
})(MessageOperationEnum || (exports.MessageOperationEnum = MessageOperationEnum = {}));
//# sourceMappingURL=messageModel.js.map