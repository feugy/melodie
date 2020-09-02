'use strict'

import SortableList from './SortableList.stories.svelte'
import { trackListData } from '../Player/Player.stories'
import { hrefSinkDecorator } from '../../../.storybook/decorators'
import { action } from '@storybook/addon-actions'

export default {
  title: 'Components/Sortable list',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator]
}

export const actionsData = {
  click: action('on track clicked'),
  move: action('on track moved'),
  remove: action('on track removed')
}

export const Default = () => ({
  Component: SortableList,
  props: {
    items: [...trackListData, ...trackListData]
  },
  on: actionsData
})
