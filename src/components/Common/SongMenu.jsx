import { useState, useRef, useEffect } from 'react';
import usePlayerStore from '../../stores/playerStore';
import usePlaylistStore from '../../stores/playlistStore';
import '../../styles/components/menu.css';

// Icons
const MoreIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
);

const PlayNextIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
);

const AddQueueIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
);

const AddPlaylistIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 10H3v2h11v-2zm0-4H3v2h11V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM3 16h7v-2H3v2z" />
    </svg>
);

const HeartIcon = ({ filled }) => (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const ShareIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
    </svg>
);

const SongMenu = ({ song, position = 'bottom-left' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
    const menuRef = useRef(null);

    const { addToQueue, addToQueueNext } = usePlayerStore();
    const { playlists, addToPlaylist, toggleLike, isLiked, createPlaylist } = usePlaylistStore();

    const liked = isLiked(song.id);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
                setShowPlaylistPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePlayNext = () => {
        addToQueueNext(song);
        setIsOpen(false);
    };

    const handleAddToQueue = () => {
        addToQueue(song);
        setIsOpen(false);
    };

    const handleToggleLike = () => {
        toggleLike(song);
        setIsOpen(false);
    };

    const handleShare = async () => {
        const url = `https://music.youtube.com/watch?v=${song.id}`;
        if (navigator.share) {
            await navigator.share({ title: song.title, url });
        } else {
            navigator.clipboard.writeText(url);
            // Could show toast notification
        }
        setIsOpen(false);
    };

    const handleAddToPlaylist = (playlistId) => {
        addToPlaylist(playlistId, song);
        setShowPlaylistPicker(false);
        setIsOpen(false);
    };

    const handleCreatePlaylist = () => {
        const name = prompt('Enter playlist name:');
        if (name) {
            const newPlaylist = createPlaylist(name);
            addToPlaylist(newPlaylist.id, song);
        }
        setShowPlaylistPicker(false);
        setIsOpen(false);
    };

    return (
        <div className="song-menu-container" ref={menuRef}>
            <button
                className="song-menu-trigger"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            >
                <MoreIcon />
            </button>

            {isOpen && (
                <div className={`song-menu ${position}`}>
                    <button className="song-menu-item" onClick={handlePlayNext}>
                        <PlayNextIcon />
                        <span>Play Next</span>
                    </button>
                    <button className="song-menu-item" onClick={handleAddToQueue}>
                        <AddQueueIcon />
                        <span>Add to Queue</span>
                    </button>
                    <div className="song-menu-divider" />
                    <button className="song-menu-item" onClick={handleToggleLike}>
                        <HeartIcon filled={liked} />
                        <span>{liked ? 'Unlike' : 'Like'}</span>
                    </button>
                    <button
                        className="song-menu-item"
                        onClick={() => setShowPlaylistPicker(!showPlaylistPicker)}
                    >
                        <AddPlaylistIcon />
                        <span>Add to Playlist</span>
                    </button>
                    {showPlaylistPicker && (
                        <div className="playlist-picker">
                            <button className="playlist-picker-item new" onClick={handleCreatePlaylist}>
                                + New Playlist
                            </button>
                            {playlists.map((playlist) => (
                                <button
                                    key={playlist.id}
                                    className="playlist-picker-item"
                                    onClick={() => handleAddToPlaylist(playlist.id)}
                                >
                                    {playlist.name}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="song-menu-divider" />
                    <button className="song-menu-item" onClick={handleShare}>
                        <ShareIcon />
                        <span>Share</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SongMenu;
