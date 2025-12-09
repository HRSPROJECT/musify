import { NavLink } from 'react-router-dom';
import usePlaylistStore from '../../stores/playlistStore';
import '../../styles/components/layout.css';

// Icons
const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
);

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
);

const LibraryIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
    </svg>
);

const HeartIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const PlaylistIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
);

const AddIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
);

const MusicNoteIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

export const MobileHeader = ({ onMenuClick }) => (
    <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
        </button>
        <div className="mobile-logo">
            <MusicNoteIcon />
            <span>Musify</span>
        </div>
        <div className="mobile-header-spacer" />
    </div>
);

const Sidebar = ({ mobileOpen, onClose }) => {
    const { playlists, likedSongs, createPlaylist } = usePlaylistStore();

    const handleCreatePlaylist = () => {
        const name = prompt('Enter playlist name:');
        if (name) {
            createPlaylist(name);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <MusicNoteIcon />
                        Musify
                    </div>
                    {/* Mobile Close Button */}
                    <button className="sidebar-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <NavLink
                            to="/"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <HomeIcon />
                            Home
                        </NavLink>
                        <NavLink
                            to="/search"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <SearchIcon />
                            Search
                        </NavLink>
                        <NavLink
                            to="/library"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <LibraryIcon />
                            Library
                        </NavLink>
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Playlists</span>
                            <button
                                onClick={handleCreatePlaylist}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                }}
                                title="Create Playlist"
                            >
                                <AddIcon />
                            </button>
                        </div>

                        {/* Liked Songs */}
                        <NavLink
                            to="/liked"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <HeartIcon />
                            Liked Songs
                            {likedSongs.length > 0 && (
                                <span style={{
                                    marginLeft: 'auto',
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-secondary)',
                                }}>
                                    {likedSongs.length}
                                </span>
                            )}
                        </NavLink>

                        {/* User Playlists */}
                        {playlists.map(playlist => (
                            <NavLink
                                key={playlist.id}
                                to={`/playlist/${playlist.id}`}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <PlaylistIcon />
                                <span className="truncate" style={{ flex: 1 }}>{playlist.name}</span>
                                <span style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-secondary)',
                                }}>
                                    {playlist.songs.length}
                                </span>
                            </NavLink>
                        ))}

                        {playlists.length === 0 && (
                            <div style={{
                                padding: 'var(--space-sm)',
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-text-secondary)',
                                textAlign: 'center',
                            }}>
                                No playlists yet
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section" style={{ marginTop: 'auto' }}>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <SettingsIcon />
                            Settings
                        </NavLink>
                    </div>
                </nav>
            </aside>
        </>
    );
};

export const MobileNav = () => {
    return (
        <nav className="mobile-nav">
            <div className="mobile-nav-items">
                <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <HomeIcon />
                    <span>Home</span>
                </NavLink>
                <NavLink to="/search" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <SearchIcon />
                    <span>Search</span>
                </NavLink>
                <NavLink to="/library" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <LibraryIcon />
                    <span>Library</span>
                </NavLink>
                <NavLink to="/liked" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <HeartIcon />
                    <span>Liked</span>
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <SettingsIcon />
                    <span>Settings</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default Sidebar;
