import { Content } from '~/components/layout/Content.tsx'
import { useDocLayoutLoaderData } from './documentation.$product.$ref.tsx'

export {
	ErrorBoundary,
	headers,
	publicLoader as loader,
	meta,
} from '~/components/layout/Content.tsx'

export default function DocPage() {
	const { menu, product, basePath } = useDocLayoutLoaderData()
	return <Content menu={menu} product={product} basePath={basePath} />
}
