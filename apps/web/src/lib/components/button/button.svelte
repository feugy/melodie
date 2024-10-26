<script module lang="ts">
  const sizes = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }
  const iconPaddings = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  }
  const gaps = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  }
  const colors = {
    primary: 'preset-filled-primary-500',
    secondary: 'preset-filled-secondary-500',
    tertiary: 'preset-filled-tertiary-500',
    success: 'preset-filled-success-500',
    warning: 'preset-filled-warning-500',
    error: 'preset-filled-error-500',
    surface: 'preset-filled-surface-500',
  }

  export interface ButtonProps {
    Icon?: typeof IconType | Component
    class?: string
    size?: keyof typeof sizes
    color?: keyof typeof colors
    onclick?: () => unknown
    children?: Snippet
  }
</script>

<script lang="ts">
  import type { Icon as IconType } from 'lucide-svelte'
  import type { Component, Snippet } from 'svelte'

  let {
    onclick,
    class: className = '',
    Icon,
    children,
    size = 'md',
    color = 'primary',
  }: ButtonProps = $props()
</script>

<button
  type="button"
  class="{className} btn {colors[color]} {sizes[size]} {children
    ? gaps[size]
    : `${iconPaddings[size]} h-auto`}"
  {onclick}
  >{#if Icon}<Icon
      class="{children ? 'size-[1em]' : 'size-[1.25em]'} text-inherit"
    />{/if}{@render children?.()}</button
>
