import { TAbstractModelPanel } from "../panels/panelInterface";
export type TInspectorObject = {
    source: string;
    date: Date;
    rpo_status: string | number;
    source_status: string | number;
    function: string;
    line: number;
    checked?: boolean;
};
export type TInspectorObjectModel = TAbstractModelPanel & {
    includeOutScope: boolean;
    objects: TInspectorObject[];
};
//# sourceMappingURL=inspectObjectModel.d.ts.map