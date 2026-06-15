declare module 'safe-eval' {
	function safeEval(
		code: string,
		context?: Record<string, unknown>,
		opts?: Record<string, unknown>,
	): unknown
	export default safeEval
}
