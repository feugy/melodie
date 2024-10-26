import { recordEvent } from '@atelier-wb/svelte'

import CustomOption from './DropdownToolCustomOption.svelte'

export const dropdownData = {
  options: [
    { label: 'one' },
    { label: 'two (disabled)', disabled: true },
    { label: 'three', icon: 'i-mdi-cog' },
    { label: 'four', icon: 'i-mdi-account' },
    {
      label: `this is a very long label that doesn't wrap`,
      icon: 'i-mdi-play'
    }
  ]
}

export const dropdownCustomData = {
  options: [
    { label: 'simple' },
    { label: 'simple with icon', icon: 'i-mdi-playlist-plus' },
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
