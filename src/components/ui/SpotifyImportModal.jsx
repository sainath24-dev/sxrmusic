import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, List, Link as LinkIcon, Music, CheckCircle2, Square, StopCircle, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import usePlayerStore from '../../store/playerStore';
import { searchSongs } from '../../api/saavn';
import { clsx } from 'clsx';

function cleanSongTitle(raw) {
  if (!raw) return '';
  return raw
    .replace(/official\s*(music)?\s*(video|audio|lyric|lyrics|track)/gi, ' ')
    .replace(/full\s*(video|audio|song)/gi, ' ')
    .replace(/video\s*song/gi, ' ')
    .replace(/\b(video|song|audio|lyrics|lyrical|hd|4k|remastered|visualizer|feat\.|ft\.)\b/gi, ' ')
    .replace(/[\[\(\{].*?[\]\}\)]/g, ' ')
    .replace(/[\|\-–—•:\/\\_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SpotifyImportModal = ({ type = 'spotify', onClose }) => {
  const [url, setUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [customName, setCustomName] = useState('');
  const [trackLimit, setTrackLimit] = useState('all'); // Default to 'all' (unlimited)
  const [importMode, setImportMode] = useState('link'); // 'link' | 'text'
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, added: 0, skipped: 0, status: '' });
  
  const isCancelledRef = useRef(false);
  const { playlists, createPlaylist, addSongToPlaylist, addSongsToPlaylist, deletePlaylist } = usePlayerStore();

  // Helper to fetch HTML through local server proxy or resilient CORS proxies
  const fetchHtmlWithProxy = async (targetUrl) => {
    const proxies = [
      `/api/proxy?url=${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.org/?url=${encodeURIComponent(targetUrl)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
      `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(targetUrl)}`
    ];

    for (const proxyUrl of proxies) {
      if (isCancelledRef.current) return null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);
        const res = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          if (proxyUrl.includes('api.allorigins.win/get')) {
            const json = await res.json();
            if (json.contents && json.contents.length > 50) return json.contents;
          } else {
            const text = await res.text();
            if (text && text.length > 50 && !text.includes('522: Connection timed out') && !text.includes('520: Web server')) {
              return text;
            }
          }
        }
      } catch (e) {
        console.warn(`Proxy ${proxyUrl.slice(0, 35)} failed:`, e.message);
      }
    }
    return null;
  };

  // Dedicated Spotify Extractor (Backend API + Embed Fallbacks)
  const extractSpotifyTracks = async (spotifyUrl, limit = 'all') => {
    // 1. Try serverless backend endpoint first (Fastest & 100% reliable on Vercel/Node)
    try {
      const res = await fetch(`/api/spotify?url=${encodeURIComponent(spotifyUrl)}&limit=${encodeURIComponent(limit)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.tracks && data.tracks.length > 0) {
          return {
            name: data.name || "Spotify Playlist",
            tracks: data.tracks.map(t => t.query || `${t.title} ${t.artist}`.trim())
          };
        }
      }
    } catch (e) {
      console.warn("Direct /api/spotify endpoint unavailable, falling back to proxy extractors:", e);
    }

    // 2. Client-side Embed HTML extraction via CORS proxies
    let embedUrl = spotifyUrl;
    let playlistId = null;
    let isPlaylist = false;
    if (spotifyUrl.includes('spotify.com/playlist/')) {
      playlistId = spotifyUrl.split('playlist/')[1].split('?')[0];
      embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
      isPlaylist = true;
    } else if (spotifyUrl.includes('spotify.com/album/')) {
      const albumId = spotifyUrl.split('album/')[1].split('?')[0];
      embedUrl = `https://open.spotify.com/embed/album/${albumId}`;
    } else if (spotifyUrl.includes('spotify.com/track/')) {
      const trackId = spotifyUrl.split('track/')[1].split('?')[0];
      embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    }

    const htmlText = await fetchHtmlWithProxy(embedUrl);
    if (htmlText) {
      let playlistName = "Spotify Playlist";
      let embedTracks = [];

      const match = htmlText.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
      if (match) {
        try {
          const nextData = JSON.parse(match[1]);
          const entity = nextData?.props?.pageProps?.state?.data?.entity;
          if (entity) {
            playlistName = entity.name || entity.title || playlistName;
            if (entity.trackList && entity.trackList.length > 0) {
              embedTracks = entity.trackList.map(t => `${t.title} ${t.subtitle || ''}`.trim());
            } else if (entity.title) {
              embedTracks = [`${entity.title} ${entity.subtitle || ''}`.trim()];
            }
          }
        } catch (err) {
          console.warn("Failed to parse Spotify __NEXT_DATA__ JSON:", err);
        }
      }

      // Check for accessToken to attempt multi-page retrieval
      const tokenMatch = htmlText.match(/"accessToken":"([^"]+)"/);
      if (isPlaylist && playlistId && tokenMatch) {
        try {
          const token = tokenMatch[1];
          const HASH = "86dde7b9d9356e2369414647cf6950cfed96e778e129cfdfc99aea6c1613b3b0";
          let maxTracks = limit === 'all' ? 1000 : parseInt(limit, 10) || 1000;
          let offset = 0;
          let totalCount = Infinity;
          let pagedTracks = [];
          let pages = 0;

          while (offset < totalCount && pagedTracks.length < maxTracks && pages < 15) {
            if (isCancelledRef.current) break;
            pages++;
            const params = new URLSearchParams({
              operationName: "fetchPlaylistContents",
              variables: JSON.stringify({ uri: `spotify:playlist:${playlistId}`, offset, limit: 100 }),
              extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: HASH } })
            });

            const pRes = await fetch(`https://api-partner.spotify.com/pathfinder/v1/query?${params.toString()}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });

            if (!pRes.ok) break;
            const pData = await pRes.json();
            const content = pData.data?.playlistV2?.content;
            if (!content || !content.items || content.items.length === 0) break;

            if (content.totalCount !== undefined) totalCount = content.totalCount;

            for (const it of content.items) {
              if (pagedTracks.length >= maxTracks) break;
              const trackData = it.itemV2?.data;
              if (trackData && trackData.name) {
                const title = trackData.name;
                const artist = trackData.artists?.items?.map(a => a.profile?.name).filter(Boolean).join(", ") || "";
                pagedTracks.push(`${title} ${artist}`.trim());
              }
            }

            offset += content.items.length;
            if (content.items.length < 100) break;
          }

          if (pagedTracks.length > 0) {
            return {
              name: playlistName,
              tracks: pagedTracks
            };
          }
        } catch (e) {
          console.warn("Client partner query failed, using embed tracks fallback:", e);
        }
      }

      if (embedTracks.length > 0) {
        return {
          name: playlistName,
          tracks: embedTracks
        };
      }
    }

    // 3. Single track oEmbed fallback ONLY if input is a single track
    if (spotifyUrl.includes('spotify.com/track/')) {
      const singleTitle = await fetchSpotifyOembed(spotifyUrl);
      if (singleTitle) {
        return {
          name: singleTitle,
          tracks: [singleTitle]
        };
      }
    }

    return null;
  };

  // Dedicated YouTube Extractor (Backend Innertube Endpoint + Direct Client Fallbacks)
  const extractYoutubeTracks = async (youtubeUrl, limit = 'all') => {
    // 1. Try serverless backend endpoint first (Fastest & 100% reliable on Vercel/Node)
    try {
      const res = await fetch(`/api/youtube?url=${encodeURIComponent(youtubeUrl)}&limit=${encodeURIComponent(limit)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.tracks && data.tracks.length > 0) {
          return {
            name: data.name || "YouTube Playlist",
            tracks: data.tracks.map(t => t.query || `${t.title} ${t.artist}`.trim())
          };
        }
      }
    } catch (e) {
      console.warn("Direct /api/youtube endpoint unavailable, falling back:", e);
    }

    // 2. Extract playlist ID from URL
    let playlistId = null;
    if (youtubeUrl.includes('list=')) {
      playlistId = youtubeUrl.split('list=')[1].split('&')[0];
    } else if (youtubeUrl.startsWith('PL') || youtubeUrl.startsWith('UU') || youtubeUrl.startsWith('OLAK5uy_') || youtubeUrl.startsWith('RD')) {
      playlistId = youtubeUrl;
    }

    if (playlistId) {
      // 3. Try direct Innertube WEB_REMIX API with multi-page continuations
      try {
        const maxTracks = limit === 'all' ? 1000 : parseInt(limit, 10) || 1000;
        let continuationToken = null;
        const titles = [];
        let playlistTitle = 'YouTube Playlist';

        const searchForTracks = (obj) => {
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
                titles.push(`${title} ${artist}`.trim());
              }
            }
          } else if (obj.playlistVideoRenderer) {
            const title = obj.playlistVideoRenderer.title?.runs?.[0]?.text || obj.playlistVideoRenderer.title?.simpleText;
            const artist = obj.playlistVideoRenderer.shortBylineText?.runs?.[0]?.text || '';
            if (title && title !== '[Private video]' && title !== '[Deleted video]') {
              titles.push(`${title} ${artist}`.trim());
            }
          }

          if (obj.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
            continuationToken = obj.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
          }

          Object.values(obj).forEach(searchForTracks);
        };

        const browseRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: {
              client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.00.00', hl: 'en', gl: 'US' }
            },
            browseId: playlistId.startsWith('VL') ? playlistId : `VL${playlistId}`
          })
        });

        if (browseRes.ok) {
          const data = await browseRes.json();
          searchForTracks(data);

          let pages = 1;
          while (continuationToken && titles.length < maxTracks && pages < 15) {
            if (isCancelledRef.current) break;
            const nextTok = continuationToken;
            continuationToken = null;
            pages++;

            const contRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                context: {
                  client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.00.00', hl: 'en', gl: 'US' }
                },
                continuation: nextTok
              })
            });

            if (!contRes.ok) break;
            const contData = await contRes.json();
            const prevLen = titles.length;
            searchForTracks(contData);
            if (titles.length === prevLen) break;
          }

          if (titles.length > 0) {
            return {
              name: playlistTitle,
              tracks: [...new Set(titles)].slice(0, maxTracks)
            };
          }
        }
      } catch (e) {
        console.warn("Direct Innertube call failed:", e);
      }
    }

    // 4. Video IDs fallback via oEmbed
    const ytIds = extractYoutubeVideoIds(youtubeUrl);
    if (ytIds.length > 0) {
      const titles = [];
      for (const id of ytIds) {
        if (isCancelledRef.current) break;
        const title = await fetchYoutubeVideoTitle(id);
        if (title) titles.push(title);
      }
      if (titles.length > 0) {
        return {
          name: titles.length === 1 ? titles[0] : `YouTube Mix (${titles.length} tracks)`,
          tracks: titles
        };
      }
    }

    return null;
  };

  // Helper to extract YouTube video IDs from a string or multiline text
  const extractYoutubeVideoIds = (text) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  // Helper to fetch YouTube video title via oEmbed
  const fetchYoutubeVideoTitle = async (videoId) => {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return data.title || null;
      }
    } catch (e) {
      console.warn(`oEmbed failed for video ${videoId}:`, e);
    }
    return null;
  };

  // Helper to fetch Spotify Track / Album title via oEmbed
  const fetchSpotifyOembed = async (spotifyUrl) => {
    try {
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return data.title || null;
      }
    } catch (e) {
      console.warn(`Spotify oEmbed failed for ${spotifyUrl}:`, e);
    }
    return null;
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    toast('Cancelling import...', { icon: '🛑' });
  };

  const handleImport = async () => {
    isCancelledRef.current = false;
    let trackList = [];
    let defaultPlaylistName = "Imported Playlist";

    if (importMode === 'text') {
      if (!manualText.trim()) {
        toast.error('Please enter song titles or links');
        return;
      }

      setIsImporting(true);
      setProgress({ current: 0, total: 0, added: 0, skipped: 0, status: 'Parsing input...' });

      const lines = manualText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const extractedTitles = [];

      for (const line of lines) {
        if (isCancelledRef.current) break;
        const ytIds = extractYoutubeVideoIds(line);
        if (ytIds.length > 0) {
          for (const id of ytIds) {
            if (isCancelledRef.current) break;
            const title = await fetchYoutubeVideoTitle(id);
            if (title) extractedTitles.push(title);
          }
        } else if (line.includes('spotify.com/track/')) {
          const title = await fetchSpotifyOembed(line);
          if (title) extractedTitles.push(title);
        } else {
          extractedTitles.push(line);
        }
      }

      if (isCancelledRef.current) {
        setIsImporting(false);
        toast('Import cancelled');
        return;
      }

      trackList = extractedTitles;
      defaultPlaylistName = customName.trim() || "Manual Import";
    } else {
      const input = url.trim();
      const isSpotify = input.includes('spotify.com');
      const isYoutube = input.includes('youtube.com') || input.includes('youtu.be');

      if (!isSpotify && !isYoutube) {
        toast.error('Please enter a valid Spotify or YouTube link');
        return;
      }

      setIsImporting(true);
      setProgress({ current: 0, total: 0, added: 0, skipped: 0, status: 'Analyzing playlist link...' });

      try {
        if (isSpotify) {
          const spotifyResult = await extractSpotifyTracks(input, trackLimit);
          if (isCancelledRef.current) {
            setIsImporting(false);
            return;
          }

          if (spotifyResult && spotifyResult.tracks && spotifyResult.tracks.length > 0) {
            trackList = spotifyResult.tracks;
            defaultPlaylistName = spotifyResult.name;
          } else {
            throw new Error("Could not extract tracks from this Spotify link. Please verify the playlist is public, or paste the song titles into the 'Manual / Titles' tab.");
          }
        } else if (isYoutube) {
          const ytResult = await extractYoutubeTracks(input, trackLimit);
          if (isCancelledRef.current) {
            setIsImporting(false);
            return;
          }

          if (ytResult && ytResult.tracks && ytResult.tracks.length > 0) {
            trackList = ytResult.tracks;
            defaultPlaylistName = ytResult.name;
          } else {
            throw new Error("Could not extract tracks from this YouTube link. Please verify the playlist is public, or paste titles into 'Manual / Titles'.");
          }
        }
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Failed to fetch playlist');
        setIsImporting(false);
        return;
      }
    }

    if (isCancelledRef.current) {
      setIsImporting(false);
      toast('Import cancelled');
      return;
    }

    // Apply track limit if selected and not 'all'
    if (trackLimit !== 'all') {
      const maxLimit = parseInt(trackLimit, 10);
      if (!isNaN(maxLimit) && trackList.length > maxLimit) {
        trackList = trackList.slice(0, maxLimit);
      }
    }

    if (trackList.length === 0) {
      toast.error('No tracks found to import');
      setIsImporting(false);
      return;
    }

    const finalPlaylistName = customName.trim() || defaultPlaylistName;
    const sourceIdentifier = importMode === 'link' ? url.trim() : null;

    // Check if an existing playlist matches this name or source link
    const existingPlaylist = playlists.find(p => {
      if (sourceIdentifier && p.sourceUrl && p.sourceUrl === sourceIdentifier) return true;
      return p.name.toLowerCase().trim() === finalPlaylistName.toLowerCase().trim();
    });

    const isExisting = !!existingPlaylist;
    const playlistId = existingPlaylist ? existingPlaylist.id : createPlaylist(finalPlaylistName, sourceIdentifier);

    // Build sets of existing songs to skip duplicates
    const existingSongIds = new Set((existingPlaylist?.songs || []).map(s => s.id));
    const existingSongKeys = new Set(
      (existingPlaylist?.songs || []).map(s => {
        const title = (s.name || s.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const artist = (s.artists?.primary?.[0]?.name || s.subtitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${title}-${artist.slice(0, 10)}`;
      })
    );

    setIsImporting(true);
    setProgress({ 
      current: 0, 
      total: trackList.length, 
      added: 0, 
      skipped: 0, 
      status: isExisting ? `Checking for new songs in "${existingPlaylist.name}"...` : 'Matching & saving tracks...' 
    });

    let addedCount = 0;
    let skippedCount = 0;

    // Batch match in parallel chunks of 4 for 4x faster imports of large playlists
    const BATCH_SIZE = 4;
    for (let i = 0; i < trackList.length; i += BATCH_SIZE) {
      if (isCancelledRef.current) break;

      const batch = trackList.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (rawTitle) => {
          if (isCancelledRef.current) return null;
          const cleaned = cleanSongTitle(rawTitle);
          const query = cleaned.split(' ').slice(0, 6).join(' ');

          try {
            let matchedSong = null;
            const res = await searchSongs(query, 1);
            if (res.success && res.data?.results?.length > 0) {
              matchedSong = res.data.results[0];
            } else {
              const fbRes = await searchSongs(rawTitle.replace(/[\[\]\(\)]/g, ''), 1);
              if (fbRes.success && fbRes.data?.results?.length > 0) {
                matchedSong = fbRes.data.results[0];
              }
            }
            return { rawTitle, cleaned, matchedSong };
          } catch (e) {
            return { rawTitle, cleaned, matchedSong: null };
          }
        })
      );

      if (isCancelledRef.current) break;

      const newSongsToSave = [];
      for (const res of batchResults) {
        if (!res || !res.matchedSong) continue;
        const matchedSong = res.matchedSong;
        const songKey = `${(matchedSong.name || matchedSong.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')}-${(matchedSong.artists?.primary?.[0]?.name || matchedSong.subtitle || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}`;

        if (existingSongIds.has(matchedSong.id) || existingSongKeys.has(songKey)) {
          skippedCount++;
        } else {
          newSongsToSave.push(matchedSong);
          existingSongIds.add(matchedSong.id);
          existingSongKeys.add(songKey);
          addedCount++;
        }
      }

      if (newSongsToSave.length > 0) {
        addSongsToPlaylist(playlistId, newSongsToSave);
      }

      const currentProcessed = Math.min(i + BATCH_SIZE, trackList.length);
      const lastCleaned = batchResults[batchResults.length - 1]?.cleaned || '';
      setProgress({
        current: currentProcessed,
        total: trackList.length,
        added: addedCount,
        skipped: skippedCount,
        status: `Matching (${currentProcessed}/${trackList.length}): ${lastCleaned.slice(0, 28)}...`
      });
    }

    if (isCancelledRef.current) {
      if (addedCount > 0) {
        toast.success(`Import stopped. Added ${addedCount} new tracks to "${finalPlaylistName}".`);
      } else {
        if (!isExisting) deletePlaylist(playlistId);
        toast('Import cancelled.');
      }
    } else {
      if (isExisting) {
        if (addedCount > 0) {
          toast.success(`Added ${addedCount} new track${addedCount > 1 ? 's' : ''} to "${existingPlaylist.name}" (${skippedCount} already present)!`);
        } else if (skippedCount > 0) {
          toast.success(`All ${skippedCount} tracks are already in "${existingPlaylist.name}". Everything is up to date!`);
        } else {
          toast.error("Could not match any tracks for this playlist.");
        }
      } else {
        if (addedCount > 0) {
          toast.success(`Successfully imported ${addedCount} tracks to "${finalPlaylistName}"!`);
        } else {
          deletePlaylist(playlistId);
          toast.error("Could not find matching songs for this playlist on our servers.");
        }
      }
    }

    onClose();
    setIsImporting(false);
  };

  const isYoutubeMode = type === 'youtube' || (importMode === 'link' && (url.includes('youtube.com') || url.includes('youtu.be')));

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1200] flex items-center justify-center p-4 select-none" onClick={isImporting ? handleCancel : onClose}>
      <div className="bg-[#FFFFFF] text-[#0F0F0F] w-full max-w-md rounded-2xl p-6 border border-[#EAEAEA] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F142]/25 text-[#337418] border border-[#5DD62C]/30">IMPORT</span>
            <h2 className="text-lg font-bold text-[#0F0F0F]">
              Import Playlist / Tracks
            </h2>
          </div>
          <button 
            onClick={isImporting ? handleCancel : onClose} 
            className="text-[#6B7280] hover:text-[#0F0F0F] p-1.5 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors"
            title={isImporting ? "Cancel Import" : "Close"}
          >
            <X size={16} />
          </button>
        </div>

        {!isImporting ? (
          <div className="flex flex-col gap-4">
            <div className="flex bg-[#F3F4F6] p-1 rounded-full border border-[#E5E7EB]">
              <button 
                onClick={() => setImportMode('link')}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-[12px] font-bold transition-all",
                  importMode === 'link' ? "bg-[#FFFFFF] text-[#0F0F0F] shadow-sm border border-[#E5E7EB]" : "text-[#6B7280] hover:text-[#0F0F0F]"
                )}
              >
                <LinkIcon size={14} />
                Link(s)
              </button>
              <button 
                onClick={() => setImportMode('text')}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-[12px] font-bold transition-all",
                  importMode === 'text' ? "bg-[#FFFFFF] text-[#0F0F0F] shadow-sm border border-[#E5E7EB]" : "text-[#6B7280] hover:text-[#0F0F0F]"
                )}
              >
                <List size={14} />
                Manual / Titles
              </button>
            </div>

            {importMode === 'link' ? (
              <>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">
                  Paste <strong className="text-[#0F0F0F]">Spotify</strong> or <strong className="text-[#0F0F0F]">YouTube</strong> playlist/mix links. Tracks are resolved to lossless streams.
                </p>
                <textarea
                  rows={3}
                  placeholder={isYoutubeMode 
                    ? "Paste YouTube playlist URL or multiple video URLs (one per line)..." 
                    : "https://open.spotify.com/playlist/... or https://youtube.com/watch?v=..."}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#F9FAFB] text-[#0F0F0F] placeholder-[#9CA3AF] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none border border-[#E5E7EB] focus:border-[#5DD62C] transition-all resize-none font-mono text-[12px]"
                />
              </>
            ) : (
              <>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">
                  Paste song titles or YouTube links (one per line) to rebuild into a playlist.
                </p>
                <textarea
                  rows={4}
                  placeholder="Song Title - Artist&#10;https://youtube.com/watch?v=...&#10;Another Song..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full bg-[#F9FAFB] text-[#0F0F0F] placeholder-[#9CA3AF] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none border border-[#E5E7EB] focus:border-[#5DD62C] transition-all resize-none font-mono text-[12px]"
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1 block">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="My Imported Mix"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#F9FAFB] text-[#0F0F0F] placeholder-[#9CA3AF] rounded-xl px-3 py-2 text-[12px] border border-[#E5E7EB] focus:outline-none focus:border-[#5DD62C]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1 block">
                  Max Tracks
                </label>
                <select
                  value={trackLimit}
                  onChange={(e) => setTrackLimit(e.target.value)}
                  className="w-full bg-[#F9FAFB] text-[#0F0F0F] rounded-xl px-3 py-2 text-[12px] focus:outline-none border border-[#E5E7EB] focus:border-[#5DD62C] font-semibold"
                >
                  <option value="all">Unlimited (All Tracks)</option>
                  <option value="500">Up to 500 tracks</option>
                  <option value="200">Up to 200 tracks</option>
                  <option value="100">Up to 100 tracks</option>
                  <option value="50">Up to 50 tracks</option>
                  <option value="25">Up to 25 tracks</option>
                </select>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F0FDF4] border border-[#5DD62C]/30 text-[11px] text-[#337418] leading-snug">
              <Info size={14} className="text-[#337418] shrink-0 mt-0.5" />
              <span>
                Imports automatically ignore duplicates if you re-import or update the same playlist.
              </span>
            </div>

            <button
              onClick={handleImport}
              className="w-full py-2.5 mt-1 text-[13px] flex items-center justify-center gap-2 font-bold rounded-full bg-[#C8F142] text-black hover:bg-[#d4f85e] shadow-md shadow-[#C8F142]/30 transition-all cursor-pointer"
            >
              <CheckCircle2 size={16} />
              Start Import
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <Loader2 size={36} className="animate-spin text-[#337418] mb-1" />
            <div className="text-center">
              <h3 className="text-base font-bold text-[#0F0F0F]">Rebuilding Playlist...</h3>
              <p className="text-[12px] text-[#337418] mt-1 max-w-[90%] truncate font-bold">
                {progress.status}
              </p>
            </div>

            <div className="w-full bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB] flex flex-col gap-2">
              <div className="flex justify-between text-[11px] text-[#6B7280] font-semibold">
                <span>Progress: {progress.current} / {progress.total}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#337418] font-bold">{progress.added} new</span>
                  {progress.skipped > 0 && (
                    <span className="text-[#9CA3AF]">({progress.skipped} existing)</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#5DD62C] transition-all duration-300 rounded-full"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 30}%` }}
                />
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              className="w-full py-2.5 px-4 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#0F0F0F] text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-1"
            >
              <StopCircle size={15} />
              Stop & Save ({progress.added} tracks)
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SpotifyImportModal;
