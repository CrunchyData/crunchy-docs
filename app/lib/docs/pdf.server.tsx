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
import LRUCache from 'lru-cache'
import { getMDXComponent } from 'mdx-bundler/client/index.js'
import stream from 'node:stream'
import { useMemo } from 'react'
import { removeEndSlashes } from '~/utils/removeEndSlashes.ts'
import { getConfig, getDocFromDir } from './doc.server.ts'
import { NavItem, getMenu } from './menu.server.ts'
import { parseMdxToPdf } from './pdf/index.server.ts'
import { replaceConfigVars } from './utils.ts'

export async function renderPDF({
	product,
	ref,
	isPrivate,
}: {
	product: string
	ref: string
	isPrivate?: boolean
}) {
	const docs = await getPDFData({ product, ref, isPrivate })
	if (!docs)
		throw new Error(
			`No docs found for: ${isPrivate ? 'private/' : ''}${product}/${ref}`,
		)

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

let NO_CACHE = process.env.NO_CACHE ?? false

/**
 * While we're using HTTP caching, we have this memory cache too so that
 * document requests and data request to the same document can do less work for
 * new versions. This makes our origin server very fast, but adding HTTP caching
 * let's have simpler and faster deployments with just one origin server, but
 * still distribute the documents across the CDN.
 */
global.pdfCache ??= new LRUCache<string, string[] | undefined>({
	max: 300,
	ttl: NO_CACHE ? 1 : 1000 * 60 * 5, // 5 minutes
	allowStale: !NO_CACHE,
	noDeleteOnFetchRejection: true,
	fetchMethod: async key => {
		console.log('Fetching fresh pdf', key)
		const [access, product, ref] = key.split(':')
		return getFreshPDFData({ product, ref, isPrivate: access === 'private' })
	},
})

export async function getPDFData({
	product,
	ref,
	isPrivate = false,
}: {
	product: string
	ref: string
	isPrivate?: boolean
}): Promise<string[] | undefined> {
	if (NO_CACHE) {
		return getFreshPDFData({ product, ref, isPrivate })
	}

	if (isPrivate) {
		const key = `private:${product}:${ref}`
		if (pdfCache.has(key)) {
			const doc = await pdfCache.fetch(key)
			return doc
		}
	}

	const key = `public:${product}:${ref}`
	const docs = await pdfCache.fetch(key)
	return docs
}

async function getFreshPDFData({
	product,
	ref,
	isPrivate = false,
}: {
	product: string
	ref: string
	isPrivate?: boolean
}): Promise<string[]> {
	const [menu, config] = await Promise.all([
		getMenu({ product, ref, isPrivate }),
		getConfig({ product, ref, isPrivate }),
	])

	const docs: string[] = []

	for (let item of menu) {
		const pdf = await pdfFromItem({ item, product, ref, isPrivate })
		if (pdf) docs.push(pdf)

		if (!item.children?.length) continue

		for (let child of item.children) {
			const pdf = await pdfFromItem({ item: child, product, ref, isPrivate })
			if (pdf) docs.push(pdf)

			if (!child.children?.length) continue

			for (let grandchild of child.children) {
				const pdf = await pdfFromItem({
					item: grandchild,
					product,
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
	isPrivate = false,
}: {
	item: NavItem
	product: string
	ref: string
	isPrivate?: boolean
}): Promise<string | null> {
	const slug = slugToDocKey(item.slug, product, ref)
	// if (slug !== '/quickstart') return null

	const doc = await getDocFromDir({ product, ref, slug, isPrivate })

	if (!doc || doc.includes('draft: true')) return null

	return doc
}

function slugToDocKey(slug: string, product: string, ref: string) {
	return removeEndSlashes(slug).replace(`${product}/${ref}`, '')
}
