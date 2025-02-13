import { savePDF } from "~/lib/docs/pdf.server.tsx";
import { getProductAccess } from "~/lib/docs/utils.ts";
import { getProductVersions, getVersion } from "~/lib/docs/versions.server.ts";

const args = process.argv.slice(2)
const [product, ref] = args
const access = getProductAccess(product)

const versions = await getProductVersions({ product })
const { version } = getVersion(versions, ref)

savePDF({ product, ref, version, access })
