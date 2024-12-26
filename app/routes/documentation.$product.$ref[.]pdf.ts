import { type LoaderFunctionArgs } from '@remix-run/node'
import fs from 'fs/promises'
import path from 'path'
import invariant from 'tiny-invariant'
import { contentPath } from '~/lib/docs/fs.server.ts'
import { getProductVersions, getVersion } from '~/lib/docs/versions.server.ts'
import { pdf } from '~/utils/responses.server.ts'

export { headers } from '~/components/layout/Content.tsx'

export async function loader({ params }: LoaderFunctionArgs) {
	let { product, ref } = params
	invariant(product, 'expected `params.product`')
	invariant(ref, 'expected `params.ref`')

	const versions = await getProductVersions({ product })
	const { version } = getVersion(versions, ref)

	const pdfResponse = await fs.readFile(
		path.join(contentPath(product, version), 'documentation.pdf'),
	)
	return pdf(pdfResponse)

}
