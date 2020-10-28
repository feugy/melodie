'use strict'

import { withKnobs, text } from '@storybook/addon-knobs'
import Card from './Card.stories.svelte'

export default {
  title: 'Site components/Card',
  decorators: [withKnobs]
}

export const Default = () => ({
  Component: Card,
  props: {
    title: text('Title', 'Portable'),
    image: text('Image', 'logos/os.png')
  }
})
