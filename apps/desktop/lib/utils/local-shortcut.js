export function registerShortcut(webContents, shortcut, handler) {
  webContents.on('before-input-event', (event, input) => {
    if (matchAccelerator(shortcut, input)) {
      event.preventDefault()
      handler(webContents, event)
    }
  })
}

const modifierChecks = [
  { value: 'alt', modifier: 'alt' },
  { value: 'shift', modifier: 'shift' },
  { value: 'command', altValue: 'cmd', modifier: 'meta' },
  { value: 'control', altValue: 'ctrl', modifier: 'control' },
  {
    value: 'commandorcontrol',
    altValue: 'cmdorctrl',
    modifier: 'control',
    modifier2: 'meta'
  }
]

export function matchAccelerator(shortcut, input) {
  for (const part of shortcut.toLowerCase().split('+')) {
    let modifierMatch = false
    for (const { value, altValue, modifier, modifier2 } of modifierChecks) {
      if (part === value || part === altValue) {
        if (!input[modifier] && !input[modifier2]) {
          return false
        } else {
          modifierMatch = true
          break
        }
      }
    }
    if (!modifierMatch && input.key.toLowerCase() !== part) {
      return false
    }
  }
  return true
}
