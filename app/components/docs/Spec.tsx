import { Link } from '@remix-run/react'
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
	return (
		<h3 id={id} className="flex flex-col pt-4">
			<Link className="text-sm opacity-75" to={`#${parentId}`}>
				↩ Parent
			</Link>
			<span className="break-all">{children}</span>
		</h3>
	)
}
