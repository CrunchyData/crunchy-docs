import * as ArrayUtils from './array.ts'

export interface EmptyZipperObj {
	previous: []
	current: undefined
	after: []
}

export interface NonEmptyZipperObj<A> {
	previous: A[]
	current: A
	after: A[]
}

type ZipperObject<A> = EmptyZipperObj | NonEmptyZipperObj<A>

export type T<A> = ZipperObject<A>

/**
 * @param array - Empty array
 * @returns Empty Zipper object
 */
export function fromArray<TArray extends readonly []>(
	array: TArray,
): EmptyZipperObj
/**
 * @param array - Tuple
 * @returns Non-empty Zipper object
 */
export function fromArray<TArray extends readonly [unknown, ...unknown[]]>(
	array: TArray,
): NonEmptyZipperObj<TArray[number]>
/**
 * @param array - Array of unknown length and/or order (so not a tuple)
 * @returns Empty or non-empty Zipper object
 */
export function fromArray<A>(array: readonly A[]): T<A>
export function fromArray<A>(array: readonly A[]): T<A> {
	const current = ArrayUtils.head(array)
	const after = ArrayUtils.tail(array)
	return { previous: [], current, after } as T<A>
}

export function current<A>({ current }: NonEmptyZipperObj<A>): A
export function current<A>({ current }: EmptyZipperObj): undefined
export function current<A>({ current }: T<A>): A | undefined {
	return current
}

/**
 * Move back one in the zipper if possible. If not, do nothing
 */
export function previous<A>(zipper: T<A>): T<A> {
	if (isEmpty(zipper)) return { ...zipper }
	const { previous, current, after } = zipper

	if (ArrayUtils.isEmpty(previous)) {
		return { previous, current, after }
	}

	const lastCurrent = current
	// Can add non-null assertion because of if check above
	const nextCurrent = previous.pop()!
	after.unshift(lastCurrent)

	return {
		previous,
		current: nextCurrent,
		after,
	}
}

/**
 * Move forward one in the zipper if possible. If not, do nothing
 */
export function next<A>(zipper: T<A>): T<A> {
	if (isEmpty(zipper)) return { ...zipper }

	const { previous, current, after } = zipper
	if (ArrayUtils.isEmpty(after)) {
		return { previous, current, after }
	}

	const lastCurrent = current
	// Can add non-null assertion because of if check above
	const nextCurrent = after.shift()!
	previous.push(lastCurrent)

	return {
		previous,
		current: nextCurrent,
		after,
	}
}

/**
 * Move to first element
 */
export function first<A>(zipper: T<A>): T<A> {
	if (isEmpty(zipper)) return { ...zipper }

	const { previous, current, after } = zipper
	if (ArrayUtils.isNotEmpty(previous)) {
		const [first, ...rest] = previous
		return {
			previous: [],
			current: first,
			after: [...rest, current, ...after],
		}
	}

	return { previous, current, after }
}

/**
 * Move to last element
 */
export function last<A>(zipper: T<A>): T<A> {
	if (isEmpty(zipper)) return { ...zipper }
	const { previous, current, after } = zipper

	if (ArrayUtils.isEmpty(after)) {
		return { previous, current, after }
	}

	const last = after.pop()!
	return {
		previous: [...previous, current, ...after],
		current: last,
		after: [],
	}
}

/**
 * Map all elements
 */
export function map<A, B>(
	zipper: T<A>,
	fn: (element: A, index: number, array: A[]) => B,
): T<B> {
	if (isEmpty(zipper)) return { ...zipper }
	const { previous, current, after } = zipper
	return {
		previous: previous.map(fn),
		current: fn(current, 0, []),
		after: after.map(fn),
	}
}

/**
 * Map all elements
 */
export function mapBy<A, B>(
	zipper: T<A>,
	fn: (
		position: 'previous' | 'current' | 'after',
		element: A,
		index: number,
		array: A[],
	) => B,
): T<B> {
	if (isEmpty(zipper)) return { ...zipper }
	const { previous, current, after } = zipper
	const arr = [...previous, current, ...after]
	return {
		previous: previous.map((a, idx) => fn('previous', a, idx, arr)),
		current: fn('current', current, previous.length, []),
		after: after.map((a, idx) =>
			fn('after', a, previous.length + 1 + idx, arr),
		),
	}
}

/**
 * Find item that matches passed in func and set as current
 */

export function find<A>(
	zipper: NonEmptyZipperObj<A>,
	findFunc: (a: A) => boolean,
): NonEmptyZipperObj<A>
export function find<A>(
	zipper: EmptyZipperObj,
	findFunc: (a: A) => boolean,
): EmptyZipperObj
export function find<A>(zipper: T<A>, findFunc: (a: A) => boolean) {
	const array = toArray(zipper)
	const foundIdx = array.findIndex(findFunc)

	if (foundIdx >= 0) {
		return {
			previous: array.slice(0, foundIdx),
			current: array[foundIdx]!,
			after: array.length <= foundIdx + 1 ? [] : array.slice(foundIdx + 1),
		}
	}

	return zipper
}

/**
 * NOTE there's an edge case bug: `isEmpty(fromArray([undefined]))` would return
 * `true` when it should be `false`.
 */
export function isEmpty<A>(zipper: ZipperObject<A>): zipper is EmptyZipperObj {
	const { previous, current, after } = zipper
	return previous.length === 0 && current === undefined && after.length === 0
}

/**
 * Get the size of the zipper
 *
 * NOTE there's an edge case bug: `size(fromArray([undefined]))` would return 0
 */
export function size<A>(zipper: T<A>): number {
	const { previous, after } = zipper
	return isEmpty(zipper) ? 0 : previous.length + 1 + after.length
}

export function toArray<A>(zipper: T<A>): A[] {
	if (isEmpty(zipper)) return []
	const { previous, current, after } = zipper
	return [...previous, current, ...after]
}

export function currentIndex<A>({ previous }: T<A>) {
	return previous.length
}

export function append<A>(zipper: T<A>, arr: A[]) {
	const { previous, current, after } = zipper
	if (current === undefined) {
		if (ArrayUtils.isNotEmpty(arr)) {
			const [first, ...rest] = arr
			return { previous, current: first, after: rest }
		}

		return zipper
	}
	return { previous, current, after: [...after, ...arr] }
}
