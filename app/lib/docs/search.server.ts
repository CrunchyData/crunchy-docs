import fs from 'fs/promises'
import LRUCache from 'lru-cache'
import lunr from 'lunr'
import { remark } from 'remark'
import strip from 'strip-markdown'
import { NO_CACHE, SALT, createCache } from '~/utils/cache.server.ts'
import { parseAttrs } from './attrs.server.ts'
import { contentPath, privateContentPath, walk } from './fs.server.ts'
import { Access, makeSlug } from './utils.ts'

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

/**
 * While we're using HTTP caching, we have this memory cache too so that
 * document requests and data request to the same document can do less work for
 * new versions. This makes our origin server very fast, but adding HTTP caching
 * let's have simpler and faster deployments with just one origin server, but
 * still distribute the documents across the CDN.
 */
global.searchCache ??= createCache<SearchCache | undefined>(
	async (key, _stale, { context }) => {
		console.log('Fetching fresh doc', key)
		const [access, product] = key.split(':')
		return getFreshSearch({
			product,
			version: context.version,
			access: access as Access,
		})
	},
)

export async function getSearch({
	product,
	version,
	ref,
	access = 'public',
}: {
	product: string
	version: string
	ref: string
	access?: Access
}): Promise<SearchCache | undefined> {
	return NO_CACHE
		? getFreshSearch({ product, access, version })
		: searchCache.fetch(`${access}:${product}:${ref}:${SALT}`, {
				fetchContext: { version },
		  })
}

async function getFreshSearch({
	product,
	version,
	access = 'public',
}: {
	product: string
	version: string
	access?: Access
}): Promise<SearchCache> {
	const map: Map<string, SearchDoc> = new Map()
	const builder = new lunr.Builder()

	builder.ref('slug')
	builder.field('title', { boost: 15 })
	builder.field('body', {
		boost: 5,
	})

	if (access !== 'private') {
		await walk(contentPath(product, version), async filepath => {
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
				slug: makeSlug({ filepath, product, version }),
			}

			map.set(doc.slug, doc)
		})
	}

	if (access !== 'public') {
		await walk(privateContentPath(product, version), async filepath => {
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
				slug: makeSlug({ filepath, product, version, isPrivate: true }),
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
