import { createReadStream, createWriteStream } from 'node:fs'
import { rename } from 'node:fs/promises'
import { basename, dirname, join, parse } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { walk } from './utils.ts'

async function transform(rootPath: string) {
	walk(rootPath, async originalPath => {
		if (
			originalPath.endsWith('README.md') ||
			!originalPath.includes('references/crd')
		)
			return

		let filePath: null | string = null
		if (originalPath.endsWith('_index.md')) {
			filePath = originalPath.replace('_index.md', 'index.mdx')
			await rename(originalPath, filePath)
		} else if (originalPath.endsWith('.md')) {
			filePath = originalPath.replace('.md', '.mdx')
			await rename(originalPath, filePath)
		} else if (originalPath.endsWith('.mdx')) {
			filePath = originalPath
		}

		if (!filePath) return
		console.log('Migrating file: ', filePath)
		const tempFilePath = createTempFilepath(filePath)

		// Create a readable stream to read the file content
		const inputStream = createReadStream(filePath, { encoding: 'utf8' })

		// Create a writable stream to write the modified content to a temporary file
		const tempOutputStream = createWriteStream(tempFilePath)

		// Create a transform stream to perform the find and replace
		const transformStream = new Transform({
			transform(chunk, encoding, callback) {
				// Replace the search value with the replace value in the chunk
				let stringChunk = chunk.toString()

				if (filePath?.includes('/references/crd.mdx')) {
					stringChunk = replaceBoldTag(stringChunk)
					stringChunk = replaceItalicTag(stringChunk)
					stringChunk = replaceReferenceHeadings(stringChunk)
					stringChunk = replaceEscapeChars(stringChunk)
				} else {
					stringChunk = replaceParams(stringChunk)
					stringChunk = replaceRefs(stringChunk, filePath!)
					stringChunk = replaceNotices(stringChunk)
					stringChunk = replaceIdHeadings(stringChunk)
				}

				// stringChunk = replaceParagraphBreaks(stringChunk)
				stringChunk = replaceExtraBreaks(stringChunk)

				// Pass the replaced chunk to the output stream
				this.push(stringChunk)
				callback()
			},
		})

		// Pipe the input stream through the transform stream to the temporary output stream
		try {
			await pipeline(inputStream, transformStream, tempOutputStream)
		} catch (error) {
			console.error(
				'An error occurred during the find and replace operation:',
				error,
			)
		}

		console.log('Find and replace completed successfully.')

		try {
			rename(tempFilePath, filePath)
			console.log('File replaced successfully.')
		} catch (error) {
			console.error('Error replacing the file:', error)
		}
	})
}

function replaceParams(file: string): string {
	const regex = /\{\{\s?<\s?param\s([^\s]+)\s>\}\}/gm
	return file.replace(regex, (_, param) => `{${param}}`)
}

function replaceRefs(file: string, filepath: string): string {
	const regex = /\[([^\]]+)\]\(\{\{\s?<\s?relref\s"([^"]+)"[^\)]+\)/gm
	return file.replace(regex, (match, label, to, id) => {
		if (typeof to !== 'string') return match
		to = to.replace(/^\//gm, '').replace('/_index.md', '').replace('.md', '')
		if (to.startsWith('./') || to.startsWith('../')) {
			to = join(filepath, to)
		}

		return `<Ref to="${to}${id}">${label}</Ref>`
	})
}

function replaceNotices(file: string): string {
	const regex =
		/\{\{\s?%\s?notice\s([^\s]+)\s%\}\}([\s\S]+?(?={{))\{\{\s?%\s?\/\s?notice\s%\}\}/gm
	return file.replace(regex, (match, noticeType, content) => {
		switch (noticeType) {
			case 'warning':
				return `<Warning>${content}</Warning>`
			case 'info':
			case 'note':
				return `<Info>${content}</Info>`
			case 'tip':
				return `<Hint>${content}</Hint>`

			default:
				return match
		}
	})
}

function replaceParagraphBreaks(file: string): string {
	return file.replace(
		/(?:\n\n)([^#|-|\[].*?)(?=\n\n|$)/gs,
		(match, paragraph) => `\n\n${paragraph.trim().replace('\n', ' ')}`,
	)
}
function replaceIdHeadings(file: string): string {
	return file.replace(
		/(#+)\s([^\{|\n]+){#([^\}]+)}/gm,
		(match, size, heading, id) => {
			const level = size.length
			return `<h${level} id="${id}">${heading.trim()}</h${level}>`
		},
	)
}

function replaceExtraBreaks(file: string): string {
	return file.replace(/(\n\s*\n+)/gm, '\n\n')
}

function replaceEscapeChars(file: string): string {
	return file.replace(
		/([^`])(<key,\s?value>|<key,value,effect>|<operator>|<topologyKey>|\(\s?\{\}\)|\{key,value\}|\{\(key, value\)\})([^`]?)/gm,
		(match, prefix, content, suffix) => `${prefix}\`${content}\`${suffix}`,
	)
}

function replaceBoldTag(file: string): string {
	return file.replaceAll('<b>', '<strong>').replaceAll('</b>', '</strong>')
}

function replaceItalicTag(file: string): string {
	return file.replaceAll('<i>', '<em>').replaceAll('</i>', '</em>')
}

function replaceReferenceHeadings(file: string): string {
	const childHeadingRegex =
		/<h3 id="([^"]+)">\s*?([^\s]+)[^#]*#([^"]+)([\s\S]*?)<\/h3>/gm

	return file.replace(childHeadingRegex, (_, id, text, parentId) => {
		return `<ChildHeading id="${id}" parentId="${parentId}">${text}</ChildHeading>`
	})
}

function createTempFilepath(filepath: string): string {
	const directory = dirname(filepath)
	const filename = basename(filepath)

	// Split the filename into its name and extension parts
	const { name, ext } = parse(filename)

	// Create the new filename with "-temp" added before the extension
	const newFilename = name + '-temp' + ext

	// Create the new filepath by joining the directory, new filename, and extension
	return join(directory, newFilename)
}

transform(process.argv[2])
