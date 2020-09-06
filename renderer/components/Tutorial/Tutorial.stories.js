'use strict'

import { action } from '@storybook/addon-actions'
import Tutorial from './Tutorial.stories.svelte'

export default {
  title: 'Components/Tutorial',
  excludeStories: /.*Data$/
}

export const actionData = {
  next: action('on next button')
}

export const Default = () => ({
  Component: Tutorial
})

export const WithNext = () => ({
  Component: Tutorial,
  props: {
    nextButtonText: 'Move on!'
  },
  on: actionData
})

export const Positionned = () => ({
  Component: Tutorial,
  props: {
    top: '75%',
    left: '5%'
  }
})
