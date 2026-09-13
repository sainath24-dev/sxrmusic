// Reliable instances for JioSaavn API
const PRIMARY_BASE = 'https://saavn.sumit.co/api';

const fetchApi = async (endpoint, params = {}) => {
  const url = new URL(`${PRIMARY_BASE}${endpoint}`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  try {
    const r = await fetch(url.toString(), { mode: 'cors' });
    if (!r.ok) {
      if (r.status === 404) return { success: false, data: null };
      throw new Error(`HTTP ${r.status}`);
    }
    const data = await r.json();
    return data.data ? data : { success: true, data };
  } catch (err) {
    console.warn(`API request issue on ${endpoint}:`, err);
    return { success: false, data: null };
  }
};

export const searchAll = async (query) => {
  const [songsRes, artistsRes, albumsRes] = await Promise.all([
    searchSongs(query, 50),
    searchArtists(query, 20),
    searchAlbums(query, 20)
  ]);

  return {
    success: true,
    data: {
      songs: songsRes.data || { results: [] },
      artists: artistsRes.data || { results: [] },
      albums: albumsRes.data || { results: [] }
    }
  };
};

export const searchSongs = (query, limit = 50) => fetchApi('/search/songs', { query, limit, n: limit });
export const searchAlbums = (query, limit = 20) => fetchApi('/search/albums', { query, limit, n: limit });
export const searchArtists = (query, limit = 20) => fetchApi('/search/artists', { query, limit, n: limit });

export const getAlbumById = (id) => fetchApi('/albums', { id });
export const getArtistById = (id) => fetchApi(`/artists/${id}`);

export const getArtistSongs = async (id, pages = 3) => {
  const allResults = [];
  for (let i = 0; i < pages; i++) {
    const res = await fetchApi(`/artists/${id}/songs`, { page: i, limit: 50, n: 50 });
    if (res.success && res.data) {
      const results = res.data.results || res.data || [];
      if (Array.isArray(results)) {
        allResults.push(...results);
        if (results.length < 10) break;
      } else if (results.songs) {
        allResults.push(...results.songs);
        if (results.songs.length < 10) break;
      }
    }
  }
  return { success: true, data: { results: allResults } };
};

const cleanSongSearchTerm = (str) => {
  if (!str) return '';
  return str
    .replace(/official\s*(music)?\s*(video|audio|lyric|lyrics|track)/gi, ' ')
    .replace(/full\s*(video|audio|song)/gi, ' ')
    .replace(/video\s*song/gi, ' ')
    .replace(/\b(video|song|audio|lyrics|lyrical|hd|4k|remastered|visualizer|feat\.|ft\.)\b/gi, ' ')
    .replace(/[\[\(\{].*?[\]\}\)]/g, ' ')
    .replace(/[\|\-–—•:\/\\_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const parseLrcOrPlainLyrics = (rawText, rawSynced) => {
  if (!rawText && !rawSynced) return { synced: false, lines: [] };
  
  if (rawSynced && typeof rawSynced === 'string') {
    const lines = [];
    const rawLines = rawSynced.split('\n');
    for (const line of rawLines) {
      const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseFloat(match[2]);
        const time = mins * 60 + secs;
        const text = decodeHtml(match[3]).trim();
        if (text) {
          lines.push({ time, text });
        }
      }
    }
    if (lines.length > 0) {
      return { synced: true, lines };
    }
  }

  // Plain lyrics fallback
  const textSource = rawText || rawSynced || '';
  const clean = textSource.replace(/<br\s*\/?>/gi, '\n');
  const lines = clean
    .split('\n')
    .map(l => ({ time: 0, text: decodeHtml(l).trim() }))
    .filter(l => l.text.length > 0);

  return { synced: false, lines };
};

export const getLyrics = async (songParam) => {
  if (!songParam) return { success: false, data: null };

  const id = typeof songParam === 'object' ? songParam.id : songParam;
  const rawTitle = typeof songParam === 'object' ? (songParam.name || songParam.title || '') : '';
  const rawArtist = typeof songParam === 'object' 
    ? (songParam.artists?.primary?.[0]?.name || songParam.artists?.all?.[0]?.name || songParam.subtitle || '') 
    : '';

  const cleanTrack = cleanSongSearchTerm(rawTitle);
  const cleanArtist = cleanSongSearchTerm(rawArtist).split(',')[0].split('&')[0].trim();

  // 1. Try LRCLIB for Synchronized & Multilingual Lyrics
  if (cleanTrack) {
    try {
      if (cleanArtist) {
        const directUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(cleanArtist)}`;
        const res = await fetch(directUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.syncedLyrics || data.plainLyrics) {
            const parsed = parseLrcOrPlainLyrics(data.plainLyrics, data.syncedLyrics);
            if (parsed.lines.length > 0) {
              return { 
                success: true, 
                data: { 
                  synced: parsed.synced, 
                  lines: parsed.lines,
                  lyrics: data.plainLyrics || data.syncedLyrics 
                } 
              };
            }
          }
        }
      }

      // LRCLIB Search fallback
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTrack} ${cleanArtist}`.trim())}`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          const best = results[0];
          if (best.syncedLyrics || best.plainLyrics) {
            const parsed = parseLrcOrPlainLyrics(best.plainLyrics, best.syncedLyrics);
            if (parsed.lines.length > 0) {
              return { 
                success: true, 
                data: { 
                  synced: parsed.synced, 
                  lines: parsed.lines,
                  lyrics: best.plainLyrics || best.syncedLyrics 
                } 
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn("LRCLIB query failed:", e);
    }
  }

  // 2. JioSaavn / Saavn API Fallback
  if (id) {
    try {
      const res = await fetchApi('/lyrics', { id });
      if (res.success && res.data?.lyrics) {
        const parsed = parseLrcOrPlainLyrics(res.data.lyrics, null);
        return { 
          success: true, 
          data: { 
            synced: parsed.synced, 
            lines: parsed.lines,
            lyrics: res.data.lyrics 
          } 
        };
      }
      
      const r = await fetch(`https://jiosaavn-api.vercel.app/lyrics?id=${id}`);
      if (r.ok) {
        const data = await r.json();
        if (data.status && data.lyrics) {
          const parsed = parseLrcOrPlainLyrics(data.lyrics, null);
          return { 
            success: true, 
            data: { 
              synced: parsed.synced, 
              lines: parsed.lines,
              lyrics: data.lyrics 
            } 
          };
        }
      }
    } catch (e) {
      console.warn("Saavn lyrics fallback failed:", e);
    }
  }

  return { success: false, data: null };
};

export const getTrending = () => searchSongs('trending hits 2025', 30);
export const getHindiHits = () => searchSongs('latest hindi hits', 30);
export const getTamilHits = () => searchSongs('latest tamil hits', 30);
export const getTeluguHits = () => searchSongs('latest telugu hits', 30);
export const getPunjabiHits = () => searchSongs('latest punjabi hits', 30);
export const getKannadaHits = () => searchSongs('latest kannada hits', 30);

export const getTopArtists = async () => {
  const names = [
    'Arijit Singh', 'Talwinder', 'Diljit Dosanjh', 'Atif Aslam', 'Shreya Ghoshal', 
    'Anirudh Ravichander', 'Sid Sriram', 'Neha Kakkar', 'Darshan Raval', 'Armaan Malik',
    'Badshah', 'AP Dhillon', 'Karan Aujla', 'King', 'Ritviz', 'Prateek Kuhad', 
    'Sonu Nigam', 'KK', 'Mohit Chauhan', 'Jubin Nautiyal'
  ];

  const results = await Promise.all(
    names.map(name => searchArtists(name, 1))
  );

  const uniqueArtists = results
    .map(res => res.data?.results?.[0])
    .filter(Boolean);

  return { success: true, data: { results: uniqueArtists } };
};

export const getSongsByLanguage = (language, page = 1, limit = 30) =>
  fetchApi('/search/songs', { query: `top ${language} hits`, page, limit, n: limit });

export const getStreamUrl = (song) => {
  if (!song) return null;
  const urls = song.downloadUrl || [];
  let rawUrl = null;
  if (Array.isArray(urls) && urls.length > 0) {
    const sorted = [...urls].sort((a, b) => {
      const qA = parseInt(a?.quality || '0', 10);
      const qB = parseInt(b?.quality || '0', 10);
      return qB - qA;
    });
    rawUrl = sorted[0]?.url || sorted[0]?.link || null;
  } else {
    rawUrl = song.url || song.media_url || null;
  }

  if (!rawUrl) return null;
  // Ensure HTTPS to prevent Mixed Content blocking on production HTTPS hosts
  if (rawUrl.startsWith('http://')) {
    return rawUrl.replace('http://', 'https://');
  }
  return rawUrl;
};

export const decodeHtml = (html) => {
  if (!html) return '';
  if (typeof document === 'undefined') return html;
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};
