// @ts-check

/** @type {import('prettier').Config} */
module.exports = {
	arrowParens: 'avoid',
	bracketSameLine: false,
	bracketSpacing: true,
	embeddedLanguageFormatting: 'auto',
	htmlWhitespaceSensitivity: 'css',
	singleQuote: true,
	jsxSingleQuote: false,
	proseWrap: 'always',
	quoteProps: 'consistent',
	semi: false,
	trailingComma: 'all',
	useTabs: true,
	overrides: [
		{
			files: [
				'*.cts',
				'*.mts',
				'*.ts',
				'*.tsx',
				'*.cjs',
				'*.js',
				'*.jsx',
				'*.mjs',
			],
			options: {
				parser: 'typescript',
				plugins: [
					require('prettier-plugin-organize-imports'),
					require('prettier-plugin-tailwindcss'),
				],
			},
		},
		{
			files: ['*.md', '*.mdx'],
			parser: 'mdx',
			options: {
				useTabs: false,
				proseWrap: 'never',
			},
		},
	],
}
