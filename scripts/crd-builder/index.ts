import fs, { existsSync, mkdirSync, type WriteStream } from 'fs'
import yaml from 'js-yaml'
import path from 'node:path'
import { walk } from '../utils.ts'
import { type Schema } from './types.ts'

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
	walk(input, filepath => {
		const schema = readSchema(filepath)
		const resource = transformSchema(schema)
		writeMarkdown(resource, output)
	})
}

export function readSchema(input: string) {
	const schemaFile = fs.readFileSync(input, 'utf-8')
	return yaml.load(schemaFile) as RawResource
}

function transformSchema(resource: RawResource): Schema {
	const { spec } = resource
	const rootSchema = spec.versions[0].schema.openAPIV3Schema
	if (rootSchema.type !== 'object') {
		throw Error('The root schema is not an object.')
	}

	const name = spec.names.kind
	const slug = nameToSlug(name)
	const description = rootSchema.description ?? ''

	let schemas: Schema[] = rootSchema?.properties
		? buildProperties(rootSchema.properties, {
				name,
				slug,
				requiredList: ['apiVersion', 'kind', 'metadata'],
		  })
		: []

	return {
		type: 'root',
		group: spec.group,
		name: spec.names.kind,
		slug: nameToSlug(spec.names.kind),
		version: spec.versions[0].name,
		description: transformDescription(description),
		properties: schemas,
		required: false,
	}
}

function buildProperties(
	rawSchemas: Record<string, RawSchema>,
	parent: { name: string; slug: string; requiredList: string[] },
): Schema[] {
	let schemas: Schema[] = []

	for (let [name, data] of Object.entries(rawSchemas)) {
		const base = {
			name,
			slug: nameToSlug(name),
			description: data.description
				? transformDescription(data.description)
				: undefined,
			required: parent.requiredList.includes(name),
		}

		switch (data.type) {
			case 'string':
				schemas.push({ ...base, type: data.enum ?? 'string' })
				break
			case 'integer':
				schemas.push({ ...base, type: 'integer' })
				break
			case 'array':
				if (data.items.type === 'array') break
				if (data.items.type === 'object') {
					schemas.push({
						...base,
						type: '[]object',
						parentName: parent.name,
						parentSlug: parent.slug,
						items: data.items['x-kubernetes-preserve-unknown-fields']
							? undefined
							: buildProperties(data.items.properties, {
									name: `${parent.name}.${base.name}[index]`,
									slug: `${parent.slug}${base.slug}index`,
									requiredList: data.items.required ?? [],
							  }),
					})
					break
				}

				schemas.push({
					...base,
					type: `[]${data.items.type}`,
				})
				break

			case 'object': {
				if (name === 'metadata' && !data.properties) {
					schemas.push({
						...base,
						type: 'object',
						description:
							'Refer to the Kubernetes API documentation for the fields of the `metadata` field.',
						properties: [],
						parentName: parent.name,
						parentSlug: parent.slug,
					})
					break
				}

				if (data.additionalProperties) {
					const intOrString =
						data.additionalProperties['x-kubernetes-int-or-string']

					schemas.push({
						...base,
						type: intOrString
							? `map[string]: int\|string`
							: 'map[string]: string',
					})
					break
				}
				schemas.push({
					...base,
					type: 'object',
					parentName: parent.name,
					parentSlug: parent.slug,
					properties: data['x-kubernetes-preserve-unknown-fields']
						? undefined
						: buildProperties(data.properties, {
								name: `${parent.name}.${base.name}`,
								slug: `${parent.slug}${base.slug}`,
								requiredList: data.required ?? [],
						  }),
				})
			}
		}
	}

	return schemas
}

function nameToSlug(name: string) {
	return name.toLowerCase().replace(/\W/g, '')
}

function transformDescription(description: string) {
	return description.replace(
		/([^`])(<key,\s?value>|<key,value,effect>|<operator>|<topologyKey>|\(\s?\{\}\)|\{key,value\}|\{\(key, value\)\})([^`]?)/gm,
		(match, prefix, content, suffix) => `${prefix}\`${content}\`${suffix}`,
	)
}

function writeMarkdown(resource: Schema, outputDir: string) {
	const filename = path.join(outputDir, resource.name.toLowerCase() + '.mdx')
	const stream = fs.createWriteStream(filename)
	stream.on('error', e => {
		console.error(e)
	})

	generateMarkdown(stream, resource)

	stream.end()
}

function generateMarkdown(stream: WriteStream, resource: Schema) {
	type Frontmatter = {
		title: string
		draft: boolean
	}

	const frontmatter: Frontmatter = {
		title: resource.name,
		draft: false,
	}

	const frontmatterData = yaml.dump(frontmatter)

	stream.write('---\n')
	stream.write(frontmatterData)
	stream.write('---\n\n')

	stream.write(`
{/*

	THIS FILE IS AUTO-GENERATED.

	Making changes to it will be overwritten on the next cron.

	Instead, make changes to the generator script here:

	https://github.com/CrunchyData/crunchy-docs/blob/main/scripts/crd-builder/index.ts

*/}

`)

	stream.write(`<h2 id="${resource.slug}">${resource.name}</h2>`)
	stream.write('\n\n')
	stream.write(resource.description)
	stream.write('\n\n')
	stream.write(tableHeading)
	stream.write(tableAlignment)
	if (resource.type !== 'root') throw Error('Root schema is not object.')
	stream.write(propertyTable(resource.properties))
	stream.write('\n\n')
	resource.properties.forEach(
		schema => schema.name !== 'metadata' && schemaToMarkdown(stream, schema),
	)
}

function schemaToMarkdown(stream: WriteStream, schema: Schema) {
	switch (schema.type) {
		case 'object': {
			if (!schema.properties) return stream
			stream.write(
				`<ChildHeading id="${schema.parentSlug}${schema.slug}" parentId="${schema.parentSlug}">${schema.parentName}.${schema.name}</ChildHeading>`,
			)
			stream.write('\n\n')
			if (schema.description) {
				stream.write(schema.description)
				stream.write('\n\n')
			}

			stream.write(tableHeading)
			stream.write(tableAlignment)
			stream.write(propertyTable(schema.properties))
			stream.write('\n\n')
			schema.properties.forEach(property => schemaToMarkdown(stream, property))
			return stream
		}

		case '[]object': {
			if (!schema.items) return stream
			stream.write(
				`<ChildHeading id="${schema.parentSlug}${schema.slug}index" parentId="${schema.parentSlug}">${schema.parentName}.${schema.name}[index]</ChildHeading>`,
			)
			stream.write('\n\n')
			if (schema.description) {
				stream.write(schema.description)
				stream.write('\n\n')
			}

			stream.write(tableHeading)
			stream.write(tableAlignment)
			stream.write(propertyTable(schema.items))
			stream.write('\n\n')
			schema.items.forEach(item => schemaToMarkdown(stream, item))
			return stream
		}

		default:
			return stream
	}
}

const tableHeading = '| name | type | required | description |\n'
const tableAlignment = '| :---- | ---- | :----: | :---- |\n'
function propertyTable(properties: Schema[]): string {
	return properties
		.map(property => {
			let name = property.name
			let pType: string = Array.isArray(property.type)
				? property.type.map(type => `\`${type}\``).join(', ')
				: `\`${property.type}\``

			if (property.type === '[]object') {
				name = `<TableLink to="${property.parentSlug}${property.slug}index">${property.name}</TableLink>`
			}

			if (property.type === 'object') {
				name = `<TableLink to="${property.parentSlug}${property.slug}">${property.name}</TableLink>`
			}

			return `| ${name} | ${pType} | ${property.required ? '✅' : '❌'} | ${
				property.description
			} |`
		})
		.join('\n')
}

type BaseRawSchema = {
	description?: string
}

type StringSchema = BaseRawSchema & {
	type: 'string'
	enum?: string[]
}

type IntegerSchema = BaseRawSchema & {
	type: 'integer'
}

type ArraySchema = BaseRawSchema & {
	type: 'array'
	items: RawSchema
}

type ObjectSchema = BaseRawSchema & {
	'type': 'object'
	'properties': Record<string, RawSchema>
	'additionalProperties'?: {
		'x-kubernetes-int-or-string'?: boolean
	}
	'x-kubernetes-preserve-unknown-fields': boolean
	'required'?: string[]
}

type RawSchema = StringSchema | IntegerSchema | ArraySchema | ObjectSchema

type RawResource = {
	spec: {
		group: string
		names: {
			kind: string
		}
		versions: {
			name: string
			schema: {
				openAPIV3Schema: ObjectSchema
			}
		}[]
	}
}

main(process.argv[2], process.argv[3])
