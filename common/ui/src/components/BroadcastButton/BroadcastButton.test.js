'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import faker from 'faker'
import QRCode from 'qrcode'
import { get } from 'svelte/store'
import BroadcastButton from './BroadcastButton.svelte'
import { sleep } from '../../tests'
import { cleanup, init, totp } from '../../stores/totp'
import { stayAwake, releaseWakeLock } from '../../utils'

jest.mock('qrcode', () => ({ default: { toCanvas: jest.fn() } }))
jest.mock('../../utils/wake-lock')

const {
  default: { toCanvas }
} = QRCode

describe('BroadcastButton component', () => {
  let address
  let handleClick

  beforeAll(() => init('abcdef'))

  afterAll(cleanup)

  beforeEach(() => {
    jest.resetAllMocks()
    handleClick = jest.fn()
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
    expect(screen.queryByText('wifi_off')).toBeInTheDocument()
    expect(screen.queryByText('wifi')).not.toBeInTheDocument()
    expect(toCanvas).not.toHaveBeenCalled()

    await component.$set({ isBroadcasting: true })
    expect(screen.queryByRole('menu')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toHaveAttribute('href', getFullAddress())
    expect(screen.queryByText('wifi_off')).not.toBeInTheDocument()
    expect(screen.queryByText('wifi')).toBeInTheDocument()
    expect(handleClick).not.toHaveBeenCalled()
    expect(toCanvas).toHaveBeenCalledWith(
      expect.anything(),
      getFullAddress(),
      expect.any(Object)
    )
    expect(toCanvas).toHaveBeenCalledTimes(1)
    expect(stayAwake).toHaveBeenCalledTimes(1)
    expect(releaseWakeLock).toHaveBeenCalledTimes(1)
    expect(stayAwake).toHaveBeenCalledAfter(releaseWakeLock)
  })

  it('hides QR code when stopping broadcast', async () => {
    const { component } = render(BroadcastButton, {
      isBroadcasting: false,
      address
    })
    component.$on('click', handleClick)
    await component.$set({ isBroadcasting: true })
    expect(screen.queryByRole('menu')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toHaveAttribute('href', getFullAddress())
    expect(screen.queryByText('wifi_off')).not.toBeInTheDocument()
    expect(screen.queryByText('wifi')).toBeInTheDocument()
    expect(toCanvas).toHaveBeenCalledWith(
      expect.anything(),
      getFullAddress(),
      expect.any(Object)
    )

    component.$set({ isBroadcasting: false })
    await sleep(250)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText('wifi_off')).toBeInTheDocument()
    expect(screen.queryByText('wifi')).not.toBeInTheDocument()
    expect(handleClick).not.toHaveBeenCalled()
    expect(toCanvas).toHaveBeenCalledTimes(1)
    expect(stayAwake).toHaveBeenCalledTimes(1)
    expect(releaseWakeLock).toHaveBeenCalledTimes(2)
    expect(Math.max(...stayAwake.mock.invocationCallOrder)).toBeLessThan(
      Math.max(...releaseWakeLock.mock.invocationCallOrder)
    )
  })

  it('fires click handler', async () => {
    render(html`<${BroadcastButton}
      isBroadcasting=${false}
      address=${address}
      on:click=${handleClick}
    />`)
    await userEvent.click(screen.queryByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
    expect(toCanvas).not.toHaveBeenCalled()
  })

  it('opens menu on hover', async () => {
    render(html`<${BroadcastButton}
      isBroadcasting=${true}
      address=${address}
      on:click=${handleClick}
    />`)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await fireEvent.mouseEnter(screen.queryByRole('button').parentElement)

    expect(screen.queryByRole('menu')).toBeInTheDocument()
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
    expect(toCanvas).toHaveBeenCalledTimes(1)
  })

  it('does not open menu on hover when not broadcasting', async () => {
    render(html`<${BroadcastButton}
      isBroadcasting=${false}
      address=${address}
      on:click=${handleClick}
    />`)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await fireEvent.mouseEnter(screen.queryByRole('button').parentElement)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    fireEvent.mouseLeave(screen.queryByRole('button').parentElement)
    await sleep(250)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    expect(handleClick).not.toHaveBeenCalled()
    expect(toCanvas).not.toHaveBeenCalled()
  })
})
