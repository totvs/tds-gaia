"use strict";
/*
Copyright 2021 TOTVS S.A

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
exports.CommonCommandToWebViewEnum = exports.CommonCommandFromWebViewEnum = void 0;
var CommonCommandFromWebViewEnum;
(function (CommonCommandFromWebViewEnum) {
    CommonCommandFromWebViewEnum["AfterSelectResource"] = "AFTER_SELECT_RESOURCE";
    CommonCommandFromWebViewEnum["Close"] = "CLOSE";
    CommonCommandFromWebViewEnum["Ready"] = "READY";
    CommonCommandFromWebViewEnum["Reset"] = "RESET";
    CommonCommandFromWebViewEnum["Save"] = "SAVE";
    CommonCommandFromWebViewEnum["SaveAndClose"] = "SAVE_AND_CLOSE";
    CommonCommandFromWebViewEnum["SelectResource"] = "SELECT_RESOURCE";
    CommonCommandFromWebViewEnum["LinkMouseOver"] = "LINK_MOUSE_OVER";
    CommonCommandFromWebViewEnum["LinkClick"] = "LINK_CLICK";
    CommonCommandFromWebViewEnum["CopyToClipboard"] = "COPY_TO_CLIPBOARD";
})(CommonCommandFromWebViewEnum || (exports.CommonCommandFromWebViewEnum = CommonCommandFromWebViewEnum = {}));
var CommonCommandToWebViewEnum;
(function (CommonCommandToWebViewEnum) {
    CommonCommandToWebViewEnum["InitialData"] = "INITIAL_DATA";
    CommonCommandToWebViewEnum["UpdateModel"] = "UPDATE_MODEL";
})(CommonCommandToWebViewEnum || (exports.CommonCommandToWebViewEnum = CommonCommandToWebViewEnum = {}));
//# sourceMappingURL=webviewProtocol.js.map