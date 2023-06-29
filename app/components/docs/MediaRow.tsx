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
}: { src: string } & Omit<LinkProps, 'className'>) {
	const { pathname } = useLocation()
	return (
		<div className="overflow-hidden rounded-xl">
			<Link
				{...props}
				to={`${getProductIndexPath(pathname)}/${to}`}
				className="not-prose aspect-h-3 aspect-w-4 block"
			>
				<img src={src} className="object-contain" />
			</Link>
		</div>
	)
}

export function MediaHeading({
	children,
	to,
	...props
}: PropsWithChildren<LinkProps>) {
	const { pathname } = useLocation()
	return (
		<h3>
			<Link {...props} to={`${getProductIndexPath(pathname)}/${to}`}>
				{children}
			</Link>
		</h3>
	)
}
