import { clsx } from 'clsx'
import { type PropsWithChildren } from 'react'

const variants = {
	enum: 'bg-crunchy/25',
	deprecated: 'bg-orange-300',
}

type Variant = {
	variant?: keyof typeof variants
}

export default function Enum({
	children,
	variant = 'enum',
}: PropsWithChildren<Variant>) {
	const bg = variants[variant]
	return (
		<span
			className={clsx(
				bg,
				'inline-block rounded px-1.5 py-0.5 text-xs font-bold uppercase text-primary',
			)}
		>
			{children}
		</span>
	)
}
