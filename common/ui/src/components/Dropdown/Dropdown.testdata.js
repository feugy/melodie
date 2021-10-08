'use strict'

import { recordEvent } from '@atelier-wb/svelte'
import CustomOption from './DropdownToolCustomOption.svelte'

export const dropdownData = {
  options: [
    { label: 'one' },
    { label: 'two (disabled)', disabled: true },
    { label: 'three', icon: 'add' },
    { label: 'four', icon: 'people' },
    {
      label: `this is a very long label that doesn't wrap`,
      icon: 'play_arrow'
    }
  ]
}

export const dropdownCustomData = {
  options: [
    { label: 'simple' },
    { label: 'simple with icon', icon: 'add' },
    {
      Component: CustomOption,
      props: {
        text: 'enter name:',
        onValueSet: (...args) => recordEvent('custom-select', ...args)
      }
    }
  ]
}

export const dropdownSimpleData = { options: ['one', 'two', 'three'] }
