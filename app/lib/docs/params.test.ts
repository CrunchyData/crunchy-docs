import { validateParams as validate } from './params.server.ts'

let LATEST_V1_MAJOR_TAG: string
let LATEST_V1_MINOR_TAG: string
let LATEST_STABLE_TAG: string

const TAGS = [
	'v1.0.0',
	'v1.1.0',
	(LATEST_V1_MINOR_TAG = 'v1.1.1'),
	(LATEST_V1_MAJOR_TAG = 'v1.2.0'),
	'v2.0.0',
	(LATEST_STABLE_TAG = 'v2.1.0'),
	'v3.0.0-pre.0',
]

const BRANCHES = ['main', 'dev']

describe('validateParams', () => {
	describe('with a valid lang in the first position', () => {
		describe('and a valid tag in the second position', () => {
			it('returns null', () => {
				expect(validate(TAGS, BRANCHES, { product: 'en', ref: 'v1.0.0' })).toBe(
					null,
				)
				expect(
					validate(TAGS, BRANCHES, {
						'product': 'en',
						'ref': 'v1.0.0',
						'*': 'beef',
					}),
				).toBe(null)
			})
		})

		describe('and a valid shorthand tag', () => {
			it('expands the major shorthand', () => {
				expect(validate(TAGS, BRANCHES, { product: 'en', ref: 'v1' })).toBe(
					`en/${LATEST_V1_MAJOR_TAG}`,
				)
			})
			it('expands the minor shorthand', () => {
				expect(validate(TAGS, BRANCHES, { product: 'en', ref: 'v1.1' })).toBe(
					`en/${LATEST_V1_MINOR_TAG}`,
				)
			})
			it('expands the major shorthand, preserves splat', () => {
				expect(
					validate(TAGS, BRANCHES, {
						'product': 'en',
						'ref': 'v1',
						'*': 'beef/taco',
					}),
				).toBe(`en/${LATEST_V1_MAJOR_TAG}/beef/taco`)
			})
		})

		describe('and a valid branch in the second position', () => {
			it('returns null', () => {
				expect(validate(TAGS, BRANCHES, { product: 'en', ref: 'main' })).toBe(
					null,
				)
				expect(
					validate(TAGS, BRANCHES, {
						'product': 'en',
						'ref': 'main',
						'*': 'beef',
					}),
				).toBe(null)
			})
		})

		it('redirects to the latest stable tag', () => {
			expect(validate(TAGS, BRANCHES, { product: 'en' })).toBe(
				`en/${LATEST_STABLE_TAG}`,
			)
		})

		describe('and an invalid branch or tag in the second position', () => {
			it('inserts latest tag', () => {
				expect(validate(TAGS, BRANCHES, { product: 'en', ref: 'beef' })).toBe(
					`en/${LATEST_STABLE_TAG}/beef`,
				)
			})
		})
	})
})
