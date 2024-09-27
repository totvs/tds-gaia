import { TAbstractModelPanel } from "../panels/panelInterface";
import { CommonCommandFromWebViewEnum } from "../webviewProtocol";
export declare enum ApplyPatchCommandEnum {
    PATCH_VALIDATE = "PATCH_VALIDATE",
    GET_INFO_PATCH = "GET_INFO_PATCH"
}
export type ApplyPatchCommand = CommonCommandFromWebViewEnum & ApplyPatchCommandEnum;
export type TPatchFileData = {
    name: string;
    uri?: string;
    validation: string;
    tphInfo: any;
    isProcessing: boolean;
};
export type TApplyPatchModel = TAbstractModelPanel & {
    serverName: string;
    address: string;
    environment: string;
    patchFiles: TPatchFileData[];
    applyOldFiles: boolean;
};
export declare const EMPTY_PATCH_FILE: TPatchFileData;
export declare const EMPTY_APPLY_PATCH_MODEL: TApplyPatchModel;
//# sourceMappingURL=applyPatchModel.d.ts.map