import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import piped from '../../api/piped';
import usePlayerStore from '../../stores/playerStore';

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
);

const MusicNoteIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

const PersonIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

const AlbumIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
    </svg>
);

const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const SearchBar = ({ onSearch, placeholder = 'Search for songs, albums, artists...' }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [results, setResults] = useState({ songs: [], artists: [], albums: [] });
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const { setQueue, prefetchAudio } = usePlayerStore();

    // Fetch dynamic results as user types
    const fetchResults = useCallback(async (searchQuery) => {
        if (searchQuery.length < 2) {
            setSuggestions([]);
            setResults({ songs: [], artists: [], albums: [] });
            return;
        }

        setIsLoading(true);

        try {
            // Fetch suggestions and actual results in parallel
            const [suggestionsData, songsData, artistsData] = await Promise.all([
                piped.getSuggestions(searchQuery).catch(() => []),
                piped.search(searchQuery, 'music_songs').catch(() => ({ items: [] })),
                piped.search(searchQuery, 'music_artists').catch(() => ({ items: [] })),
            ]);

            setSuggestions(suggestionsData?.slice(0, 4) || []);
            setResults({
                songs: songsData?.items?.slice(0, 4) || [],
                artists: artistsData?.items?.slice(0, 3) || [],
                albums: [],
            });

            // Prefetch first 2 songs for instant playback
            songsData?.items?.slice(0, 2).forEach(song => {
                if (song.id) prefetchAudio(song.id);
            });
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [prefetchAudio]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchResults(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, fetchResults]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            setShowDropdown(false);
            if (onSearch) {
                onSearch(query);
            } else {
                navigate(`/search?q=${encodeURIComponent(query)}`);
            }
        }
    };

    const handleSuggestionClick = (suggestion) => {
        const text = typeof suggestion === 'string' ? suggestion : suggestion?.query || String(suggestion);
        setQuery(text);
        setShowDropdown(false);
        if (onSearch) {
            onSearch(text);
        } else {
            navigate(`/search?q=${encodeURIComponent(text)}`);
        }
    };

    const handlePlaySong = (song, e) => {
        e.stopPropagation();
        setQueue([{
            id: song.id,
            title: song.title,
            artist: song.artist || song.uploaderName,
            thumbnail: song.thumbnail,
            duration: song.duration,
        }], 0);
        setShowDropdown(false);
    };

    const handleSongClick = (song) => {
        setQueue([{
            id: song.id,
            title: song.title,
            artist: song.artist || song.uploaderName,
            thumbnail: song.thumbnail,
            duration: song.duration,
        }], 0);
        setShowDropdown(false);
    };

    const handleArtistClick = (artist) => {
        setShowDropdown(false);
        navigate(`/artist/${artist.browseId || artist.id}`);
    };

    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        setResults({ songs: [], artists: [], albums: [] });
    };

    const hasResults = suggestions.length > 0 || results.songs.length > 0 || results.artists.length > 0;

    return (
        <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }} ref={dropdownRef}>
            <form onSubmit={handleSubmit} className="search-bar">
                <SearchIcon />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={placeholder}
                />
                {query && (
                    <button
                        type="button"
                        className="search-clear-btn"
                        onClick={handleClear}
                    >
                        <CloseIcon />
                    </button>
                )}
            </form>

            {showDropdown && query.length >= 2 && (
                <div className="search-dropdown">
                    {isLoading && (
                        <div className="search-loading">
                            <div className="search-loading-spinner" />
                            Searching...
                        </div>
                    )}

                    {!isLoading && !hasResults && (
                        <div className="search-empty">
                            No results found for "{query}"
                        </div>
                    )}

                    {/* Text Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="search-section">
                            {suggestions.map((suggestion, index) => {
                                const text = typeof suggestion === 'string'
                                    ? suggestion
                                    : suggestion?.query || suggestion?.text || String(suggestion);
                                return (
                                    <div
                                        key={`sug-${index}`}
                                        className="search-suggestion-item"
                                        onClick={() => handleSuggestionClick(text)}
                                    >
                                        <SearchIcon />
                                        <span>{text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Songs */}
                    {results.songs.length > 0 && (
                        <div className="search-section">
                            <div className="search-section-title">Songs</div>
                            {results.songs.map((song, index) => (
                                <div
                                    key={`song-${index}`}
                                    className="search-result-item"
                                    onClick={() => handleSongClick(song)}
                                >
                                    {song.thumbnail ? (
                                        <img src={song.thumbnail} alt="" className="search-result-thumb" />
                                    ) : (
                                        <div className="search-result-thumb search-result-thumb-fallback">
                                            <MusicNoteIcon />
                                        </div>
                                    )}
                                    <div className="search-result-info">
                                        <div className="search-result-title">{song.title}</div>
                                        <div className="search-result-subtitle">
                                            Song • {song.artist || song.uploaderName}
                                        </div>
                                    </div>
                                    <button
                                        className="search-result-play"
                                        onClick={(e) => handlePlaySong(song, e)}
                                    >
                                        <PlayIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Artists */}
                    {results.artists.length > 0 && (
                        <div className="search-section">
                            <div className="search-section-title">Artists</div>
                            {results.artists.map((artist, index) => (
                                <div
                                    key={`artist-${index}`}
                                    className="search-result-item"
                                    onClick={() => handleArtistClick(artist)}
                                >
                                    {artist.thumbnail ? (
                                        <img
                                            src={artist.thumbnail}
                                            alt=""
                                            className="search-result-thumb"
                                            style={{ borderRadius: '50%' }}
                                        />
                                    ) : (
                                        <div className="search-result-thumb search-result-thumb-fallback" style={{ borderRadius: '50%' }}>
                                            <PersonIcon />
                                        </div>
                                    )}
                                    <div className="search-result-info">
                                        <div className="search-result-title">{artist.name || artist.title}</div>
                                        <div className="search-result-subtitle">Artist</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* See all results */}
                    {hasResults && (
                        <div
                            className="search-see-all"
                            onClick={handleSubmit}
                        >
                            See all results for "{query}"
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .search-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    margin-top: 8px;
                    background: var(--color-surface-elevated);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-xl);
                    border: 1px solid var(--color-border);
                    overflow: hidden;
                    z-index: var(--z-dropdown);
                    max-height: 70vh;
                    overflow-y: auto;
                    animation: slideUp 0.2s ease-out;
                }

                .search-loading {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                    padding: var(--space-md);
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm);
                }

                .search-loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid var(--color-border);
                    border-top-color: var(--color-primary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .search-empty {
                    padding: var(--space-lg);
                    text-align: center;
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm);
                }

                .search-section {
                    border-bottom: 1px solid var(--color-divider);
                }

                .search-section:last-of-type {
                    border-bottom: none;
                }

                .search-section-title {
                    padding: var(--space-sm) var(--space-md);
                    font-size: var(--font-size-xs);
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    background: var(--color-surface-variant);
                }

                .search-suggestion-item {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                    padding: var(--space-sm) var(--space-md);
                    cursor: pointer;
                    transition: background var(--transition-fast);
                    font-size: var(--font-size-sm);
                }

                .search-suggestion-item:hover {
                    background: var(--color-surface-variant);
                }

                .search-suggestion-item svg {
                    width: 16px;
                    height: 16px;
                    color: var(--color-text-tertiary);
                }

                .search-result-item {
                    display: flex;
                    align-items: center;
                    gap: var(--space-md);
                    padding: var(--space-sm) var(--space-md);
                    cursor: pointer;
                    transition: background var(--transition-fast);
                }

                .search-result-item:hover {
                    background: var(--color-surface-variant);
                }

                .search-result-item:hover .search-result-play {
                    opacity: 1;
                }

                .search-result-thumb {
                    width: 40px;
                    height: 40px;
                    border-radius: var(--radius-sm);
                    object-fit: cover;
                    flex-shrink: 0;
                }

                .search-result-thumb-fallback {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--color-surface-variant);
                    color: var(--color-text-tertiary);
                }

                .search-result-info {
                    flex: 1;
                    min-width: 0;
                }

                .search-result-title {
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .search-result-subtitle {
                    font-size: var(--font-size-xs);
                    color: var(--color-text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .search-result-play {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--color-primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity var(--transition-fast), transform var(--transition-fast);
                    flex-shrink: 0;
                }

                .search-result-play:hover {
                    transform: scale(1.1);
                }

                .search-see-all {
                    padding: var(--space-md);
                    text-align: center;
                    font-size: var(--font-size-sm);
                    color: var(--color-primary);
                    cursor: pointer;
                    font-weight: var(--font-weight-medium);
                    transition: background var(--transition-fast);
                }

                .search-see-all:hover {
                    background: var(--color-surface-variant);
                }
            `}</style>
        </div>
    );
};

export default SearchBar;
