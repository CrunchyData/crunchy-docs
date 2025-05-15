import { savePDF } from '~/lib/docs/pdf.server.tsx'
import { getProductAccess } from '~/lib/docs/utils.ts'
import { getProductVersions, getVersion } from '~/lib/docs/versions.server.ts'

//const args = process.argv.slice(2)
//const [product, ref] = args
//
const products = ['postgres-operator', 'postgres-operator-private']
const refs = ['5.3', '5.4', '5.5', '5.6', '5.7', '5.8']

async function generate(p: string, r: string) {
	const access = getProductAccess(p)

	const versions = await getProductVersions({ product: p })
	const { version } = getVersion(versions, r)

	savePDF({ product: p, ref: r, version, access })
}

products.forEach(p => refs.forEach(r => generate(p, r)))
