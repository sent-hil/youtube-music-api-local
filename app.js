const http = require('http')
const { URL } = require('url')
const ytdl = require('@distube/ytdl-core')
const { google } = require('googleapis')
const youtubesearchapi = require('youtube-search-api')

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
})

const PORT = 9000

const searchForVideos = async (searchQuery, nextPageToken, amount) => {
  return await youtubesearchapi.GetListByKeyword(searchQuery, false, amount)
}

const getAudioUrl = async (videoId) => {
  const info = await ytdl.getInfo(`http://www.youtube.com/watch?v=${videoId}`)
  return info.formats.filter(
    (x) => x['container'] == 'mp4' && x['hasAudio'] == true
  )[0]
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
  const query = Object.fromEntries(parsedUrl.searchParams).query

  if (!query) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: '`query` is empty' }))
    return
  }

  console.log('Got request with query', query)

  const videos = await searchForVideos(query)
  console.log(`Found ${videos.items.length} videos`)

  // filter out sponsored videos
  const id = videos.items.filter((i) => 'channelTitle' in i)[0].id

  const audioFormat = await getAudioUrl(id)
  console.log('Returning', id)

  res.writeHead(200, { 'Content-Type': 'application/json' })

  res.end(JSON.stringify({ url: audioFormat.url }))
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`)
})
