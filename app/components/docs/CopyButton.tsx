import {
	ClipboardDocumentCheckIcon,
	ClipboardDocumentIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { useCallback, useState } from 'react'

/**
 * A reusable cooldown hook for changing a button label when text was copied to
 * the clipboard. Calls during cooldown will cancel the previous.
 *
 * @example
 * const [isCopied, startCooldown] = useCooldown()
 *
 * function onClick (e) {
 *   startCooldown();
 * }
 *
 * <span>{isCopied ? 'copied' : 'copy'}</span>
 */
export function useCooldown(): [boolean, () => void] {
	const [cooldown, setCooldown] = useState<NodeJS.Timeout>()

	const startCooldown = useCallback(() => {
		if (cooldown) clearTimeout(cooldown)

		setCooldown(
			setTimeout(() => {
				setCooldown(undefined)
			}, 3000),
		)
	}, [cooldown, setCooldown])

	return [!!cooldown, startCooldown]
}

export default function CopyButton({ text }: { text: string }) {
	const [isCopied, startCooldown] = useCooldown()

	const onClick = useCallback(() => {
		window?.navigator?.clipboard?.writeText(text)
		startCooldown()
	}, [text, startCooldown])

	return (
		<button
			type="button"
			onClick={onClick}
			className={clsx(
				'absolute right-3 top-3 flex cursor-pointer flex-row items-center justify-center rounded-md border border-transparent px-2 py-1 text-primary opacity-0 shadow-sm transition duration-300 hover:opacity-50 hover:shadow-md focus:ring-2 focus:ring-crunchy/50 group-hover:opacity-75 sm:text-sm',
				isCopied
					? 'bg-emerald-500 text-white focus:ring-emerald-500/50'
					: `bg-white`,
			)}
		>
			{isCopied ? (
				<>
					<ClipboardDocumentCheckIcon className="mr-1 h-4 w-4" />
					Copied
				</>
			) : (
				<>
					<ClipboardDocumentIcon className="mr-1 h-4 w-4" />
					Copy
				</>
			)}
		</button>
	)
}
