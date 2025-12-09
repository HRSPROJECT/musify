// YouTube Music API client - uses our Express backend

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const apiFetch = async (endpoint, options = {}) => {
    const url = API_BASE + endpoint;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'HTTP ' + response.status + ': ' + response.statusText);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error.message);
        throw error;
    }
};

// Search for songs, videos, playlists, channels
export const search = async (query, filter = 'music_songs') => {
    const params = new URLSearchParams({ q: query, filter });
    return apiFetch('/search?' + params.toString());
};

// Get search suggestions
export const getSuggestions = async (query) => {
    const params = new URLSearchParams({ query });
    const results = await apiFetch('/suggestions?' + params.toString());
    return results || [];
};

// Get stream info (includes audio URLs)
export const getStream = async (videoId) => {
    return apiFetch('/streams/' + videoId);
};

// Get playlist
export const getPlaylist = async (playlistId) => {
    return apiFetch('/playlists/' + playlistId);
};

// Get album
export const getAlbum = async (albumId) => {
    return apiFetch('/albums/' + albumId);
};

// Get artist
export const getArtist = async (artistId) => {
    return apiFetch('/artist/' + artistId);
};

// Get related/next songs for auto-play
export const getRelated = async (videoId) => {
    return apiFetch('/related/' + videoId);
};

// Get trending content
export const getTrending = async (region = 'US') => {
    return apiFetch('/trending');
};

// Extract best audio stream - returns the direct audio URL from yt-dlp
export const getBestAudioStream = (streamData) => {
    if (!streamData || !streamData.audioStreams || !streamData.audioStreams.length) {
        return null;
    }
    return streamData.audioStreams[0];
};

export default {
    search,
    getSuggestions,
    getStream,
    getPlaylist,
    getAlbum,
    getArtist,
    getRelated,
    getTrending,
    getBestAudioStream,
};

