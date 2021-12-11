import { createRequire } from 'module'
import sveltePreprocess from 'svelte-preprocess'
import { windi } from 'svelte-windicss-preprocess'

const require = createRequire(import.meta.url)
const { version } = require('./package.json')

export default {
  preprocess: [
    sveltePreprocess({
      postcss: true,
      replace: [['MELODIE_VERSION', JSON.stringify(version)]]
    }),
    // Jest does not use vite, which has its windiCSS processor
    windi({})
  ]
}
