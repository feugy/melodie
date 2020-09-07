'use strict'

import Annotation from './Annotation.stories.svelte'

export default {
  title: 'Components/Annotation',
  excludeStories: /.*Data$/
}

// Note: snapshots will all look the same as JSDom does has a mocked implementation of getBoundingClientRect()

export const Default = () => ({
  Component: Annotation
})

export const AboveCenterLeft = () => ({
  Component: Annotation,
  props: { slot: 1 }
})

export const AboveCenterRight = () => ({
  Component: Annotation,
  props: { slot: 2 }
})

export const AboveRight = () => ({
  Component: Annotation,
  props: { slot: 3 }
})

export const MiddleLeft = () => ({
  Component: Annotation,
  props: { slot: 4 }
})

export const Positionned = () => ({
  Component: Annotation,
  props: { slot: 5, top: '5%', left: '60%' }
})

export const MiddleRight = () => ({
  Component: Annotation,
  props: { slot: 7 }
})

export const BellowLeft = () => ({
  Component: Annotation,
  props: { slot: 8 }
})

export const BellowCenterLeft = () => ({
  Component: Annotation,
  props: { slot: 9 }
})

export const BellowCenterRight = () => ({
  Component: Annotation,
  props: { slot: 10 }
})

export const BellowRight = () => ({
  Component: Annotation,
  props: { slot: 11 }
})
