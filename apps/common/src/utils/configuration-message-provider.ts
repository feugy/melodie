import { SimpleMessagesProvider } from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'

export class ConfigurationMessageProvider extends SimpleMessagesProvider {
	fields: Record<string, string>

	constructor(fields: Record<string, string>) {
		super({
			required: '{{ field }} env variable is required',
			number: '{{ field }} env variable must be a positive integer',
			positive: '{{ field }} env variable must be a positive integer',
			withoutDecimals: '{{ field }} env variable must be a positive integer',
			'folders.*.minLength':
				'FOLDERS env variable value #{{ field }} must contain at least {{ min }} characters',
			'array.minLength':
				'{{ field }} env variable must contain at least {{ min }} element'
		})
		this.fields = fields
	}

	getMessage(
		rawMessage: string,
		rule: string,
		field: FieldContext,
		args?: Record<string, unknown>
	) {
		const name =
			this.fields[field.wildCardPath] || this.fields[field.name] || field.name
		return super.getMessage(rawMessage, rule, { ...field, name }, args)
	}
}
