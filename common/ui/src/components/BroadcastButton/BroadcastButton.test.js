import { faker } from '@faker-js/faker'
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { toCanvas } from 'qrcode'
import { tick } from 'svelte'
import { get } from 'svelte/store'
import html from 'svelte-htm'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { cleanup, init, totp } from '../../stores/totp'
import { sleep } from '../../tests'
import { releaseWakeLock, stayAwake } from '../../utils'
import BroadcastButton from './BroadcastButton.svelte'

vi.mock('qrcode', async importActual => ({
  ...(await importActual()),
  toCanvas: vi.fn()
}))
vi.mock('../../utils/wake-lock')

// jsdom needs 'canvas' module to implement HTMLCanvasElement
// however, with vitest thread, it's horribly crashing
// https://github.com/vitest-dev/vitest/issues/740#issuecomment-1581232942
describe.skip('BroadcastButton component', () => {
  let address
  let handleClick

  beforeAll(() => init('abcdef'))

  afterAll(() => cleanup())

  beforeEach(() => {
    vi.resetAllMocks()
    handleClick = vi.fn()
    address = faker.internet.url()
    stayAwake.mockResolvedValue()
    releaseWakeLock.mockResolvedValue()
  })

  function getFullAddress() {
    return `${address}?totp=${get(totp)}`
  }

  it('displays QR code when broadcasting', async () => {
    const { component } = render(BroadcastButton, {
      isBroadcasting: false,
      address
    })
    component.$on('click', handleClick)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('button')?.querySelector('i')).toHaveClass(
      'i-mdi-wifi-off'
    )
    expect(toCanvas).not.toHaveBeenCalled()

    component.$set({ isBroadcasting: true })
    await tick()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toHaveAttribute('href', getFullAddress())
    expect(screen.getByRole('button')?.querySelector('i')).toHaveClass(
      'i-mdi-wifi'
    )
    expect(handleClick).not.toHaveBeenCalled()
    expect(toCanvas).toHaveBeenCalledWith(
      expect.anything(),
      getFullAddress(),
      expect.any(Object)
    )
    expect(toCanvas).toHaveBeenCalledOnce()
    expect(stayAwake).toHaveBeenCalledOnce()
    expect(releaseWakeLock).toHaveBeenCalledOnce()
    expect(stayAwake).toHaveBeenCalledAfter(releaseWakeLock)
  })

  it('hides QR code when stopping broadcast', async () => {
    const { component } = render(BroadcastButton, {
      isBroadcasting: false,
      address
    })
    expect(releaseWakeLock).toHaveBeenCalledOnce()
    component.$on('click', handleClick)
    await component.$set({ isBroadcasting: true })
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toHaveAttribute('href', getFullAddress())
    expect(screen.getByRole('button')?.querySelector('i')).toHaveClass(
      'i-mdi-wifi'
    )
    expect(toCanvas).toHaveBeenCalledWith(
      expect.anything(),
      getFullAddress(),
      expect.any(Object)
    )

    expect(releaseWakeLock).toHaveBeenCalledOnce()
    component.$set({ isBroadcasting: false })

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.getByRole('button')?.querySelector('i')).toHaveClass(
        'i-mdi-wifi-off'
      )
    })
    expect(handleClick).not.toHaveBeenCalled()
    expect(toCanvas).toHaveBeenCalledOnce()
    expect(stayAwake).toHaveBeenCalledOnce()
    expect(releaseWakeLock).toHaveBeenCalledTimes(2)
    expect(Math.max(...stayAwake.mock.invocationCallOrder)).toBeLessThan(
      Math.max(...releaseWakeLock.mock.invocationCallOrder)
    )
  })

  it('fires click handler', async () => {
    render(
      html`<${BroadcastButton}
        isBroadcasting=${false}
        address=${address}
        on:click=${handleClick}
      />`
    )
    await userEvent.click(screen.queryByRole('button'))

    expect(handleClick).toHaveBeenCalledOnce()
    expect(toCanvas).not.toHaveBeenCalled()
  })

  it('opens menu on hover', async () => {
    render(
      html`<${BroadcastButton}
        isBroadcasting=${true}
        address=${address}
        on:click=${handleClick}
      />`
    )
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    fireEvent.mouseEnter(screen.queryByRole('button').parentElement)

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toHaveAttribute('href', getFullAddress())

    fireEvent.mouseLeave(screen.queryByRole('button').parentElement)
    await sleep(450)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(handleClick).not.toHaveBeenCalled()
    expect(toCanvas).toHaveBeenCalledWith(
      expect.anything(),
      getFullAddress(),
      expect.any(Object)
    )
    expect(toCanvas).toHaveBeenCalledOnce()
  })

  it('does not open menu on hover when not broadcasting', async () => {
    render(
      html`<${BroadcastButton}
        isBroadcasting=${false}
        address=${address}
        on:click=${handleClick}
      />`
    )
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    fireEvent.mouseEnter(screen.queryByRole('button').parentElement)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    fireEvent.mouseLeave(screen.queryByRole('button').parentElement)
    await sleep(250)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    expect(handleClick).not.toHaveBeenCalled()
    expect(toCanvas).not.toHaveBeenCalled()
  })
})
