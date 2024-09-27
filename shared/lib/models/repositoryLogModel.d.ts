import { TAbstractModelPanel } from "../panels/panelInterface";
export type TRepositoryLogModel = TAbstractModelPanel & {
    serverName: string;
    rpoVersion: string;
    dateGeneration: Date;
    environment: string;
    rpoPatches: TPatchInfoModel[];
};
export type TPatchInfoModel = {
    dateFileApplication: Date;
    dateFileGeneration: Date;
    typePatch: number;
    isCustom: boolean;
    programsApp: TProgramAppModel[];
};
export type TProgramAppModel = {
    name: string;
    date: Date;
};
export declare const EMPTY_REPOSITORY_MODEL: TRepositoryLogModel;
//# sourceMappingURL=repositoryLogModel.d.ts.map