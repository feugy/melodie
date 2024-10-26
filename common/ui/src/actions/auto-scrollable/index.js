export function autoScrollable(node, params = {}) {
  let borderDetection
  let maxScroll
  let scrollBy
  let timeout

  function destroy() {
    node.removeEventListener('drag', handleMouseMove)
    node.removeEventListener('dragend', handleMouseLeave)
  }

  function update(params = {}) {
    borderDetection = params.borderDetection | 75
    maxScroll = params.maxScroll || 30
    node.addEventListener('drag', handleMouseMove)
    node.addEventListener('dragend', handleMouseLeave)
  }

  update(params)

  function scrollView() {
    node.scrollBy({ top: scrollBy })
    timeout = window?.requestAnimationFrame(scrollView)
  }

  function handleMouseMove({ clientY }) {
    const { scrollTop, scrollHeight, clientHeight } = node
    if (scrollHeight <= clientHeight || clientY === 0) {
      return
    }
    window?.cancelAnimationFrame(timeout)
    scrollBy = 0
    if (clientY < borderDetection && scrollTop > 0) {
      scrollBy = (-(borderDetection - clientY) * maxScroll) / borderDetection
    } else if (
      clientY > clientHeight - borderDetection &&
      scrollTop < scrollHeight - clientHeight
    ) {
      scrollBy =
        ((Math.min(clientY, clientHeight) - clientHeight + borderDetection) *
          maxScroll) /
        borderDetection
    }
    if (scrollBy) {
      scrollView()
    }
  }

  function handleMouseLeave() {
    window?.cancelAnimationFrame(timeout)
  }

  return { update, destroy }
}
