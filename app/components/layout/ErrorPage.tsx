import { Link } from '@remix-run/react'

export default function ErrorPage({
	code = 404,
	title = 'Page Not Found',
	message = 'Please check the URL in the address bar and try again',
}: {
	code?: number
	title?: string
	message?: JSX.Element | string
}) {
	return (
		<div className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
			<main className="sm:flex">
				<p className="text-4xl font-extrabold text-crunchy sm:text-5xl">
					{code}
				</p>
				<div className="sm:ml-6">
					<div className="sm:border-l sm:border-gray-200 sm:pl-6">
						<h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
							{title}
						</h1>
						<p className="mt-1 text-base text-gray-500">{message}</p>
					</div>
					<div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
						<Link
							to="/"
							className="hover:bg-crunchy-hover inline-flex items-center rounded-md border border-transparent bg-crunchy px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-crunchy/50 focus:ring-offset-2"
						>
							Go back home
						</Link>
					</div>
				</div>
			</main>
		</div>
	)
}
