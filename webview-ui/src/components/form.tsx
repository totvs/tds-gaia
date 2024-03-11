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

import { ButtonAppearance } from "@vscode/webview-ui-toolkit";
import "./form.css";
import { ChangeHandler, FieldValues, FormState, RegisterOptions, UseFormReturn, UseFormSetError, UseFormSetValue, useFormContext } from "react-hook-form";
import { VSCodeButton, VSCodeLink, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
import { sendClose, sendReset } from "../utilities/common-command-webview";
import React from "react";

/**
 * Returns the default set of actions for the form.
 * 
 * The default actions include:
 * - Save: Submits the form and closes the page. Enabled when form is dirty and valid.
 * - Close: Closes the page without saving. 
 * - Clear: Resets the form fields. Initially hidden.
 */
export function getDefaultActionsForm(): IFormAction[] {
	return [
		{
			id: -1,
			caption: "Save",
			hint: "Salva as informações e fecha a página",
			appearance: "primary",
			type: "submit",
			isProcessRing: true,
			enabled: (isDirty: boolean, isValid: boolean) => {
				return isDirty && isValid;
			},
		},
		{
			id: -2,
			caption: "Close",
			hint: "Fecha a página, sem salvar as informações",
			appearance: "secondary",
			onClick: () => {
				sendClose();
			},
		},
		{
			id: -3,
			caption: "Clear",
			hint: "Reinicia os campos do formulário",
			appearance: "secondary",
			type: "reset",
			visible: false
		}
	];
}

/**
* Notas:
* - Usar _hook_ ``FormProvider`` antes de iniciar ``TDSForm``.
*   Esse _hook_ proverá informações para os elementos filhos e
*   fará a interface entre a aplicação e o formulário.
*
* - O tipo ``DataModel`` que complementa a definição de ``TDSFormProps``,
*   descreve a estrutura de dados do formulário. Normalmente,
*	você não precisa instanciar um objeto para armazenar os dados,
*   o _hook_ ``FormProvider`` proverá esse armazenamento e acesso aos dados,
*   através dos métodos ``getValues()``, ``setValues()``.
**/

type TDSFormProps<DataModel extends FieldValues> = {
	id?: string;
	onSubmit: (data: any) => void;
	methods: UseFormReturn<DataModel>;
	actions?: IFormAction[];
	children: any
	isProcessRing?: boolean
};

/**
 * Interface for form action buttons. 
 * Defines the shape of action button configs used in TDS forms.
*/
export interface IFormAction {
	id: number;
	caption: string;
	hint?: string;
	onClick?: any;
	enabled?: boolean | ((isDirty: boolean, isValid: boolean) => boolean);
	visible?: boolean | ((isDirty: boolean, isValid: boolean) => boolean);
	isProcessRing?: boolean
	type?: "submit" | "reset" | "button" | "link";
	appearance?: ButtonAppearance;
}

/**
 * Interface for form field components.
 * Defines the props shape for form fields.
 */
export type TdsFieldProps = {
	name: string;
	label: string;
	info?: string;
	readOnly?: boolean
	className?: string;
	rules?: RegisterOptions<FieldValues, string>;
	onChange?: ChangeHandler;
}

/**
 * Sets form values from a data model object.
 * Maps the data model object values to the form values by field name.
 * Handles undefined values to avoid errors.
 *
 * Passing ``setValue`` is necessary, as this function
 * is executed outside the form context.
*/
export function setDataModel<DataModel extends FieldValues>
	(setValue: UseFormSetValue<DataModel>, dataModel: Partial<DataModel>) {
	if (dataModel) {
		Object.keys(dataModel).forEach((fieldName: string) => {
			if (dataModel[fieldName] !== undefined) {
				setValue(fieldName as any, dataModel[fieldName]!);
			} else {
				console.error(`Erro chamar setValue no campo ${fieldName}`);
			}
		})
	} else {
		console.error("Parâmetro [DataModel] não informando (indefinido)");
	}
}

type TFieldError = {
	type: string;
	message?: string
};

type TFieldErrors<M> = Partial<Record<keyof M | "root", TFieldError>>;

/**
 * Sets form field errors from an error model object.
 * Maps the error model object to field errors by field name.
 * Handles undefined error values to avoid errors.
 *
 * Passing ``setError`` is necessary, as this function
 * is executed outside the form context.
*
*/
export function setErrorModel<DataModel extends FieldValues>(setError: UseFormSetError<DataModel>, errorModel: TFieldErrors<DataModel>) {
	if (errorModel) {
		Object.keys(errorModel).forEach((fieldName: string) => {
			if (errorModel[fieldName] !== undefined) {
				setError(fieldName as any, {
					message: errorModel[fieldName]?.message,
					type: errorModel[fieldName]?.type
				})
			} else {
				console.error(`Erro ao chamar setError no campo ${fieldName}`);
			}
		});
	}
}

/**
 *
 * Se usar em _hook_ useFieldArray, ver nota inicio do fonte.
 *
 * @param props
 * @returns
 */
let isProcessRing: boolean = false;

/**
 * Renders a form component with state management and actions.
 * 
 * Accepts a generic DataModel for the form values and errors.
 * Provides form state values and common form handling methods.
 * Renders form content, messages, and action buttons.
 * Handles submit and reset events.
 */
export function TdsForm<DataModel extends FieldValues>(props: TDSFormProps<DataModel>): JSX.Element {
	const {
		formState: { errors, isDirty, isValid, isSubmitting },
	} = useFormContext();

	let actions: IFormAction[] = props.actions ? props.actions : getDefaultActionsForm();

	if (isSubmitting && (actions.length > 0)) {
		isProcessRing = props.isProcessRing !== undefined ? props.isProcessRing : true;
	} else if (!isValid) {
		isProcessRing = props.isProcessRing !== undefined ? props.isProcessRing : false;
	}

	actions.forEach((action: IFormAction) => {
		action.isProcessRing = (action.isProcessRing !== undefined ? action.isProcessRing && isProcessRing : undefined)
	});

	const id: string = props.id ? props.id : "form";
	const children = React.Children.toArray(props.children);

	return (
		<form className="tds-form"
			id={id}
			onSubmit={props.methods.handleSubmit(props.onSubmit)}
			onReset={() => sendReset(props.methods.getValues())}
			onKeyUp={(ev: React.KeyboardEvent<HTMLElement>) => {
				// console.log(ev.key, ev.ctrlKey, ev.metaKey, ev.altKey, ev.shiftKey);
				// //TODO: ainda com erro, não envia newMessage
				// if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
				// 	ev.preventDefault();
				// 	ev.stopPropagation();
				// 	document.getElementById("btnSend")?.focus();
				// 	document.getElementById("btnSend")?.click();
				// }
			}}
			autoComplete="off"
		>
			<section className={"tds-form-content"}>
				{...children}
			</section>
			<section className="tds-form-footer">
				<div className="tds-message">
					{errors.root && <span className={`tds-error`}>{errors.root.message}.</span>}
					{isProcessRing && <><VSCodeProgressRing /><span>Wait please. Processing...</span></>}
				</div>
				<div className="tds-actions">
					{actions.map((action: IFormAction) => {
						let propsField: any = {};
						let visible: string = "";

						propsField["key"] = action.id;
						propsField["type"] = action.type || "button";

						if (isProcessRing) {
							propsField["disabled"] = true;
						} else if (action.enabled !== undefined) {
							if (typeof action.enabled === "function") {
								propsField["disabled"] = !(action.enabled as Function)(isDirty, isValid);
							} else {
								propsField["disabled"] = !action.enabled;
							}
						}

						if (action.appearance) {
							propsField["appearance"] = action.appearance;
						}

						if (action.onClick) {
							propsField["onClick"] = action.onClick;
						}

						if (action.visible !== undefined) {
							let isVisible: false;

							if (action.visible = typeof action.visible === "function") {
								isVisible = (Function)(action.visible)(isDirty, isValid)
							} else {
								isVisible = action.visible;
							}

							visible = isVisible ? "" : "tds-hidden";
						}

						return (action.type == "link" ?
							<VSCodeLink onClick={() => action.onClick()}>{action.caption}</VSCodeLink>
							: <VSCodeButton
								className={`tds-button-button ${visible}`}
								{...propsField} >
								{action.caption}
							</VSCodeButton>)
					})}
				</div>
			</section>
		</form >
	);
}

// export { TdsCheckBoxField } from "./fields/checkBoxField";
// export { TdsLabelField } from "./fields/labelField";
// export { TdsNumericField } from "./fields/numericField";
// export { TdsSelectionField } from "./fields/selectionField";
// export { TdsSelectionFileField } from "./fields/selectionResourceField";
// export { TdsSelectionFolderField } from "./fields/selectionResourceField";
// export { TdsSimpleCheckBoxField } from "./fields/simpleCheckBoxField";
export { TdsTextField } from "./fields/textField";
// export { TdsSimpleTextField } from "./fields/simpleTextField";
