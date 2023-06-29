import { installGlobals } from '@remix-run/node'
import 'dotenv/config'
import { matchers, type TestingLibraryMatchers } from './matchers.cjs'

declare global {
	namespace Vi {
		interface JestAssertion<T = any>
			extends jest.Matchers<void, T>,
				TestingLibraryMatchers<T, void> {}
	}
}

expect.extend(matchers)

installGlobals()
