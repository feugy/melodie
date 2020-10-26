'use strict'

import sirv from 'sirv'
import polka from 'polka'
import * as sapper from '@sapper/server'

const { PORT, BASE_PATH } = process.env

polka()
  .use(BASE_PATH || '/', sirv('static'), sapper.middleware())
  .listen(PORT)
