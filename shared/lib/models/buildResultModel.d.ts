import { TAbstractModelPanel } from "../panels/panelInterface";
import { CommonCommandFromWebViewEnum } from "../webviewProtocol";
export declare enum BuildResultCommandEnum {
    Export = "EXPORT"
}
export type BuildResultCommand = CommonCommandFromWebViewEnum & BuildResultCommandEnum;
export type TBuildInfoResult = {
    filename: string;
    status: string;
    message: string;
    detail: string;
    uri: string;
};
export type TBuildResultModel = TAbstractModelPanel & {
    timeStamp: Date;
    returnCode: number;
    buildInfos: TBuildInfoResult[];
};
export declare const EMPTY_BUILD_RESULT_MODEL: TBuildResultModel;
//# sourceMappingURL=buildResultModel.d.ts.map