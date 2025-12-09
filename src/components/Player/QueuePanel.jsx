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

const QueuePanel = ({ isOpen, onClose }) => {
    const { queue, queueIndex, currentTrack, playTrack, removeFromQueue, clearQueue } = usePlayerStore();

    const currentSong = queue[queueIndex];
    const upNext = queue.slice(queueIndex + 1);
    const previousSongs = queue.slice(0, queueIndex);

    const handlePlaySong = (track, index) => {
        usePlayerStore.setState({ queueIndex: index });
        playTrack(track);
    };

    return (
        <>
            <div className={`queue-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`queue-panel ${isOpen ? 'open' : ''}`}>
                <div className="queue-panel-header">
                    <h2 className="queue-panel-title">Queue</h2>
                    <div className="queue-panel-actions">
                        <button onClick={clearQueue}>Clear All</button>
                        <button onClick={onClose}>
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className="queue-panel-content">
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
                            {/* Now Playing */}
                            {currentTrack && (
                                <div className="queue-section">
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
