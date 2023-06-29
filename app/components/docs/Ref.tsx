import { Link, useLocation, type LinkProps } from '@remix-run/react'
import getProductIndexPath from '~/utils/get-product-index-path.ts'

export default function Ref({ to, children, ...props }: LinkProps) {
	const { pathname } = useLocation()
	return (
		<Link {...props} to={`${getProductIndexPath(pathname)}/${to}`}>
			{children}
		</Link>
	)
}
