import fs, { existsSync, mkdirSync } from 'fs'
import yaml from 'js-yaml'
import util from 'util'
import { z } from 'zod'
import { Schema } from './types.ts'

function main(input: string, output: string) {
	if (!existsSync(output)) {
		mkdirSync(output, { recursive: true })
	}

	try {
		updateAPIRef(input, output)
	} catch (e) {
		console.error(e)
	}
}

function updateAPIRef(input: string, output: string) {
	const schema = readSchema(input)
	const resource = schemaToResource(schema)
	console.log(util.inspect(resource, { depth: null, colors: true }))
	// generateAndWriteMarkdown(schema, output)
}

export function readSchema(input: string) {
	const schemaFile = fs.readFileSync(input, 'utf-8')
	return yaml.load(schemaFile) as Record<string, any>
}

function transformSchema(schema: Record<string, any>): Schema {
	const { spec } = rawResourceValidator.parse(schema)
	const rootSchema = spec.versions[0].schema.openAPIV3Schema
	if (rootSchema.type !== 'object') {
		throw Error('The root schema is not an object.')
	}

	let schemas: Schema[] = rootSchema?.properties
		? buildProperties(rootSchema.properties, ['apiVersion', 'kind', 'metadata'])
		: []

	return {
		type: 'root',
		group: spec.group,
		name: spec.names.kind,
		slug: nameToSlug(spec.names.kind),
		version: spec.versions[0].name,
		description: spec.versions[0].schema.openAPIV3Schema.description,
		properties: schemas,
	}
}

function buildProperties(
	rawSchemas: Record<string, RawSchema>,
	requiredList: string[],
): Schema[] {
	let schemas: Schema[] = []

	for (let [name, data] of Object.entries(rawSchemas)) {
		const base = {
			name,
			slug: nameToSlug(name),
			description: data.description,
			required: requiredList.includes(name),
		}

		switch (data.type) {
			case 'string':
				schemas.push({ ...base, type: data.enum ?? 'string' })
				break
			case 'integer':
				schemas.push({ ...base, type: 'integer' })
				break
			case 'array':
				schemas.push({
					...base,
					type: 'array',
					items: [] as Schema[],
				})
				break
			case 'object': {
				if (data.additionalProperties) {
					const intOrString =
						data.additionalProperties['x-kubernetes-int-or-string']

					schemas.push({
						...base,
						type: intOrString
							? 'map[string]: int|string'
							: 'map[string]: string',
					})
					break
				}

				schemas.push({
					...base,
					type: 'object',
					properties: buildProperties(data.properties, data.required ?? []),
				})
			}
		}
	}

	return schemas
}

function nameToSlug(name: string) {
	return name.toLowerCase().replace(/\W/g, '')
}

const baseRawSchema = z.object({
	description: z.string().optional(),
})

type StringSchema = z.infer<typeof stringSchema>
const stringSchema = baseRawSchema.extend({
	type: z.literal('string'),
	enum: z.array(z.string()).optional(),
})

type IntegerSchema = z.infer<typeof integerSchema>
const integerSchema = baseRawSchema.extend({
	type: z.literal('integer'),
})

const baseArraySchema = baseRawSchema.extend({
	type: z.literal('array'),
})

const baseObjectSchema = baseRawSchema.extend({
	type: z.literal('object'),
	required: z.array(z.string()).optional(),
	additionalProperties: z
		.object({
			'x-kubernetes-int-or-string': z.boolean().optional(),
		})
		.optional(),
})

type ArraySchema = z.infer<typeof baseRawSchema> & {
	type: 'array'
	items: RawSchema
}

type ObjectSchema = z.infer<typeof baseObjectSchema> & {
	properties: Record<string, RawSchema>
}

type RawSchema = StringSchema | IntegerSchema | ArraySchema | ObjectSchema

const rawSchema: z.ZodType<RawSchema> = z.union([
	stringSchema,
	integerSchema,
	baseArraySchema.extend({
		items: z.lazy(() => rawSchema),
	}),
	baseObjectSchema.extend({
		properties: z.lazy(() => z.record(rawSchema)),
	}),
])

const rawResourceValidator = z.object({
	spec: z.object({
		group: z.string(),
		names: z.object({ kind: z.string() }),
		versions: z.array(
			z.object({
				name: z.string(),
				schema: z.object({ openAPIV3Schema: rawSchema }),
			}),
		),
	}),
})

main(process.argv[2], process.argv[3])
