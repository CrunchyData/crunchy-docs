/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default {
	cacheDirectory: './node_modules/.cache/remix',
	assetsBuildDirectory: 'docs-public/build',
	serverBuildPath: 'docs-build/index.js',
	publicPath: '/docs-public/build/',
	ignoredRouteFiles: ['**/.*', '**/.test.{js,jsx,ts,tsx}'],
	serverModuleFormat: 'esm',
	serverPlatform: 'node',
	tailwind: true,
	postcss: true,
	watchPaths: ['./tailwind.config.ts', './content/**/*.mdx'],
	dev: true,
	future: {
		v3_fetcherPersist: true,
		v3_relativeSplatPath: true,
	},
}
