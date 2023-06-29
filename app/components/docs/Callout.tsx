import {
	ExclamationTriangleIcon,
	InformationCircleIcon,
} from '@heroicons/react/20/solid'
import { LightBulbIcon } from '@heroicons/react/24/outline'
import type { PropsWithChildren } from 'react'

export function Hint({ children }: PropsWithChildren<{}>) {
	return (
		<div className="mt-6 rounded-lg bg-success-500/20 text-success-900">
			<div className="not-prose px-6 pt-4">
				<p className="flex items-center font-display font-bold">
					<LightBulbIcon className="h-4 w-4" />
					<span className="pl-1">Hint</span>
				</p>
			</div>
			<div className="hint-body px-6 pb-4">{children}</div>
		</div>
	)
}

export function Info({ children }: PropsWithChildren<{}>) {
	return (
		<div className="mt-6 rounded-lg bg-crunchy/20">
			<div className="not-prose px-6 pt-4">
				<p className="flex items-center font-display font-bold">
					<InformationCircleIcon className="h-4 w-4" />
					<span className="pl-1">Info</span>
				</p>
			</div>
			<div className="info-body px-6 pb-4">{children}</div>
		</div>
	)
}

export function Warning({ children }: PropsWithChildren<{}>) {
	return (
		<div className="mt-6 rounded-lg bg-warning-500/20 text-warning-900">
			<div className="not-prose px-6 pt-4">
				<p className="flex items-center font-display font-bold">
					<ExclamationTriangleIcon className="h-4 w-4" />
					<span className="pl-1">Warning</span>
				</p>
			</div>
			<div className="warning-body px-6 pb-4">{children}</div>
		</div>
	)
}
