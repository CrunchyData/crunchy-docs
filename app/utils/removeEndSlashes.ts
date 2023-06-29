export function removeEndSlashes(s: string): string {
	return s.replaceAll(/(^\/|\/$)/g, '')
}

export function removeLastSlash(s: string): string {
	return s.replaceAll(/\/$/g, '')
}
