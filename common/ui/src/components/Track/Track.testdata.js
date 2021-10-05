const album = 'Diamonds on the inside'
const artists = ['Ben Harper']
const albumRef = [1, album]
const artistRefs = artists.map((artist, id) => [id, artist])

export const trackData = {
  media: './cover.jpg',
  tags: { title: 'Mama got a girlfriend', artists, album, duration: 125.78 },
  albumRef,
  artistRefs
}
