// biome-ignore lint/suspicious/noExplicitAny: unknown doesn't work here
export function debounce<T extends (...args: any[]) => void>(
	func: T,
	wait: number
): T {
	let timeout: ReturnType<typeof setTimeout> | null = null
	return function (this: unknown, ...args) {
		if (timeout) {
			clearTimeout(timeout)
		}
		timeout = setTimeout(() => {
			func.apply(this, args)
		}, wait)
	} as T
}
