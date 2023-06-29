import { redirect, type LoaderArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'

export async function loader({ params }: LoaderArgs) {
	let { product } = params
	invariant(product, 'expected `params.product`')

	return redirect(`/documentation/${product}/latest`)
}
