'use strict'

import Card from './Card.stories.svelte'

export default {
  title: 'Site components/Card',
  args: {
    title: 'Portable',
    image: 'logos/os.png'
  }
}

export const Default = args => ({
  Component: Card,
  props: args
})
