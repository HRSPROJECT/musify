import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
    persist(
        (set) => ({
            // Theme
            theme: 'system', // 'light', 'dark', 'system'
            accentColor: '#8b5cf6', // Purple as default

            // Playback
            audioQuality: 'high', // 'low', 'medium', 'high'
            crossfade: false,
            crossfadeDuration: 5,
            normalizeVolume: true,

            // Display
            showLyrics: true,
            compactMode: false,
            animatedBackgrounds: true,

            // Privacy
            saveHistory: true,

            // Actions
            setTheme: (theme) => set({ theme }),
            setAccentColor: (color) => set({ accentColor: color }),
            setAudioQuality: (quality) => set({ audioQuality: quality }),
            setCrossfade: (enabled) => set({ crossfade: enabled }),
            setCrossfadeDuration: (duration) => set({ crossfadeDuration: duration }),
            setNormalizeVolume: (enabled) => set({ normalizeVolume: enabled }),
            setShowLyrics: (show) => set({ showLyrics: show }),
            setCompactMode: (compact) => set({ compactMode: compact }),
            setAnimatedBackgrounds: (enabled) => set({ animatedBackgrounds: enabled }),
            setSaveHistory: (save) => set({ saveHistory: save }),
        }),
        {
            name: 'musify-settings',
        }
    )
);

export default useSettingsStore;
