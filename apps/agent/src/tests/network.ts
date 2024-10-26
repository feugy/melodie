import { type AddressInfo, type Server, createServer } from 'node:net'

/** Finds a random available port. */
export async function findPort() {
	const server = await new Promise<Server>(resolve => {
		const srv = createServer()
		srv.listen(0, () => resolve(srv))
	})
	const { port } = server.address() as AddressInfo
	server.close()
	return port
}
