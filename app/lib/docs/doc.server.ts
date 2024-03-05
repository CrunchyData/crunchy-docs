import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import type LRUCache from 'lru-cache'
import path from 'path'
import { z } from 'zod'
import { NO_CACHE, SALT, createCache } from '~/utils/cache.server.ts'
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

/**
 * While we're using HTTP caching, we have this memory cache too so that
 * document requests and data request to the same document can do less work for
 * new versions. This makes our origin server very fast, but adding HTTP caching
 * let's have simpler and faster deployments with just one origin server, but
 * still distribute the documents across the CDN.
 */
global.docCache ??= createCache<Doc | undefined>(async key => {
	console.log('Fetching fresh doc', key)
	const [access, product, version, slug] = key.split(':')
	return getFreshDoc({
		product,
		version,
		slug,
		isPrivate: access === 'private',
	})
})

export async function getDoc({
	product,
	version,
	slug,
	isPrivate = false,
}: {
	product: string
	version: string
	slug: string
	isPrivate?: boolean
}): Promise<Doc | undefined> {
	if (NO_CACHE) {
		return getFreshDoc({ product, slug, version, isPrivate })
	}

	if (isPrivate) {
		const key = `private:${product}:${version}:${slug}:${SALT}`
		const doc = await docCache.fetch(key)
		if (doc) return doc
	}

	const key = `public:${product}:${version}:${slug}:${SALT}`
	const doc = await docCache.fetch(key)
	return doc
}

async function getFreshDoc({
	product,
	version,
	slug,
	isPrivate = false,
}: {
	product: string
	version: string
	slug: string
	isPrivate?: boolean
}) {
	const [mdx, config] = await Promise.all([
		getDocFromDir({ product, version, slug, isPrivate }),
		getConfig({ product, version, isPrivate }),
	])
	if (!mdx) return undefined

	return parseMdx(replaceConfigVars(mdx, config))
}

export async function getDocFromDir(args: {
	product: string
	version: string
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
	version,
	slug,
	isPrivate = false,
}: {
	product: string
	version: string
	slug: string
	isPrivate?: boolean
}) {
	if (isPrivate) {
		let filePath = path.join(privateContentPath(product, version), slug)
		console.log(`Checking if filepath exists: ${filePath}`)
		if (existsSync(`${filePath}.mdx`)) return `${filePath}.mdx`

		filePath = path.join(removeLastSlash(filePath), 'index')
		console.log(`Checking if filepath exists: ${filePath}`)
		if (existsSync(`${filePath}.mdx`)) return `${filePath}.mdx`
	}

	let filePath = path.join(contentPath(product, version), slug)
	console.log(`Checking if filepath exists: ${filePath}`)
	if (existsSync(`${filePath}.mdx`)) return `${filePath}.mdx`

	filePath = path.join(removeLastSlash(filePath), 'index')
	console.log(`Checking if filepath exists: ${filePath}`)
	if (existsSync(`${filePath}.mdx`)) return `${filePath}.mdx`

	throw Error(`This file doesn't exists: ${product}/${version}/${slug}`)
}

const configValidator = z.record(z.string(), z.string())

export async function getConfig({
	product,
	version,
	isPrivate,
}: {
	product: string
	version: string
	isPrivate?: boolean
}): Promise<Record<string, string>> {
	const base = isPrivate
		? privateContentPath(product, version)
		: contentPath(product, version)
	return getJsonFile(path.join(base, 'config.json'), configValidator.parse)
}
