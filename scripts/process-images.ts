import { existsSync, mkdirSync, watch } from 'fs'
import loading from 'loading-cli'
import { parse } from 'path'
import sharp from 'sharp'
import { walk } from './utils.ts'

/***
 * build a cache file for each content-type
 * walkPath: the path to read
 * filename: what to save the cache file as
 * urlPath: used for slugs, such as /docs, /posts, etc
 ***/
async function processImages() {
	const inputDir = './images'
	const webOutputDir = '/public/images'
	const pdfOutputDir = '/public/pdf/images'

	const load = loading('Processing images').start()
	await walk(inputDir, async path => {
		if (
			path.endsWith('.jpg') ||
			path.endsWith('.png') ||
			path.endsWith('.svg')
		) {
			try {
				const base = sharp(path)
				const output = (outputDir: string) =>
					`${process.cwd()}${outputDir}${
						path.replace(inputDir, '').split('.')[0]
					}`
				const webOutput = output(webOutputDir)

				const webParsed = parse(webOutput)

				if (!existsSync(webParsed.dir)) {
					mkdirSync(webParsed.dir, { recursive: true })
				}

				const pdfOutput = output(pdfOutputDir)

				const pdfParsed = parse(pdfOutput)

				if (!existsSync(pdfParsed.dir)) {
					mkdirSync(pdfParsed.dir, { recursive: true })
				}

				Promise.all([
					base.resize({ width: 896 }).toFile(`${pdfOutput}.png`),
					base
						.resize({ width: 896 })
						.webp({ lossless: true })
						.toFile(`${webOutput}.webp`),
					base
						.resize({ width: 1792 })
						.webp({ lossless: true })
						.toFile(`${webOutput}@2x.webp`),
				])
			} catch (error) {
				console.error(`ERROR: Failed to process file ${path}.`)
			}
		}
	})
	load.stop()
}

processImages()

if (process.argv.at(-1) === 'watch') {
	watch('./images', (_eventType, filename) => {
		if (
			filename &&
			(filename.endsWith('.jpg') ||
				filename.endsWith('.png') ||
				filename.endsWith('.svg'))
		) {
			processImages()
		}
	})
}
