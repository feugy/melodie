'use strict'

export function autoScrollable(node, params = {}) {
  let borderDetection
  let maxScroll
  let enabled
  let scrollBy
  let timeout

  function destroy() {
    node.removeEventListener('mousemove', handleMouseMove)
    node.removeEventListener('mouseleave', handleMouseLeave)
  }

  function update(params = {}) {
    borderDetection = params.borderDetection | 75
    maxScroll = params.maxScroll || 50
    enabled = params.enabled !== undefined ? params.enabled : true
    if (enabled) {
      node.addEventListener('mousemove', handleMouseMove)
      node.addEventListener('mouseleave', handleMouseLeave)
    } else {
      handleMouseLeave()
      destroy()
    }
  }

  update(params)

  function scrollView() {
    node.scrollBy({ top: scrollBy })
    timeout = requestAnimationFrame(scrollView)
  }

  function handleMouseMove({ clientY }) {
    const { scrollTop, scrollHeight, clientHeight } = node
    if (scrollHeight <= clientHeight) {
      return
    }
    cancelAnimationFrame(timeout)
    scrollBy = 0
    if (clientY < borderDetection && scrollTop > 0) {
      scrollBy = (-(borderDetection - clientY) * maxScroll) / borderDetection
    } else if (
      clientY > clientHeight - borderDetection &&
      scrollTop < scrollHeight - clientHeight
    ) {
      scrollBy =
        ((clientY - clientHeight + borderDetection) * maxScroll) /
        borderDetection
    }
    if (scrollBy) {
      scrollView()
    }
  }

  function handleMouseLeave() {
    cancelAnimationFrame(timeout)
  }

  return { update, destroy }
}
