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

// import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
// import { ChangeHandler, useController, useFormContext } from "react-hook-form";
// import PopupMessage from "../popup-message";
// import { TdsFieldProps } from "../form";

// type TdsSelectionFieldProps = TdsFieldProps & {
// 	options?: {
// 		value: string;
// 		text: string;
// 	}[]
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
// export function TdsSelectionField(props: TdsSelectionFieldProps): JSX.Element {
// 	const {
// 		register,
// 		getValues,
// 		formState: { isDirty }
// 	} = useFormContext();
// 	const { field, fieldState } = useController(props);
// 	const registerField = register(props.name, props.rules);
// 	const options = props.options || [];
// 	const currentValue: string = getValues(props.name) as string;

// 	return (
// 		<section
// 			className={`tds-field-container tds-selection-field ${props.className ? props.className : ''}`}
// 		>
// 			<label
// 				htmlFor={field.name}
// 			>
// 				{props.label}
// 				{props.rules?.required && <span className="tds-required" />}
// 			</label>
// 			<br />
// 			<VSCodeDropdown
// 				{...registerField}
// 			>
// 				{options.map(({ value, text }, index) => {
// 					return (
// 						<VSCodeOption key={index} value={value} checked={currentValue === value}>{text}</VSCodeOption>
// 					)
// 				})}
// 				<PopupMessage field={props} fieldState={fieldState} />
// 			</VSCodeDropdown>
// 		</section>
// 	)
// }