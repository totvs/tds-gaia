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
exports.EMPTY_APPLY_PATCH_MODEL = exports.EMPTY_PATCH_FILE = exports.ApplyPatchCommandEnum = void 0;
var ApplyPatchCommandEnum;
(function (ApplyPatchCommandEnum) {
    ApplyPatchCommandEnum["PATCH_VALIDATE"] = "PATCH_VALIDATE";
    ApplyPatchCommandEnum["GET_INFO_PATCH"] = "GET_INFO_PATCH";
})(ApplyPatchCommandEnum || (exports.ApplyPatchCommandEnum = ApplyPatchCommandEnum = {}));
exports.EMPTY_PATCH_FILE = {
    name: "",
    uri: undefined,
    validation: "",
    tphInfo: {},
    isProcessing: false,
    //fsPath: ""
};
exports.EMPTY_APPLY_PATCH_MODEL = {
    serverName: "",
    address: "",
    environment: "",
    patchFiles: [],
    applyOldFiles: false
};
//# sourceMappingURL=applyPatchModel.js.map