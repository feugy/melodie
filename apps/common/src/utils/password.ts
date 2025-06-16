import { password } from 'bun'

export function encode(value: string) {
	return password.hash(value)
}

export function compare(value: string, encoded: string) {
	return password.verify(value, encoded)
}
