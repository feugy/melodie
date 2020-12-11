'use strict'

import { action } from '@storybook/addon-actions'
import Image from './Image.stories.svelte'

export default {
  title: 'Components/Image',
  excludeStories: /.*Data$/
}

export const actionsData = {
  click: action('on image click')
}

export const Default = () => ({
  Component: Image,
  props: { src: './cover.jpg' },
  on: actionsData
})

export const WithEscapedPath = () => ({
  Component: Image,
  props: { src: './# Films/cover.jpg' },
  on: actionsData
})

export const Rouded = () => ({
  Component: Image,
  props: { src: './avatar.jpg', rounded: true },
  on: actionsData
})

export const Broken = () => ({
  Component: Image,
  props: { src: './unknown.jpg' },
  on: actionsData
})

export const BrokenRounded = () => ({
  Component: Image,
  props: { rounded: true },
  on: actionsData
})
