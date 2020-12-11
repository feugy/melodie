'use strict'

import { action } from '@storybook/addon-actions'
import ConfirmationDialogue from './ConfirmationDialogue.stories.svelte'

export default {
  title: 'Components/Confirmation dialogue',
  excludeStories: /.*Data$/
}

export const dialogueData = {
  title: 'This is a title',
  open: true
}

export const actionsData = {
  close: action('on confirmation close'),
  open: action('on confirmation open')
}

export const Default = () => ({
  Component: ConfirmationDialogue,
  props: dialogueData,
  on: actionsData
})

export const CustomAction = () => ({
  Component: ConfirmationDialogue,
  props: {
    ...dialogueData,
    confirmIcon: 'redo',
    confirmText: `Yes, I'm sure!`,
    cancelIcon: 'undo',
    cancelText: 'No, let me go!'
  },
  on: actionsData
})
