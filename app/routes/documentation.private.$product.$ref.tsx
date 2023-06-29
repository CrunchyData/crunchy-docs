import {
	json,
	redirect,
	type LoaderArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Outlet, useLoaderData, useRouteLoaderData } from '@remix-run/react'
import invariant from 'tiny-invariant'
import Container from '~/components/layout/Container.tsx'
import { getMenu } from '~/lib/docs/menu.server.ts'
import { validateParams } from '~/lib/docs/params.server.ts'
import { getProductData } from '~/lib/docs/product.server.ts'
import {
	getProductVersions,
	versionsToMenu,
} from '~/lib/docs/versions.server.ts'

const ROUTE_ID = 'routes/documentation.private.$product.$ref'

export async function loader({ params }: LoaderArgs) {
	let { product, ref, '*': splat } = params
	invariant(product, 'expected `params.product`')
	invariant(ref, 'expected `params.ref`')

	const versions = await getProductVersions({ product, isPrivate: true })

	let betterUrl = validateParams(versions, ['latest'], {
		product,
		ref,
		'*': splat,
	})

	if (betterUrl) throw redirect('/' + betterUrl)

	const menu = await getMenu({ product, ref, isPrivate: true })
	const versionMenu = versionsToMenu(product, ref, versions)
	const { name, links } = await getProductData({ product, isPrivate: true })

	return json({
		menu,
		versions: versionMenu,
		product: { label: name, to: `/${product}/${ref}` },
		links,
		ref,
		basePath: '/documentation/private',
	})
}

export function useDocLayoutLoaderData(): SerializeFrom<typeof loader> {
	const data = useRouteLoaderData(ROUTE_ID) as
		| SerializeFrom<typeof loader>
		| undefined

	invariant(data, 'Unable to find doc layout data')
	return data
}

export default function DocLayout() {
	const { menu, product, versions, links, basePath } =
		useLoaderData<typeof loader>()
	return (
		<Container
			menu={menu}
			product={product}
			versions={versions}
			links={links}
			basePath={basePath}
		>
			<Outlet />
		</Container>
	)
}
