import { type Version } from './versions.server.ts'

export function validateParams(
	tags: Version[],
	branches: string[],
	params: { product: string; ref?: string; ['*']?: string },
): string | null {
	let { product, ref, '*': slug } = params

	if (
		!ref ||
		(ref &&
			!tags.some(({ version }) => ref === version) &&
			!branches.includes(ref))
	) {
		return `${product}/latest${slug ? `/${slug}` : ''}`
	}

	return null
}
