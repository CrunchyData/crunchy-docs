export {
	ErrorBoundary,
	headers,
	publicLoader as loader,
	meta,
} from '~/components/layout/Content.tsx'

import { Content } from '~/components/layout/Content.tsx'
import { useDocLayoutLoaderData } from './documentation.$product.$ref.tsx'

export default function DocPage() {
	const { menu, product, basePath, version, ref } = useDocLayoutLoaderData()
	return (
		<Content
			showTitle
			menu={menu}
			product={product}
			basePath={basePath}
			version={version}
			ref={ref}
		/>
	)
}
