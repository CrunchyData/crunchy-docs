import { type Element } from 'hast-util-is-element'
import { visit } from 'unist-util-visit'

export default function rehypeWrapTable() {
	// @ts-ignore
	return async function transform(tree) {
		visit(tree, 'element', (node, i, parent) => {
			if (i !== null && node.tagName === 'table') {
				const wrapped: Element = {
					type: 'element',
					tagName: 'div',
					properties: {
						className: ['overflow-x-auto', 'sm:-mx-6', 'lg:-mx-8'],
					},
					children: [
						{
							type: 'element',
							tagName: 'div',
							properties: {
								className: [
									'inline-block',
									'min-w-full',
									'align-middle',
									'sm:px-6 lg:px-8',
								],
							},
							children: [node],
						},
					],
				}
				parent.children[i] = wrapped
			}
		})
	}
}
