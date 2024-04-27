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

// import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
// import { useController, useFormContext } from "react-hook-form";
// import PopupMessage from "../popup-message";
// import { IFormAction, TdsFieldProps } from "../form";
// import { sendClose } from "../../utilities/common-command-webview";

// type TdsNumericFieldProps = TdsFieldProps & {
// 	//onChange?: (event: ChangeEvent<HTMLInputElement>) => any;
// }

// /**
//  *
//  * - Uso de _hook_ ``useFieldArray`` e propriedade ``disabled``:
//  *   Por comportamento do _hook_, campos com ``disabled`` ativo não são armazenados
//  *   no _array_ associado ao _hook_.
//  *   Caso seja necessário sua manipulação, use ``readOnly`` como alternativa.
//  *
//  * @param props
//  *
//  * @returns
//  */
// export function TdsNumericField(props: TdsNumericFieldProps): JSX.Element {
// 	const {
// 		register,
// 		setValue,
// 		formState: { isDirty }
// 	} = useFormContext();
// 	const rules = {
// 		...props.rules,
// 		valueAsNumber: true,
// 		pattern: {
// 			value: /\d+/gm,
// 			message: `[${props.label}] only accepts numbers`
// 		},
// 	};
// 	const { field, fieldState } = useController({ ...props, rules: rules });
// 	const registerField = register(props.name);

// 	return (
// 		<section
// 			className={`tds-field-container tds-numeric-field ${props.className ? props.className : ''}`}
// 		>
// 			<label
// 				htmlFor={field.name}
// 			>
// 				{props.label}
// 				{props.rules?.required && <span className="tds-required" />}
// 			</label>
// 			<VSCodeTextField
// 				readOnly={props.readOnly || false}
// 				{...registerField}
// 			>
// 				<PopupMessage field={props} fieldState={fieldState} />
// 			</VSCodeTextField>
// 		</section>
// 	)
// }