import { bundleMDX } from 'mdx-bundler'
import path from 'path'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkPrism from 'remark-prism'
import { docAttributes } from '../attrs.server.ts'
import { rehypeCopyCode } from './code.server.ts'
import {
	headingsToTableOfContents,
	rehypeHeadings,
	type Heading,
} from './headings.server.ts'
import { rehypeImages } from './img.server.ts'
import rehypeWrapTable from './tables.server.ts'

export async function parseMdx(mdx: string) {
	// Pull all h2 & h3 headings
	const headings: Heading[] = []
	const { frontmatter, code } = await bundleMDX({
		source: mdx,
		cwd: path.join(process.cwd(), 'documentation'),
		mdxOptions(options) {
			options.remarkPlugins = [
				...(options.remarkPlugins ?? []),
				remarkGfm,
				remarkPrism,
			]

			options.rehypePlugins = [
				...(options.rehypePlugins ?? []),
				rehypeCopyCode,
				rehypeSlug,
				rehypeImages,
				[rehypeAutolinkHeadings, { behavior: 'wrap' }],
				[rehypeHeadings, { exportRef: headings }],
				rehypeWrapTable,
			]

			return options
		},
	})

	return {
		attributes: docAttributes.parse(frontmatter),
		html: code,
		tableOfContents: headingsToTableOfContents(headings),
	}
}
