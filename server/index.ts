import { createRequestHandler } from '@remix-run/express'
import { broadcastDevReady } from '@remix-run/node'
import address from 'address'
import chalk from 'chalk'
import chokidar from 'chokidar'
import closeWithGrace from 'close-with-grace'
import compression from 'compression'
import express, {
	type NextFunction,
	type Request,
	type RequestHandler,
	type Response,
} from 'express'
import { readFile, readdir } from 'fs/promises'
import morgan from 'morgan'
import path from 'path'
import {
	compile as compileRedirectPath,
	pathToRegexp,
	type Key,
} from 'path-to-regexp'
import { fileURLToPath, pathToFileURL } from 'url'

const BUILD_DIR = path.join(process.cwd(), 'build', 'index.js')
const BUILD_DIR_FILE_URL = pathToFileURL(BUILD_DIR).href

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const here = (...d: Array<string>) => path.join(__dirname, ...d)
let update = Date.now()
const getLatestBuild = () => import(`${BUILD_DIR_FILE_URL}?update=${update}`)

const app = express()

app.use(compression())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

// Remix fingerprints its assets so we can cache forever.
app.use(
	'/build',
	express.static('public/build', { immutable: true, maxAge: '1y' }),
)

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }))

morgan.token('url', (req, res) => decodeURIComponent(req.url ?? ''))
app.use(morgan('tiny'))

app.all(
	'*',
	getRedirectsMiddleware({
		redirectsString: await getRedirectFiles(),
	}),
)

app.all(
	'*',
	process.env.NODE_ENV === 'development'
		? async (req, res, next) => {
				return createRequestHandler({
					build: await getLatestBuild(),
					mode: process.env.NODE_ENV,
				})(req, res, next)
		  }
		: createRequestHandler({
				build: await getLatestBuild(),
				mode: process.env.NODE_ENV,
		  }),
)

process.on('uncaughtException', function (exception) {
	console.log(exception) // to see your exception details in the console
	// if you are on production, maybe you can send the exception details to your
	// email as well ?
})

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
	console.error(err)
})

const desiredPort = Number(process.env.PORT || 3000)

const server = app.listen(desiredPort, () => {
	console.log(`🚀  We have liftoff!`)
	const localUrl = `http://localhost:${desiredPort}`
	let lanUrl: string | null = null
	const localIp = address.ip()
	// Check if the address is a private ip
	// https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
	// https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-dev-utils/WebpackDevServerUtils.js#LL48C9-L54C10
	if (/^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(localIp)) {
		lanUrl = `http://${localIp}:${desiredPort}`
	}

	console.log(
		`
${chalk.bold('Local:')}            ${chalk.cyan(localUrl)}
${lanUrl ? `${chalk.bold('On Your Network:')}  ${chalk.cyan(lanUrl)}` : ''}
${chalk.bold('Press Ctrl+C to stop')}
		`.trim(),
	)

	if (process.env.NODE_ENV === 'development') {
		notifyRemixDevReady()
	}
})

closeWithGrace(async () => {
	await new Promise((resolve, reject) => {
		server.close(e => (e ? reject(e) : resolve('ok')))
	})
})

async function notifyRemixDevReady() {
	update = Date.now()
	const build = await getLatestBuild()
	broadcastDevReady(build)
}

// during dev, we'll keep the build module up to date with the changes
if (process.env.NODE_ENV === 'development') {
	// avoid watching the folder itself, just watch its content
	const watcher = chokidar.watch(
		`${path.dirname(BUILD_DIR).replace(/\\/g, '/')}/**.*`,
		{
			ignored: ['**/**.map'],
		},
	)
	watcher.on('all', notifyRemixDevReady)
}

function typedBoolean<T>(
	value: T,
): value is Exclude<T, '' | 0 | false | null | undefined> {
	return Boolean(value)
}

async function getRedirectFiles(): Promise<string> {
	const rootPath = here('./_redirects')
	const results = await readdir(rootPath)
	const redirects: string[] = []

	for (let fileOrDirectory of results) {
		const filePath = `${rootPath}/${fileOrDirectory}`

		if (filePath.endsWith('.txt')) {
			const file = await readFile(filePath, 'utf-8')
			if (file) redirects.push(file)
		}
	}

	return redirects.join('/n')
}

function getRedirectsMiddleware({
	redirectsString,
}: {
	redirectsString: string
}): RequestHandler {
	const possibleMethods = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', '*']
	const redirects = redirectsString
		.split('\n')
		.map((line, lineNumber) => {
			if (!line.trim() || line.startsWith('#')) return null

			let methods, from, to
			const [one, two, three] = line
				.split(' ')
				.map(l => l.trim())
				.filter(Boolean)
			if (!one) return null

			const splitOne = one.split(',')
			if (possibleMethods.some(m => splitOne.includes(m))) {
				methods = splitOne
				from = two
				to = three
			} else {
				methods = ['*']
				from = one
				to = two
			}

			if (!from || !to) {
				console.error(`Invalid redirect on line ${lineNumber + 1}: "${line}"`)
				return null
			}
			const keys: Array<Key> = []

			const toUrl = to.includes('//')
				? new URL(to)
				: new URL(`https://same_host${to}`)
			try {
				return {
					methods,
					from: pathToRegexp(from, keys),
					keys,
					toPathname: compileRedirectPath(toUrl.pathname, {
						encode: encodeURIComponent,
					}),
					toUrl,
				}
			} catch (error: unknown) {
				// if parsing the redirect fails, we'll warn, but we won't crash
				console.error(
					`Failed to parse redirect on line ${lineNumber}: "${line}"`,
				)
				return null
			}
		})
		.filter(typedBoolean)

	return function redirectsMiddleware(req, res, next) {
		const host = req.header('X-Forwarded-Host') ?? req.header('host')
		const protocol = host?.includes('localhost') ? 'http' : 'https'
		let reqUrl
		try {
			reqUrl = new URL(`${protocol}://${host}${req.url}`)
		} catch (error: unknown) {
			console.error(`Invalid URL: ${protocol}://${host}${req.url}`)
			next()
			return
		}
		for (const redirect of redirects) {
			try {
				if (
					!redirect.methods.includes('*') &&
					!redirect.methods.includes(req.method)
				) {
					continue
				}
				const match = req.path.match(redirect.from)
				if (!match) continue

				const params: Record<string, string> = {}
				const paramValues = match.slice(1)
				for (
					let paramIndex = 0;
					paramIndex < paramValues.length;
					paramIndex++
				) {
					const paramValue = paramValues[paramIndex]
					const key = redirect.keys[paramIndex]
					if (key && paramValue) {
						params[key.name] = paramValue
					}
				}
				const toUrl = new URL(redirect.toUrl)

				toUrl.protocol = protocol
				if (toUrl.host === 'same_host') toUrl.host = reqUrl.host

				for (const [key, value] of reqUrl.searchParams.entries()) {
					toUrl.searchParams.append(key, value)
				}
				toUrl.pathname = redirect.toPathname(params)
				res.redirect(307, toUrl.toString())
				return
			} catch (error: unknown) {
				// an error in the redirect shouldn't stop the request from going through
				console.error(`Error processing redirects:`, {
					error,
					redirect,
					'req.url': req.url,
				})
			}
		}
		next()
	}
}
