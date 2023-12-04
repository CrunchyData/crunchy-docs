/**
 * Invariant function that throws an `Error` with a custom error message.
 */
export function invariant(
	condition: unknown,
	message: string,
): asserts condition {
	if (condition) return
	throw new Error(message)
}
