'use strict'

export const artistSuggestionsData = [
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg',
    provider: 'Discogs'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg',
    provider: 'Discogs'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg',
    provider: 'Discogs'
  }
]

export const albumSuggestionsData = artistSuggestionsData.map(
  ({ artwork, provider }) => ({ cover: artwork, provider })
)
