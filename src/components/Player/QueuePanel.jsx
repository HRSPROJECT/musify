import usePlayerStore from '../../stores/playerStore';
import '../../styles/components/menu.css';

// Icons
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
);

const MusicNoteIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

const QueueMusicIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
);

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

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const QueuePanel = ({ isOpen, onClose }) => {
    const {
        queue,
        queueIndex,
        currentTrack,
        playTrack,
        removeFromQueue,
        clearQueue,
        isPlaying,
        togglePlay,
        playNext,
        playPrevious,
        isShuffled,
        toggleShuffle,
        repeatMode,
        toggleRepeat,
        currentTime,
        duration,
        seek,
        prefetchAudio
    } = usePlayerStore();

    const currentSong = queue[queueIndex];
    const upNext = queue.slice(queueIndex + 1);
    const previousSongs = queue.slice(0, queueIndex);

    const handlePlaySong = (track, index) => {
        usePlayerStore.setState({ queueIndex: index });
        playTrack(track);
    };

    const handleMouseEnter = (trackId) => {
        if (trackId) prefetchAudio(trackId);
    };

    const handleProgressClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <>
            <div className={`queue-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`queue-panel ${isOpen ? 'open' : ''}`}>
                <div className="queue-panel-header">
                    {/* Mobile Down Arrow for Close */}
                    <button className="mobile-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                        </svg>
                    </button>
                    <h2 className="queue-panel-title">Queue</h2>
                    <div className="queue-panel-actions">
                        <button onClick={clearQueue}>Clear All</button>
                        <button onClick={onClose} className="desktop-close-btn">
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className="queue-panel-content">
                    {/* Mobile Full Player Controls */}
                    {currentTrack && (
                        <div className="mobile-player-controls">
                            <div className="mobile-player-artwork">
                                <img
                                    src={currentTrack.thumbnail}
                                    alt={currentTrack.title}
                                    className={isPlaying ? 'playing' : ''}
                                />
                            </div>
                            <div className="mobile-player-info">
                                <div className="title">{currentTrack.title}</div>
                                <div className="artist">{currentTrack.artist}</div>
                            </div>

                            <div className="mobile-player-progress-container">
                                <div className="progress-bar" onClick={handleProgressClick}>
                                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="time-info">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="mobile-player-buttons">
                                <button
                                    className={`btn-icon ${isShuffled ? 'active' : ''}`}
                                    onClick={toggleShuffle}
                                >
                                    <ShuffleIcon />
                                </button>
                                <button className="btn-icon" onClick={playPrevious}>
                                    <SkipPrevIcon />
                                </button>
                                <button className="btn-play-pause" onClick={togglePlay}>
                                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                                </button>
                                <button className="btn-icon" onClick={playNext}>
                                    <SkipNextIcon />
                                </button>
                                <button
                                    className={`btn-icon ${repeatMode !== 'off' ? 'active' : ''}`}
                                    onClick={toggleRepeat}
                                >
                                    {repeatMode === 'one' ? <RepeatOneIcon /> : <RepeatIcon />}
                                </button>
                            </div>
                        </div>
                    )}

                    {queue.length === 0 ? (
                        <div className="queue-empty">
                            <QueueMusicIcon />
                            <p>Your queue is empty</p>
                            <p style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-xs)' }}>
                                Add songs to start listening
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Now Playing (Desktop) */}
                            {currentTrack && (
                                <div className="queue-section desktop-now-playing">
                                    <div className="queue-section-title">Now Playing</div>
                                    <div className="queue-item playing">
                                        {currentTrack.thumbnail ? (
                                            <img
                                                src={currentTrack.thumbnail}
                                                alt=""
                                                className="queue-item-thumbnail"
                                            />
                                        ) : (
                                            <div className="queue-item-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <MusicNoteIcon />
                                            </div>
                                        )}
                                        <div className="queue-item-info">
                                            <div className="queue-item-title">{currentTrack.title}</div>
                                            <div className="queue-item-artist">{currentTrack.artist}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Up Next */}
                            {upNext.length > 0 && (
                                <div className="queue-section">
                                    <div className="queue-section-title">Up Next ({upNext.length})</div>
                                    {upNext.map((track, idx) => {
                                        const actualIndex = queueIndex + 1 + idx;
                                        return (
                                            <div
                                                key={`${track.id}-${actualIndex}`}
                                                className="queue-item"
                                                onClick={() => handlePlaySong(track, actualIndex)}
                                                onMouseEnter={() => handleMouseEnter(track.id)}
                                            >
                                                {track.thumbnail ? (
                                                    <img
                                                        src={track.thumbnail}
                                                        alt=""
                                                        className="queue-item-thumbnail"
                                                    />
                                                ) : (
                                                    <div className="queue-item-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <MusicNoteIcon />
                                                    </div>
                                                )}
                                                <div className="queue-item-info">
                                                    <div className="queue-item-title">{track.title}</div>
                                                    <div className="queue-item-artist">{track.uploaderName || track.artist}</div>
                                                </div>
                                                <button
                                                    className="queue-item-remove"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromQueue(actualIndex);
                                                    }}
                                                >
                                                    <CloseIcon />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Previously Played */}
                            {previousSongs.length > 0 && (
                                <div className="queue-section">
                                    <div className="queue-section-title">Previously Played</div>
                                    {previousSongs.map((track, idx) => (
                                        <div
                                            key={`${track.id}-${idx}`}
                                            className="queue-item"
                                            style={{ opacity: 0.6 }}
                                            onClick={() => handlePlaySong(track, idx)}
                                            onMouseEnter={() => handleMouseEnter(track.id)}
                                        >
                                            {track.thumbnail ? (
                                                <img
                                                    src={track.thumbnail}
                                                    alt=""
                                                    className="queue-item-thumbnail"
                                                />
                                            ) : (
                                                <div className="queue-item-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <MusicNoteIcon />
                                                </div>
                                            )}
                                            <div className="queue-item-info">
                                                <div className="queue-item-title">{track.title}</div>
                                                <div className="queue-item-artist">{track.uploaderName || track.artist}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default QueuePanel;
