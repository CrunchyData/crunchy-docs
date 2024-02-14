import Ref from './Ref.tsx'

export function RoleVar({
	value,
	deprecated = false,
}: {
	value: string
	deprecated?: boolean
}) {
	// Regular expression to extract role and variable from inner string
	const [role, name] = value.split('/')

	// Handle deprecated scenario
	if (deprecated) {
		return (
			<span className="yaml rolevar deprecated">
				<Ref to="/documentation/crunchy-ha-postgresql/#deprecatedobsolete-variables">
					{name}
				</Ref>
			</span>
		)
	}

	// Construct URL based on role and variable
	const url = role
		? `references/roles/crunchydata.pg.${
				role !== 'global' ? `${role}/` : ''
		  }#${name}`
		: ''

	return (
		<span>
			<em>
				<Ref to={url}>{name}</Ref>
			</em>
		</span>
	)
}
