import { base } from '$app/paths'
import { logIn } from '$lib/server'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import * as z from 'zod/v4-mini'

export const load: PageServerLoad = ({ locals, params: { locale } }) => {
	const { session = null } = locals
	if (session) {
		throw redirect(303, `${base}/${locale}/albums`)
	}
}

const loginSchema = z.object({
	name: z.string().check(z.minLength(1), z.maxLength(50)),
	password: z.string().check(z.minLength(1), z.maxLength(50))
})

export const actions: Actions = {
	default: async ({ request, locals, params: { locale } }) => {
		try {
			const form = await request.formData()
			const parsed = loginSchema.safeParse(Object.fromEntries(form.entries()))
			if (!parsed.success) {
				return fail(400, {
					message: 'Invalid input',
					error: z.prettifyError(parsed.error)
				})
			}
			const { name, password } = parsed.data
			console.log('> log in', name, password)
			locals.session = await logIn(name, password)
			console.log('> session', locals.session)
		} catch (error) {
			return fail(401, {
				message: 'Unauthorized',
				error: (error as Error).message
			})
		}
		throw redirect(303, `${base}/${locale}/albums`)
	}
}
