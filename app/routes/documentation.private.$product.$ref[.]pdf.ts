import type { LoaderArgs } from '@remix-run/node'
import fs from 'fs/promises'
import path from 'path'
import { pdf } from 'remix-utils/responses'
import invariant from 'tiny-invariant'
import { privateContentPath } from '~/lib/docs/fs.server.ts'

export { headers } from '~/components/layout/Content.tsx'

export async function loader({ params }: LoaderArgs) {
	let { product, ref, '*': splat } = params
	invariant(product, 'expected `params.product`')
	invariant(ref, 'expected `params.ref`')

	const pdfResponse = await fs.readFile(
		path.join(privateContentPath(product, ref), 'documentation.pdf'),
	)
	return pdf(pdfResponse)

	// const versions = await getProductVersions({ product, isPrivate: true })

	// let betterUrl = validateParams(versions, ['latest'], {
	// 	product,
	// 	ref,
	// 	'*': splat,
	// })

	// if (betterUrl) throw redirect('/' + betterUrl)

	// const body = await renderPDF({ product, ref, isPrivate: true })

	// const headers = new Headers({
	// 	'Content-Type': 'application/pdf',
	// 	'Cache-Control': CACHE_CONTROL.doc,
	// })

	// return new Response(body, { status: 200, headers })
}
