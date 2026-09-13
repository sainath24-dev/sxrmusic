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

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing Spotify url parameter' });
  }

  try {
    let embedUrl = url;
    if (url.includes('spotify.com/playlist/')) {
      const playlistId = url.split('playlist/')[1].split('?')[0];
      embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
    } else if (url.includes('spotify.com/album/')) {
      const albumId = url.split('album/')[1].split('?')[0];
      embedUrl = `https://open.spotify.com/embed/album/${albumId}`;
    } else if (url.includes('spotify.com/track/')) {
      const trackId = url.split('track/')[1].split('?')[0];
      embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    }

    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Spotify embed returned status ${response.status}` });
    }

    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (!match) {
      return res.status(404).json({ error: 'Could not find __NEXT_DATA__ in Spotify embed HTML' });
    }

    const nextData = JSON.parse(match[1]);
    const entity = nextData?.props?.pageProps?.state?.data?.entity;

    if (!entity) {
      return res.status(404).json({ error: 'Could not find playlist entity in Spotify data' });
    }

    const name = entity.name || entity.title || 'Spotify Playlist';
    let tracks = [];

    if (entity.trackList && entity.trackList.length > 0) {
      tracks = entity.trackList.map(t => ({
        title: t.title,
        artist: t.subtitle || '',
        query: `${t.title} ${t.subtitle || ''}`.trim(),
        duration: t.duration || 0
      }));
    } else if (entity.title) {
      tracks = [{
        title: entity.title,
        artist: entity.subtitle || '',
        query: `${entity.title} ${entity.subtitle || ''}`.trim(),
        duration: entity.duration || 0
      }];
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
