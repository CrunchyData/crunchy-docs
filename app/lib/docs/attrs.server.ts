import parseYamlHeader from 'gray-matter'
import { z } from 'zod'

export const docAttributes = z.object({
	title: z.string(),
	weight: z.number().optional(),
	draft: z.boolean().optional().default(false),
	hideTableOfContents: z.boolean().optional().default(false),
	showChildren: z.boolean().optional().default(false),
	show: z.enum(['public', 'private', 'all']).optional().default('all'),
	meta: z
		.object({
			title: z.string().optional(),
			description: z.string().optional(),
		})
		.optional(),
})

export type DocAttributes = z.infer<typeof docAttributes>

/**
 * Removes the extension from mdx file names.
 */
export function parseAttrs(mdx: string): { content: string } & DocAttributes {
	const { data, content } = parseYamlHeader(mdx)
	const {
		title,
		weight,
		draft = false,
		hideTableOfContents = false,
		show = 'all',
		showChildren = false,
	} = docAttributes.parse(data)

	return {
		title,
		weight,
		draft,
		content,
		hideTableOfContents,
		showChildren,
		show,
	}
}
