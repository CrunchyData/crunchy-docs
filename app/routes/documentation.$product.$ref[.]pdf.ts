import type { LoaderArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { validateParams } from '~/lib/docs/params.server.ts'
import { renderPDF } from '~/lib/docs/pdf.server.tsx'
import { getProductVersions } from '~/lib/docs/versions.server.ts'
import { CACHE_CONTROL } from '~/utils/http.server.ts'

export { headers } from '~/components/layout/Content.tsx'

export async function loader({ params }: LoaderArgs) {
	let { product, ref, '*': splat } = params
	invariant(product, 'expected `params.product`')
	invariant(ref, 'expected `params.ref`')

	const versions = await getProductVersions({ product })

	let betterUrl = validateParams(versions, ['latest'], {
		product,
		ref,
		'*': splat,
	})

	if (betterUrl) throw redirect('/' + betterUrl)

	const body = await renderPDF({ product, ref })

	const headers = new Headers({
		'Content-Type': 'application/pdf',
		'Cache-Control': CACHE_CONTROL.doc,
	})

	return new Response(body, { status: 200, headers })
}
