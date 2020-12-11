'use strict'

import { action } from '@storybook/addon-actions'
import Dialogue from './Dialogue.stories.svelte'

export default {
  title: 'Components/Dialogue',
  excludeStories: /.*Data$/
}

export const dialogueData = {
  title: 'This is a title',
  open: true
}

export const actionsData = {
  close: action('on dialogue close'),
  open: action('on dialogue open')
}

export const Default = () => ({
  Component: Dialogue,
  props: dialogueData,
  on: actionsData
})
