import { Combobox, Dialog, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import type { Dispatch, SetStateAction } from 'react'
import { Fragment, useEffect, useState } from 'react'

import { useFetcher, useNavigate } from '@remix-run/react'

import { clsx } from 'clsx'
import { SearchDoc } from '~/lib/docs/search.server.ts'
import {
	SearchDocExcerpt,
	type loader,
} from '~/routes/documentation.$product.$ref.actions.search.tsx'

function showExcerpt(body: string | null, query: string) {
	if (body === null) return '...'

	if (!body.includes(query)) return `${body}...`

	const [before, after] = body.split(query)
	return (
		<>
			...{before}
			<strong>{query}</strong>
			{after}...
		</>
	)
}

type DisplayState = 'list' | 'loading' | 'empty' | 'init'

export function SearchPalette({
	open,
	setOpen,
	productPath,
	isPrivate = false,
}: {
	open: boolean
	setOpen: Dispatch<SetStateAction<boolean>>
	productPath: string
	isPrivate?: boolean
}) {
	const [query, setQuery] = useState('')
	const { load, ...fetcher } = useFetcher<typeof loader>()
	const navigate = useNavigate()
	const results: SearchDocExcerpt[] = fetcher.data?.results ?? [] // initially data is undefined

	useEffect(
		function getFilteredPosts() {
			load(
				`/documentation${
					isPrivate ? '/private' : ''
				}${productPath}/actions/search?term=${query}`,
			)
		},
		[load, query],
	)

	const display: DisplayState = getDisplayState({
		query,
		results,
		loading: fetcher.state !== 'idle',
	})

	return (
		<Transition.Root
			show={open}
			as={Fragment}
			afterLeave={() => setQuery('')}
			appear
		>
			<Dialog as="div" className="relative z-10" onClose={setOpen}>
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
				</Transition.Child>

				<div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<Dialog.Panel className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
							<Combobox
								onChange={(doc: SearchDoc) => {
									navigate(doc.slug)
									setOpen(false)
								}}
							>
								<div className="relative">
									<MagnifyingGlassIcon
										className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
										aria-hidden="true"
									/>
									<Combobox.Input
										className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:ring-0 sm:text-sm"
										placeholder="Search..."
										onChange={event => setQuery(event.target.value)}
									/>
									{fetcher.state !== 'idle' && results.length ? (
										<Spinner className="absolute right-4 top-3.5 h-5 w-5" />
									) : null}
								</div>

								<SearchResults
									results={results}
									display={display}
									query={query}
								/>
							</Combobox>
						</Dialog.Panel>
					</Transition.Child>
				</div>
			</Dialog>
		</Transition.Root>
	)
}

function SearchResults({
	results,
	display,
	query,
}: {
	results: SearchDocExcerpt[]
	display: DisplayState
	query: string
}) {
	switch (display) {
		case 'list':
			return (
				<Combobox.Options
					static
					className="max-h-72 scroll-py-2 overflow-y-auto py-2 text-sm text-gray-800"
				>
					{results.map(doc => (
						<Combobox.Option
							key={doc.slug}
							value={doc}
							className={({ active }) =>
								clsx(
									'flex cursor-default select-none flex-col gap-0.5 px-4 py-3',
									active && 'bg-crunchy',
								)
							}
						>
							{({ active }) => (
								<>
									<span
										className={clsx(
											'font-display font-bold',
											active ? 'text-white' : 'text-primary',
										)}
									>
										{doc.title}
									</span>
									<span className={clsx(active && 'text-white/75')}>
										{showExcerpt(doc.body, query)}
									</span>
								</>
							)}
						</Combobox.Option>
					))}
				</Combobox.Options>
			)

		case 'loading':
			return (
				<div className="flex items-center px-4 py-4">
					<Spinner />
					<p>Loading search results</p>
				</div>
			)

		case 'empty':
			return <p className="p-4 text-sm text-gray-500">No Matches found.</p>

		case 'init':
		default:
			return null
	}
}

function Spinner({ className = 'mr-2 h-5 w-5' }: { className?: string }) {
	return (
		<div role="status">
			<svg
				aria-hidden="true"
				className={clsx(className, 'animate-spin fill-crunchy text-gray-200')}
				viewBox="0 0 100 101"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
					fill="currentColor"
				/>
				<path
					d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
					fill="currentFill"
				/>
			</svg>
			<span className="sr-only">Loading...</span>
		</div>
	)
}

function getDisplayState({
	query,
	results,
	loading,
}: {
	query: string
	results: SearchDocExcerpt[]
	loading: boolean
}): DisplayState {
	if (results.length) return 'list'
	if (!query.length) return 'init'
	if (loading) return 'loading'
	return 'empty'
}
