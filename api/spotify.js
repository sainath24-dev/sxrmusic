export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, limit } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing Spotify url parameter' });
  }

  // Parse maximum track limit
  let maxLimit = 1000;
  if (limit && limit !== 'all') {
    const parsed = parseInt(limit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      maxLimit = parsed;
    }
  }

  try {
    let embedUrl = url;
    let playlistId = null;
    let isPlaylist = false;

    if (url.includes('spotify.com/playlist/')) {
      playlistId = url.split('playlist/')[1].split('?')[0];
      embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
      isPlaylist = true;
    } else if (url.includes('spotify.com/album/')) {
      const albumId = url.split('album/')[1].split('?')[0];
      embedUrl = `https://open.spotify.com/embed/album/${albumId}`;
    } else if (url.includes('spotify.com/track/')) {
      const trackId = url.split('track/')[1].split('?')[0];
      embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    }

    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Spotify embed returned status ${response.status}` });
    }

    const html = await response.text();
    let name = 'Spotify Playlist';
    let fallbackTracks = [];

    // 1. Try to extract basic metadata and fallback tracks from __NEXT_DATA__
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (match) {
      try {
        const nextData = JSON.parse(match[1]);
        const entity = nextData?.props?.pageProps?.state?.data?.entity;
        if (entity) {
          name = entity.name || entity.title || name;
          if (entity.trackList && entity.trackList.length > 0) {
            fallbackTracks = entity.trackList.map(t => ({
              title: t.title,
              artist: t.subtitle || '',
              query: `${t.title} ${t.subtitle || ''}`.trim(),
              duration: t.duration || 0
            }));
          } else if (entity.title) {
            fallbackTracks = [{
              title: entity.title,
              artist: entity.subtitle || '',
              query: `${entity.title} ${entity.subtitle || ''}`.trim(),
              duration: entity.duration || 0
            }];
          }
        }
      } catch (err) {
        console.warn('Could not parse __NEXT_DATA__:', err);
      }
    }

    // 2. If it's a playlist, attempt multi-page retrieval via Spotify Partner API (allows 100+ songs up to maxLimit)
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
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
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
      } catch (partnerErr) {
        console.warn('Partner query pagination error:', partnerErr);
      }
    }

    // Fall back to embed trackList if partner API yielded 0 tracks
    if (tracks.length === 0) {
      tracks = fallbackTracks;
    }

    if (tracks.length > maxLimit) {
      tracks = tracks.slice(0, maxLimit);
    }

    if (tracks.length === 0) {
      return res.status(404).json({ error: 'No tracks found for this Spotify link' });
    }

    return res.status(200).json({
      success: true,
      name,
      total: tracks.length,
      tracks
    });
  } catch (err) {
    console.error('Spotify API Handler Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
