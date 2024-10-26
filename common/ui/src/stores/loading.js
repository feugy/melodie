import { combineLatest } from 'rxjs'
import { map, pluck } from 'rxjs/operators'

import { fromServerEvent } from '../utils'
import * as albums from './albums'
import * as artists from './artists'
import * as playlists from './playlists'

export const isLoading = combineLatest([
  fromServerEvent('tracking').pipe(pluck('inProgress')),
  albums.isListing,
  artists.isListing,
  playlists.isListing
]).pipe(
  map(statuses => (statuses.length ? statuses.some(status => status) : false))
)
