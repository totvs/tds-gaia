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

// import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";
// import { useController, useFormContext } from "react-hook-form";
// import PopupMessage from "../popup-message";
// import { TdsFieldProps } from "../form";

// type TdsSimpleCheckBoxFieldProps = TdsFieldProps & {
// 	textLabel: string;

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
// export function TdsSimpleCheckBoxField(props: TdsSimpleCheckBoxFieldProps): JSX.Element {
// 	const {
// 		register,
// 		getValues,
// 		setValue,
// 		formState: { isDirty }
// 	} = useFormContext();
// 	const { field, fieldState } = useController(props);
// 	const registerField = register(props.name, props.rules);
// 	const originalChange = registerField.onChange;
// 	registerField.onChange = (e) => {
// 		if (originalChange) {
// 			originalChange(e)
// 		}

// 		if ((e.target as HTMLInputElement).indeterminate) {
// 			setValue(registerField.name, null);
// 		} else {
// 			setValue(registerField.name, e.target.checked ? true : false);
// 		}

// 		return e.target.checked;
// 	}

// 	return (
// 		<section
// 			className={`tds-field-container tds-simple-checkbox-field  ${props.className ? props.className : ''}`}
// 		>
// 			<VSCodeCheckbox
// 				checked={field.value.toString() === "true"}
// 				indeterminate={field.value.toString() !== "true" && field.value.toString() !== "false"}
// 				readOnly={props.readOnly || false}
// 				{...registerField}
// 			>
// 				{props.textLabel}
// 				<PopupMessage field={props} fieldState={fieldState} />
// 			</VSCodeCheckbox>
// 		</section>
// 	)
// }