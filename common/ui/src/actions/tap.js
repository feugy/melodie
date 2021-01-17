'use strict'

const tapDuration = 250

export function tap(node) {
  function handleDown({ clientX, clientY }) {
    if (node.disabled) {
      return
    }

    const handleUp = event => {
      if (
        Math.abs(event.clientX - clientX) > 5 ||
        Math.abs(event.clientY - clientY) > 5
      ) {
        return
      }
      node.dispatchEvent(
        new CustomEvent('tap', {
          detail: { x: event.clientX, y: event.clientY }
        })
      )
      clean()
    }

    function clean() {
      node.removeEventListener('pointerup', handleUp)
    }

    node.addEventListener('pointerup', handleUp)
    setTimeout(clean, tapDuration)
  }

  node.addEventListener('pointerdown', handleDown)
  return { destroy: () => node.removeEventListener('pointerdown', handleDown) }
}
