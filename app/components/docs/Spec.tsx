import { Link, LinkProps, useLocation } from '@remix-run/react'
import type {
	ComponentPropsWithoutRef,
	ComponentType,
	ElementType,
} from 'react'

export type Tag = ElementType | ComponentType<{ className?: string }>

export function ChildHeading({
	id,
	parentId,
	children,
}: ComponentPropsWithoutRef<'h4'> & { parentId: string }) {
	const { pathname } = useLocation()
	return (
		<h3 id={id} className="flex flex-col pt-4">
			<Link className="text-sm opacity-75" to={`${pathname}#${parentId}`}>
				↩ Parent
			</Link>
			<span className="break-all">{children}</span>
		</h3>
	)
}

export function TableLink({ to, children, ...props }: LinkProps) {
	const { pathname } = useLocation()
	return (
		<Link {...props} to={`${pathname}#${to}`}>
			{children}
		</Link>
	)
}
