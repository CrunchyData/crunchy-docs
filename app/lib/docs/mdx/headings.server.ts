import { headingRank } from 'hast-util-heading-rank'
import { type Element } from 'hast-util-is-element'
import { type MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { visit } from 'unist-util-visit'

export type Heading = { id: string; text: string; level: 2 | 3 }

function handleComponent(node: MdxJsxFlowElement): Heading | null {
	if (
		node.name === 'h2' ||
		node.name === 'h3' ||
		node.name === 'ChildHeading'
	) {
		let id = node.attributes.find(
			attr => attr.type === 'mdxJsxAttribute' && attr.name === 'id',
		)?.value

		if (typeof id !== 'string') {
			id = createIdFromHeading(node.children)
		}

		const text = node.children.reduce<string>((acc, el) => {
			visit(el, 'text', textNode => {
				acc += textNode.value
			})
			return acc
		}, '')

		return {
			id,
			text,
			level: node.name === 'h2' ? 2 : 3,
		}
	}
	return null
}

function handleElement(node: Element): Heading | null {
	const level = headingRank(node)

	// If not React Heading set base as the a tag
	if (level && (level === 2 || level === 3)) {
		let anchor = node.children.find(child => {
			return child.type === 'element' && child.tagName === 'a'
		})

		if (anchor && anchor.type === 'element') {
			const text = anchor.children.reduce<string>((acc, el) => {
				visit(el, 'text', textNode => {
					acc += textNode.value
				})
				return acc
			}, '')

			if (typeof node.properties?.id === 'string') {
				return {
					id: node.properties.id,
					text,
					level,
				}
			}
		}
	}

	return null
}

function createIdFromHeading(children: any[]): string {
	return children
		.reduce<string>((acc, child) => {
			if (child.type === 'text') acc += child.value
			return acc
		}, '')
		.toLowerCase()
		.replaceAll(' ', '-')
}
/**
 * Pull out all h2 and h3 headings to create a table of contents tree
 */
export function rehypeHeadings({ exportRef }: { exportRef: Heading[] }) {
	// @ts-ignore
	return async function transform(tree) {
		visit(
			tree,
			node => node.type === 'element' || node.type === 'mdxJsxFlowElement',
			function visitor(node) {
				const heading =
					node.type === 'mdxJsxFlowElement'
						? handleComponent(node)
						: handleElement(node)

				if (heading) {
					if (node.type === 'mdxJsxFlowElement') {
						const anchor = {
							type: 'element',
							tagName: 'a',
							properties: {
								href: `#${heading.id}`,
							},
							children: node.children,
						}

						node.children = [anchor]
					}
					exportRef.push(heading)
				}
			},
		)
	}
}

type TOCBase = {
	id: string
	text: string
}

export type TOCParent = TOCBase & { children: TOCBase[] }

export function headingsToTableOfContents(headings: Heading[]) {
	return headings.reduce<TOCParent[]>((acc, { id, text, level }) => {
		if (level === 2) {
			acc.push({
				id,
				text,
				children: [],
			})
		} else {
			const tail = acc.pop()
			if (tail) {
				tail.children.push({ id, text })
				acc.push(tail)
			}
		}

		return acc
	}, [])
}
