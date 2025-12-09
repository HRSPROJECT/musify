import usePlayerStore from '../../stores/playerStore';
import SongMenu from '../Common/SongMenu';

// Icons
const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const MusicNoteIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SongCard = ({
    id,
    title,
    artist,
    thumbnail,
    duration,
    uploaderName,
    onClick,
    showMenu = true,
}) => {
    const { currentTrack, isPlaying, prefetchAudio } = usePlayerStore();
    const isCurrentSong = currentTrack?.id === id;

    // Create song object for menu actions
    const song = {
        id,
        title,
        artist: artist || uploaderName,
        uploaderName: uploaderName || artist,
        thumbnail,
        duration,
    };

    // Prefetch on hover for instant playback
    const handleMouseEnter = () => {
        if (id && !isCurrentSong) {
            prefetchAudio(id);
        }
    };

    return (
        <div
            className={`song-card ${isCurrentSong ? 'playing' : ''}`}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
        >
            <div className="song-card-thumbnail-wrapper">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={title}
                        className="song-card-thumbnail"
                        loading="lazy"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div
                    className="song-card-thumbnail song-card-thumbnail-fallback"
                    style={{
                        display: thumbnail ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <MusicNoteIcon />
                </div>
                <div className="song-card-play-overlay">
                    {isCurrentSong && isPlaying ? <PauseIcon /> : <PlayIcon />}
                </div>
            </div>

            <div className="song-card-info">
                <div className="song-card-title truncate">{title}</div>
                <div className="song-card-artist truncate">{artist || uploaderName}</div>
            </div>

            {duration > 0 && (
                <span className="song-card-duration">{formatDuration(duration)}</span>
            )}

            {showMenu && (
                <div className="song-card-actions" onClick={(e) => e.stopPropagation()}>
                    <SongMenu song={song} position="bottom-left" />
                </div>
            )}
        </div>
    );
};

export default SongCard;
