import {
	json,
	redirect,
	type LoaderFunctionArgs,
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
	getVersion,
	versionsToMenu,
} from '~/lib/docs/versions.server.ts'

const ROUTE_ID = 'routes/documentation.$product.$ref'
export { ROUTE_ID as docLayoutRouteId }

export async function loader({ params }: LoaderFunctionArgs) {
	let { product, ref, '*': splat } = params
	invariant(product, 'expected `params.product`')
	invariant(ref, 'expected `params.ref`')

	const versions = await getProductVersions({ product })
	const { version, isPreview } = getVersion(versions, ref)

	console.log(versions, version, isPreview)

	let betterUrl = validateParams(versions, ['latest'], {
		product,
		ref,
		'*': splat,
	})

	if (betterUrl) throw redirect('/documentation/' + betterUrl)

	const menu = await getMenu({ product, version, ref })
	const versionMenu = versionsToMenu(product, ref, versions)
	const { name, links } = await getProductData({ product })

	return json({
		menu,
		versions: versionMenu,
		product: { label: name, to: `/${product}/${ref}` },
		links,
		ref,
		version,
		isPreview,
		basePath: '/documentation',
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
	const { menu, product, versions, links, basePath, ref, isPreview } =
		useLoaderData<typeof loader>()
	return (
		<Container
			menu={menu}
			product={product}
			productRef={ref}
			isPreview={isPreview}
			versions={versions}
			links={links}
			basePath={basePath}
		>
			<Outlet />
		</Container>
	)
}
