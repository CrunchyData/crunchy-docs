import fs from 'fs/promises'
import path from 'path'

export async function walk(
	path: string,
	callback: (path: string, stat: any) => Promise<void> | void,
): Promise<void> {
	const results = await fs.readdir(path)

	for (let fileOrDirectory of results) {
		const filePath = `${path}/${fileOrDirectory}`
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

export function getMdxUrl(file: string, walkPath: string) {
	let url = ''

	if (file.endsWith('index.mdx')) {
		url = `${file.substring(
			walkPath.length + 1,
			file.length - '/index.mdx'.length,
		)}`
		// is this any other mdx file?
	} else if (file.endsWith('.mdx')) {
		url = `${file.substring(walkPath.length + 1, file.length - '.mdx'.length)}`
	}

	return url
}

export async function writeFile(filepath: string, contents: string) {
	await fs.mkdir(path.dirname(filepath), { recursive: true })
	fs.writeFile(filepath, contents, 'utf-8')
}
