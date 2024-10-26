import audiodb from './audiodb/index.js'
import discogs from './discogs/index.js'
import local from './local/index.js'

export { default as audiodb } from './audiodb/index.js'
export { default as discogs } from './discogs/index.js'
export { default as local } from './local/index.js'
export const allProviders = [audiodb, discogs, local]
export * from './too-many-requests-error.js'
