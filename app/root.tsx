import { cssBundleHref } from '@remix-run/css-bundle'
import {
	json,
	type LinksFunction,
	type SerializeFrom,
	type V2_MetaFunction,
} from '@remix-run/node'
import {
	isRouteErrorResponse,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useLocation,
	useRouteError,
	useRouteLoaderData,
} from '@remix-run/react'
import { useEffect, useState } from 'react'
import invariant from 'tiny-invariant'
import ErrorPage from './components/layout/ErrorPage.tsx'
import tailwindStylesheetUrl from './styles/tailwind.css'
import { getEnv } from './utils/env.server.ts'

export const handle = {
	id: 'root',
}

export const links: LinksFunction = () => {
	return [
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export const meta: V2_MetaFunction = () => {
	return [
		{ title: 'Crunchy Data Documentation' },
		{ name: 'description', content: 'Documentation for Crunchy Data.' },
	]
}

export async function loader() {
	return json({
		ENV: getEnv(),
	})
}

export function useRootLoaderData(): SerializeFrom<typeof loader> {
	const data = useRouteLoaderData('root') as
		| SerializeFrom<typeof loader>
		| undefined
	invariant(data, 'Unable to find root layout data')
	return data
}

export default function App() {
	let { ENV } = useLoaderData<typeof loader>()
	const { pathname } = useLocation()
	const [encodedPage, setEncodedPage] = useState<string | null>(null)

	useEffect(() => {
		setEncodedPage(window.btoa(window.location.href))
	}, [pathname])

	return (
		<html
			lang="en"
			className="min-h-screen bg-white text-secondary antialiased"
		>
			<head>
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Links />

				<link
					href="/favicons/apple-icon-57x57.png"
					rel="apple-touch-icon"
					sizes="57x57"
					type="image/png"
				/>
				<link
					href="/favicons/apple-icon-60x60.png"
					rel="apple-touch-icon"
					sizes="60x60"
					type="image/png"
				/>
				<link
					href="/favicons/apple-icon-72x72.png"
					rel="apple-touch-icon"
					sizes="72x72"
					type="image/png"
				/>
				<link
					href="/favicons/apple-icon-76x76.png"
					rel="apple-touch-icon"
					sizes="76x76"
					type="image/png"
				/>
				<link
					href="/favicons/apple-icon-114x114.png"
					rel="apple-touch-icon"
					sizes="114x114"
					type="image/png"
				/>
				<link
					href="/favicons/apple-icon-120x120.png"
					rel="apple-touch-icon"
					sizes="120x120"
					type="image/png"
				/>
				<link
					href="/favicons/apple-icon-144x144.png"
					rel="apple-touch-icon"
					sizes="144x144"
					type="image/png"
				/>
				<link
					href="/favicons/apple-icon-152x152.png"
					rel="apple-touch-icon"
					sizes="152x152"
					type="image/png"
				/>
				<link
					href="/favicons/apple-icon-180x180.png"
					rel="apple-touch-icon"
					sizes="180x180"
					type="image/png"
				/>
				<link
					href="/favicons/android-icon-192x192.png"
					rel="icon"
					sizes="192x192"
					type="image/png"
				/>
				<link
					href="/favicons/favicon-32x32.png"
					rel="icon"
					sizes="32x32"
					type="image/png"
				/>
				<link
					href="/favicons/favicon-96x96.png"
					rel="icon"
					sizes="96x96"
					type="image/png"
				/>
				<link
					href="/favicons/favicon-16x16.png"
					rel="icon"
					sizes="16x16"
					type="image/png"
				/>
				<link href="/favicons/manifest.json" rel="manifest" />
				<meta content="#193656" name="msapplication-TileColor" />
				<meta
					content="/favicons/ms-icon-144x144.png"
					name="msapplication-TileImage"
				/>
				<meta content="#193656" name="theme-color" />
				<link href="/favicon.ico" rel="shortcut icon" type="image/x-icon" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin=""
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400;0,500;0,700;1,400&family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;1,400&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				{ENV.MODE === 'production' &&
				!pathname.startsWith('/documentation/private') ? (
					<>
						{encodedPage ? (
							<img
								aria-hidden
								alt=""
								height="1"
								width="1"
								src={`https://link.crunchydata.com/logo.gif?page=${encodedPage}`}
							/>
						) : null}
						<script src="https://link.crunchydata.com/cd.js"></script>
						<script
							async
							src="https://www.googletagmanager.com/gtag/js?id=UA-92590099-4"
						></script>
						<script
							dangerouslySetInnerHTML={{
								__html: `window.dataLayer = window.dataLayer || [];
							function gtag(){dataLayer.push(arguments);}
							gtag('js', new Date());
							gtag('config', 'UA-92590099-4');`,
							}}
						/>
					</>
				) : null}
				<script
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(ENV)}`,
					}}
				/>
				<LiveReload />
			</body>
		</html>
	)
}

export function ErrorBoundary() {
	const error = useRouteError()
	console.log(error)
	let status = 500
	let message = 'Unknown error'

	if (isRouteErrorResponse(error)) {
		status = error.status
		message = error.data
	} else if (error instanceof Error) {
		message = error.message
	}

	return (
		<ErrorDocument title="Error!">
			<ErrorPage code={status} title={`There was an error`} message={message} />
		</ErrorDocument>
	)
}

function ErrorDocument({
	children,
	title,
}: {
	children: React.ReactNode
	title?: string
}) {
	return (
		<html className="h-full" lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				{title ? <title>{title}</title> : null}
				<Meta />
				<Links />
			</head>
			<body className="h-full">
				{children}
				<ScrollRestoration />
				<Scripts />
				{process.env.NODE_ENV === 'development' && <LiveReload />}
			</body>
		</html>
	)
}
