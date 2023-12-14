import 'dotenv/config'

if (process.env.NODE_ENV === 'production') {
	await import('./docs-server-build/index.js')
} else {
	await import('./server/index.ts')
}
