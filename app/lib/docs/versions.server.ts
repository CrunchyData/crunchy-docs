import LRUCache from 'lru-cache'
import path from 'path'
import semver from 'semver'
import { z } from 'zod'
import { type NavLink } from '~/types.ts'
import { createCache, NO_CACHE, SALT } from '~/utils/cache.server.ts'
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

const versionValidator = z.string().regex(/\d(\.\d){0,2}/)
const oldVersionJsonValidator = z.array(versionValidator).nonempty()
const newVersionJsonValidator = z
	.array(z.object({ version: versionValidator, isPublic: z.boolean() }))
	.nonempty()
const versionJsonValidator = z.union([
	oldVersionJsonValidator,
	newVersionJsonValidator,
])

export type Versions = z.infer<typeof versionJsonValidator>

declare global {
	var versionsCache: LRUCache<string, string[]>
}

// global for SS "HMR", we need a better story here
global.versionsCache ??= createCache<string[]>(async key => {
	console.log('Fetching fresh versions')
	let [access, product] = key.split(':')
	return getAllVersions({ product, isPrivate: access === 'private' })
})

export async function getProductVersions({
	product,
	isPrivate = false,
}: {
	product: string
	isPrivate?: boolean
}) {
	if (NO_CACHE) {
		return getAllVersions({ product, isPrivate })
	}
	return versionsCache.fetch(
		`${isPrivate ? 'private' : 'public'}:${product}:${SALT}`,
	)
}

async function getAllVersions({
	product,
	isPrivate = false,
}: {
	product: string
	isPrivate?: boolean
}): Promise<string[]> {
	const base = isPrivate ? privateRootPath(product) : rootPath(product)
	const versions = await getJsonFile(
		path.join(base, 'versions.json'),
		versionJsonValidator.parse,
	)

	const isNewSchema = typeof versions[0] !== 'string'

	if (!isNewSchema) return versions as string[]

	return isPrivate
		? (versions as z.infer<typeof newVersionJsonValidator>).map(
				({ version }) => version,
		  )
		: (versions as z.infer<typeof newVersionJsonValidator>).flatMap(
				({ isPublic, version }) => (isPublic ? [version] : []),
		  )
}

export function versionsToMenu(
	product: string,
	ref: string,
	versions: string[],
): NonEmptyZipperObj<NavLink> | null {
	const sorted = versions.map((v, i) => ({
		label: i === 0 ? `${v} (latest)` : v,
		to: `/${product}/${i === 0 ? 'latest' : v}`,
	}))
	const zipped = fromArray(sorted)

	if (isEmpty(zipped)) return null
	return ref === 'latest'
		? zipped
		: find<NavLink>(zipped, ({ label }) => label === ref)
}
