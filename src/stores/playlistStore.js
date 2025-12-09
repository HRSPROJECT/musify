import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Local playlist store with persistence
const usePlaylistStore = create(
    persist(
        (set, get) => ({
            // User's local playlists
            playlists: [],

            // Create a new playlist
            createPlaylist: (name, description = '') => {
                const newPlaylist = {
                    id: 'local_' + Date.now(),
                    name,
                    description,
                    songs: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    thumbnail: null,
                };
                set((state) => ({
                    playlists: [...state.playlists, newPlaylist],
                }));
                return newPlaylist;
            },

            // Delete a playlist
            deletePlaylist: (playlistId) => {
                set((state) => ({
                    playlists: state.playlists.filter((p) => p.id !== playlistId),
                }));
            },

            // Rename a playlist
            renamePlaylist: (playlistId, newName) => {
                set((state) => ({
                    playlists: state.playlists.map((p) =>
                        p.id === playlistId
                            ? { ...p, name: newName, updatedAt: Date.now() }
                            : p
                    ),
                }));
            },

            // Add a song to a playlist
            addToPlaylist: (playlistId, song) => {
                set((state) => ({
                    playlists: state.playlists.map((p) => {
                        if (p.id !== playlistId) return p;
                        // Check if song already exists
                        if (p.songs.some((s) => s.id === song.id)) return p;
                        const updatedSongs = [...p.songs, song];
                        return {
                            ...p,
                            songs: updatedSongs,
                            thumbnail: updatedSongs[0]?.thumbnail || null,
                            updatedAt: Date.now(),
                        };
                    }),
                }));
            },

            // Remove a song from a playlist
            removeFromPlaylist: (playlistId, songId) => {
                set((state) => ({
                    playlists: state.playlists.map((p) => {
                        if (p.id !== playlistId) return p;
                        const updatedSongs = p.songs.filter((s) => s.id !== songId);
                        return {
                            ...p,
                            songs: updatedSongs,
                            thumbnail: updatedSongs[0]?.thumbnail || null,
                            updatedAt: Date.now(),
                        };
                    }),
                }));
            },

            // Get a specific playlist
            getPlaylist: (playlistId) => {
                return get().playlists.find((p) => p.id === playlistId);
            },

            // Liked songs (special playlist)
            likedSongs: [],

            toggleLike: (song) => {
                set((state) => {
                    const isLiked = state.likedSongs.some((s) => s.id === song.id);
                    return {
                        likedSongs: isLiked
                            ? state.likedSongs.filter((s) => s.id !== song.id)
                            : [...state.likedSongs, { ...song, likedAt: Date.now() }],
                    };
                });
            },

            isLiked: (songId) => {
                return get().likedSongs.some((s) => s.id === songId);
            },
        }),
        {
            name: 'musify-playlists',
        }
    )
);

export default usePlaylistStore;
