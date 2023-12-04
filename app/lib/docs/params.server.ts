export function validateParams(
	tags: string[],
	branches: string[],
	params: { product: string; ref?: string; ['*']?: string },
): string | null {
	let { product, ref, '*': slug } = params

	if (!ref || (ref && !tags.includes(ref) && !branches.includes(ref))) {
		return `${product}/latest${slug ? `/${slug}` : ''}`
	}

	return null
}
