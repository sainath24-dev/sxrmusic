import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyPlugin = () => ({
  name: 'media-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // Handle /api/youtube
      if (req.url && req.url.startsWith('/api/youtube?')) {
        try {
          const parsedUrl = new URL(req.url, 'http://localhost');
          const targetUrl = parsedUrl.searchParams.get('url') || parsedUrl.searchParams.get('list') || '';
          const limitParam = parsedUrl.searchParams.get('limit');
          let maxLimit = 1000;
          if (limitParam && limitParam !== 'all') {
            const parsedLimit = parseInt(limitParam, 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) maxLimit = parsedLimit;
          }

          let playlistId = null;
          if (targetUrl.includes('list=')) {
            playlistId = targetUrl.split('list=')[1].split('&')[0];
          } else if (targetUrl.startsWith('PL') || targetUrl.startsWith('UU') || targetUrl.startsWith('OLAK5uy_') || targetUrl.startsWith('RD')) {
            playlistId = targetUrl;
          }

          if (playlistId) {
            let playlistTitle = 'YouTube Playlist';
            let continuationToken = null;
            const tracks = [];
            const seenQueries = new Set();

            const extractTracksAndContinuation = (obj) => {
              if (!obj || typeof obj !== 'object') return;
              if (obj.playlistHeaderRenderer?.title?.runs?.[0]?.text) {
                playlistTitle = obj.playlistHeaderRenderer.title.runs[0].text;
              } else if (obj.musicDetailHeaderRenderer?.title?.runs?.[0]?.text) {
                playlistTitle = obj.musicDetailHeaderRenderer.title.runs[0].text;
              }

              if (obj.musicResponsiveListItemRenderer) {
                const flexColumns = obj.musicResponsiveListItemRenderer.flexColumns;
                if (flexColumns && flexColumns.length > 0) {
                  const title = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
                  let artist = '';
                  if (flexColumns.length > 1) {
                    artist = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map(r => r.text).join('') || '';
                  }
                  if (title && title !== '[Private video]' && title !== '[Deleted video]') {
                    const query = `${title} ${artist}`.trim();
                    if (!seenQueries.has(query.toLowerCase())) {
                      seenQueries.add(query.toLowerCase());
                      tracks.push({ title, artist, query });
                    }
                  }
                }
              } else if (obj.playlistVideoRenderer) {
                const title = obj.playlistVideoRenderer.title?.runs?.[0]?.text || obj.playlistVideoRenderer.title?.simpleText;
                const artist = obj.playlistVideoRenderer.shortBylineText?.runs?.[0]?.text || '';
                if (title && title !== '[Private video]' && title !== '[Deleted video]') {
                  const query = `${title} ${artist}`.trim();
                  if (!seenQueries.has(query.toLowerCase())) {
                    seenQueries.add(query.toLowerCase());
                    tracks.push({ title, artist, query });
                  }
                }
              }

              if (obj.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
                continuationToken = obj.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
              }

              Object.values(obj).forEach(extractTracksAndContinuation);
            };

            const browseRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              body: JSON.stringify({
                context: {
                  client: {
                    clientName: 'WEB_REMIX',
                    clientVersion: '1.20240101.00.00',
                    hl: 'en',
                    gl: 'US'
                  }
                },
                browseId: playlistId.startsWith('VL') ? playlistId : `VL${playlistId}`
              })
            });

            const initialData = await browseRes.json();
            extractTracksAndContinuation(initialData);

            let pages = 1;
            while (continuationToken && tracks.length < maxLimit && pages < 15) {
              const nextTok = continuationToken;
              continuationToken = null;
              pages++;

              const contRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: JSON.stringify({
                  context: {
                    client: {
                      clientName: 'WEB_REMIX',
                      clientVersion: '1.20240101.00.00',
                      hl: 'en',
                      gl: 'US'
                    }
                  },
                  continuation: nextTok
                })
              });

              if (!contRes.ok) break;
              const contData = await contRes.json();
              const prevCount = tracks.length;
              extractTracksAndContinuation(contData);
              if (tracks.length === prevCount) break;
            }

            const finalTracks = tracks.slice(0, maxLimit);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, name: playlistTitle, total: finalTracks.length, tracks: finalTracks }));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'No playlist ID found' }));
          return;
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }

      // Handle /api/spotify
      if (req.url && req.url.startsWith('/api/spotify?')) {
        try {
          const parsedUrl = new URL(req.url, 'http://localhost');
          const targetUrl = parsedUrl.searchParams.get('url') || '';
          const limitParam = parsedUrl.searchParams.get('limit');
          let maxLimit = 1000;
          if (limitParam && limitParam !== 'all') {
            const parsedLimit = parseInt(limitParam, 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) maxLimit = parsedLimit;
          }

          let embedUrl = targetUrl;
          let playlistId = null;
          let isPlaylist = false;
          if (targetUrl.includes('spotify.com/playlist/')) {
            playlistId = targetUrl.split('playlist/')[1].split('?')[0];
            embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
            isPlaylist = true;
          } else if (targetUrl.includes('spotify.com/album/')) {
            const albumId = targetUrl.split('album/')[1].split('?')[0];
            embedUrl = `https://open.spotify.com/embed/album/${albumId}`;
          } else if (targetUrl.includes('spotify.com/track/')) {
            const trackId = targetUrl.split('track/')[1].split('?')[0];
            embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
          }

          const response = await fetch(embedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          });

          const html = await response.text();
          let name = 'Spotify Playlist';
          let fallbackTracks = [];

          const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
          if (match) {
            try {
              const nextData = JSON.parse(match[1]);
              const entity = nextData?.props?.pageProps?.state?.data?.entity;
              name = entity?.name || entity?.title || name;
              if (entity?.trackList && entity.trackList.length > 0) {
                fallbackTracks = entity.trackList.map(t => ({
                  title: t.title,
                  artist: t.subtitle || '',
                  query: `${t.title} ${t.subtitle || ''}`.trim()
                }));
              }
            } catch (e) {}
          }

          const tokenMatch = html.match(/"accessToken":"([^"]+)"/);
          const token = tokenMatch ? tokenMatch[1] : null;
          const SPOTIFY_PLAYLIST_QUERY_HASH = "86dde7b9d9356e2369414647cf6950cfed96e778e129cfdfc99aea6c1613b3b0";

          let tracks = [];
          if (isPlaylist && playlistId && token) {
            try {
              let offset = 0;
              let totalCount = Infinity;
              let pages = 0;

              while (offset < totalCount && tracks.length < maxLimit && pages < 15) {
                pages++;
                const params = new URLSearchParams({
                  operationName: 'fetchPlaylistContents',
                  variables: JSON.stringify({
                    uri: `spotify:playlist:${playlistId}`,
                    offset,
                    limit: 100
                  }),
                  extensions: JSON.stringify({
                    persistedQuery: { version: 1, sha256Hash: SPOTIFY_PLAYLIST_QUERY_HASH }
                  })
                });

                const partnerRes = await fetch(`https://api-partner.spotify.com/pathfinder/v1/query?${params.toString()}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                  }
                });

                if (!partnerRes.ok) break;
                const partnerData = await partnerRes.json();
                const content = partnerData.data?.playlistV2?.content;
                if (!content || !content.items) break;

                if (content.totalCount !== undefined) {
                  totalCount = content.totalCount;
                }

                const items = content.items;
                if (items.length === 0) break;

                for (const it of items) {
                  if (tracks.length >= maxLimit) break;
                  const trackData = it.itemV2?.data;
                  if (trackData) {
                    const trackTitle = trackData.name;
                    const trackArtist = trackData.artists?.items?.map(a => a.profile?.name).filter(Boolean).join(', ') || '';
                    if (trackTitle) {
                      tracks.push({
                        title: trackTitle,
                        artist: trackArtist,
                        query: `${trackTitle} ${trackArtist}`.trim()
                      });
                    }
                  }
                }

                offset += items.length;
                if (items.length < 100) break;
              }
            } catch (err) {
              console.warn('Local partner pagination error:', err);
            }
          }

          if (tracks.length === 0) {
            tracks = fallbackTracks;
          }

          if (tracks.length > maxLimit) {
            tracks = tracks.slice(0, maxLimit);
          }

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ success: true, name, total: tracks.length, tracks }));
          return;
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }

      // Handle /api/proxy
      if (req.url && req.url.startsWith('/api/proxy?url=')) {
        try {
          const targetUrl = decodeURIComponent(req.url.slice('/api/proxy?url='.length));
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          const text = await response.text();
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(text);
          return;
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), proxyPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
