'use strict'

import { action } from '@storybook/addon-actions'
import ImageUploader from './ImageUploader.svelte'

export default {
  title: 'Components/Image Uploader',
  excludeStories: /.*Data$/
}

export const actionsData = {
  select: action('on image select')
}

export const Default = () => ({
  Component: ImageUploader,
  props: { value: null, class: 'h-64 w-64 inline-block' },
  on: actionsData
})
