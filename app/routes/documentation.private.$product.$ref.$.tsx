import { Content } from '~/components/layout/Content.tsx'
import { useDocLayoutLoaderData } from './documentation.private.$product.$ref.tsx'

export {
	ErrorBoundary,
	headers,
	privateLoader as loader,
	meta,
} from '~/components/layout/Content.tsx'

export default function DocPage() {
	const { menu, product, basePath } = useDocLayoutLoaderData()
	return <Content showTitle menu={menu} product={product} basePath={basePath} />
}
