import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import piped from '../api/piped';
import usePlayerStore from '../stores/playerStore';
import usePlaylistStore from '../stores/playlistStore';
import SongCard from '../components/Cards/SongCard';
import '../styles/components/layout.css';
import '../styles/components/cards.css';

const ArrowBackIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
);

const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const ShuffleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
    </svg>
);

const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
);

const Playlist = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLocal, setIsLocal] = useState(false);

    const { setQueue } = usePlayerStore();
    const { getPlaylist, deletePlaylist, removeFromPlaylist } = usePlaylistStore();

    useEffect(() => {
        fetchPlaylist();
    }, [id]);

    const fetchPlaylist = async () => {
        setIsLoading(true);
        setError(null);

        // Check if it's a local playlist
        if (id?.startsWith('local_')) {
            setIsLocal(true);
            const localPlaylist = getPlaylist(id);
            if (localPlaylist) {
                setPlaylist({
                    name: localPlaylist.name,
                    uploader: 'My Playlist',
                    videos: localPlaylist.songs.length,
                    thumbnailUrl: localPlaylist.thumbnail || localPlaylist.songs[0]?.thumbnail,
                    relatedStreams: localPlaylist.songs.map(song => ({
                        url: `/watch?v=${song.id}`,
                        ...song,
                    })),
                });
            } else {
                setError('Playlist not found');
            }
            setIsLoading(false);
            return;
        }

        // Fetch from remote API
        setIsLocal(false);
        try {
            const data = await piped.getPlaylist(id);
            setPlaylist(data);
        } catch (err) {
            console.error('Failed to fetch playlist:', err);
            setError('Failed to load playlist. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayAll = () => {
        if (!playlist?.relatedStreams?.length) return;

        const tracks = playlist.relatedStreams.map(track => ({
            id: track.id || track.url?.split('v=')[1],
            title: track.title,
            artist: track.uploaderName || track.artist,
            thumbnail: track.thumbnail,
            duration: track.duration,
        }));
        setQueue(tracks, 0);
    };

    const handleShuffle = () => {
        if (!playlist?.relatedStreams?.length) return;

        const tracks = playlist.relatedStreams.map(track => ({
            id: track.id || track.url?.split('v=')[1],
            title: track.title,
            artist: track.uploaderName || track.artist,
            thumbnail: track.thumbnail,
            duration: track.duration,
        }));

        // Shuffle tracks
        for (let i = tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
        }

        setQueue(tracks, 0);
    };

    const handlePlayTrack = (track, index) => {
        const tracks = playlist.relatedStreams.map(t => ({
            id: t.id || t.url?.split('v=')[1],
            title: t.title,
            artist: t.uploaderName || t.artist,
            thumbnail: t.thumbnail,
            duration: t.duration,
        }));
        setQueue(tracks, index);
    };

    const handleDeletePlaylist = () => {
        if (confirm('Delete this playlist?')) {
            deletePlaylist(id);
            navigate('/');
        }
    };

    const handleRemoveSong = (songId) => {
        removeFromPlaylist(id, songId);
        // Refresh playlist data
        fetchPlaylist();
    };

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <div className="empty-state-title">Error</div>
                <div className="empty-state-description">{error}</div>
                <button className="btn btn-primary" onClick={fetchPlaylist} style={{ marginTop: 'var(--space-md)' }}>
                    Try Again
                </button>
            </div>
        );
    }

    if (!playlist) {
        return null;
    }

    return (
        <div className="animate-fade-in">
            {/* Back Button */}
            <button
                className="navbar-back-btn"
                onClick={() => navigate(-1)}
                style={{ marginBottom: 'var(--space-md)' }}
            >
                <ArrowBackIcon />
            </button>

            {/* Header */}
            <header className="page-header">
                {playlist.thumbnailUrl ? (
                    <img
                        src={playlist.thumbnailUrl}
                        alt={playlist.name}
                        className="page-header-thumbnail"
                    />
                ) : (
                    <div className="page-header-thumbnail" style={{
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                    }}>
                        🎵
                    </div>
                )}
                <div className="page-header-info">
                    <span className="page-header-type">{isLocal ? 'My Playlist' : 'Playlist'}</span>
                    <h1 className="page-header-title">{playlist.name}</h1>
                    <p className="page-header-subtitle">
                        {playlist.uploader} • {playlist.videos || playlist.relatedStreams?.length || 0} songs
                    </p>
                    <div className="page-header-actions">
                        <button className="btn btn-primary" onClick={handlePlayAll} disabled={!playlist.relatedStreams?.length}>
                            <PlayIcon />
                            Play
                        </button>
                        <button className="btn btn-secondary" onClick={handleShuffle} disabled={!playlist.relatedStreams?.length}>
                            <ShuffleIcon />
                            Shuffle
                        </button>
                        {isLocal && (
                            <button
                                className="btn btn-secondary"
                                onClick={handleDeletePlaylist}
                                style={{ color: 'var(--color-error)' }}
                            >
                                <DeleteIcon />
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Track List */}
            <section>
                {playlist.relatedStreams?.length > 0 ? (
                    playlist.relatedStreams.map((track, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                            <SongCard
                                id={track.id || track.url?.split('v=')[1]}
                                title={track.title}
                                artist={track.uploaderName || track.artist}
                                thumbnail={track.thumbnail}
                                duration={track.duration}
                                onClick={() => handlePlayTrack(track, index)}
                            />
                            {isLocal && (
                                <button
                                    onClick={() => handleRemoveSong(track.id)}
                                    style={{
                                        position: 'absolute',
                                        right: '60px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'var(--color-surface-variant)',
                                        border: 'none',
                                        padding: '8px',
                                        borderRadius: 'var(--radius-full)',
                                        color: 'var(--color-error)',
                                        cursor: 'pointer',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                    }}
                                    className="remove-song-btn"
                                    title="Remove from playlist"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-title">Empty playlist</div>
                        <div className="empty-state-description">
                            {isLocal ? 'Add songs using the 3-dot menu on any song' : "This playlist doesn't have any songs yet"}
                        </div>
                    </div>
                )}
            </section>

            <style>{`
                .song-card:hover .remove-song-btn {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div className="animate-fade-in">
        <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            <div className="skeleton" style={{ width: '200px', height: '200px', borderRadius: 'var(--radius-lg)' }} />
            <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '100px', marginBottom: 'var(--space-sm)' }} />
                <div className="skeleton skeleton-text" style={{ width: '60%', height: '32px', marginBottom: 'var(--space-sm)' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 'var(--space-lg)' }} />
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <div className="skeleton" style={{ width: '100px', height: '44px', borderRadius: 'var(--radius-full)' }} />
                    <div className="skeleton" style={{ width: '100px', height: '44px', borderRadius: 'var(--radius-full)' }} />
                </div>
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)' }}>
                    <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)' }} />
                    <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '8px' }} />
                        <div className="skeleton skeleton-text skeleton-text-sm" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default Playlist;
