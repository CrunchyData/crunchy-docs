import fs from 'fs/promises'
import LRUCache from 'lru-cache'
import lunr from 'lunr'
import { remark } from 'remark'
import strip from 'strip-markdown'
import { parseAttrs } from './attrs.server.ts'
import { contentPath, privateContentPath, walk } from './fs.server.ts'
import { makeSlug } from './utils.ts'

export type SearchDoc = {
	title: string
	body: string
	slug: string
}

type SearchCache = {
	index: lunr.Index
	map: Record<string, SearchDoc>
}

declare global {
	var searchCache: LRUCache<string, SearchCache | undefined>
}

let NO_CACHE = process.env.NO_CACHE ?? false

/**
 * While we're using HTTP caching, we have this memory cache too so that
 * document requests and data request to the same document can do less work for
 * new versions. This makes our origin server very fast, but adding HTTP caching
 * let's have simpler and faster deployments with just one origin server, but
 * still distribute the documents across the CDN.
 */
global.searchCache ??= new LRUCache<string, SearchCache | undefined>({
	// let docCache = new LRUCache<string, Doc | undefined>({
	max: 300,
	ttl: NO_CACHE ? 1 : 1000 * 60 * 20, // 20 minutes
	allowStale: !NO_CACHE,
	noDeleteOnFetchRejection: true,
	fetchMethod: async key => {
		console.log('Fetching fresh doc', key)
		const [access, product, ref] = key.split(':')
		return getFreshSearch({ product, ref, isPrivate: access === 'private' })
	},
})

export async function getSearch({
	product,
	ref,
	isPrivate = false,
}: {
	product: string
	ref: string
	isPrivate?: boolean
}): Promise<SearchCache | undefined> {
	return NO_CACHE
		? getFreshSearch({ product, ref, isPrivate })
		: searchCache.fetch(`${isPrivate ? 'private' : 'public'}:${product}:${ref}`)
}

async function getFreshSearch({
	product,
	ref,
	isPrivate = false,
}: {
	product: string
	ref: string
	isPrivate?: boolean
}): Promise<SearchCache> {
	const map: Map<string, SearchDoc> = new Map()
	const builder = new lunr.Builder()

	builder.ref('slug')
	builder.field('title', { boost: 15 })
	builder.field('body', {
		boost: 5,
	})

	await walk(contentPath(product, ref), async filepath => {
		if (!filepath.endsWith('.mdx') || filepath.includes('crd.mdx')) return
		const mdx = await fs.readFile(filepath, 'utf-8')
		const { title, draft, content } = parseAttrs(mdx)

		const body = cleanExtraCruft(
			(await remark().use(strip).process(content)).value.toString(),
		)

		if (draft || !body.length) return

		const doc: SearchDoc = {
			title,
			body,
			slug: makeSlug({ filepath, product, ref }),
		}

		map.set(doc.slug, doc)
	})

	if (isPrivate) {
		await walk(privateContentPath(product, ref), async filepath => {
			if (!filepath.endsWith('.mdx')) return
			const mdx = await fs.readFile(filepath, 'utf-8')
			const { title, draft, content } = parseAttrs(mdx)

			const body = cleanExtraCruft(
				(await remark().use(strip).process(content)).value.toString(),
			)

			if (draft || !body.length) return

			const doc: SearchDoc = {
				title,
				body,
				slug: makeSlug({ filepath, product, ref, isPrivate }),
			}

			map.set(doc.slug, doc)
		})
	}

	for (let doc of map.values()) {
		builder.add(doc)
	}

	return { index: builder.build(), map: Object.fromEntries(map) }
}

function cleanExtraCruft(s: string): string {
	return s
		.replaceAll('\n', ' ')
		.replaceAll('\\', '')
		.replace(/\{\/\*.*\*\/\}/g, '')
		.replaceAll('  ', ' ')
		.trim()
}
