import type LRUCache from 'lru-cache'
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
const versionOldSchema = z.object({
	version: versionValidator,
	isPublic: z.boolean(),
})

const versionNewSchema = z.object({
	version: versionValidator,
	status: z.union([
		z.literal('preview'),
		z.literal('private'),
		z.literal('public'),
	]),
})
const versionJsonValidator = z
	.array(
		z.union([versionOldSchema, versionNewSchema]).transform(version => {
			if ('isPublic' in version) {
				return {
					version: version.version,
					status: version.isPublic ? 'public' : 'private',
				}
			}
			return version
		}),
	)
	.nonempty()

export type Versions = z.infer<typeof versionJsonValidator>
export type Version = { version: string; isPreview: boolean }
declare global {
	var versionsCache: LRUCache<string, Version[]>
}

// global for SS "HMR", we need a better story here
global.versionsCache ??= createCache<Version[]>(async key => {
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
}): Promise<{ version: string; isPreview: boolean }[]> {
	const base = isPrivate ? privateRootPath(product) : rootPath(product)
	const versions = await getJsonFile(
		path.join(base, 'versions.json'),
		versionJsonValidator.parse,
	)

	return isPrivate
		? versions.map(({ status, version }) => ({
				version,
				isPreview: status === 'preview',
		  }))
		: versions.flatMap(({ status, version }) => [
				{
					version,
					isPreview: status !== 'public',
				},
		  ])
}

export function versionsToMenu(
	product: string,
	ref: string,
	versions: Version[],
): NonEmptyZipperObj<NavLink> | null {
	let latestFound = false
	const sorted = versions.flatMap(({ version, isPreview }, i) => {
		if (isPreview) return []
		const item = {
			label: latestFound ? version : `${version} (latest)`,
			to: `/${product}/${latestFound ? version : 'latest'}`,
		}
		latestFound = true
		return item
	})

	const version = versions.find(({ version }) => version === ref)
	if (version?.isPreview) {
		return fromArray([
			{ label: `${ref} (preview)`, to: `/${product}/${ref}` },
			...sorted,
		])
	}

	const zipped = fromArray(sorted)
	if (isEmpty(zipped)) return null
	if (ref === 'latest') return zipped
	return find<NavLink>(zipped, ({ label }) => label === ref)
}

export function getVersion(versions: Version[], ref: string): Version {
	return ref === 'latest'
		? versions.find(({ isPreview }) => !isPreview) ?? versions[0]
		: versions.find(v => v.version === ref) ?? versions[0]
}
