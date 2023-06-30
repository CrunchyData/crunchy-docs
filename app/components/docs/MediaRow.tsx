import { Link, LinkProps, useLocation } from '@remix-run/react'
import { PropsWithChildren } from 'react'
import getProductIndexPath from '~/utils/get-product-index-path.ts'

export function MediaRow({ children }: PropsWithChildren) {
	return <div className="grid gap-6 md:grid-cols-3">{children}</div>
}

export function MediaItem({ children }: PropsWithChildren) {
	return <div>{children}</div>
}

export function MediaImage({
	src,
	to,
	...props
}: { src: string; to?: string } & Omit<LinkProps, 'to' | 'className'>) {
	const { pathname } = useLocation()
	const wrapperClass = 'not-prose aspect-h-3 aspect-w-4 block'
	return (
		<div className="overflow-hidden rounded-xl">
			{to ? (
				<Link
					{...props}
					to={`${getProductIndexPath(pathname)}/${to}`}
					className={wrapperClass}
				>
					<img src={src} className="object-contain" />
				</Link>
			) : (
				<div className={wrapperClass}>
					<img src={src} className="object-contain" />
				</div>
			)}
		</div>
	)
}

export function MediaHeading({
	children,
	to,
	...props
}: PropsWithChildren<{ to?: string } & Omit<LinkProps, 'to'>>) {
	const { pathname } = useLocation()
	return (
		<h3>
			{to ? (
				<Link {...props} to={`${getProductIndexPath(pathname)}/${to}`}>
					{children}
				</Link>
			) : (
				<span>{children}</span>
			)}
		</h3>
	)
}
