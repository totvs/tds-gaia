import { TAbstractModelPanel } from "../panels/panelInterface";
export type TLauncherType = "" | "totvs_language_debug" | "totvs_language_web_debug" | "totvs_tdsreplay_debug";
export type TLauncherConfigurationModel = TAbstractModelPanel & {
    launcherType: TLauncherType;
    name: string;
    launchersNames: string[];
    program: string;
    programArgs: {
        value: string;
    }[];
    smartClient: string;
    webAppUrl: string;
    enableMultiThread: boolean;
    enableProfile: boolean;
    multiSession: boolean;
    accessibilityMode: boolean;
    openGlMode: boolean;
    dpiMode: boolean;
    oldDpiMode: boolean;
    language: TLanguagesEnum;
    doNotShowSplash: boolean;
    ignoreFiles: boolean;
};
export declare enum TLanguagesEnum {
    DEFAULT = "Default",
    PT = "Portuguese",
    EN = "English",
    ES = "Spanish",
    RU = "Russian"
}
export declare const EMPTY_LAUNCHER_CONFIGURATION: TLauncherConfigurationModel;
//# sourceMappingURL=launchConfigurationModel.d.ts.map