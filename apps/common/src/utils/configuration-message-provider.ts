import { SimpleMessagesProvider } from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'

export class ConfigurationMessageProvider extends SimpleMessagesProvider {
	fields: Record<string, string>

	constructor(fields: Record<string, string>) {
		super({
			required: '{{ field }} is required',
			number: '{{ field }} must be a positive integer',
			positive: '{{ field }} must be a positive integer',
			url: '{{ field }} must be a valid URL',
			withoutDecimals: '{{ field }} must be a positive integer',
			array: '{{ field }} must be an array',
			'folders.*.minLength':
				'folder #{{ field }} must contain at least {{ min }} characters',
			'folders.*.string': 'folder #{{ field }} must be a string',
			'array.minLength': '{{ field }} must contain at least {{ min }} element'
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
