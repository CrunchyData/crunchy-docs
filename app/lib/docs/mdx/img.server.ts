import { isElement, type Element } from 'hast-util-is-element'
import { type MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { visit } from 'unist-util-visit'

function createImageComponent(node: Element): MdxJsxFlowElement {
	const src =
		typeof node?.properties?.src === 'string'
			? node.properties.src
			: '/images/missing-image'
	const alt =
		typeof node?.properties?.alt === 'string' ? node.properties.alt : ''

	return {
		type: 'mdxJsxFlowElement',
		name: 'Image',
		attributes: [
			{
				type: 'mdxJsxAttribute',
				name: 'src',
				value: src.replace(/\..*$/, ''),
			},
			{
				type: 'mdxJsxAttribute',
				name: 'alt',
				value: alt,
			},
		],
		children: [],
	}
}

/**
 * Convert image tags
 */
export function rehypeImages() {
	// @ts-ignore
	return async function transform(tree) {
		visit(
			tree,
			node => isElement(node) && node.tagName === 'img',
			node => {
				return Object.assign(node, createImageComponent(node))
			},
		)
	}
}
