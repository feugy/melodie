'use strict'

import Heading from './Heading.stories.svelte'

export default {
  title: 'Components/Heading',
  excludeStories: /.*Data$/
}

export const headingData = {
  title: '70 albums',
  image: './valentino-funghi-MEcxLZ8ENV8-unsplash.jpg'
}

export const Default = () => ({
  Component: Heading,
  props: headingData
})
