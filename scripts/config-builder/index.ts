import { existsSync, mkdirSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import toml from 'toml'
import { z } from 'zod'

const configKeys = [
	'operatorVersion',
	'imageCrunchyPostgres',
	'imageCrunchyPostgresPrivate',
	'imageCrunchyPGBackrest',
	'imageCrunchyPGBackrestPrivate',
	'imageCrunchyPGBouncer',
	'imageCrunchyPGUpgrade',
	'imageCrunchyExporter',
	'imageCrunchyPGAdmin',
	'operatorRepository',
	'operatorRepositoryPrivate',
	'postgresOperatorTag',
	'PGBouncerComponentTagUbi8',
	'PGBouncerTagUbi8',
	'postgres14GIS32ComponentTagUbi8',
	'postgres14GIS32TagUbi8',
	'fromPostgresVersion',
	'postgresVersion',
	'postgresVersion13',
	'postGISVersion',
	'operatorHelmRepository',
]

async function main(input: string, output: string) {
	if (!existsSync(output)) {
		mkdirSync(output, { recursive: true })
	}

	try {
		const configToml = await readFile(input, 'utf-8')
		const data = toml.parse(configToml)
		const { params } = configValidator.parse(data)
		const config: Record<string, string | boolean> = {}

		for (const key of configKeys) {
			const foundParam = params?.[key]
			if (foundParam) {
				config[key] = foundParam
			}
		}

		await writeFile(join(output, 'config.json'), JSON.stringify(config))
	} catch (e) {
		console.error(e)
	}
}

const configValidator = z.object({
	params: z.record(z.string().or(z.boolean())),
})

main(process.argv[2], process.argv[3])
