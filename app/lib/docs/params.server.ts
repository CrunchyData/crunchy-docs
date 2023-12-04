export function validateParams(
	tags: string[],
	branches: string[],
	params: { product: string; ref?: string; ['*']?: string },
): string | null {
	let { product, ref } = params

	if (
		!ref ||
		ref === tags[0] ||
		(ref && !tags.includes(ref) && !branches.includes(ref))
	) {
		return `${product}/latest`
	}

	return null
}
