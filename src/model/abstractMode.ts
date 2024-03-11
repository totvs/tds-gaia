/*
Copyright 2024 TOTVS S.A

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http: //www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * Type alias for an abstract model object.
 */
export type TAbstractModel = {

}

/**
 * Enumeration of possible error types.
 */
export type TErrorType =
    "required"
    | "min"
    | "max"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "validate"
    | "warning";

/**
 * Type representing a field error. 
 * Contains the error type and an optional error message.
*/
export type TFieldError = {
    type: TErrorType;
    message?: string
};

/**
 * Type representing field errors for a model type M.
 * Allows associating errors to model fields or the "root" key.
*/
export type TFieldErrors<M> = Partial<Record<keyof M | "root", TFieldError>>;
