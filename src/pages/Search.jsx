import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import piped from '../api/piped';
import usePlayerStore from '../stores/playerStore';
import SearchBar from '../components/Search/SearchBar';
import SongCard from '../components/Cards/SongCard';
import MediaCard from '../components/Cards/MediaCard';
import '../styles/components/cards.css';

const FILTERS = [
    { id: 'music_songs', label: 'Songs' },
    { id: 'music_albums', label: 'Albums' },
    { id: 'music_artists', label: 'Artists' },
    { id: 'music_playlists', label: 'Playlists' },
];

const Search = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [activeFilter, setActiveFilter] = useState('music_songs');
    const [results, setResults] = useState([]);
    const [nextpage, setNextpage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { setQueue } = usePlayerStore();

    const performSearch = useCallback(async (searchQuery, filter, loadMore = false) => {
        if (!searchQuery) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await piped.search(searchQuery, filter);

            if (loadMore) {
                setResults(prev => [...prev, ...(data.items || [])]);
            } else {
                setResults(data.items || []);
            }
            setNextpage(data.nextpage || null);
        } catch (err) {
            console.error('Search failed:', err);
            setError('Search failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (query) {
            performSearch(query, activeFilter);
        }
    }, [query, activeFilter, performSearch]);

    const handleSearch = (newQuery) => {
        setSearchParams({ q: newQuery });
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
    };

    const handlePlayTrack = (track) => {
        const videoId = track.url?.split('v=')[1] || track.id;
        setQueue([{
            id: videoId,
            title: track.title,
            artist: track.uploaderName,
            thumbnail: track.thumbnail,
            duration: track.duration,
        }], 0);
    };

    const handlePlayAll = () => {
        if (activeFilter !== 'music_songs') return;

        const tracks = results.map(track => ({
            id: track.url?.split('v=')[1] || track.id,
            title: track.title,
            artist: track.uploaderName,
            thumbnail: track.thumbnail,
            duration: track.duration,
        }));
        setQueue(tracks, 0);
    };

    const loadMore = () => {
        if (nextpage && !isLoading) {
            performSearch(query, activeFilter, true);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Search Header */}
            <div className="navbar">
                <div className="navbar-content">
                    <SearchBar onSearch={handleSearch} />
                </div>
            </div>

            {/* Filter Chips */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                marginBottom: 'var(--space-lg)',
                flexWrap: 'wrap',
            }}>
                {FILTERS.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => handleFilterChange(filter.id)}
                        style={{
                            padding: 'var(--space-sm) var(--space-md)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            background: activeFilter === filter.id
                                ? 'var(--color-primary)'
                                : 'var(--color-surface-variant)',
                            color: activeFilter === filter.id
                                ? 'var(--color-text-on-primary)'
                                : 'var(--color-text-primary)',
                            transition: 'all var(--transition-fast)',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Results Header */}
            {query && (
                <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
                    <h2 className="section-title">
                        Results for "{query}"
                    </h2>
                    {activeFilter === 'music_songs' && results.length > 0 && (
                        <button
                            className="btn btn-secondary"
                            onClick={handlePlayAll}
                            style={{ height: '36px', padding: '0 var(--space-md)' }}
                        >
                            Play All
                        </button>
                    )}
                </div>
            )}

            {/* Results */}
            {!query ? (
                <EmptyState type="initial" />
            ) : isLoading && results.length === 0 ? (
                <LoadingSkeleton filter={activeFilter} />
            ) : error ? (
                <ErrorState message={error} onRetry={() => performSearch(query, activeFilter)} />
            ) : results.length === 0 ? (
                <EmptyState type="no-results" query={query} />
            ) : activeFilter === 'music_songs' ? (
                <SongResults
                    results={results}
                    onPlay={handlePlayTrack}
                />
            ) : (
                <MediaResults
                    results={results}
                    type={activeFilter}
                />
            )}

            {/* Load More */}
            {nextpage && results.length > 0 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: 'var(--space-xl)',
                }}>
                    <button
                        className="btn btn-secondary"
                        onClick={loadMore}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

// Sub-components
const SongResults = ({ results, onPlay }) => (
    <div>
        {results.map((track, index) => (
            <SongCard
                key={index}
                id={track.url?.split('v=')[1] || track.id}
                title={track.title}
                artist={track.uploaderName}
                thumbnail={track.thumbnail}
                duration={track.duration}
                onClick={() => onPlay(track)}
                onPlayNext={() => {
                    usePlayerStore.getState().addToQueueNext({
                        id: track.url?.split('v=')[1] || track.id,
                        title: track.title,
                        artist: track.uploaderName,
                        thumbnail: track.thumbnail,
                        duration: track.duration,
                    });
                }}
                onAddToQueue={() => {
                    usePlayerStore.getState().addToQueue({
                        id: track.url?.split('v=')[1] || track.id,
                        title: track.title,
                        artist: track.uploaderName,
                        thumbnail: track.thumbnail,
                        duration: track.duration,
                    });
                }}
            />
        ))}
    </div>
);

const MediaResults = ({ results, type }) => (
    <div className="card-grid">
        {results.map((item, index) => (
            <MediaCard
                key={index}
                id={item.url?.split('list=')[1] || item.url?.split('/')[2] || item.id}
                title={item.name || item.title}
                subtitle={item.uploaderName || item.description}
                thumbnail={item.thumbnail}
                type={type.replace('music_', '').slice(0, -1)}
                linkTo={getItemLink(item, type)}
            />
        ))}
    </div>
);

const getItemLink = (item, type) => {
    const id = item.url?.split('list=')[1] || item.url?.split('/')[2] || item.id;
    switch (type) {
        case 'music_albums':
        case 'music_playlists':
            return `/playlist/${id}`;
        case 'music_artists':
            return `/artist/${id}`;
        default:
            return '#';
    }
};

const LoadingSkeleton = ({ filter }) => {
    if (filter === 'music_songs') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)' }}>
                        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)' }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '8px' }} />
                            <div className="skeleton skeleton-text skeleton-text-sm" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="card-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="media-card">
                    <div className="skeleton skeleton-thumbnail" />
                    <div className="skeleton skeleton-text" style={{ marginTop: 'var(--space-md)', width: '80%' }} />
                    <div className="skeleton skeleton-text skeleton-text-sm" style={{ marginTop: 'var(--space-xs)' }} />
                </div>
            ))}
        </div>
    );
};

const EmptyState = ({ type, query }) => (
    <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <div className="empty-state-title">
            {type === 'initial' ? 'Search for music' : `No results for "${query}"`}
        </div>
        <div className="empty-state-description">
            {type === 'initial'
                ? 'Find your favorite songs, albums, and artists'
                : 'Try different keywords or check your spelling'}
        </div>
    </div>
);

const ErrorState = ({ message, onRetry }) => (
    <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Something went wrong</div>
        <div className="empty-state-description">{message}</div>
        <button className="btn btn-primary" onClick={onRetry} style={{ marginTop: 'var(--space-md)' }}>
            Try Again
        </button>
    </div>
);

export default Search;
