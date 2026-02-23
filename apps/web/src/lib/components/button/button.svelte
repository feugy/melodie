<script module lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements'

  const sizes = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }
  const iconPaddings = {
    sm: 'p-1.5!',
    md: 'p-2!',
    lg: 'p-2.5!',
  }
  const gaps = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  }
  const colors = {
    primary: 'preset-outlined-primary-500 text-primary-500',
    secondary: 'preset-filled-secondary-500',
    tertiary: 'preset-filled-tertiary-500',
    success: 'preset-filled-success-500',
    warning: 'preset-filled-warning-500',
    error: 'preset-filled-error-500',
    surface: 'preset-filled-surface-500',
  }

  export interface ButtonProps extends HTMLButtonAttributes {
    Icon?: typeof IconType | Component
    class?: string
    size?: keyof typeof sizes
    color?: keyof typeof colors
    children?: Snippet
    loading?: boolean
  }
</script>

<script lang="ts">
  import type { Icon as IconType } from 'lucide-svelte'
  import Loader from 'lucide-svelte/icons/loader-circle'
  import type { Component, Snippet } from 'svelte'

  let {
    class: className = '',
    Icon,
    children,
    size = 'md',
    color = 'primary',
    loading = false,
    disabled = false,
    ...rest
  }: ButtonProps = $props()

  let DisplayedIcon = $derived(loading ? Loader : Icon)
</script>

<button
  type="button"
  class={[
    className,
    'btn h-auto font-semibold',
    colors[color],
    sizes[size],
    children ? gaps[size] : iconPaddings[size],
    !children && 'rounded-full',
    loading && '[&>svg]:animate-spin',
  ]}
  disabled={disabled || loading}
  {...rest}
  >{#if DisplayedIcon}<DisplayedIcon
      class={[
        children ? 'size-[1em]' : 'size-[1.25em]',
        'text-inherit',
      ] as unknown as string}
    />{/if}{@render children?.()}</button
>
