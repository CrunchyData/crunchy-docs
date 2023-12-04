import fs from 'fs/promises'
import { dirname, join } from 'path'
import { getPublicProductSlug } from './utils.ts'

const __dirname = dirname(import.meta.url).replace('file://', '')

export function contentPath(product: string, ref: string) {
	const publicProduct = getPublicProductSlug(product)
	if (process.env.PGO_PATH) {
		return join(process.env.PGO_PATH, 'public', ref)
	}

	return join(__dirname, '../', 'documentation', publicProduct, ref)
}

export function rootPath(product: string) {
	if (process.env.PGO_PATH) {
		return process.env.PGO_PATH
	}

	const publicProduct = getPublicProductSlug(product)
	return join(__dirname, '../', 'documentation', publicProduct)
}

export function privateContentPath(product: string, ref: string) {
	if (process.env.PGO_PATH) {
		return join(process.env.PGO_PATH, 'private', ref)
	}
	return join(__dirname, '../', 'documentation/private', product, ref)
}

export function privateRootPath(product: string) {
	if (process.env.PGO_PATH) {
		return process.env.PGO_PATH
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
