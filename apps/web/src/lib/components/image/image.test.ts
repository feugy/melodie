import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { render } from '@testing-library/svelte'
import { tick } from 'svelte'
import Image from './image.svelte'

describe('Image component', () => {
	beforeAll(() => {
		GlobalRegistrator.register()
	})

	afterAll(() => GlobalRegistrator.unregister())

	it('displays existing image with default dimensions', async () => {
		const src = '//public/icon-512x512.png'
		const screen = render(Image, { src })
		const image = screen.queryByRole('img')
		expect(image?.getAttribute('src')).toBe(`http:${src}?f=image%2Favif`)
		expect(image?.getAttribute('loading')).toBe('lazy')
		expect(screen.queryByTestId('broken-image')).not.toBeInTheDocument()
		expect(screen.queryByTestId('music')).not.toBeInTheDocument()
		expect(screen.queryByTestId('user')).not.toBeInTheDocument()
	})

	it('displays fallback for broken image', async () => {
		const src = '//unknown-cover.jpeg'
		const screen = render(Image, { src })
		screen.queryByRole('img')?.dispatchEvent(new ErrorEvent('error'))
		await tick()
		expect(screen.queryByRole('img')).not.toBeInTheDocument()
		expect(screen.getByTestId('broken-image')).toBeInTheDocument()
		expect(screen.queryByTestId('music')).not.toBeInTheDocument()
		expect(screen.queryByTestId('user')).not.toBeInTheDocument()
	})

	it('displays avatar fallback for broken image', async () => {
		const src = 'unknown-avatar.jpeg'
		const screen = render(Image, { src, brokenIcon: 'user' })
		screen.queryByRole('img')?.dispatchEvent(new ErrorEvent('error'))
		await tick()
		expect(screen.queryByRole('img')).not.toBeInTheDocument()
		expect(screen.queryByTestId('broken-image')).not.toBeInTheDocument()
		expect(screen.queryByTestId('music')).not.toBeInTheDocument()
		expect(screen.getByTestId('user')).toBeInTheDocument()
	})
})
