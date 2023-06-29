import {
	Document,
	Image,
	Link,
	Page,
	Path,
	Svg,
	Text,
	View,
} from '@react-pdf/renderer'
import { getMDXComponent } from 'mdx-bundler/client/index.js'
import { useMemo } from 'react'

export default function PDF({ docs }: { docs: string[] }) {
	return (
		<Document style={{ fontFamily: 'Helvetica' }}>
			<Page size="LETTER" wrap={true} style={{ padding: '40px' }}>
				{docs.map((doc, i) => (
					<Doc doc={doc} key={i} />
				))}
			</Page>
		</Document>
	)
}

function Doc({ doc }: { doc: string }) {
	const Component = useMemo(() => getMDXComponent(doc), [doc])
	return (
		<Component
			components={{
				View,
				Text,
				Image,
				Link,
				Svg,
				Path,
			}}
		></Component>
	)
}
