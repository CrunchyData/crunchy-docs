export type Resource = {}

export type Schema =
	| {
			type: 'root'
			group: string
			name: string
			slug: string
			version: string
			description?: string
			properties: Schema[]
			required: boolean
	  }
	| {
			type:
				| 'string'
				| 'integer'
				| 'map[string]: int|string'
				| 'map[string]: string'
				| string[]
			name: string
			slug: string
			description?: string
			required: boolean
	  }
	| {
			type: 'object'
			name: string
			slug: string
			description?: string
			required: boolean
			properties?: Schema[]
			parentName: string
			parentSlug: string
	  }
	| {
			type: '[]string' | '[]integer'
			name: string
			slug: string
			description?: string
			required: boolean
	  }
	| {
			type: '[]object'
			name: string
			slug: string
			description?: string
			required: boolean
			items?: Schema[]
			parentName: string
			parentSlug: string
	  }
