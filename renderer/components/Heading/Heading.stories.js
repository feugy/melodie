'use strict'

import Heading from './Heading.stories.svelte'

export default {
  title: 'Components/Heading'
}
export const Default = () => ({
  Component: Heading,
  props: {
    title: '70 albums',
    image: './valentino-funghi-MEcxLZ8ENV8-unsplash.jpg'
  }
})
