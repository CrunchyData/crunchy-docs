import * as acorn from 'acorn'
import { type Element } from 'hast'
import { isElement } from 'hast-util-is-element'
import yaml from 'js-yaml'
import { type Root, type Text } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import {
	type MdxJsxFlowElement,
	type MdxJsxTextElement,
	mdxJsxFromMarkdown,
} from 'mdast-util-mdx-jsx'
import { bundleMDX } from 'mdx-bundler'
import { mdxJsx } from 'micromark-extension-mdx-jsx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { docAttributes } from '../attrs.server.ts'

export async function parseMdxToPdf(mdx: string) {
	const { frontmatter, code } = await bundleMDX({
		source: mdx,
		mdxOptions(options) {
			options.remarkPlugins = [
				...(options.remarkPlugins ?? []),
				remarkFrontmatter,
				remarkTitle,
				remarkGfm,
			]

			options.rehypePlugins = [...(options.rehypePlugins ?? []), rehypeToPdf]

			return options
		},
	})

	return {
		attributes: docAttributes.parse(frontmatter),
		pdf: code,
	}
}

function remarkTitle() {
	return async function transform(tree: Root) {
		visit(tree, 'yaml', (node, i, parent) => {
			const data = yaml.load(node.value) as { title: string; root?: false }
			if (parent === null || i === null) return

			if (data?.root) {
				parent.children.slice(i, 1)
				return
			}

			if (!data?.title) return

			parent.children[i] = {
				type: 'heading',
				depth: 1,
				children: [
					{
						type: 'text',
						value: data.title,
					},
				],
			}
		})
	}
}

function transformNode(node: any, i: number, level = 0) {
	switch (node.type) {
		case 'root':
			return node

		case 'mdxTextExpression':
			return null

		case 'text':
			if (level === 1 || node.value === '\n') {
				return null
			}

			return node

		case 'mdxJsxTextElement':
			if (!isMdxJsxTextElement(node)) break

			switch (node.name) {
				// TODO: Make this to navigate to another page in PDF.
				case 'Ref': {
					const raw = `<Text/>`
					return convertComponent(raw, node)
				}

				case 'MediaHeading': {
					const raw = `<Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 18 }} />`
					return convertComponent(raw, node)
				}

				case 'Text':
				case 'View':
					return node

				case 'LightBulbIcon': {
					const raw = `<Svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }}><Path strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></Svg>`

					return convertComponent(raw, node)
				}

				case 'InformationCircleIcon': {
					const raw = `<Svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }}><Path strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></Svg>`

					return convertComponent(raw, node)
				}

				case 'ExclamationTriangleIcon': {
					const raw = `<Svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }}><Path strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></Svg>`

					return convertComponent(raw, node)
				}

				case 'strong': {
					return convertStrong(node)
				}

				case 'a': {
					return convertAnchor(node)
				}

				default:
					console.log('Unsupported flow text element: ', node.name)
					return null
			}

		case 'mdxJsxFlowElement':
			if (!isMdxJsxFlowElement(node)) break

			switch (node.name) {
				// TODO: Make this to navigate to another page in PDF.
				case 'Ref': {
					const raw = `<Text/>`
					return convertComponent(raw, node)
				}

				case 'MediaRow': {
					const raw = `<View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} />`
					return convertComponent(raw, node)
				}

				case 'MediaItem': {
					const raw = `<View style={{ width: '30%' }} />`
					return convertComponent(raw, node)
				}

				case 'MediaImage': {
					let src = node.attributes?.find(
						attr => attr.type === 'mdxJsxAttribute' && attr.name === 'src',
					)?.value

					const raw = `<Image src="${src}" style={{ height: 100 }} />`
					return convertComponent(raw, node)
				}

				case 'h2': {
					const raw = `<Text wrap style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 20 }} />`

					return convertComponent(raw, node)
				}

				case 'h3':
				case 'ChildHeading': {
					const raw = `<Text wrap style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', marginTop: 18 }} />`

					return convertComponent(raw, node)
				}

				case 'a': {
					return convertAnchor(node)
				}

				case 'img': {
					let src = node.attributes?.find(
						attr => attr.type === 'mdxJsxAttribute' && attr.name === 'src',
					)?.value

					const width =
						node.attributes?.find(
							attr => attr.type === 'mdxJsxAttribute' && attr.name === 'width',
						)?.value ?? '75vw'

					const raw = `<Image src="${src}" style={{ width: "${width}", marginTop: 8 }} />`

					return convertComponent(raw, node)
				}

				case 'Hint': {
					let value = ''
					if (node.children.length === 1) {
						const child = node.children[0] as any
						if (child.type === 'text') {
							value = `<Text>${child.value}</Text>`
						}
					}
					const raw = `<View style={{ marginTop: 8, borderRadius: 4, backgroundColor: "#D8F1E6", color: "#064e3b", paddingHorizontal: 18, paddingVertical: 12, fontSize: 10 }}><View style={{ display: "flex", flexDirection: "row", alignItems: "center", fontFamily: "Helvetica-Bold", marginBottom: 2 }}><LightBulbIcon className="h-4 w-4" /><Text style={{ paddingLeft: 4 }}>Hint</Text></View>${value}</View>`

					return convertComponent(raw, node)
				}

				case 'Info': {
					let value = ''
					if (node.children.length === 1) {
						const child = node.children[0] as any
						if (child.type === 'text') {
							value = `<Text>${child.value}</Text>`
						}
					}
					const raw = `<View style={{ marginTop: 8, borderRadius: 4, backgroundColor: "#D6E0FC", paddingHorizontal: 18, paddingVertical: 12, fontSize: 10 }}><View style={{ display: "flex", flexDirection: "row", alignItems: "center", fontFamily: "Helvetica-Bold", marginBottom: 2 }}><InformationCircleIcon className="h-4 w-4" /><Text style={{ paddingLeft: 4 }}>Info</Text></View>${value}</View>`

					return convertComponent(raw, node)
				}

				case 'Warning': {
					let value = ''
					if (node.children.length === 1) {
						const child = node.children[0] as any
						if (child.type === 'text') {
							value = `<Text>${child.value}</Text>`
						}
					}
					const raw = `<View style={{ marginTop: 8, borderRadius: 4, backgroundColor: "#FEE4D5", color: "#7c2d12", paddingHorizontal: 18, paddingVertical: 12, fontSize: 10 }}><View style={{ display: "flex", flexDirection: "row", alignItems: "center", fontFamily: "Helvetica-Bold", marginBottom: 2 }}><ExclamationTriangleIcon className="h-4 w-4" /><Text style={{ paddingLeft: 4 }}>Warning</Text></View>${value}</View>`

					return convertComponent(raw, node)
				}

				case 'Path':
					return node

				case 'strong': {
					return convertStrong(node)
				}

				case 'table': {
					return convertTable(node)
				}

				case 'thead': {
					return convertTableHead(node)
				}

				case 'th': {
					return convertTH(node)
				}

				case 'tbody': {
					return convertTableBody(node)
				}

				case 'tr': {
					return convertTR(node, i)
				}

				case 'td': {
					return convertTD(node)
				}

				default:
					console.log('Unsupported flow element: ', node.name)
					return null
			}

		case 'element':
			if (!isElement(node)) break
			switch (node.tagName) {
				case 'h1': {
					const raw = `<Text wrap style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', marginTop: 24 }} />`

					return convertComponent(raw, node)
				}

				case 'h2': {
					const raw = `<Text wrap style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 20 }} />`

					return convertComponent(raw, node)
				}

				case 'h3': {
					const raw = `<Text wrap style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', marginTop: 18 }} />`

					return convertComponent(raw, node)
				}

				case 'h4': {
					const raw = `<Text wrap style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 16 }} />`

					return convertComponent(raw, node)
				}

				case 'h5': {
					const raw = `<Text wrap style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 14 }} />`

					return convertComponent(raw, node)
				}

				case 'h6': {
					const raw = `<Text wrap style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 12, textTransform: 'uppercase' }} />`

					return convertComponent(raw, node)
				}

				case 'p': {
					const raw = `<Text wrap style={{ fontSize: 10, marginTop: 8, lineHeight: 1.6 }} />`

					if (
						node.children.length === 1 &&
						node.children[0].type === 'element' &&
						node.children[0].tagName === 'img'
					) {
						return convertImage(node.children[0])
					}

					return convertComponent(raw, node)
				}

				case 'blockquote': {
					const raw = `<Text wrap style={{ fontSize: 12, paddingVertical: 4, paddingHorizontal: 8, borderLeft: "2px solid #2B67F0", marginTop: 8, lineHeight: 1.6 }} />`

					return convertComponent(raw, node)
				}

				case 'a': {
					return convertAnchor(node)
				}

				case 'strong': {
					return convertStrong(node)
				}

				case 'em': {
					const raw = `<Text wrap style={{ fontSize: 10, fontFamily: 'Helvetica-Oblique' }} />`

					return convertComponent(raw, node)
				}

				case 'ol':
				case 'ul': {
					const raw = `<View wrap style={{ display: "flex", flexDirection: 'column' }} />`

					return convertComponent(raw, node)
				}

				case 'li': {
					const raw = `<Text wrap style={{ display: "flex", flexDirection: 'row', marginTop: 4, fontSize: 10, lineHeight: 1.6 }}><Text wrap style={{ marginHorizontal: 8 }}>•  </Text></Text>`

					return convertComponent(raw, node)
				}

				case 'pre': {
					const raw = `<Text wrap style={{ display: 'flex', flexDirection: 'column', padding: 8, backgroundColor: '#e2e8f0', marginTop: 4, fontSize: 10, fontFamily: "Courier", borderRadius: 4 }} />`

					return convertComponent(raw, node)
				}

				case 'code': {
					const raw = `<Text wrap style={{ paddingLeft: 8, fontFamily: "Courier-Bold", backgroundColor: '#e2e8f0' }}/>`

					const child = node.children[0] as Text
					const value = child.value.replaceAll(' ', '\t')

					node.children = [{ ...child, value }]

					return convertComponent(raw, node)
				}

				case 'table': {
					return convertTable(node)
				}

				case 'thead': {
					return convertTableHead(node)
				}

				case 'th': {
					return convertTH(node)
				}

				case 'tbody': {
					return convertTableBody(node)
				}

				case 'tr': {
					return convertTR(node, i)
				}

				case 'td': {
					return convertTD(node)
				}

				case 'img': {
					return convertImage(node)
				}

				default:
					console.log('Unsupported element: ', node.tagName)
					return null
			}

		case 'mdxjsEsm':
			return null

		default:
			console.log(`Unsupported node: ${node.type}`, node)
			return null
	}
}

function traverse(node: any, i: number, level = 0) {
	node = transformNode(node, i, level)

	// Recursively traverse child nodes
	if (node !== null && 'children' in node && Array.isArray(node.children)) {
		node.children = (node.children as any[])
			.filter(node => node.type !== 'text' || node.value !== '\n')
			.reduce((acc: any[], child: any, i) => {
				const updatedChild = traverse(child, i, level + 1)
				if (updatedChild !== null) acc.push(updatedChild)
				return acc
			}, [])
	}

	return node
}

function rehypeToPdf() {
	return async function transform(tree: Root) {
		tree = traverse(tree, 0)
	}
}

function convertComponent(
	raw: string,
	node?: Element | MdxJsxFlowElement | MdxJsxTextElement,
):
	| (Omit<MdxJsxFlowElement, 'children'> & {
			children: any[]
	  })
	| (Omit<MdxJsxTextElement, 'children'> & {
			children: any[]
	  })
	| null {
	const { children } = fromMarkdown(raw, {
		extensions: [mdxJsx({ acorn, addResult: true })],
		mdastExtensions: [mdxJsxFromMarkdown()],
	})

	let component = children[0] as any

	if (!isMdxJsxFlowElement(component) && !isMdxJsxTextElement(component)) {
		component = component.children[0]
	}

	return isMdxJsxFlowElement(component) || isMdxJsxTextElement(component)
		? {
				...component,
				children: [...(component?.children ?? []), ...(node?.children ?? [])],
		  }
		: null
}

function isMdxJsxTextElement(n: unknown): n is MdxJsxTextElement {
	return (
		typeof n === 'object' &&
		!Array.isArray(n) &&
		n !== null &&
		'type' in n &&
		n.type === 'mdxJsxTextElement'
	)
}

function isMdxJsxFlowElement(n: unknown): n is MdxJsxFlowElement {
	return (
		typeof n === 'object' &&
		!Array.isArray(n) &&
		n !== null &&
		'type' in n &&
		n.type === 'mdxJsxFlowElement'
	)
}

function convertImage(node: Element) {
	let src = node.properties?.src

	const raw = `<Image src="${src}" style={{ marginTop: 8 }} />`

	return convertComponent(raw)
}

function convertTable(node: Element | MdxJsxFlowElement) {
	const raw = `<View style={{ display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch', marginTop: 8, fontSize: 10, border: '1px solid #94a3b8', borderRadius: 4 }}/>`

	return convertComponent(raw, node)
}

function convertTableHead(node: Element | MdxJsxFlowElement) {
	const raw = `<View style={{ display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch', backgroundColor: '#e2e8f0', borderBottom: '1px solid #94a3b8' }} />`

	return convertComponent(raw, node)
}

function convertTH(node: Element | MdxJsxFlowElement) {
	const raw = `<Text style={{
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 3,
		paddingHorizontal: 5,
		flexGrow: 1,
		flexShrink: 1,
	}} />`

	return convertComponent(raw, node)
}

function convertTableBody(node: Element | MdxJsxFlowElement) {
	const raw = `<View style={{ display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch' }} />`

	return convertComponent(raw, node)
}

function convertTR(node: Element | MdxJsxFlowElement, i: number) {
	const raw = `<View style={{
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignItems: 'stretch',
		flexGrow: 1,
		flexShrink: 1,
		backgroundColor: "${i % 2 !== 0 ? '#f1f5f9' : 'transparent'}"
	}} />`
	return convertComponent(raw, node)
}

function convertTD(node: Element | MdxJsxFlowElement) {
	const raw = `<Text style={{
		display: 'flex',
		flexDirection: 'column',
		paddingVertical: 3,
		paddingHorizontal: 5,
		flexGrow: 1,
		flexShrink: 1,
	}} />`
	return convertComponent(raw, node)
}

function convertStrong(node: Element | MdxJsxFlowElement | MdxJsxTextElement) {
	const raw = `<Text wrap style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }} />`

	return convertComponent(raw, node)
}

function convertAnchor(node: Element | MdxJsxFlowElement | MdxJsxTextElement) {
	const href =
		node.type === 'element' ? node.properties?.href : getFlowHref(node)

	const raw = `<Link wrap href="${
		href ?? '#'
	}" style={{ fontSize: 10, textDecoration: 'underline', color: '#2B67F0' }} />`

	return convertComponent(raw, node)
}

function getFlowHref(node: MdxJsxFlowElement | MdxJsxTextElement) {
	return node.attributes?.find(
		attr => attr.type === 'mdxJsxAttribute' && attr.name === 'href',
	)?.value
}
