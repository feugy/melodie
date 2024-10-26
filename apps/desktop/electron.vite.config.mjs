import defineUiConfig from '@melodie/ui/vite.config.js'
import { defineConfig } from 'electron-vite'

export default defineConfig(async args => {
  const renderer = await defineUiConfig(args)
  return {
    /*main: {
      build: {
        lib: {
          entry: './main.js',
          formats: 'es'
        },
        rollupOptions: {
          external: [
            /^electron/,
            'mock-aws-s3',
            'aws-sdk',
            'better-sqlite3',
            'mysql2',
            'oracledb',
            'pg',
            'tedious',
            'mysql',
            'pg-query-stream',
            ...builtinModules.flatMap(m => [m, `node:${m}`])
          ]
        }
      }
    },*/
    renderer: {
      root: '../../common/ui',
      define: renderer.define,
      plugins: renderer.plugins,
      build: {
        rollupOptions: {
          input: { index: '../../common/ui/index.html' }
        },
        outDir: 'out'
      }
    }
  }
})
