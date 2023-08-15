import { createReadStream, createWriteStream } from 'node:fs'
import { rename } from 'node:fs/promises'
import { basename, dirname, join, parse } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { walk } from './utils.ts'

async function transform(rootPath: string) {
	walk(rootPath, async originalPath => {
		if (originalPath.endsWith('README.md')) return

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

				stringChunk = replaceBr(stringChunk)
				stringChunk = replaceParams(stringChunk)
				stringChunk = replaceRefs(stringChunk, filePath!)
				stringChunk = replaceMonitoring(stringChunk)
				stringChunk = replaceNotices(stringChunk)
				stringChunk = replaceIdHeadings(stringChunk)
				stringChunk = replaceMisnamedCodeBlocks(stringChunk)
				stringChunk = replaceBashCodeBlocks(stringChunk)
				stringChunk = replaceSqlCodeBlocks(stringChunk)
				stringChunk = replaceYamlCodeBlocks(stringChunk)
				stringChunk = replaceDefaultCodeBlocks(stringChunk)
				stringChunk = replaceExtraBreaks(stringChunk)
				stringChunk = replaceImages(stringChunk)

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
	const regex = /\[([^\]]+)\]\(\{\{\s?<\s?(?:relref|ref)\s"([^"]+)"[^\)]+\)/gm
	return file.replace(regex, (match, label, to, id) => {
		if (typeof to !== 'string') return match
		to = to.replace(/^\//gm, '').replace('/_index.md', '').replace('.md', '')
		if (to.startsWith('./') || to.startsWith('../')) {
			to = join(filepath, to)
		}

		return `<Ref to="${to}${id}">${label}</Ref>`
	})
}

function replaceMonitoring(file: string): string {
	return file
		.replaceAll(
			'[PGO Monitoring]: {{< relref "installation/monitoring/_index.md" >}}',
			'',
		)
		.replaceAll(
			'[PGO Monitoring]',
			'<Ref to="installation/monitoring">PGO Monitoring</Ref>',
		)
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

function replaceIdHeadings(file: string): string {
	return file.replace(
		/(#+)\s([^\{|\n]+){#([^\}]+)}/gm,
		(match, size, heading, id) => {
			const level = size.length
			return `<h${level} id="${id}">${heading.trim()}</h${level}>`
		},
	)
}

function replaceBr(file: string): string {
	return file.replace(/^<br><br>/gm, '')
}

function replaceExtraBreaks(file: string): string {
	return file.replace(/(\n\s*\n+)/gm, '\n\n')
}

function replaceYamlCodeBlocks(file: string): string {
	const yamlRegex = /```\n(.*:|---|cat)([\s\S]*?)```/gm
	return file.replace(yamlRegex, '```yaml\n$1$2```')
}

function replaceBashCodeBlocks(file: string): string {
	const bashRegex =
		/```\n(kubectl|vacuumdb|rm|\$|YOUR_GITHUB_UN|helm|#|tar|psql|PG_CLUSTER_PRIMARY_POD|PG_CLUSTER_USER_SECRET_NAME|cp|PGO_FEATURE_GATES|PRIMARY_POD|echo|watch|pgo)([\s\S]*?)```/gm
	return file.replace(bashRegex, '```bash\n$1$2```')
}

function replaceMisnamedCodeBlocks(file: string): string {
	return file
		.replaceAll('```shell-session', '```bash')
		.replaceAll('```bash-session', '```bash')
		.replaceAll('```shell', '```bash')
		.replaceAll('```console', '```bash')
}

function replaceSqlCodeBlocks(file: string): string {
	const sqlRegex =
		/```\n(CREATE|\\c|GRANT|TABLE|SHOW|BEGIN|\\set|SELECT|DROP)([\s\S]*?)```/gm
	return file.replace(sqlRegex, '```sql\n$1$2```')
}

function replaceDefaultCodeBlocks(file: string): string {
	const defaultRegex = /```\n[^\n]/gm
	return file.replace(defaultRegex, '```bash\n')
}

function replaceImages(file: string) {
	return file
		.replaceAll(
			'logos/pgo.svg',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/5870a046-db5a-4af3-2bcf-f0c005826400/public',
		)
		.replaceAll(
			'/images/postgresql-cluster-dr-base.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/5e40b6aa-e6f6-4660-6af2-7124553df000/public',
		)
		.replaceAll(
			'/images/repo-based-standby.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/30c09ee1-c1c1-43f6-c4a8-fd0238b05500/public',
		)
		.replaceAll(
			'/images/streaming-standby.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/a8fd8f3c-a1f9-479a-5763-99dd55ae3d00/public',
		)
		.replaceAll(
			'/images/streaming-standby-external-repo.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/4af8ed0a-9b7d-4708-4ab2-913646788900/public',
		)
		.replaceAll(
			'/images/postgresql-ha-overview.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/311e4833-b3ae-4ae7-06a6-f4d16b04d500/public',
		)
		.replaceAll(
			'/images/postgresql-monitoring.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/88984271-ad0e-43f3-d4be-12db42a0e600/public',
		)
		.replaceAll(
			'/images/postgresql-monitoring-overview.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/806850fe-f027-41d7-3495-971f7355b100/public',
		)
		.replaceAll(
			'/images/postgresql-monitoring-cluster.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/778d3c45-8152-4105-8f69-51a205685e00/public',
		)
		.replaceAll(
			'/images/postgresql-monitoring-pod.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/672a61ed-ca2a-469d-a32b-379bfe3ec800/public',
		)
		.replaceAll(
			'/images/postgresql-monitoring-backups.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/fb47f640-bb4a-4044-2412-2f384eb8e000/public',
		)
		.replaceAll(
			'/images/postgresql-monitoring-service.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/8912af0d-986a-4dfa-85b8-bac1b860e800/public',
		)
		.replaceAll(
			'/images/postgresql-monitoring-query-total.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/c19f1690-7751-4599-d1dd-818d5e4dd000/public',
		)
		.replaceAll(
			'/images/postgresql-monitoring-query-topn.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/cfa6e2ab-6528-4a30-32d9-c81c9829ba00/public',
		)
		.replaceAll(
			'/images/postgresql-monitoring-alerts.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/59c93cf6-94ab-456a-6d3a-2f7904810b00/public',
		)
		.replaceAll(
			'/images/postgresql-cluster-architecture.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/f7ac6b3b-a1e2-4169-b774-4d87ce652000/public',
		)
		.replaceAll(
			'/images/pgadmin4-query.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/7a43fb2f-f93e-4aed-2c98-4610d3220f00/public',
		)
		.replaceAll(
			'/images/pgadmin4-login.png',
			'https://imagedelivery.net/lPM0ntuwQfh8VQgJRu0mFg/dcad7131-3d89-4bf0-1ed2-7876a87e7300/public',
		)
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
