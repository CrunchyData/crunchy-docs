import LRUCache from 'lru-cache'
import path from 'path'
import semver from 'semver'
import { z } from 'zod'
import { type NavLink } from '~/types.ts'
import {
	find,
	fromArray,
	isEmpty,
	type NonEmptyZipperObj,
} from '~/utils/zipper.ts'
import { getJsonFile, privateRootPath, rootPath } from './fs.server.ts'

export function getLatestVersion(versions: string[]) {
	return versions.filter(tag =>
		semver.satisfies(tag, '*', { includePrerelease: false }),
	)[0]
}

declare global {
	var versionsCache: LRUCache<string, string[]>
}

let NO_CACHE = process.env.NO_CACHE ?? false

// global for SS "HMR", we need a better story here
global.versionsCache ??= new LRUCache<string, string[]>({
	// let versionsCache = new LRUCache<string, string[]>({
	max: 3,
	ttl: 1000 * 60 * 5, // 5 minutes, so we can see new versions quickly
	allowStale: true,
	noDeleteOnFetchRejection: true,
	fetchMethod: async key => {
		console.log('Fetching fresh versions')
		let [access, product] = key.split(':')
		return getAllVersions({ product, isPrivate: access === 'private' })
	},
})

export async function getProductVersions({
	product,
	isPrivate = false,
}: {
	product: string
	isPrivate?: boolean
}) {
	if (NO_CACHE) {
		getAllVersions({ product, isPrivate })
	}
	return versionsCache.fetch(`${isPrivate ? 'private' : 'public'}:${product}`)
}

const versionValidator = z.array(z.string().regex(/\d\.\d\.\d/)).nonempty()

async function getAllVersions({
	product,
	isPrivate = false,
}: {
	product: string
	isPrivate?: boolean
}): Promise<z.infer<typeof versionValidator>> {
	const base = isPrivate ? privateRootPath(product) : rootPath(product)
	return getJsonFile(path.join(base, 'versions.json'), versionValidator.parse)
}

export function versionsToMenu(
	product: string,
	ref: string,
	versions: string[],
): NonEmptyZipperObj<NavLink> | null {
	const sorted = semver.rsort(versions).map((v, i) => ({
		label: i === 0 ? `${v} (latest)` : v,
		to: `/${product}/${v}`,
	}))
	const zipped = fromArray(sorted)

	if (isEmpty(zipped)) return null
	return ref === 'latest'
		? zipped
		: find<NavLink>(zipped, ({ to }) => to === ref)
}
