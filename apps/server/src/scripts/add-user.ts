import { join } from 'node:path'
import { usersModel } from '@melodie/common/models'
import { encode } from '@melodie/common/utils'

export async function addUser({
	name,
	password,
	config,
	help
}: {
	name: string
	password: string
	config: string
	help?: boolean
}) {
	if (help) {
		console.log(`Usage: melodie add-user [options]

Create a new user.

Options:
  -c, --config <path>  Config folder (default: .melodie)
  -n, --name <name>    Username (required)
  -p, --password <pwd> Password (required)
  -h, --help           Show this help`)
		return
	}

	await usersModel.init({ filename: join(config, '.db.sqlite3') }, false)
	const hash = await encode(password)
	const { hash: _unused, ...saved } = await usersModel.save({
		name,
		hash,
		createdAt: Date.now()
	})
}
