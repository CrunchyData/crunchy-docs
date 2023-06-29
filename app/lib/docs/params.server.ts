import * as semver from 'semver'

export function validateParams(
	tags: string[],
	branches: string[],
	params: { product: string; ref?: string; ['*']?: string },
): string | null {
	let { product, ref, '*': splat } = params
	let existingRef = ref && (tags.includes(ref) || branches.includes(ref))

	if (!ref) {
		return `${product}/${semver.maxSatisfying(tags, '*', {
			includePrerelease: false,
		})}`
	}

	if (!existingRef) {
		let expandedRef = semver.maxSatisfying(tags, ref, {
			includePrerelease: false,
		})
		let latest = semver.maxSatisfying(tags, '*')
		let path = [product]

		if (expandedRef) path.push(expandedRef)
		else if (latest) path.push(latest, ref)

		if (splat) path.push(splat)
		return path.join('/')
	}

	return null
}
