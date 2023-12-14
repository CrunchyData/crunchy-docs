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
	future: {
		v2_headers: true,
		v2_meta: true,
		v2_errorBoundary: true,
		v2_normalizeFormMethod: true,
		v2_routeConvention: true,
		unstable_dev: true,
	},
}
