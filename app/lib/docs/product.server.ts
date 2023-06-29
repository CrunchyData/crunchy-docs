import path from 'path'
import { z } from 'zod'
import { getJsonFile, privateRootPath, rootPath } from './fs.server.ts'

const productDataValidator = z.object({
	name: z.string(),
	links: z.array(
		z.object({
			label: z.string(),
			to: z.string(),
		}),
	),
})

export async function getProductData({
	product,
	isPrivate = false,
}: {
	product: string
	isPrivate?: boolean
}): Promise<z.infer<typeof productDataValidator>> {
	const base = isPrivate ? privateRootPath(product) : rootPath(product)

	return getJsonFile(
		path.join(base, 'product.json'),
		productDataValidator.parse,
	)
}
