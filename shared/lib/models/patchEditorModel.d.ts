import { CommonCommandFromWebViewEnum } from "../webviewProtocol";
export declare enum PatchEditorCommandEnum {
    Export = "EXPORT"
}
export type PatchEditorCommand = CommonCommandFromWebViewEnum & PatchEditorCommandEnum;
export type TPatchInfo = {
    name: string;
    type: string;
    buildType: string;
    date: Date;
    size: number;
};
export type TPatchEditorModel = {
    filename: string;
    lengthFile: number;
    patchInfo: TPatchInfo[];
};
export declare const EMPTY_PATCH_EDITOR_MODEL: TPatchEditorModel;
//# sourceMappingURL=patchEditorModel.d.ts.map