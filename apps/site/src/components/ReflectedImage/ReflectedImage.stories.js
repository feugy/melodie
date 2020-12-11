'use strict'

import ReflectedImage from './ReflectedImage.stories.svelte'

export default {
  title: 'Site components/Reflected image',
  args: {
    src: 'images/screenshot-ui-fr.png',
    height: 250
  }
}

export const Default = args => ({
  Component: ReflectedImage,
  props: {
    ...args,
    height: `${args.height}px`
  }
})
