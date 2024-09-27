"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_LAUNCHER_CONFIGURATION = exports.TLanguagesEnum = void 0;
var TLanguagesEnum;
(function (TLanguagesEnum) {
    TLanguagesEnum["DEFAULT"] = "Default";
    TLanguagesEnum["PT"] = "Portuguese";
    TLanguagesEnum["EN"] = "English";
    TLanguagesEnum["ES"] = "Spanish";
    TLanguagesEnum["RU"] = "Russian";
})(TLanguagesEnum || (exports.TLanguagesEnum = TLanguagesEnum = {}));
exports.EMPTY_LAUNCHER_CONFIGURATION = {
    launcherType: "",
    name: "",
    launchersNames: [],
    program: "",
    programArgs: [],
    smartClient: "",
    webAppUrl: "",
    enableMultiThread: true,
    enableProfile: false,
    multiSession: true,
    accessibilityMode: false,
    openGlMode: false,
    dpiMode: false,
    oldDpiMode: false,
    language: TLanguagesEnum.DEFAULT,
    doNotShowSplash: false,
    ignoreFiles: true,
};
//# sourceMappingURL=launchConfigurationModel.js.map