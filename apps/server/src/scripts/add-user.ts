import { join } from 'node:path'
import { usersModel } from '@melodie/common/models'
import { encode } from '@melodie/common/utils'

export async function addUser({
	name,
	password,
	config
}: { name: string; password: string; config: string }) {
	await usersModel.init({ filename: join(config, '.db.sqlite3') }, false)
	const hash = await encode(password)
	const { hash: _unused, ...saved } = await usersModel.save({
		name,
		hash,
		createdAt: Date.now()
	})
}
