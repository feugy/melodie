<script module lang="ts">
  import type { Snippet } from 'svelte'
  import type { ButtonProps } from '../button/button.svelte'

  export interface ConfirmButtonProps
    extends Omit<ButtonProps, 'onclick' | 'children' | 'oncancel' | 'onconfirm'> {
    cancelColor?: ButtonProps['color']
    confirmColor?: ButtonProps['color']
    cancelLabel?: string
    confirmLabel?: string
    closeOnConfirm?: boolean
    onconfirm?: (event: MouseEvent) => unknown
    oncancel?: (event: MouseEvent) => unknown
    children?: Snippet
  }
</script>

<script lang="ts">
  import CheckIcon from 'lucide-svelte/icons/check'
  import XIcon from 'lucide-svelte/icons/x'
  import Button from '../button/button.svelte'

  let {
    class: className = '',
    size = 'md',
    color = 'primary',
    cancelColor = 'error',
    confirmColor = 'primary',
    cancelLabel = 'Cancel',
    confirmLabel = 'Confirm',
    closeOnConfirm = true,
    type = 'button',
    Icon,
    onconfirm,
    oncancel,
    disabled = false,
    loading = false,
    children,
    ...rest
  }: ConfirmButtonProps = $props()

  let confirming = $state(false)

  function openConfirm(event: MouseEvent) {
    event.preventDefault()
    if (disabled || loading) return
    confirming = true
  }

  function cancelConfirm(event: MouseEvent) {
    event.preventDefault()
    confirming = false
    oncancel?.(event)
  }

  function approveConfirm(event: MouseEvent) {
    event.preventDefault()
    const form = (event.currentTarget as HTMLButtonElement).form
    onconfirm?.(event)
    if (closeOnConfirm) {
      confirming = false
    }
    if (type === 'submit') {
      form?.requestSubmit()
    }
  }
</script>

<div class={[className, 'inline-flex items-center']}>
    {#if !confirming}
      <Button
        type="button"
        size={size}
        color={color}
        Icon={Icon}
        onclick={openConfirm}
        disabled={disabled}
        loading={loading}
        {...rest}
      >{@render children?.()}</Button>
    {:else}
      <div
        class="inline-flex items-center gap-2"
      >
        <Button
          type="button"
          size="sm"
          color={cancelColor}
          Icon={XIcon}
          aria-label={cancelLabel}
          title={cancelLabel}
          onclick={cancelConfirm}
          disabled={disabled || loading}
        />
        <Button
          {type}
          size="sm"
          color={confirmColor}
          Icon={CheckIcon}
          aria-label={confirmLabel}
          title={confirmLabel}
          onclick={approveConfirm}
          disabled={disabled}
          loading={loading}
          {...rest}
        />
      </div>
    {/if}
</div>
