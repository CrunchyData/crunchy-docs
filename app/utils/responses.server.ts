/**
 * Create a response with a PDF file response.
 * It receives a string with the PDF content and set the Content-Type header to
 * `application/pdf; charset=utf-8` always.
 *
 * This is useful to dynamically create a PDF file from a Resource Route.
 * @example
 * export async function loader({ request }: LoaderArgs) {
 *   return pdf(await generatePDF(request.formData()));
 * }
 */
export function pdf(
	content: Blob | Buffer | ArrayBuffer,
	init: number | ResponseInit = {},
): Response {
	let responseInit = typeof init === 'number' ? { status: init } : init

	let headers = new Headers(responseInit.headers)
	if (!headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/pdf')
	}

	return new Response(content, {
		...responseInit,
		headers,
	})
}
