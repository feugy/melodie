import '../common'

window.BASE_URL = ''

window.IntersectionObserver = function () {
  return {
    observe: jest.fn(),
    unobserve: jest.fn()
  }
}

window.ResizeObserver = function () {
  return {
    observe: jest.fn(),
    unobserve: jest.fn()
  }
}

Element.prototype.scrollTo = jest.fn()
