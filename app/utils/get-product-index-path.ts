export default function getProductIndexPath(path: string) {
	if (path.includes('documentation/private')) {
		const [root, access, product, ref] = path.split('/').filter(Boolean)
		return `/${root}/${access}/${product}/${ref}`
	}
	const [root, product, ref] = path.split('/').filter(Boolean)
	return `/${root}/${product}/${ref}`
}
