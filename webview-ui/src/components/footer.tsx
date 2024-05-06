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

import "./footer.css";
import React from "react";

export interface IFooter {
	//linkToDoc?: string
	children: any
}

/**
 * Renders the footer component.
 * 
 * @param props - The footer component props.
 * @param props.children - The content to render within the footer.
 */
export default function TdsFooter(props: IFooter) {
	// const re: RegExp = /\[(.*)]\]?(.*)/g;
	// let match: RegExpExecArray | null = re.exec(props.linkToDoc || "");
	// let text: string;
	// let href: string;

	// if (match && match.length > 1) {
	// 	text = "Help";  //match[1];
	// 	href = "https://github.com/totvs/tds-vscode/blob/master/docs/" + match[2];
	// } else {
	// 	text = props.linkToDoc || "";
	// 	href = props.linkToDoc || ""
	// }

	const children = React.Children.toArray(props.children);

	//{props.linkToDoc && <div className="tds-help-doc"><VSCodeLink href={href}>{text}</VSCodeLink></div>}
	return (
		<section className="tds-footer">
			{children.length > 0 && <>
				<div className="tds-logo">
					<img src="../icons/totvs-32x32.png" alt="TOTVS S.A." />
				</div>
				<div className="tds-footer-content">
					{...children}
				</div>
			</>
			}
		</section>
	);
}
