export type TAbstractModel = {

}

export type TErrorType =
    "required"
    | "min"
    | "max"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "validate"
    | "warning";

export type TFieldError = {
    type: TErrorType;
    message?: string
};

export type TFieldErrors<M> = Partial<Record<keyof M | "root", TFieldError>>;
