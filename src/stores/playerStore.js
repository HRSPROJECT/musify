import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import piped from '../api/piped';

// Audio URL cache for instant playback
const audioUrlCache = new Map();

const usePlayerStore = create(
    persist(
        (set, get) => ({
            // Current track
            currentTrack: null,
            audioUrl: null,
            isPlaying: false,
            isLoading: false,
            error: null,

            // Playback state
            currentTime: 0,
            duration: 0,
            volume: 1,
            isMuted: false,

            // Repeat & Shuffle
            repeatMode: 'off',
            isShuffled: false,

            // Queue
            queue: [],
            queueIndex: 0,
            originalQueue: [],

            // Audio element reference
            audioRef: null,

            setAudioRef: (ref) => set({ audioRef: ref }),

            // Pre-fetch audio URL in background
            prefetchAudio: async (trackId) => {
                if (!trackId || audioUrlCache.has(trackId)) return;
                try {
                    const streamData = await piped.getStream(trackId);
                    const audioStream = piped.getBestAudioStream(streamData);
                    if (audioStream?.url) {
                        audioUrlCache.set(trackId, audioStream.url);
                    }
                } catch (e) {
                    // Silent fail for prefetch
                }
            },

            // Play a track - optimized for speed
            playTrack: async (track) => {
                // Pause immediately to prevent playing while loading
                const { audioRef } = get();
                if (audioRef) {
                    audioRef.pause();
                } else {
                    // Fallback: try to find the audio element directly
                    document.querySelector('audio')?.pause();
                }

                const trackId = track.id || track.url?.split('v=')[1];

                // Immediately update UI with track info
                set({
                    currentTrack: {
                        id: trackId,
                        title: track.title || 'Loading...',
                        artist: track.uploaderName || track.artist || 'Unknown',
                        thumbnail: track.thumbnail,
                        duration: track.duration || 0,
                    },
                    isPlaying: true,
                    isLoading: true,
                    error: null,
                    currentTime: 0,
                });

                // Check cache first for instant playback
                const cachedUrl = audioUrlCache.get(trackId);
                if (cachedUrl) {
                    set({ audioUrl: cachedUrl, isLoading: false });
                    // Pre-fetch next song
                    const { queue, queueIndex } = get();
                    if (queue[queueIndex + 1]) {
                        get().prefetchAudio(queue[queueIndex + 1].id);
                    }
                    return;
                }

                try {
                    const streamData = await piped.getStream(trackId);

                    // Race condition check: if track changed while fetching, abort
                    if (get().currentTrack?.id !== trackId) return;

                    const audioStream = piped.getBestAudioStream(streamData);

                    if (!audioStream) {
                        throw new Error('No audio stream available');
                    }

                    // Cache the URL
                    audioUrlCache.set(trackId, audioStream.url);

                    // Update with full info
                    set((state) => ({
                        currentTrack: {
                            ...state.currentTrack,
                            title: track.title || streamData.title || state.currentTrack?.title,
                            artist: track.uploaderName || track.artist || streamData.uploader || state.currentTrack?.artist,
                            thumbnail: track.thumbnail || streamData.thumbnailUrl || state.currentTrack?.thumbnail,
                            duration: track.duration || streamData.duration || state.currentTrack?.duration,
                        },
                        audioUrl: audioStream.url,
                        isLoading: false,
                    }));

                    // Pre-fetch next songs in queue
                    const { queue, queueIndex } = get();
                    [1, 2, 3].forEach(offset => {
                        const nextTrack = queue[queueIndex + offset];
                        if (nextTrack?.id) {
                            get().prefetchAudio(nextTrack.id);
                        }
                    });
                } catch (error) {
                    console.error('Failed to play track:', error);
                    // Only update error if we're still on the same track
                    if (get().currentTrack?.id === trackId) {
                        set({ error: error.message, isLoading: false, isPlaying: false });
                    }
                }
            },

            // Queue management
            setQueue: (tracks, startIndex = 0) => {
                const { isShuffled } = get();
                set({
                    queue: tracks,
                    originalQueue: tracks,
                    queueIndex: startIndex,
                });

                if (isShuffled) {
                    get().shuffleQueue();
                }

                if (tracks[startIndex]) {
                    get().playTrack(tracks[startIndex]);
                }

                // Pre-fetch first few songs
                tracks.slice(startIndex, startIndex + 3).forEach(t => {
                    if (t?.id) get().prefetchAudio(t.id);
                });
            },

            addToQueue: (track) => {
                set((state) => ({
                    queue: [...state.queue, track],
                    originalQueue: [...state.originalQueue, track],
                }));
                // Pre-fetch the added track
                if (track?.id) get().prefetchAudio(track.id);
            },

            addToQueueNext: (track) => {
                set((state) => ({
                    queue: [
                        ...state.queue.slice(0, state.queueIndex + 1),
                        track,
                        ...state.queue.slice(state.queueIndex + 1),
                    ],
                    originalQueue: [
                        ...state.originalQueue.slice(0, state.queueIndex + 1),
                        track,
                        ...state.originalQueue.slice(state.queueIndex + 1),
                    ],
                }));
                // Pre-fetch immediately since it's next
                if (track?.id) get().prefetchAudio(track.id);
            },

            removeFromQueue: (index) => {
                set((state) => {
                    const newQueue = state.queue.filter((_, i) => i !== index);
                    const newOriginal = state.originalQueue.filter((_, i) => i !== index);
                    return {
                        queue: newQueue,
                        originalQueue: newOriginal,
                        queueIndex: index < state.queueIndex ? state.queueIndex - 1 : state.queueIndex,
                    };
                });
            },

            clearQueue: () => {
                set({
                    queue: [],
                    originalQueue: [],
                    queueIndex: 0,
                });
            },

            // Navigation - optimized with prefetch
            playNext: async () => {
                const { queue, queueIndex, repeatMode, currentTrack } = get();
                let nextIndex = queueIndex + 1;

                if (nextIndex >= queue.length) {
                    if (repeatMode === 'all') {
                        nextIndex = 0;
                    } else if (currentTrack?.id) {
                        // Auto-play: fetch related songs
                        try {
                            console.log('Fetching related songs...');
                            const related = await piped.getRelated(currentTrack.id);
                            if (related?.items?.length > 0) {
                                const newTracks = related.items.slice(0, 10);
                                set({
                                    queue: [...queue, ...newTracks],
                                    originalQueue: [...get().originalQueue, ...newTracks],
                                    queueIndex: queue.length,
                                });
                                get().playTrack(newTracks[0]);
                                // Pre-fetch rest
                                newTracks.slice(1, 4).forEach(t => get().prefetchAudio(t.id));
                                return;
                            }
                        } catch (e) {
                            console.error('Failed to get related songs:', e);
                        }
                        set({ isPlaying: false });
                        return;
                    } else {
                        set({ isPlaying: false });
                        return;
                    }
                }

                set({ queueIndex: nextIndex });
                get().playTrack(queue[nextIndex]);
            },

            playPrevious: () => {
                const { queue, queueIndex, currentTime, repeatMode, audioRef } = get();

                if (currentTime > 3) {
                    if (audioRef) audioRef.currentTime = 0;
                    return;
                }

                let prevIndex = queueIndex - 1;
                if (prevIndex < 0) {
                    prevIndex = repeatMode === 'all' ? queue.length - 1 : 0;
                }

                set({ queueIndex: prevIndex });
                get().playTrack(queue[prevIndex]);
            },

            // Playback controls
            togglePlay: () => {
                set((state) => ({ isPlaying: !state.isPlaying }));
            },

            setIsPlaying: (isPlaying) => set({ isPlaying }),
            setCurrentTime: (currentTime) => set({ currentTime }),
            setDuration: (duration) => set({ duration }),

            seek: (time) => {
                const { audioRef } = get();
                if (audioRef) {
                    audioRef.currentTime = time;
                    set({ currentTime: time });
                }
            },

            setVolume: (volume) => {
                const { audioRef } = get();
                if (audioRef) audioRef.volume = volume;
                set({ volume, isMuted: volume === 0 });
            },

            toggleMute: () => {
                const { audioRef, isMuted, volume } = get();
                if (!audioRef) return;

                if (isMuted) {
                    audioRef.volume = volume || 1;
                    set({ isMuted: false });
                } else {
                    audioRef.volume = 0;
                    set({ isMuted: true });
                }
            },

            toggleRepeat: () => {
                set((state) => ({
                    repeatMode: state.repeatMode === 'off' ? 'all' :
                        state.repeatMode === 'all' ? 'one' : 'off',
                }));
            },

            toggleShuffle: () => {
                const { isShuffled, queue, originalQueue, queueIndex, currentTrack } = get();

                if (isShuffled) {
                    // Restore original order
                    const currentIdx = originalQueue.findIndex(t => t.id === currentTrack?.id);
                    set({
                        queue: originalQueue,
                        queueIndex: currentIdx >= 0 ? currentIdx : 0,
                        isShuffled: false,
                    });
                } else {
                    get().shuffleQueue();
                    set({ isShuffled: true });
                }
            },

            shuffleQueue: () => {
                const { queue, queueIndex, currentTrack } = get();
                if (queue.length <= 1) return;

                const current = queue[queueIndex];
                const rest = queue.filter((_, i) => i !== queueIndex);

                // Fisher-Yates shuffle
                for (let i = rest.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [rest[i], rest[j]] = [rest[j], rest[i]];
                }

                set({
                    queue: [current, ...rest],
                    queueIndex: 0,
                });
            },
        }),
        {
            name: 'musify-player',
            partialize: (state) => ({
                volume: state.volume,
                repeatMode: state.repeatMode,
                isShuffled: state.isShuffled,
            }),
        }
    )
);

export default usePlayerStore;
