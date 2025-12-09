const express = require('express');
const cors = require('cors');
const path = require('path');
const { Innertube, UniversalCache } = require('youtubei.js');
// exec removed for Vercel compatibility

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://musify-one-xi.vercel.app', // User's deployed frontend
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize YouTube Music client for search
let yt = null;

async function initYouTube() {
    try {
        yt = await Innertube.create({
            lang: 'en',
            location: 'US',
            cache: new UniversalCache(false),
            generate_session_locally: true
        });
        console.log('YouTube Music client initialized');
    } catch (error) {
        console.error('Failed to initialize YouTube client:', error.message);
    }
}

// Cache for audio URLs
const audioCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000;
const pendingRequests = new Map();

// Get audio URL using youtubei.js (pure JS, no binaries)
async function getAudioUrl(videoId) {
    const cached = audioCache.get(videoId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Cache hit for:', videoId);
        return cached.url;
    }

    if (pendingRequests.has(videoId)) {
        return pendingRequests.get(videoId);
    }

    const requestPromise = (async () => {
        try {
            if (!yt) await initYouTube();

            // Use getInfo to get streaming data
            const info = await yt.getBasicInfo(videoId, 'Android'); // Android client often yields better streams

            // Extract best audio format
            const formats = info.streaming_data?.formats?.concat(info.streaming_data?.adaptive_formats || []) || [];
            const audioFormats = formats.filter(f => f.mime_type.startsWith('audio'));

            if (audioFormats.length === 0) {
                throw new Error('No audio formats found');
            }

            // Sort by bitrate desc
            audioFormats.sort((a, b) => b.bitrate - a.bitrate);

            const url = audioFormats[0].url;
            if (!url) throw new Error('Failed to extract URL');

            audioCache.set(videoId, { url, timestamp: Date.now() });
            return url;
        } catch (error) {
            console.error('Audio fetch error:', error.message);
            throw error;
        } finally {
            pendingRequests.delete(videoId);
        }
    })();

    pendingRequests.set(videoId, requestPromise);
    return requestPromise;
}

function prefetchAudioUrl(videoId) {
    if (!audioCache.has(videoId) && !pendingRequests.has(videoId)) {
        getAudioUrl(videoId).catch(() => { });
    }
}

// Helper functions
function getText(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (obj.text) return getText(obj.text);
    if (obj.name) return getText(obj.name);
    if (obj.runs) return obj.runs.map(r => getText(r.text)).join('');
    if (Array.isArray(obj)) return obj.map(getText).filter(Boolean).join(', ');
    return '';
}

function getThumbnail(thumbnails) {
    if (!thumbnails) return null;
    if (Array.isArray(thumbnails) && thumbnails.length > 0) {
        // Get highest quality thumbnail
        const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
        return sorted[0]?.url || null;
    }
    if (thumbnails.url) return thumbnails.url;
    return null;
}

function getArtists(item) {
    if (item.artists?.length) {
        return item.artists.map(a => getText(a.name || a)).filter(Boolean).join(', ') || 'Unknown';
    }
    if (item.author) return getText(item.author.name || item.author) || 'Unknown';
    if (item.subtitle) return getText(item.subtitle);
    return 'Unknown';
}

function getDuration(item) {
    if (!item.duration) return 0;
    if (typeof item.duration === 'number') return item.duration;
    if (item.duration.seconds) return item.duration.seconds;
    if (item.duration.text) {
        const text = getText(item.duration.text);
        const parts = text.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
}

// Flatten nested content - improved to handle more structures
function flattenContents(obj, maxDepth = 6) {
    const items = [];
    const visited = new WeakSet();

    function traverse(node, depth) {
        if (!node || depth > maxDepth) return;
        if (typeof node !== 'object') return;
        if (visited.has(node)) return;
        visited.add(node);

        // Check if this is a playable item
        const id = node.id || node.video_id || node.videoId;
        const title = node.title || node.name;
        if (id && title) {
            items.push(node);
        }

        // Traverse arrays
        if (Array.isArray(node)) {
            node.forEach(item => traverse(item, depth + 1));
            return;
        }

        // Traverse object properties
        const keys = ['contents', 'items', 'results', 'sections', 'tracks', 'videos', 'music_shelf', 'shelf_contents'];
        for (const key of keys) {
            if (node[key]) traverse(node[key], depth + 1);
        }
    }

    traverse(obj, 0);
    return items;
}

function isPlayableId(id) {
    return id && typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id);
}

const ensureYT = async (req, res, next) => {
    try {
        if (!yt) await initYouTube();
        if (!yt) throw new Error('YouTube client failed to initialize');
        next();
    } catch (error) {
        console.error('ensureYT error:', error);
        res.status(500).json({ error: 'YouTube Client Error', details: error.message, stack: error.stack });
    }
};

// Format item to consistent structure
function formatItem(item, type = 'stream') {
    const id = item.id || item.video_id || item.videoId;
    if (!id) return null;

    // For non-song items (albums, artists, playlists), don't require 11-char ID
    if (type === 'stream' && !isPlayableId(id)) return null;

    const title = getText(item.title) || getText(item.name);
    if (!title) return null;

    return {
        type,
        title,
        url: type === 'stream' ? '/watch?v=' + id : '/' + type + '/' + id,
        thumbnail: getThumbnail(item.thumbnails || item.thumbnail),
        uploaderName: getArtists(item),
        duration: getDuration(item),
        id,
    };
}

// Search endpoint - handles different filters
app.get('/api/search', ensureYT, async (req, res) => {
    try {
        const { q, filter = 'music_songs' } = req.query;
        if (!q) return res.status(400).json({ error: 'Query required' });

        console.log('Searching:', q, 'filter:', filter);

        // Map filter to YouTube Music type
        let searchType = undefined;
        if (filter === 'music_songs' || filter === 'song') searchType = 'song';
        else if (filter === 'music_albums' || filter === 'album') searchType = 'album';
        else if (filter === 'music_artists' || filter === 'artist') searchType = 'artist';
        else if (filter === 'music_playlists' || filter === 'playlist') searchType = 'playlist';

        const results = await yt.music.search(q, { type: searchType });
        const contents = flattenContents(results);

        const itemType = searchType === 'album' ? 'album' :
            searchType === 'artist' ? 'artist' :
                searchType === 'playlist' ? 'playlist' : 'stream';

        const items = contents.map(item => formatItem(item, itemType)).filter(Boolean);

        // Remove duplicates
        const seen = new Set();
        const unique = items.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });

        console.log('Found', unique.length, 'results for', filter);

        // Pre-fetch first 3 songs
        if (itemType === 'stream') {
            unique.slice(0, 3).forEach(item => prefetchAudioUrl(item.id));
        }

        res.json({ items: unique });
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get suggestions
app.get('/api/suggestions', ensureYT, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);
        const suggestions = await yt.music.getSearchSuggestions(query);
        const results = suggestions.map(s => {
            if (typeof s === 'string') return s;
            if (s.query) return s.query;
            const text = getText(s);
            return text || null;
        }).filter(Boolean);
        res.json(results.slice(0, 10));
    } catch (error) {
        res.json([]);
    }
});

// Get stream info
app.get('/api/streams/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        console.log('Getting stream:', videoId);

        if (!isPlayableId(videoId)) {
            return res.status(400).json({ error: 'Invalid video ID' });
        }

        const audioUrl = await getAudioUrl(videoId);

        // Get video info
        let title = 'Unknown';
        let uploader = 'Unknown';
        let duration = 0;
        let thumbnail = null;

        try {
            if (!yt) await initYouTube();
            const info = await yt.getBasicInfo(videoId);
            title = info.basic_info.title || 'Unknown';
            duration = info.basic_info.duration || 0;
            // Get best thumbnail
            const thumbs = info.basic_info.thumbnail;
            if (thumbs && thumbs.length) {
                thumbnail = thumbs.sort((a, b) => b.width - a.width)[0].url;
            }
            uploader = info.basic_info.author || 'Unknown';
        } catch (e) {
            console.log('Info fetch failed:', e.message);
        }

        console.log('Got audio URL for:', videoId);

        res.json({
            videoId,
            title,
            uploader,
            duration,
            thumbnailUrl: thumbnail,
            audioStreams: [{ url: audioUrl, bitrate: 128000, mimeType: 'audio/webm' }],
        });
    } catch (error) {
        console.error('Stream error:', error.message);
        res.status(500).json({ error: 'Failed to get stream', message: error.message });
    }
});

// Get related/next songs (for auto-play)
app.get('/api/related/:videoId', ensureYT, async (req, res) => {
    try {
        const { videoId } = req.params;
        console.log('Getting related songs for:', videoId);

        // Use YouTube Music's "up next" feature
        const upNext = await yt.music.getUpNext(videoId);
        const contents = flattenContents(upNext);

        const items = contents
            .map(item => formatItem(item, 'stream'))
            .filter(Boolean)
            .filter(item => item.id !== videoId); // Exclude current song

        // Remove duplicates
        const seen = new Set();
        const unique = items.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });

        console.log('Found', unique.length, 'related songs');

        // Pre-fetch first 2 related songs
        unique.slice(0, 2).forEach(item => prefetchAudioUrl(item.id));

        res.json({ items: unique });
    } catch (error) {
        console.error('Related error:', error.message);
        res.status(500).json({ error: 'Failed to get related songs' });
    }
});

// Get trending
app.get('/api/trending', ensureYT, async (req, res) => {
    try {
        console.log('Getting trending...');
        const home = await yt.music.getHomeFeed();
        const contents = flattenContents(home);

        const items = contents.slice(0, 50)
            .map(item => formatItem(item, 'stream'))
            .filter(Boolean);

        const seen = new Set();
        const unique = items.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });

        console.log('Found', unique.length, 'trending');
        res.json(unique);
    } catch (error) {
        console.error('Trending error:', error);
        res.status(500).json({ error: 'Failed to get trending', details: error.message, stack: error.stack });
    }
});

// Get playlist
app.get('/api/playlists/:playlistId', ensureYT, async (req, res) => {
    try {
        const { playlistId } = req.params;
        console.log('Getting playlist:', playlistId);

        const playlist = await yt.music.getPlaylist(playlistId);

        // Debug log
        console.log('Playlist keys:', Object.keys(playlist));

        // Try multiple ways to get tracks
        let tracks = [];
        if (playlist.contents) tracks = playlist.contents;
        else if (playlist.items) tracks = playlist.items;
        else if (playlist.tracks) tracks = playlist.tracks;
        else tracks = flattenContents(playlist);

        console.log('Raw tracks count:', tracks.length);

        const streams = tracks
            .map(item => formatItem(item, 'stream'))
            .filter(Boolean);

        const playlistName = getText(playlist.header?.title) ||
            getText(playlist.title) ||
            'Playlist';
        const playlistAuthor = getText(playlist.header?.subtitle) ||
            getText(playlist.author?.name) ||
            'Unknown';
        const playlistThumb = getThumbnail(playlist.header?.thumbnails) ||
            getThumbnail(playlist.thumbnails);

        res.json({
            name: playlistName,
            uploader: playlistAuthor,
            videos: streams.length,
            thumbnailUrl: playlistThumb,
            relatedStreams: streams,
        });
    } catch (error) {
        console.error('Playlist error:', error.message);
        res.status(500).json({ error: 'Failed to get playlist' });
    }
});

// Get album
app.get('/api/albums/:albumId', ensureYT, async (req, res) => {
    try {
        const { albumId } = req.params;
        console.log('Getting album:', albumId);

        const album = await yt.music.getAlbum(albumId);
        const tracks = flattenContents(album);

        const streams = tracks
            .map(item => formatItem(item, 'stream'))
            .filter(Boolean);

        res.json({
            name: getText(album.header?.title) || getText(album.title) || 'Album',
            uploader: getText(album.header?.subtitle) || 'Unknown',
            year: album.header?.year || '',
            videos: streams.length,
            thumbnailUrl: getThumbnail(album.header?.thumbnails) || getThumbnail(album.thumbnails),
            relatedStreams: streams,
        });
    } catch (error) {
        console.error('Album error:', error.message);
        res.status(500).json({ error: 'Failed to get album' });
    }
});

// Get artist
app.get('/api/artist/:artistId', ensureYT, async (req, res) => {
    try {
        const { artistId } = req.params;
        console.log('Getting artist:', artistId);

        const artist = await yt.music.getArtist(artistId);

        // Get top songs
        const topSongs = flattenContents(artist.sections?.find(s =>
            s.title?.toLowerCase?.().includes('song') ||
            s.type === 'MusicShelf'
        ) || artist);

        const songs = topSongs
            .slice(0, 20)
            .map(item => formatItem(item, 'stream'))
            .filter(Boolean);

        res.json({
            name: getText(artist.header?.title) || getText(artist.name) || 'Artist',
            description: getText(artist.header?.description) || '',
            thumbnailUrl: getThumbnail(artist.header?.thumbnails) || getThumbnail(artist.thumbnails),
            subscriberCount: artist.header?.subscriber_count || '',
            topSongs: songs,
        });
    } catch (error) {
        console.error('Artist error:', error.message);
        res.status(500).json({ error: 'Failed to get artist' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ytReady: !!yt });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../dist')));

// Handle Client-Side Routing (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log('Server running on port ' + PORT);
    await initYouTube();
});
