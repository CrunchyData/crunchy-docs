import type { LoaderFunctionArgs } from '@remix-run/node'
import fs from 'fs/promises'
import path from 'path'
import invariant from 'tiny-invariant'
import { contentPath } from '~/lib/docs/fs.server.ts'
import { pdf } from '~/utils/responses.server.ts'

export { headers } from '~/components/layout/Content.tsx'

export async function loader({ params }: LoaderFunctionArgs) {
	let { product, ref, '*': splat } = params
	invariant(product, 'expected `params.product`')
	invariant(ref, 'expected `params.ref`')
	const pdfResponse = await fs.readFile(
		path.join(contentPath(product, ref), 'documentation.pdf'),
	)
	return pdf(pdfResponse)

	// const versions = await getProductVersions({ product })

	// let betterUrl = validateParams(versions, ['latest'], {
	// 	product,
	// 	ref,
	// 	'*': splat,
	// })

	// if (betterUrl) throw redirect('/' + betterUrl)

	// const body = await renderPDF({ product, ref })

	// const headers = new Headers({
	// 	'Content-Type': 'application/pdf',
	// 	'Cache-Control': CACHE_CONTROL.doc,
	// })

	// return new Response(body, { status: 200, headers })
}
