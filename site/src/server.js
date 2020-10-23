'use strict'

import sirv from 'sirv'
import polka from 'polka'
import * as sapper from '@sapper/server'

const { PORT, NODE_ENV } = process.env
const baseUrl = NODE_ENV === 'development' ? '/' : 'melodie'

polka().use(baseUrl, sirv('static'), sapper.middleware()).listen(PORT)
