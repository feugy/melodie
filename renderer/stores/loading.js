'use strict'

import { combineLatest, BehaviorSubject } from 'rxjs'
import { pluck } from 'rxjs/operators'
import * as albums from './albums'
import * as artists from './artists'
import * as playlists from './playlists'
import { fromServerChannel } from '../utils'

const initValue = new BehaviorSubject()

export const isLoading = combineLatest(
  initValue,
  fromServerChannel('tracking').pipe(pluck('inProgress')),
  albums.isListing,
  artists.isListing,
  playlists.isListing,
  (...statuses) => statuses.some(status => status)
)

initValue.next(false)
