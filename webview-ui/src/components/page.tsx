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

import "./page.css";
import TdsHeader from "./header";
import TdsFooter from "./footer";
import TdsContent from "./content";

export interface IPageView {
	title: string;
	linkToDoc: string
	children: any;
	footerContent?: any;
}

/**
 * Renders a page layout with header, content and footer sections.
 * 
 * @param props - Page properties
 * @param props.title - Page title 
 * @param props.linkToDoc - Link to documentation
 * @param props.children - Content to render in main section
 * @param props.footerContent - Content to render in footer
 */
export default function TdsPage(props: IPageView) {

	return (
		<section className="tds-page">
			<TdsHeader title={props.title} linkToDoc={props.linkToDoc} />
			<TdsContent>
				{props.children}
			</TdsContent>
			<TdsFooter>
				{props.footerContent}
			</TdsFooter>
		</section>
	);
}
