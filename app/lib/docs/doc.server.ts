import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import LRUCache from 'lru-cache'
import path from 'path'
import { z } from 'zod'
import { removeLastSlash } from '~/utils/removeEndSlashes.ts'
import { type DocAttributes } from './attrs.server.ts'
import { contentPath, getJsonFile, privateContentPath } from './fs.server.ts'
import { type TOCParent } from './mdx/headings.server.ts'
import { parseMdx } from './mdx/index.server.ts'
import { replaceConfigVars } from './utils.ts'

export type Doc = {
	html: string
	attributes: DocAttributes
	tableOfContents: TOCParent[]
}

declare global {
	var docCache: LRUCache<string, Doc | undefined>
}

let NO_CACHE = process.env.NO_CACHE ?? false

/**
 * While we're using HTTP caching, we have this memory cache too so that
 * document requests and data request to the same document can do less work for
 * new versions. This makes our origin server very fast, but adding HTTP caching
 * let's have simpler and faster deployments with just one origin server, but
 * still distribute the documents across the CDN.
 */
global.docCache ??= new LRUCache<string, Doc | undefined>({
	// let docCache = new LRUCache<string, Doc | undefined>({
	max: 300,
	ttl: NO_CACHE ? 1 : 1000 * 60 * 5, // 5 minutes
	allowStale: !NO_CACHE,
	noDeleteOnFetchRejection: true,
	fetchMethod: async key => {
		console.log('Fetching fresh doc', key)
		const [access, product, ref, slug] = key.split(':')
		return getFreshDoc({ product, ref, slug, isPrivate: access === 'private' })
	},
})

export async function getDoc({
	product,
	ref,
	slug,
	isPrivate = false,
}: {
	product: string
	ref: string
	slug: string
	isPrivate?: boolean
}): Promise<Doc | undefined> {
	if (NO_CACHE) {
		return getFreshDoc({ product, ref, slug, isPrivate })
	}

	if (isPrivate) {
		const key = `private:${product}:${ref}:${slug}`
		const doc = await docCache.fetch(key)
		if (doc) return doc
	}

	const key = `public:${product}:${ref}:${slug}`
	const doc = await docCache.fetch(key)
	return doc
}

async function getFreshDoc({
	product,
	ref,
	slug,
	isPrivate = false,
}: {
	product: string
	ref: string
	slug: string
	isPrivate?: boolean
}) {
	const [mdx, config] = await Promise.all([
		getDocFromDir({ product, ref, slug, isPrivate }),
		getConfig({ product, ref, isPrivate }),
	])
	if (!mdx) return undefined
	return parseMdx(replaceConfigVars(mdx, config))
}

export async function getDocFromDir(args: {
	product: string
	ref: string
	slug: string
	isPrivate?: boolean
}) {
	try {
		const filename = getFilename(args)
		return await readFile(filename, 'utf-8')
	} catch (error: any) {
		if (error.code?.includes('ENOENT')) {
			throw new Error('Not found')
		}

		throw error
	}
}

function getFilename({
	product,
	ref,
	slug,
	isPrivate = false,
}: {
	product: string
	ref: string
	slug: string
	isPrivate?: boolean
}) {
	if (isPrivate) {
		let filePath = path.join(privateContentPath(product, ref), slug)
		if (existsSync(`${filePath}.mdx`)) return `${filePath}.mdx`

		filePath = path.join(removeLastSlash(filePath), 'index')
		if (existsSync(`${filePath}.mdx`)) return `${filePath}.mdx`
	}

	let filePath = path.join(contentPath(product, ref), slug)
	if (existsSync(`${filePath}.mdx`)) return `${filePath}.mdx`

	filePath = path.join(removeLastSlash(filePath), 'index')
	if (existsSync(`${filePath}.mdx`)) return `${filePath}.mdx`

	throw Error(`This file doesn't exists: ${product}/${ref}/${slug}`)
}

const configValidator = z.record(z.string(), z.string())

export async function getConfig({
	product,
	ref,
	isPrivate,
}: {
	product: string
	ref: string
	isPrivate?: boolean
}): Promise<Record<string, string>> {
	const base = isPrivate
		? privateContentPath(product, ref)
		: contentPath(product, ref)
	return getJsonFile(path.join(base, 'config.json'), configValidator.parse)
}
