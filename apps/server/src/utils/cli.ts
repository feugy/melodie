import v from '@vinejs/vine'
import type { SchemaTypes } from '@vinejs/vine/types'

export interface Question {
	key: string
	question: string
	defaultValue?: string
	schema: SchemaTypes
	when?: Record<string, Question[]>
}

export async function dialog<Result>(questions: Question[]) {
	const iterator = console[Symbol.asyncIterator]()
	const answers = await askAndValidate(questions, iterator)
	iterator.return?.()
	return answers as Result
}

async function askAndValidate(
	questions: Question[],
	iterator: AsyncIterableIterator<string>
) {
	const answers: Record<string, unknown> = {}
	for (const { key, question, defaultValue, schema, when } of questions) {
		console.log(question)
		while (true) {
			const { value } = await iterator.next()
			const data = value.trim() || defaultValue || ''
			const [error, result] = await v.tryValidate({
				schema: schema,
				data
			})
			if (error) {
				console.log(`'${data}' is invalid. Please try again.\n`)
			} else {
				answers[key] = result
				break
			}
		}
		const subQuestions = when?.[answers[key] as string]
		if (subQuestions) {
			Object.assign(answers, await askAndValidate(subQuestions, iterator))
		}
	}
	return answers
}
