import fs from 'fs/promises'
import LRUCache from 'lru-cache'
import { NO_CACHE, SALT, createCache } from '~/utils/cache.server.ts'
import { parseAttrs } from './attrs.server.ts'
import { contentPath, privateContentPath, walk } from './fs.server.ts'
import { Access, makeSlug } from './utils.ts'

/*========================
Product Menu - CACHED
=========================*/

type MenuDoc = {
	title: string
	weight?: number
	slug: string
}

export type NavItem = MenuDoc & {
	children: NavItem[]
}

type NavTree = MenuDoc & {
	children: Map<string, NavTree>
}

declare global {
	var menuCache: LRUCache<string, NavItem[]>
}

global.menuCache ??= createCache<NavItem[]>(
	async (cacheKey, _stale, { context }) => {
		let [access, product, ref] = cacheKey.split(':')
		let menu = await getMenuFromDir({
			product,
			version: context.version,
			ref,
			access: access as Access,
		})
		return menu
	},
)

export async function getMenu({
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
	return NO_CACHE
		? getMenuFromDir({ product, version, ref, access })
		: menuCache.fetch(`${access}:${product}:${ref}:${SALT}`, {
				fetchContext: { version },
		  })
}

/**
 * Builds a sorted nav from the file system
 */
export async function getMenuFromDir({
	product,
	version,
	ref,
	access = 'public',
}: {
	product: string
	version: string
	ref: string
	access?: Access
}): Promise<NavItem[]> {
	const docs: NavTree[] = []

	if (access !== 'private') {
		await walk(contentPath(product, version), async filepath => {
			if (!filepath.endsWith('.mdx')) return
			const mdx = await fs.readFile(filepath, 'utf-8')
			const { title, weight, draft, show, include } = parseAttrs(mdx)
			// not show drafts in menu
			if (draft || include) return

			// not show private in public and vice versa
			if (
				(access !== 'public' && show === 'public') ||
				(access === 'public' && show === 'private')
			) {
				return
			}

			const slug = makeSlug({ filepath, product, version })

			docs.push({
				title,
				weight,
				slug,
				children: new Map(),
			})
		})
	}

	if (access !== 'public') {
		await walk(privateContentPath(product, version), async filepath => {
			if (!filepath.endsWith('.mdx')) return
			const mdx = await fs.readFile(filepath, 'utf-8')
			const { title, weight, draft, include } = parseAttrs(mdx)
			// not show drafts in menu
			if (draft || include) return

			const slug = makeSlug({ filepath, product, version, isPrivate: true })

			docs.push({
				title,
				weight,
				slug,
				children: new Map(),
			})
		})
	}

	// sort so we can process parents before children
	docs.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))

	const tree = docs.reduce<Map<string, NavTree>>((acc, current) => {
		const { slug } = current
		if (slug.includes('/')) {
			const path = slug.split('/')
			return buildTree(acc, path, current, `/${product}/${ref}`)
		} else {
			acc.set(slug, { ...current, slug: `/${product}/${ref}/${slug}` })
		}

		return acc
	}, new Map())

	return sortNavItems(tree)
}

/**
 * Recursion to build up multiple levels of the nav tree
 */
function buildTree(
	tree: Map<string, NavTree>,
	path: string[],
	leaf: NavTree,
	rootPath: string,
) {
	if (path.length === 0) return tree

	const [root, ...rest] = path

	const item: NavTree = tree.get(root) ?? {
		title: 'parent',
		weight: 900,
		slug: `${rootPath}/${root}`,
		children: new Map(),
	}

	if (rest.length === 1) {
		item.children.set(rest[0], {
			...leaf,
			slug: `${rootPath}/${leaf.slug}`,
		})
	} else {
		item.children = buildTree(item.children, rest, leaf, rootPath)
	}

	tree.set(root, item)
	return tree
}

function sortNavItems(navTree: Map<string, NavTree>): NavItem[] {
	const trees: NavTree[] = Array.from(navTree, ([_, tree]) => tree)
	return trees.map(sortTree).sort(sortItems)
}

function sortTree(tree: NavTree): NavItem {
	const trees: NavTree[] = Array.from(tree.children, ([_, tree]) => tree)
	const items: NavItem[] = trees.reduce<NavItem[]>((acc, tree) => {
		return acc.concat(sortTree(tree))
	}, [])
	return { ...tree, children: items.sort(sortItems) }
}

function sortItems(a: NavItem, b: NavItem): number {
	if (a?.weight && b?.weight) return a.weight - b.weight
	if (a?.weight) return -1
	if (b?.weight) return 1
	return a.title.localeCompare(b.title)
}
