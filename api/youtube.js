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

  const { url, list } = req.query;
  const input = url || list;
  if (!input) {
    return res.status(400).json({ error: 'Missing YouTube url or list parameter' });
  }

  try {
    // Extract playlist ID from URL or parameter
    let playlistId = null;
    if (input.includes('list=')) {
      const parts = input.split('list=')[1].split('&')[0];
      playlistId = parts;
    } else if (input.startsWith('PL') || input.startsWith('UU') || input.startsWith('OLAK5uy_') || input.startsWith('RD')) {
      playlistId = input;
    }

    if (playlistId) {
      const browseRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
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

      if (!browseRes.ok) {
        return res.status(browseRes.status).json({ error: `YouTube API returned status ${browseRes.status}` });
      }

      const data = await browseRes.json();
      const tracks = [];
      let playlistTitle = 'YouTube Playlist';

      const searchForTracks = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        // Extract title if available in header
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
              tracks.push({
                title,
                artist,
                query: `${title} ${artist}`.trim()
              });
            }
          }
        } else if (obj.playlistVideoRenderer) {
          const title = obj.playlistVideoRenderer.title?.runs?.[0]?.text || obj.playlistVideoRenderer.title?.simpleText;
          const artist = obj.playlistVideoRenderer.shortBylineText?.runs?.[0]?.text || '';
          if (title && title !== '[Private video]' && title !== '[Deleted video]') {
            tracks.push({
              title,
              artist,
              query: `${title} ${artist}`.trim()
            });
          }
        }

        Object.values(obj).forEach(searchForTracks);
      };

      searchForTracks(data);

      if (tracks.length > 0) {
        return res.status(200).json({
          success: true,
          name: playlistTitle,
          total: tracks.length,
          tracks
        });
      }
    }

    // Fallback: Check for single or multiple video URLs via oEmbed
    const videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
    const matches = [];
    let m;
    while ((m = videoIdRegex.exec(input)) !== null) {
      if (!matches.includes(m[1])) matches.push(m[1]);
    }

    if (matches.length > 0) {
      const titles = await Promise.all(
        matches.map(async (vid) => {
          try {
            const oe = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`);
            if (oe.ok) {
              const d = await oe.json();
              return d.title || null;
            }
          } catch {}
          return null;
        })
      );

      const validTracks = titles.filter(Boolean).map(t => ({ title: t, artist: '', query: t }));
      if (validTracks.length > 0) {
        return res.status(200).json({
          success: true,
          name: validTracks.length === 1 ? validTracks[0].title : `YouTube Mix (${validTracks.length} tracks)`,
          total: validTracks.length,
          tracks: validTracks
        });
      }
    }

    return res.status(404).json({ error: 'No tracks could be found from this YouTube link' });
  } catch (err) {
    console.error('YouTube API Handler Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to extract YouTube tracks' });
  }
}
