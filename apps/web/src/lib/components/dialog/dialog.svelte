<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface DialogProps {
    open?: boolean
    title?: string
    noClose?: boolean
    class?: string
    trigger?: Snippet<[Record<string, unknown>]>
    content?: Snippet
    buttons?: Snippet
    children?: Snippet
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Dialog as SkeletonDialog, Portal } from '@skeletonlabs/skeleton-svelte'
  import XIcon from '@lucide/svelte/icons/x'
  import Button from '../button/button.svelte'

  let {
    open = $bindable(false),
    title = '',
    noClose = false,
    class: className = '',
    trigger,
    content,
    buttons,
    children,
  }: DialogProps = $props()

  const dispatch = createEventDispatcher<{
    open: void
    close: void
  }>()
  let previous = $state<boolean | null>(null)

  $effect(() => {
    if (previous === null) {
      previous = open
      return
    }
    if (previous !== open) {
      dispatch(open ? 'open' : 'close')
      previous = open
    }
  })

  function close() {
    if (!noClose) {
      open = false
    }
  }

  function handleOpenChange(details: { open: boolean }) {
    if (noClose && !details.open) {
      return
    }
    open = details.open
  }
</script>

<SkeletonDialog {open} onOpenChange={handleOpenChange}>
  {#if trigger}
    <SkeletonDialog.Trigger>
      {#snippet element(attrs)}
        {@render trigger(attrs)}
      {/snippet}
    </SkeletonDialog.Trigger>
  {/if}

  <Portal>
    <SkeletonDialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" onclick={close} />
    <SkeletonDialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <SkeletonDialog.Content
        class={[
          className,
          'card bg-surface-100-900 relative w-full max-w-sm space-y-4 p-4 shadow-xl',
        ]}
      >
        {#if title}
          <SkeletonDialog.Title class="text-lg font-bold">{title}</SkeletonDialog.Title>
        {/if}

        {#if !noClose}
          <Button
            class="absolute right-2 top-2"
            color="surface"
            size="sm"
            Icon={XIcon}
            aria-label="Close"
            onclick={close}
          />
        {/if}

        {@render content?.()}
        {@render children?.()}

        {#if buttons}
          <footer class="mt-4 flex justify-end gap-2">
            {@render buttons()}
          </footer>
        {/if}
      </SkeletonDialog.Content>
    </SkeletonDialog.Positioner>
  </Portal>
</SkeletonDialog>