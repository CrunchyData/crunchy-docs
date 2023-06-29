import { isElement } from 'hast-util-is-element'
import { toText } from 'hast-util-to-text'
import {
	type MdxJsxAttribute,
	type MdxJsxFlowElement,
} from 'mdast-util-mdx-jsx'
import { visit } from 'unist-util-visit'

export function rehypeCopyCode() {
	// @ts-ignore
	return async function transform(tree) {
		visit(
			tree,
			node => isElement(node) && node.tagName === 'pre',
			function visitor(node) {
				const CopyButton: MdxJsxFlowElement = {
					type: 'mdxJsxFlowElement',
					name: 'CopyButton',
					attributes: [
						{
							type: 'mdxJsxAttribute',
							name: 'text',
							value: toText(node),
						} satisfies MdxJsxAttribute,
					],
					children: [],
				}
				node.children.push(CopyButton)
			},
		)
	}
}
