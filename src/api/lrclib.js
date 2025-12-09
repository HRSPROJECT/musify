const LRCLIB_BASE_URL = 'https://lrclib.net';

// Search for lyrics
export const searchLyrics = async (trackName, artistName, albumName = null, duration = null) => {
    const params = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
    });

    if (albumName) params.append('album_name', albumName);
    if (duration) params.append('duration', duration);

    try {
        const response = await fetch(`${LRCLIB_BASE_URL}/api/search?${params}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('LrcLib search failed:', error);
        return [];
    }
};

// Get lyrics by ID
export const getLyricsById = async (id) => {
    try {
        const response = await fetch(`${LRCLIB_BASE_URL}/api/get/${id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('LrcLib get lyrics failed:', error);
        return null;
    }
};

// Get best matching lyrics for a song
export const getLyrics = async (title, artist, duration = null) => {
    const results = await searchLyrics(title, artist, null, duration);

    if (!results?.length) return null;

    // Find best match (prefer synced lyrics)
    const withSynced = results.filter(r => r.syncedLyrics);
    const best = withSynced.length > 0 ? withSynced[0] : results[0];

    return {
        plain: best.plainLyrics,
        synced: best.syncedLyrics,
        source: 'lrclib',
    };
};

// Parse LRC format to array of { time, text }
export const parseLrc = (lrcString) => {
    if (!lrcString) return [];

    const lines = lrcString.split('\n');
    const parsed = [];

    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
        const match = line.match(timeRegex);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const ms = parseInt(match[3].padEnd(3, '0'), 10);
            const time = minutes * 60 + seconds + ms / 1000;
            const text = line.replace(timeRegex, '').trim();

            if (text) {
                parsed.push({ time, text });
            }
        }
    }

    return parsed.sort((a, b) => a.time - b.time);
};

export default {
    searchLyrics,
    getLyricsById,
    getLyrics,
    parseLrc,
};
