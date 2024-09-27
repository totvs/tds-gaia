import { TAbstractModelPanel } from "../panels/panelInterface";
export type TIncludePath = {
    path: string;
};
export type TIncludeModel = TAbstractModelPanel & {
    includePaths: TIncludePath[];
};
export type TGlobalIncludeModel = TIncludeModel;
export declare const EMPTY_INCLUDE_MODEL: TIncludeModel;
export declare const EMPTY_GLOBAL_INCLUDE_MODEL: TGlobalIncludeModel;
//# sourceMappingURL=includeModel.d.ts.map