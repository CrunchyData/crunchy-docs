/*========================
Breadcrumbs - NOT CACHED
=========================*/

import { type NavLink } from '~/types.ts'
import { type NavItem } from './menu.server.ts'

export function getBreadcrumbs({
	menu,
	product,
	splat,
}: {
	menu: NavItem[]
	product: NavLink
	splat: string
}): NavLink[] {
	const breadcrumbs: NavLink[] = [product]

	if (splat === '') return breadcrumbs
	const children: NavLink[] = splat
		.split('/')
		.reduce<NavItem[]>((acc, current, i) => {
			if (i === 0) {
				const item = menu.find(
					({ slug }) => slug === `${product.to}/${current}`,
				)
				if (!item) return acc
				acc.push(item)
			} else {
				const prev = acc[i - 1]
				const item = prev.children.find(
					({ slug }) => slug === `${prev.slug}/${current}`,
				)
				if (!item) return acc
				acc.push(item)
			}

			return acc
		}, [])
		.map(({ title, slug }) => ({ label: title, to: slug }))

	return breadcrumbs.concat(children)
}

/*========================
Pagination - NOT CACHED
=========================*/

type Pagination = { previous?: NavLink; next?: NavLink }

export function getPagination(nav: NavItem[], path: string): Pagination {
	return nav.reduce<[boolean, Pagination]>(
		([found, pagination], current, i) => {
			if (found) return [found, pagination]

			let previous: NavLink | undefined
			let next: NavLink | undefined

			// Top-Level
			if (current.slug === path) {
				if (i !== 0) {
					previous = navItemToLink(getDeepestItem(nav[i - 1]))
				}

				if (current.children.length) {
					next = navItemToLink(current.children[0])
				} else if (nav[i + 1]) {
					next = navItemToLink(nav[i + 1])
				}

				return [true, { previous, next }]
			}

			// One level deeper
			const childPagination = nestedPagination(current, path)
			if (childPagination) {
				if (!childPagination.next && nav[i + 1])
					childPagination.next = navItemToLink(nav[i + 1])
				return [true, childPagination]
			}

			// Two levels deeper
			let grandChildIndex = 0
			for (let child of current.children) {
				const grandChildPagination = nestedPagination(child, path)
				if (grandChildPagination) {
					if (!grandChildPagination.next) {
						if (current.children[grandChildIndex + 1]) {
							grandChildPagination.next = navItemToLink(
								current.children[grandChildIndex + 1],
							)
						} else if (nav[i + 1]) {
							grandChildPagination.next = navItemToLink(nav[i + 1])
						}
					}
					return [true, grandChildPagination]
				}
				grandChildIndex++
			}

			return [found, pagination]
		},
		[false, {}],
	)[1]
}

function nestedPagination(current: NavItem, path: string): Pagination | null {
	let previous: NavLink | undefined
	let next: NavLink | undefined

	const childIndex = current.children.findIndex(({ slug }) => slug === path)
	if (childIndex === -1) return null

	const child = current.children[childIndex]

	if (childIndex === 0) {
		previous = navItemToLink(current)
	} else {
		previous = navItemToLink(getDeepestItem(current.children[childIndex - 1]))
	}

	if (child.children.length) {
		next = navItemToLink(child.children[0])
	} else if (current.children[childIndex + 1]) {
		next = navItemToLink(current.children[childIndex + 1])
	}

	return { previous, next }
}

function getDeepestItem(root: NavItem): NavItem {
	if (root.children?.length) {
		return getDeepestItem(root.children[root.children.length - 1])
	}

	return root
}

function navItemToLink({ title, slug }: NavItem): NavLink {
	return { label: title, to: slug }
}

/*========================
Children - NOT CACHED
=========================*/

export function getChildren(nav: NavItem[], path: string): NavItem[] {
	// Check the root level children
	const rootItem = nav.find(({ slug }, i) => {
		if (i === 0) return false
		return path.includes(slug)
	})
	if (!rootItem) return []
	if (rootItem.slug === path) return rootItem.children

	// Check root children
	const childItem = rootItem.children.find(({ slug }) => path.includes(slug))
	if (!childItem) return rootItem.children
	if (childItem.slug === path) return childItem.children

	return []
}
