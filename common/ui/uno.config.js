// uno.config.ts
import { defineConfig, presetIcons, presetWind } from 'unocss'

export default defineConfig({
  presets: [
    presetWind(),
    presetIcons({
      collections: {
        mdi: () => import('@iconify-json/mdi/icons.json').then(i => i.default)
      }
    })
  ],
  safelist: [...buildIconSafeList(), ...buildClassSafeList()]
})

function buildClassSafeList() {
  return Array.from({ length: 8 }, (_, i) => `col-span-${i + 1}`)
}

function buildIconSafeList() {
  return [
    'account',
    'album',
    'alert',
    'arrow-top-right-bottom-left',
    'check',
    'chevron-down',
    'chevron-left',
    'chevron-right',
    'chevron-up',
    'close-circle',
    'close',
    'cog',
    'delete',
    'dots-vertical',
    'face-man',
    'folder',
    'heart-outline',
    'launch',
    'location-enter',
    'magnify',
    'menu-down',
    'menu-up',
    'menu',
    'music-box-multiple',
    'music-note',
    'pause',
    'pencil',
    'play',
    'playlist-music',
    'playlist-plus',
    'plus-box-multiple',
    'plus-box',
    'repeat-once',
    'repeat',
    'shuffle',
    'skip-next',
    'skip-previous',
    'tag',
    'tray-arrow-down',
    'volume-off',
    'volume-plus',
    'volume',
    'wifi-off',
    'wifi'
  ].map(name => `i-mdi-${name}`)
}
