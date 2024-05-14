import { TModelPanel } from "../panels/panel";

export type TGenerateCodeModel = TModelPanel & {
    description: string;
    generateCode: string;
}