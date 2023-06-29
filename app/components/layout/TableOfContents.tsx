import { Link, useLocation } from '@remix-run/react'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'
import { type TOCParent } from '~/lib/docs/mdx/headings.server.ts'

function useActiveElement(items: TOCParent[]) {
	const [activeItem, setActiveItem] = useState<string | null>(null)
	useEffect(() => {
		const observer = new IntersectionObserver(entries => {
			let localActive = null
			for (let entry of entries) {
				if (entry.isIntersecting || entry.boundingClientRect.y < 0) {
					const id = entry.target.getAttribute('id')
					localActive = id
					if (id) setActiveItem(id)
				} else if (localActive !== null) {
					break
				}
			}
		})

		const headings = document.querySelectorAll('h2[id]')
		headings.forEach(h => observer.observe(h))
		return () => headings.forEach(h => observer.unobserve(h))
	}, [items])

	return activeItem
}

export default function TableOfContents({
	items,
	className,
}: ComponentProps<'nav'> & { items: TOCParent[] }) {
	const activeId = useActiveElement(items)
	const location = useLocation()

	return (
		<nav aria-label="Table of contents" className={className}>
			<div className="h-[calc(100vh-5rem)] w-full overflow-auto">
				<p className="font-display text-sm font-bold">Page contents</p>
				<ol className="flex flex-col gap-2 border-l py-4 text-sm">
					{items?.map(parent => {
						const isActive = activeId === parent.id
						return (
							<li
								key={parent.id}
								className={clsx(
									'-ml-px border-l pl-4',
									isActive ? 'border-gray-1100' : 'border-transparent',
								)}
							>
								<Link
									to={`${location.pathname}#${parent.id}`}
									className={clsx(
										'hover:text-primary hover:underline',
										isActive && 'text-primary',
									)}
								>
									{parent.text}
								</Link>
								{activeId === parent.id && parent.children?.length ? (
									<ol className="mb-1 mt-2 list-disc pl-2">
										{parent.children?.map(child => (
											<li key={child.id} className="ml-2">
												<Link
													to={`${location.pathname}#${child.id}`}
													className="block py-1 text-xs hover:text-primary hover:underline"
												>
													{child.text}
												</Link>
											</li>
										))}
									</ol>
								) : null}
							</li>
						)
					})}
				</ol>
			</div>
		</nav>
	)
}
