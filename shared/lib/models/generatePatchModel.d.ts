import { TAbstractModelPanel } from "../panels/panelInterface";
import { CommonCommandFromWebViewEnum } from "../webviewProtocol";
import { TInspectorObject } from "./inspectObjectModel";
export declare enum PatchGenerateCommandEnum {
    IncludeTRes = "INCLUDE_TRES",
    MoveElements = "MOVE_ELEMENTS"
}
export type PatchGenerateCommand = CommonCommandFromWebViewEnum & PatchGenerateCommandEnum;
export type TGeneratePatchFromRpoModel = TAbstractModelPanel & {
    patchName: string;
    patchDest: string;
    includeTRes: boolean;
    objectsLeft: TInspectorObject[];
    objectsRight: TInspectorObject[];
    folder: string;
};
export type TGeneratePatchByDifferenceModel = TAbstractModelPanel & {
    rpoMasterFolder: string;
    patchName: string;
    patchDest: string;
};
export declare const EMPTY_GENERATE_PATCH_FROM_RPO_MODEL: TGeneratePatchFromRpoModel;
//# sourceMappingURL=generatePatchModel.d.ts.map