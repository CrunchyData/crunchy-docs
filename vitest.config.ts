/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { react } from './scripts/test-setup/vitejs-plugin-react.cjs'

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		include: ['./app/**/*.test.{ts,tsx}', './other/**/*.test.ts'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./other/test-setup/setup-test-env.ts'],
		coverage: {
			include: ['app/**/*.{ts,tsx}'],
			all: true,
		},
	},
})
