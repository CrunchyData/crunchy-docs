import tailwindcssAspect from '@tailwindcss/aspect-ratio'
import tailwindcssForms from '@tailwindcss/forms'
import tailwindcssTypography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'
import { emerald, orange, zinc } from 'tailwindcss/colors.js'
import { fontFamily, spacing } from 'tailwindcss/defaultTheme.js'

function withOpacityValue(variable: string) {
	return ({ opacityValue }: { opacityValue: number }) => {
		if (opacityValue === undefined) {
			return `rgb(var(${variable}))`
		}
		return `rgb(var(${variable}) / ${opacityValue})`
	}
}

const sans = fontFamily.sans.filter(
	f => !['system-ui', 'BlinkMacSystemFont'].includes(f),
)

const crunchy = {
	'brighter': '#00D6F1',
	'bright': '#00A7FF',
	'DEFAULT': '#2B67F0',
	'dark-hover': '#092E83',
	'dark': '#07215D',
}

export default {
	content: [
		'./app/**/*.ts',
		'./app/**/*.tsx',
		'./app/**/*.js',
		'./app/**/*.jsx',
	],
	darkMode: 'class',
	theme: {
		extend: {
			backgroundColor: {
				// @ts-ignore
				base: withOpacityValue('--bg-base'),
				layer: {
					// @ts-ignore
					1: withOpacityValue('--bg-layer-1'),
					// @ts-ignore
					2: withOpacityValue('--bg-layer-2'),
				},
				// @ts-ignore
				border: withOpacityValue('--border-default'),
			},
			borderColor: {
				// @ts-ignore
				DEFAULT: withOpacityValue('--border-default'),
			},
			borderWidth: {
				3: '3px',
			},
			colors: {
				gray: {
					...zinc,
					1000: '#06090E',
					1100: '#020203',
				},
				accent: {
					DEFAULT: '#6BFBCE',
					bright: '#8FFFDB',
					dark: '#4FD1A8',
				},
				success: emerald,
				warning: orange,
				crunchy,
			},
			ringColor: {
				// @ts-ignore
				DEFAULT: withOpacityValue('--ring-default'),
				// @ts-ignore
				ghost: withOpacityValue('--ring-ghost'),
				// @ts-ignore
				danger: withOpacityValue('--danger'),
			},
			fontFamily: {
				display: ['var(--font-display)', ...sans],
				sans: ['var(--font-sans)', ...sans],
			},
			textColor: {
				// @ts-ignore
				secondary: withOpacityValue('--text-secondary'),
				// @ts-ignore
				primary: withOpacityValue('--text-primary'),
			},
			typography: {
				DEFAULT: {
					css: {
						'a': {
							'fontWeight': 'bold',
							'textDecoration': 'underline',
							'&:hover': {
								textDecoration: 'none',
							},
						},
						'h2,h3,h4': {
							'scroll-margin-top': spacing[32],
						},
						'table': {
							minWidth: '100%',
							marginTop: 0,
						},
						'td': {
							verticalAlign: 'top',
							lineHeight: '1.5',
						},
						'blockquote p:first-of-type::before': false,
						'blockquote p:last-of-type::after': false,
					},
				},
			},
		},
	},
	plugins: [tailwindcssTypography, tailwindcssForms, tailwindcssAspect],
} satisfies Config
