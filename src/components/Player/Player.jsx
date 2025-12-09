import { useEffect, useRef, useState } from 'react';
import usePlayerStore from '../../stores/playerStore';
import QueuePanel from './QueuePanel';
import '../../styles/components/player.css';
import '../../styles/components/menu.css';

// Icons
const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const SkipNextIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
);

const SkipPrevIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
);

const ShuffleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
    </svg>
);

const RepeatIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
);

const RepeatOneIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
    </svg>
);

const VolumeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
);

const VolumeMutedIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
);

const QueueIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
);

const MusicNoteIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Player = () => {
    const audioRef = useRef(null);
    const [queueOpen, setQueueOpen] = useState(false);

    const {
        currentTrack,
        audioUrl,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffled,
        setAudioRef,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        togglePlay,
        playNext,
        playPrevious,
        toggleRepeat,
        toggleShuffle,
        setVolume,
        toggleMute,
        seek,
    } = usePlayerStore();

    // Set audio ref on mount
    useEffect(() => {
        if (audioRef.current) {
            setAudioRef(audioRef.current);
        }
    }, [setAudioRef]);

    // Update audio source - optimized for fast playback
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        const prevSrc = audio.src;

        // Only update if URL actually changed
        if (prevSrc === audioUrl) return;

        // Set new source and play immediately
        audio.src = audioUrl;

        // Try to play immediately - most browsers support this
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch(err => {
                // Auto-play was prevented, wait for user interaction or canplay
                if (err.name === 'NotAllowedError') {
                    // Will be handled by user clicking play
                } else if (err.name === 'AbortError') {
                    // Play was interrupted by new source - ignore
                } else {
                    console.error('Play failed:', err.message);
                }
            });
        }

        const handleError = () => {
            console.error('Audio error:', audio.error?.message || 'Unknown error');
        };

        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('error', handleError);
        };
    }, [audioUrl]);

    // Handle audio events
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        if (repeatMode === 'one') {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        } else {
            playNext();
        }
    };

    const handleProgressClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!currentTrack) {
        return null;
    }

    return (
        <>
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => console.error('Audio element error:', e)}
                preload="auto"
            />

            {/* Desktop Player */}
            <div className="player-container">
                {/* Track Info */}
                <div className="player-track-info">
                    {currentTrack.thumbnail ? (
                        <img
                            src={currentTrack.thumbnail}
                            alt={currentTrack.title}
                            className="player-thumbnail"
                        />
                    ) : (
                        <div className="player-thumbnail-placeholder">
                            <MusicNoteIcon />
                        </div>
                    )}
                    <div className="player-track-details">
                        <div className="player-track-title truncate">{currentTrack.title}</div>
                        <div className="player-track-artist truncate">{currentTrack.artist}</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="player-controls">
                    <div className="player-buttons">
                        <button
                            className={`player-btn ${isShuffled ? 'active' : ''}`}
                            onClick={toggleShuffle}
                            title="Shuffle"
                        >
                            <ShuffleIcon />
                        </button>
                        <button className="player-btn" onClick={playPrevious} title="Previous">
                            <SkipPrevIcon />
                        </button>
                        <button
                            className="player-btn player-btn-main"
                            onClick={togglePlay}
                            disabled={isLoading}
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isLoading ? (
                                <div className="loading-spinner" style={{ width: 20, height: 20 }} />
                            ) : isPlaying ? (
                                <PauseIcon />
                            ) : (
                                <PlayIcon />
                            )}
                        </button>
                        <button className="player-btn" onClick={playNext} title="Next">
                            <SkipNextIcon />
                        </button>
                        <button
                            className={`player-btn ${repeatMode !== 'off' ? 'active' : ''}`}
                            onClick={toggleRepeat}
                            title={`Repeat: ${repeatMode}`}
                        >
                            {repeatMode === 'one' ? <RepeatOneIcon /> : <RepeatIcon />}
                        </button>
                    </div>

                    <div className="player-progress">
                        <span className="player-time">{formatTime(currentTime)}</span>
                        <div className="player-progress-bar" onClick={handleProgressClick}>
                            <div
                                className="player-progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="player-time">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Volume & Extra */}
                <div className="player-extra">
                    <div className="player-volume">
                        <button className="player-btn" onClick={toggleMute}>
                            {isMuted || volume === 0 ? <VolumeMutedIcon /> : <VolumeIcon />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="player-volume-slider"
                        />
                    </div>
                    <button
                        className={`player-btn ${queueOpen ? 'active' : ''}`}
                        title="Queue"
                        onClick={() => setQueueOpen(!queueOpen)}
                    >
                        <QueueIcon />
                    </button>
                </div>
            </div>

            {/* Mini Player (Mobile) */}
            <div className="mini-player">
                <div className="mini-player-progress">
                    <div
                        className="mini-player-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="mini-player-content">
                    {currentTrack.thumbnail ? (
                        <img
                            src={currentTrack.thumbnail}
                            alt={currentTrack.title}
                            className="mini-player-thumbnail"
                        />
                    ) : (
                        <div className="player-thumbnail-placeholder">
                            <MusicNoteIcon />
                        </div>
                    )}
                    <div className="mini-player-details">
                        <div className="mini-player-title truncate">{currentTrack.title}</div>
                        <div className="mini-player-artist truncate">{currentTrack.artist}</div>
                    </div>
                </div>
                <div className="mini-player-controls">
                    <button className="player-btn" onClick={togglePlay}>
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <button className="player-btn" onClick={playNext}>
                        <SkipNextIcon />
                    </button>
                </div>
            </div>

            {/* Queue Panel */}
            <QueuePanel isOpen={queueOpen} onClose={() => setQueueOpen(false)} />
        </>
    );
};

export default Player;
