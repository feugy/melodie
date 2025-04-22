/**
 * Runs concurrently a set of tasks with a given concurrency.
 * Results are returned in the order of the tasks array.
 * @param tasks Array of async functions to run concurrently.
 * @param concurrency Maximum number of tasks running in parallel.
 * @see https://stackoverflow.com/a/51020535
 */
export async function raceConcurrently<T>(
	tasks: (() => Promise<T>)[],
	concurrency: number
) {
	const iterator = tasks.entries()
	const results: PromiseSettledResult<T>[] = Array(tasks.length)
	await Promise.all(
		Array.from({ length: concurrency }, async () => {
			for (const [index, task] of iterator) {
				try {
					results[index] = { status: 'fulfilled', value: await task() }
				} catch (error) {
					results[index] = { status: 'rejected', reason: error }
				}
			}
		})
	)
	return results
}
