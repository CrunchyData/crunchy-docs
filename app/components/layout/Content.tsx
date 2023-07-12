import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import type {
	HeadersFunction,
	LoaderArgs,
	SerializeFrom,
	V2_MetaFunction,
} from '@remix-run/node'
import { json } from '@remix-run/node'
import {
	Link,
	isRouteErrorResponse,
	useLoaderData,
	useLocation,
	useRouteError,
	type LinkProps,
} from '@remix-run/react'
import { clsx } from 'clsx'
import { getMDXComponent } from 'mdx-bundler/client/index.js'
import { Fragment, useMemo } from 'react'
import invariant from 'tiny-invariant'
import { Hint, Info, Warning } from '~/components/docs/Callout.tsx'
import CopyButton from '~/components/docs/CopyButton.tsx'
import Image from '~/components/docs/Image.tsx'
import {
	MediaHeading,
	MediaImage,
	MediaItem,
	MediaRow,
} from '~/components/docs/MediaRow.tsx'
import Ref from '~/components/docs/Ref.tsx'
import { ChildHeading, TableLink } from '~/components/docs/Spec.tsx'
import Tag from '~/components/docs/Tag.tsx'
import ErrorPage from '~/components/layout/ErrorPage.tsx'
import TableOfContents from '~/components/layout/TableOfContents.tsx'
import { getDoc } from '~/lib/docs/doc.server.ts'
import { type NavItem } from '~/lib/docs/menu.server.ts'
import { getBreadcrumbs, getChildren, getPagination } from '~/lib/docs/menu.ts'
import { NavLink } from '~/types.ts'
import { CACHE_CONTROL } from '~/utils/http.server.ts'
import { removeEndSlashes } from '~/utils/removeEndSlashes.ts'

export async function publicLoader({ params }: LoaderArgs) {
	let { product, ref, '*': splat } = params
	invariant(product, 'expected `params.product`')
	invariant(ref, 'expected `params.ref`')

	console.log(`Fetching public doc for: ${splat}`)

	const doc = await getDoc({
		product,
		ref,
		slug: splat || 'index',
	})

	if (!doc) {
		throw json(
			{
				message:
					'Most likely the url you have is incorrect or that doc no longer exits.',
			},
			{ status: 404 },
		)
	}

	return json(
		{
			...doc,
			splat: removeEndSlashes(splat || ''),
		},
		{
			headers: {
				'Cache-Control': CACHE_CONTROL.doc,
			},
		},
	)
}

export async function privateLoader({ params }: LoaderArgs) {
	let { product, ref, '*': splat } = params
	invariant(product, 'expected `params.product`')
	invariant(ref, 'expected `params.ref`')

	console.log(`Fetching private doc for: ${splat}`)

	const doc = await getDoc({
		product,
		ref,
		slug: splat || 'index',
		isPrivate: true,
	})

	if (!doc) {
		throw json(
			{
				message:
					'Most likely the url you have is incorrect or that doc no longer exits.',
			},
			{ status: 404 },
		)
	}

	return json(
		{
			...doc,
			splat: removeEndSlashes(splat || ''),
		},
		{
			headers: {
				'Cache-Control': CACHE_CONTROL.doc,
			},
		},
	)
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return {
		'Cache-Control': loaderHeaders.get('Cache-Control')!,
		'Vary': 'Cookie',
	}
}

export const meta: V2_MetaFunction = ({ data }) => {
	if (!data) return [{ title: 'Not Found' }]
	const { attributes } = data as SerializeFrom<typeof publicLoader>

	return [
		{ title: attributes.meta?.title ?? attributes.title },
		...(attributes.meta?.description
			? [
					{
						name: 'description',
						content: attributes.meta.description,
					},
			  ]
			: []),
	]
}

export function Content({
	showTitle = false,
	menu,
	product,
	basePath,
}: { showTitle?: boolean } & {
	menu: NavItem[]
	product: NavLink
	basePath: string
}) {
	const { html, tableOfContents, splat, attributes } =
		useLoaderData<typeof publicLoader>()
	const location = useLocation()
	const pathname = location.pathname.replace(/^\//, '')
	const Component = useMemo(() => getMDXComponent(html), [html])
	const breadcrumbs = useMemo(
		() => getBreadcrumbs({ menu, product, splat }),
		[menu, product, splat],
	)
	const pagination = useMemo(
		() => getPagination(menu, `${product.to}/${splat}`),
		[menu, product, splat],
	)

	return (
		<div className="flex gap-8 px-6 md:px-8">
			<article className="min-w-0 max-w-4xl flex-1">
				<div>
					{breadcrumbs.length > 1 ? (
						<nav aria-label="breadcrumb">
							<ol className="flex items-center gap-2 text-sm">
								{breadcrumbs.map(({ label, to }, i) => (
									<Fragment key={to}>
										{breadcrumbs?.length > 1 && i > 0 ? (
											<ChevronRightIcon className="h-3 w-3" />
										) : null}
										{pathname === to ? (
											<p className="font-bold text-primary">{label}</p>
										) : (
											<Link
												to={`${basePath}${to}`}
												className="underline underline-offset-4 hover:text-primary hover:no-underline"
											>
												{label}
											</Link>
										)}
									</Fragment>
								))}
							</ol>
						</nav>
					) : null}
				</div>
				{showTitle ? (
					<h1 className="mt-8 font-display text-3xl font-bold text-primary md:text-4xl">
						{attributes.title}
					</h1>
				) : null}
				<div className="prose mt-6 w-full max-w-none pb-8 lg:prose-sm xl:prose-base prose-headings:font-display prose-headings:text-primary">
					{html ? (
						<Component
							components={{
								Info,
								Hint,
								Warning,
								ChildHeading,
								TableLink,
								Image,
								CopyButton,
								Tag,
								Ref,
								MediaRow,
								MediaHeading,
								MediaImage,
								MediaItem,
							}}
						/>
					) : null}

					{attributes.showChildren ? (
						<ChildPageList
							menu={menu}
							basePath={basePath}
							path={`${product.to}/${splat}`}
						/>
					) : null}
				</div>
				{pagination?.previous || pagination?.next ? (
					<nav
						className={clsx(
							pagination?.previous ? 'justify-between' : 'justify-end',
							'mt-4 flex items-center border-t py-4',
						)}
					>
						{pagination?.previous ? (
							<PaginationLink basePath={basePath} to={pagination.previous.to}>
								<ChevronLeftIcon className="h-4 w-4 transition group-hover:-translate-x-1" />
								{pagination.previous.label}
							</PaginationLink>
						) : null}
						{pagination?.next ? (
							<PaginationLink
								basePath={basePath}
								to={pagination.next.to}
								className="justify-self-end"
							>
								{pagination.next.label}
								<ChevronRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
							</PaginationLink>
						) : null}
					</nav>
				) : null}
			</article>
			{!attributes.hideTableOfContents && tableOfContents?.length ? (
				<div className="relative hidden w-56 max-w-xs shrink-0 lg:block xl:w-64 2xl:w-full">
					<TableOfContents items={tableOfContents} className="sticky top-24" />
				</div>
			) : null}
		</div>
	)
}

export function ErrorBoundary() {
	const error = useRouteError()
	console.log(error)
	let status = 500
	let message = 'Unknown error'
	let stack = undefined

	if (isRouteErrorResponse(error)) {
		status = error.status
		message = error.data.message
	} else if (error instanceof Error) {
		message = error.message
		stack = error.stack
	}

	return (
		<div className="flex gap-8 px-6 md:px-8">
			<div className="min-w-0 flex-1">
				<ErrorPage
					code={status}
					title={
						status === 404 ? 'No content found.' : 'Server error on our end.'
					}
					message={message}
				/>
			</div>
		</div>
	)
}

function PaginationLink({
	children,
	className,
	to,
	basePath,
	...props
}: LinkProps & { basePath: string }) {
	return (
		<Link
			{...props}
			to={`${basePath}${to}`}
			className={clsx(
				className,
				'group flex items-center gap-2 hover:text-crunchy',
			)}
		>
			{children}
		</Link>
	)
}

function ChildPageList({
	menu,
	basePath,
	path,
}: {
	menu: NavItem[]
	basePath: string
	path: string
}) {
	const pages = useMemo(() => getChildren(menu, path), [menu, path])

	return pages.length ? (
		<ul>
			{pages.map(({ slug, title, children }) => (
				<li key={slug}>
					<Link to={`${basePath}${slug}`}>{title}</Link>
					{children.length ? (
						<ul>
							{children.map(grandchild => (
								<li key={grandchild.slug}>
									<Link to={`${basePath}${grandchild.slug}`}>
										{grandchild.title}
									</Link>
								</li>
							))}
						</ul>
					) : null}
				</li>
			))}
		</ul>
	) : null
}
