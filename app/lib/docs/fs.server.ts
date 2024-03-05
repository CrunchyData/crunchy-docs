import fs from 'fs/promises'
import { dirname, join } from 'path'
import { getPublicProductSlug } from './utils.ts'

const __dirname = dirname(import.meta.url).replace('file://', '')

const publicProductPathMap: Record<string, string | undefined> = {
	'postgres-operator': process.env.PGO_PATH,
}

const privateProductPathMap: Record<string, string | undefined> = {
	'postgres-operator-private': process.env.PGO_PATH,
	'crunchy-ha-postgresql': process.env.AUTOMATION_PATH,
}

export function contentPath(product: string, ref: string) {
	const publicProduct = getPublicProductSlug(product)
	const localPath = publicProductPathMap?.[publicProduct]
	if (localPath) {
		return join(localPath, 'public', ref)
	}

	return join(__dirname, '../', 'documentation', publicProduct, ref)
}

export function rootPath(product: string) {
	const publicProduct = getPublicProductSlug(product)
	const localPath = publicProductPathMap?.[publicProduct]
	if (localPath) {
		return localPath
	}

	return join(__dirname, '../', 'documentation', publicProduct)
}

export function privateContentPath(product: string, ref: string) {
	const localPath = privateProductPathMap?.[product]
	if (localPath) {
		return join(localPath, 'private', ref)
	}
	return join(__dirname, '../', 'documentation/private', product, ref)
}

export function privateRootPath(product: string) {
	const localPath = privateProductPathMap?.[product]
	if (localPath) {
		return localPath
	}
	return join(__dirname, '../', 'documentation/private', product)
}

export const getLocalFile = async (path: string): Promise<string> => {
	const data = await fs.readFile(path, 'utf8')
	return data.toString()
}

export async function getJsonFile<T>(
	path: string,
	validator: (json: any) => T,
): Promise<T> {
	const contents = await getLocalFile(path)
	try {
		return validator(JSON.parse(contents))
	} catch (e) {
		console.log('Parsing error for: ', path)
		console.log('Here are the file contents: ', contents)
		throw e
	}
}

export async function walk(
	path: string,
	callback: (path: string, stat: any) => Promise<void> | void,
): Promise<void> {
	const results = await fs.readdir(path)

	for (let fileOrDirectory of results) {
		if (fileOrDirectory.startsWith('_')) continue
		const filePath = join(path, fileOrDirectory)
		const stat = await fs.stat(filePath)

		if (stat.isDirectory()) {
			await walk(filePath, callback)
		} else {
			await callback(filePath, stat)
		}
	}
}

export async function walkDir(
	path: string,
	callback: (path: string) => Promise<void> | void,
): Promise<void> {
	const results = await fs.readdir(path, { withFileTypes: true })

	for (let fileOrDirectory of results) {
		const filePath = `${path}/${fileOrDirectory.name}`

		if (fileOrDirectory.isDirectory()) {
			callback(filePath)
		}
	}
}
