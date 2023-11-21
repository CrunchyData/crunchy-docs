import fs from 'fs/promises'
import LRUCache from 'lru-cache'
import { parseAttrs } from './attrs.server.ts'
import { contentPath, privateContentPath, walk } from './fs.server.ts'
import { makeSlug } from './utils.ts'

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

let NO_CACHE = process.env.NO_CACHE ?? false

global.menuCache ??= new LRUCache<string, NavItem[]>({
	max: 10,
	ttl: NO_CACHE ? 1 : 300000, // 5 minutes
	allowStale: !NO_CACHE,
	noDeleteOnFetchRejection: true,
	fetchMethod: async cacheKey => {
		let [access, product, ref] = cacheKey.split(':')
		let menu = await getMenuFromDir({
			product,
			ref,
			isPrivate: access === 'private',
		})
		return menu
	},
})

export async function getMenu({
	product,
	ref,
	isPrivate = false,
}: {
	product: string
	ref: string
	isPrivate?: boolean
}) {
	return NO_CACHE
		? getMenuFromDir({ product, ref, isPrivate })
		: menuCache.fetch(`${isPrivate ? 'private' : 'public'}:${product}:${ref}`)
}

/**
 * Builds a sorted nav from the file system
 */
export async function getMenuFromDir({
	product,
	ref,
	isPrivate = false,
}: {
	product: string
	ref: string
	isPrivate?: boolean
}): Promise<NavItem[]> {
	const docs: NavTree[] = []
	console.log(contentPath(product, ref))
	await walk(contentPath(product, ref), async filepath => {
		if (!filepath.endsWith('.mdx')) return
		const mdx = await fs.readFile(filepath, 'utf-8')
		const { title, weight, draft } = parseAttrs(mdx)
		const slug = makeSlug({ filepath, product, ref })

		// not show drafts in menu
		if (draft) return

		docs.push({
			title,
			weight,
			slug,
			children: new Map(),
		})
	})

	if (isPrivate) {
		await walk(privateContentPath(product, ref), async filepath => {
			if (!filepath.endsWith('.mdx')) return
			const mdx = await fs.readFile(filepath, 'utf-8')
			const { title, weight, draft } = parseAttrs(mdx)
			const slug = makeSlug({ filepath, product, ref, isPrivate })

			// not show drafts in menu
			if (draft) return

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
