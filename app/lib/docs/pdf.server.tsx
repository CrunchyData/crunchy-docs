import {
	Document,
	Image,
	Link,
	Page,
	Path,
	Svg,
	Text,
	View,
	renderToStream,
} from '@react-pdf/renderer'
import { createReadableStreamFromReadable } from '@remix-run/node'
import type LRUCache from 'lru-cache'
import { getMDXComponent } from 'mdx-bundler/client/index.js'
import stream from 'node:stream'
import { useMemo } from 'react'
import { NO_CACHE, SALT, createCache } from '~/utils/cache.server.ts'
import { removeEndSlashes } from '~/utils/removeEndSlashes.ts'
import { getConfig, getDocFromDir } from './doc.server.ts'
import { type NavItem, getMenu } from './menu.server.ts'
import { parseMdxToPdf } from './pdf/index.server.ts'
import { type Access, replaceConfigVars } from './utils.ts'

export async function renderPDF({
	product,
	ref,
	version,
	access = 'public',
}: {
	product: string
	ref: string
	version: string

	access?: Access
}) {
	const docs = await getPDFData({ product, ref, version, access })
	if (!docs) throw new Error(`No docs found for: ${access}/${product}/${ref}`)

	return renderToStream(<PDF docs={docs} />)
		.then(stream.Readable.from)
		.then(createReadableStreamFromReadable)
}

function PDF({ docs }: { docs: string[] }) {
	return (
		<Document style={{ fontFamily: 'Helvetica' }}>
			<Page size="LETTER" wrap={true} style={{ padding: '40px' }}>
				{docs.map((doc, i) => (
					<Doc doc={doc} key={`doc-${i}`} />
				))}
			</Page>
		</Document>
	)
}

function Doc({ doc }: { doc: string }) {
	const Component = useMemo(() => getMDXComponent(doc), [doc])
	return (
		<Component
			components={{
				View,
				Text,
				Image,
				Link,
				Svg,
				Path,
			}}
		></Component>
	)
}

declare global {
	var pdfCache: LRUCache<string, string[] | undefined>
}

/**
 * While we're using HTTP caching, we have this memory cache too so that
 * document requests and data request to the same document can do less work for
 * new versions. This makes our origin server very fast, but adding HTTP caching
 * let's have simpler and faster deployments with just one origin server, but
 * still distribute the documents across the CDN.
 */
global.pdfCache ??= createCache<string[] | undefined>(
	async (key, _stale, { context }) => {
		console.log('Fetching fresh pdf', key)
		const [access, product, version] = key.split(':')
		return getFreshPDFData({
			product,
			ref: context.ref,
			version,
			access: access as Access,
		})
	},
)

export async function getPDFData({
	product,
	ref,
	version,
	access = 'public',
}: {
	product: string
	ref: string
	version: string
	access?: Access
}): Promise<string[] | undefined> {
	if (NO_CACHE) {
		return getFreshPDFData({ product, ref, version, access })
	}

	if (access !== 'public') {
		const key = `${access}:${product}:${ref}:${SALT}`
		if (pdfCache.has(key)) {
			const doc = await pdfCache.fetch(key, { fetchContext: { ref } })
			return doc
		}
	}

	const key = `${access}:${product}:${ref}:${SALT}`
	const docs = await pdfCache.fetch(key, { fetchContext: { ref } })
	return docs
}

async function getFreshPDFData({
	product,
	ref,
	version,
	access = 'public',
}: {
	product: string
	ref: string
	version: string
	access?: Access
}): Promise<string[]> {
	const isPrivate = access !== 'public'
	const [menu, config] = await Promise.all([
		getMenu({ product, ref, version, access }),
		getConfig({ product, version, isPrivate }),
	])

	const docs: string[] = []

	for (let item of menu) {
		const pdf = await pdfFromItem({ item, product, ref, version, isPrivate })
		if (pdf) docs.push(pdf)

		if (!item.children?.length) continue

		for (let child of item.children) {
			const pdf = await pdfFromItem({
				item: child,
				product,
				version,
				ref,
				isPrivate,
			})
			if (pdf) docs.push(pdf)

			if (!child.children?.length) continue

			for (let grandchild of child.children) {
				const pdf = await pdfFromItem({
					item: grandchild,
					product,
					version,
					ref,
					isPrivate,
				})

				if (pdf) docs.push(pdf)
			}
		}
	}

	return Promise.all(
		docs.map(doc =>
			parseMdxToPdf(replaceConfigVars(doc, config)).then(({ pdf }) => pdf),
		),
	)
}

async function pdfFromItem({
	item,
	product,
	ref,
	version,
	isPrivate = false,
}: {
	item: NavItem
	product: string
	ref: string
	version: string
	isPrivate?: boolean
}): Promise<string | null> {
	const slug = slugToDocKey(item.slug, product, ref)
	// if (slug !== '/quickstart') return null

	const doc = await getDocFromDir({ product, version, slug, isPrivate })

	if (!doc || doc.includes('draft: true')) return null

	return doc
}

function slugToDocKey(slug: string, product: string, ref: string) {
	return removeEndSlashes(slug).replace(`${product}/${ref}`, '')
}
