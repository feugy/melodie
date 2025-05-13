<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { expect, fn, userEvent, within } from '@storybook/test'
  import Bean from 'lucide-svelte/icons/bean'
  import Play from 'lucide-svelte/icons/play'
  import Component from './button.svelte'

  const { Story } = defineMeta({
    title: 'Components/Button',
    component: Component,
    args: { onclick: fn() },
  })
</script>

<Story
  name="Default"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    await expect(args.onclick).toHaveBeenCalled()
    await expect(args.onclick).toHaveBeenCalledTimes(1)
  }}>Click Me</Story
>
<Story name="Icon only" args={{ Icon: Play, size: 'lg' }} />
<Story
  name="Secondary with icon and text"
  args={{ Icon: Bean, color: 'secondary' }}>Click Me</Story
>
