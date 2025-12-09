import { Link } from 'react-router-dom';

const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const MusicNoteIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

const MediaCard = ({
    id,
    title,
    subtitle,
    thumbnail,
    type = 'album', // 'album', 'playlist', 'artist'
    onPlay,
    linkTo,
}) => {
    const handlePlayClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onPlay?.();
    };

    const content = (
        <div className="media-card">
            <div className="media-card-thumbnail-wrapper">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={title}
                        className={`media-card-thumbnail ${type === 'artist' ? 'rounded' : ''}`}
                        style={type === 'artist' ? { borderRadius: '50%' } : {}}
                    />
                ) : (
                    <div
                        className="media-card-thumbnail"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--color-surface-variant)',
                            borderRadius: type === 'artist' ? '50%' : 'var(--radius-md)',
                        }}
                    >
                        <MusicNoteIcon />
                    </div>
                )}
                {onPlay && (
                    <button className="media-card-play-btn" onClick={handlePlayClick}>
                        <PlayIcon />
                    </button>
                )}
            </div>
            <div className="media-card-title truncate">{title}</div>
            {subtitle && <div className="media-card-subtitle truncate">{subtitle}</div>}
        </div>
    );

    if (linkTo) {
        return <Link to={linkTo}>{content}</Link>;
    }

    return content;
};

export default MediaCard;
