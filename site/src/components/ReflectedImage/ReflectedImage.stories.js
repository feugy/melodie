'use strict'

import { withKnobs, text } from '@storybook/addon-knobs'
import ReflectedImage from './ReflectedImage.stories.svelte'

export default {
  title: 'Site components/Reflected image',
  decorators: [withKnobs]
}

export const Default = () => ({
  Component: ReflectedImage,
  props: {
    src: text('Image source', 'images/screenshot-ui-fr.png'),
    height: text('Height', '250px')
  }
})
