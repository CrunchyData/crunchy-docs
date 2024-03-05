import { json, type LoaderFunctionArgs } from '@remix-run/node'
import lunr from 'lunr'
import invariant from 'tiny-invariant'
import { getSearch, type SearchDoc } from '~/lib/docs/search.server.ts'
import { getProductAccess } from '~/lib/docs/utils.ts'
import { getProductVersions } from '~/lib/docs/versions.server.ts'

function getBodyContext(body: string, term: string) {
	const numContextWords = 2
	const searchTermRegex = new RegExp(
		`(?:\\s?(?:[\\w]+)\\s?){0,${numContextWords}}${term}(?:\\s?(?:[\\w]+)\\s?){0,${numContextWords}}`,
		'i',
	)
	const excerptRegex = /^(\w+(?:\s+\w+){0,5})/

	const searchMatch = body.match(searchTermRegex)
	if (searchMatch !== null) {
		return searchMatch[0]
	}

	const excerptMatch = body.match(excerptRegex)
	return excerptMatch !== null ? excerptMatch[0] : null
}

export type SearchDocExcerpt = Omit<SearchDoc, 'body'> & { body: string | null }

export async function loader({ request, params }: LoaderFunctionArgs) {
	let { product, ref } = params
	invariant(product, 'expected `params.product`')
	invariant(ref, 'expected `params.ref`')

	const productAccess = getProductAccess(product)

	const url = new URL(request.url)
	const term = url.searchParams.get('term')
	if (!term) return json({ results: [] })

	const versions = await getProductVersions({ product, isPrivate: true })
	const version = ref === 'latest' ? versions[0] : ref

	const search = await getSearch({
		product,
		version,
		ref,
		access: productAccess,
	})
	if (!search) return json({ results: [] })

	const searchTerm = lunr.tokenizer(term)

	const results: SearchDocExcerpt[] = search.index
		.query(query => {
			query.term(searchTerm, {
				editDistance: 1,
				wildcard: lunr.Query.wildcard.TRAILING,
			})
		})
		.map(result => {
			const doc = search.map?.[result.ref]

			return { ...doc, body: getBodyContext(doc.body, term) }
		})
		.filter(Boolean)

	return json({ results })
}
