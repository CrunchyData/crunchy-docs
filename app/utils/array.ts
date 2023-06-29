export type Head<TArrayOrTuple extends readonly unknown[] | []> =
	number extends TArrayOrTuple['length']
		? // Normal array
		  TArrayOrTuple[number] | undefined
		: // Tuple
		  TArrayOrTuple[0]

/**
 * Gets the first item in an array, in a type-safe way.
 *
 * When doing this manually, TypeScript ignores the possibility of the array
 * being empty. This function adds type safety for that.
 *
 * @param array
 * @returns First element in the array, or undefined if the array is empty
 *
 * @example
 * const myArray: string[] = []
 * // TypeScript thinks this is a string, but it's actually undefined because
 * // the array is empty.
 * const myStringUnsafe = myArray[0]
 * // TypeScript safely sees this as string | undefined
 * const myStringSafe = head(myArray)
 */
export function head<TArrayOrTuple extends readonly unknown[] | []>(
	arrayOrTuple: TArrayOrTuple,
): Head<TArrayOrTuple> {
	return arrayOrTuple[0]
}

export type Tail<TArrayOrTuple extends readonly unknown[] | []> =
	TArrayOrTuple extends readonly [unknown, ...infer TTail]
		? TTail
		: TArrayOrTuple

export function tail<TArrayOrTuple extends readonly unknown[] | []>(
	array: TArrayOrTuple,
): Tail<TArrayOrTuple> {
	return array.slice(1) as Tail<TArrayOrTuple>
}

export function upsert<T>({
	data,
	item,
	find,
	merge,
}: {
	data: T[]
	item: T
	find?: (item: T) => boolean
	merge?: (before: T, after: T) => T
}): T[] {
	const index = find ? data.findIndex(find) : -1
	if (-1 === index) {
		data.push(item)
	} else {
		data[index] = merge ? merge(data[index]!, item) : item
	}

	return data
}

/**
 * Type guard wrapper around `Array.prototype.includes`
 * @param array
 * @param val
 */
export function includes<T>(array: readonly T[], val: unknown): val is T {
	return (array as unknown[]).includes(val)
}

export function isEmpty<T>(array: readonly T[] | []): array is [] {
	return array.length === 0
}

export function isNotEmpty<T>(array: readonly T[] | []): array is [T, ...T[]] {
	return array.length > 0
}

export function deduplicate<T>(array: readonly T[]): T[] {
	return [...new Set(array)]
}

export function orEmpty<T>(array?: T[]) {
	return array ?? []
}
