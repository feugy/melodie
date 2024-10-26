export async function take<T>(generator: AsyncGenerator<T>, count: number) {
	const result: T[] = []
	for await (const item of generator) {
		result.push(item)
		if (result.length >= count) {
			break
		}
	}
	return result
}
