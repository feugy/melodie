'use strict'

export function classOnChange(node, parameters) {
  let previousValue = null
  let timeout

  const update = ({ value, className, duration = 500 }) => {
    if (value !== previousValue) {
      previousValue = value
      node.classList.add(className)
      timeout = setTimeout(
        () => node.classList.remove(className),
        duration + 10
      )
    }
  }

  update(parameters)

  return {
    update,
    destroy: () => clearTimeout(timeout)
  }
}
