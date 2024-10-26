// uno.config.ts
import { defineConfig, presetIcons, presetWebFonts, presetWind } from 'unocss'

export default defineConfig({
  presets: [
    presetWind(),
    presetWebFonts({
      provider: 'bunny',
      fonts: {
        raleway: {
          name: 'Raleway',
          weights: ['200', '700']
        },
        sourceSansPro: {
          name: 'Source Sans Pro',
          weights: ['300', '600']
        }
      }
    }),
    presetIcons({
      collections: {
        mdi: () => import('@iconify-json/mdi/icons.json').then(i => i.default)
      }
    })
  ],
  safelist: [...buildIconSafeList()]
})

function buildIconSafeList() {
  return ['cloud-arrow-down', 'launch', 'menu-down', 'menu-up'].map(
    name => `i-mdi-${name}`
  )
}
