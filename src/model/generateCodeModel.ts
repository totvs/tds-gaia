import { TModelPanel } from "./field-model";

export type TGenerateCodeModel = TModelPanel & {
    description: string;
    generateCode: string;
}