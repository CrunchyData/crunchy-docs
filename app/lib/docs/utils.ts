import escapeStringRegexp from 'escape-string-regexp'
import { contentPath, privateContentPath } from './fs.server.ts'

/**
 * Removes the extension from mdx file names.
 */
export function makeSlug({
	filepath,
	product,
	version,
	isPrivate,
}: {
	filepath: string
	product: string
	version: string
	isPrivate?: boolean
}): string {
	return filepath
		.replace(
			isPrivate
				? privateContentPath(product, version)
				: contentPath(product, version),
			'',
		)
		.replace(/\.mdx$/, '')
		.replace(/index$/, '')
		.replace(/(^\/|\/$)/g, '')
}

export function replaceConfigVars(
	mdx: string,
	config: Record<string, string>,
): string {
	const regexp = RegExp(
		'(' +
			Object.keys(config)
				.map(key => escapeStringRegexp(`{${key}}`))
				.join('|') +
			')',
		'g',
	)

	const replacer = (_match: string, name: string) =>
		config[name.replaceAll(/(^{)|(}$)/g, '')]

	return mdx.replace(regexp, replacer)
}

export function getPublicProductSlug(product: string): string {
	return (
		{
			'postgres-operator-private': 'postgres-operator',
		}?.[product] ?? product
	)
}

export type Access = 'public' | 'private' | 'both'

const productAccessMap: Record<string, Access> = {
	'postgres-operator-private': 'both',
	'crunchy-ha-postgresql': 'private',
}

export function getProductAccess(product: string): Access {
	return productAccessMap?.[product] ?? 'both'
}
