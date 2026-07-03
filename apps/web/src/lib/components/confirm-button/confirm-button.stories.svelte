<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { expect, fn, userEvent, within } from '@storybook/test'
  import Component from './confirm-button.svelte'

  const { Story } = defineMeta({
    title: 'Components/ConfirmButton',
    component: Component,
    args: {
      onconfirm: fn(),
      oncancel: fn(),
    },
  })
</script>

<Story
  name="Default"
  args={{
    cancelLabel: 'Nope',
    confirmLabel: 'Yes, delete',
  }}
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Delete playlist' }))
    await expect(canvas.getByRole('button', { name: 'Nope' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Yes, delete' }))
    await expect(args.onconfirm).toHaveBeenCalledTimes(1)
  }}
>Delete playlist</Story
>

<Story
  name="Cancel"
  args={{
    cancelLabel: 'Cancel',
    confirmLabel: 'Confirm',
  }}
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Delete' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))

    await expect(args.oncancel).toHaveBeenCalledTimes(1)
    await expect(canvas.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  }}
>Delete</Story
>

<Story
  name="Primary action style"
  args={{
    color: 'warning',
    confirmColor: 'success',
    cancelColor: 'surface',
    cancelLabel: 'Back',
    confirmLabel: 'Proceed',
  }}
>Run task</Story
>