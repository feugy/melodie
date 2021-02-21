'use strict'

import { action } from '@storybook/addon-actions'
import Snackbar from './Snackbar.stories.svelte'

export default {
  title: 'Components/Snackbar',
  parameters: { layout: 'padded' }
}

export const Default = () => ({
  Component: Snackbar,
  on: {
    action: action('On snack button click')
  }
})
