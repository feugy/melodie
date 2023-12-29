import { describe, expect, it } from 'vitest'

import { matchAccelerator } from './local-shortcut.js'

describe('local shortcut utilities', () => {
  it.each([
    {
      title: 'function key',
      accelerator: 'F5',
      input: { key: 'F5' }
    },
    {
      title: 'function key with optional modifier',
      accelerator: 'F5',
      input: { key: 'F5', shift: true }
    },
    {
      title: 'character',
      accelerator: 'a',
      input: { key: 'a' }
    },
    {
      title: 'character with optional modifier',
      accelerator: 'a',
      input: { key: 'a', alt: true }
    },
    {
      title: 'Shift+character',
      accelerator: 'Shift+y',
      input: { key: 'y', shift: true }
    },
    {
      title: 'Alt+character',
      accelerator: 'Alt+1',
      input: { key: '1', alt: true }
    },
    {
      title: 'Ctrl+backspace',
      accelerator: 'Ctrl+Backspace',
      input: { key: 'Backspace', control: true }
    },
    {
      title: 'CmdOrCtrl+character with meta',
      accelerator: 'CmdOrCtrl+I',
      input: { key: 'i', meta: true }
    },
    {
      title: 'CmdOrCtrl+character with control',
      accelerator: 'CmdOrCtrl+I',
      input: { key: 'i', control: true }
    }
  ])('matches $title', ({ accelerator, input }) => {
    const fullInput = {
      shift: false,
      alt: false,
      control: false,
      meta: false,
      ...input
    }
    expect(matchAccelerator(accelerator, fullInput)).toBe(true)
    expect(matchAccelerator(accelerator.toLowerCase(), fullInput)).toBe(true)
    expect(matchAccelerator(accelerator.toUpperCase(), fullInput)).toBe(true)
  })

  it.each([
    {
      title: 'wrong function key',
      accelerator: 'F3',
      input: { key: 'F5' }
    },
    {
      title: 'character',
      accelerator: 'b',
      input: { key: 'a' }
    },
    {
      title: 'shift+character',
      accelerator: 'Shift+z',
      input: { key: 'z', alt: true }
    },
    {
      title: 'alt+character',
      accelerator: 'Alt+o',
      input: { key: 'o', shift: true }
    }
  ])('does not matches $title', ({ accelerator, input }) => {
    const fullInput = {
      shift: false,
      alt: false,
      control: false,
      meta: false,
      ...input
    }
    expect(matchAccelerator(accelerator, fullInput)).toBe(false)
    expect(matchAccelerator(accelerator.toLowerCase(), fullInput)).toBe(false)
    expect(matchAccelerator(accelerator.toUpperCase(), fullInput)).toBe(false)
  })
})
/*
{
    key: 'Control',
    shift: false,
    alt: false,
    control: true,
    meta: false
  }
  { key: 'Shift', shift: true, alt: false, control: true, meta: false }
  { key: 'I', shift: true, alt: false, control: true, meta: false }
  */
