import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import piped from '../api/piped';
import usePlayerStore from '../stores/playerStore';
import SearchBar from '../components/Search/SearchBar';
import MediaCard from '../components/Cards/MediaCard';
import SongCard from '../components/Cards/SongCard';
import '../styles/components/cards.css';

const Home = () => {
    const [trending, setTrending] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { setQueue } = usePlayerStore();

    useEffect(() => {
        fetchTrending();
    }, []);

    const fetchTrending = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await piped.getTrending('US');
            // Filter for music content
            const musicContent = data.filter(item =>
                item.type === 'stream' ||
                item.uploaderName?.toLowerCase().includes('music') ||
                item.title?.toLowerCase().includes('official')
            ).slice(0, 20);
            setTrending(musicContent);

            // Prefetch first 5 songs for instant playback
            const { prefetchAudio } = usePlayerStore.getState();
            musicContent.slice(0, 5).forEach(track => {
                const id = track.url?.split('v=')[1] || track.id;
                if (id) prefetchAudio(id);
            });
        } catch (err) {
            console.error('Failed to fetch trending:', err);
            setError('Failed to load content. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayTrack = async (track) => {
        setQueue([{
            id: track.url?.split('v=')[1] || track.id,
            title: track.title,
            artist: track.uploaderName,
            thumbnail: track.thumbnail,
            duration: track.duration,
        }], 0);
    };

    const handlePlayAll = () => {
        const tracks = trending.map(track => ({
            id: track.url?.split('v=')[1] || track.id,
            title: track.title,
            artist: track.uploaderName,
            thumbnail: track.thumbnail,
            duration: track.duration,
        }));
        setQueue(tracks, 0);
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="navbar">
                <div className="navbar-content">
                    <SearchBar />
                </div>
            </div>

            {/* Welcome Section */}
            <section style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    marginBottom: 'var(--space-sm)',
                }}>
                    Good {getGreeting()}
                </h1>
                <p style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-md)',
                }}>
                    Discover new music and enjoy your favorites
                </p>
            </section>

            {/* Quick Access Cards */}
            <section style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 'var(--space-md)',
                }}>
                    <QuickAccessCard
                        title="Liked Songs"
                        subtitle="Your favorite tracks"
                        color="#1DB954"
                        to="/library/liked"
                    />
                    <QuickAccessCard
                        title="Recently Played"
                        subtitle="Continue where you left off"
                        color="#E91E63"
                        to="/library/history"
                    />
                    <QuickAccessCard
                        title="Discover"
                        subtitle="New music for you"
                        color="#9C27B0"
                        to="/discover"
                    />
                </div>
            </section>

            {/* Trending Section */}
            <section>
                <div className="section-header">
                    <h2 className="section-title">Trending Now</h2>
                    {trending.length > 0 && (
                        <button
                            className="btn btn-secondary"
                            onClick={handlePlayAll}
                            style={{ height: '36px', padding: '0 var(--space-md)' }}
                        >
                            Play All
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <ErrorState message={error} onRetry={fetchTrending} />
                ) : trending.length > 0 ? (
                    <div>
                        {trending.map((track, index) => (
                            <SongCard
                                key={index}
                                id={track.url?.split('v=')[1] || track.id}
                                title={track.title}
                                artist={track.uploaderName}
                                thumbnail={track.thumbnail}
                                duration={track.duration}
                                onClick={() => handlePlayTrack(track)}
                                onPlayNext={() => {
                                    const playerTrack = {
                                        id: track.url?.split('v=')[1] || track.id,
                                        title: track.title,
                                        artist: track.uploaderName,
                                        thumbnail: track.thumbnail,
                                        duration: track.duration,
                                    };
                                    usePlayerStore.getState().addToQueueNext(playerTrack);
                                }}
                                onAddToQueue={() => {
                                    const playerTrack = {
                                        id: track.url?.split('v=')[1] || track.id,
                                        title: track.title,
                                        artist: track.uploaderName,
                                        thumbnail: track.thumbnail,
                                        duration: track.duration,
                                    };
                                    usePlayerStore.getState().addToQueue(playerTrack);
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}
            </section>
        </div>
    );
};

// Helper Components
const QuickAccessCard = ({ title, subtitle, color, to }) => (
    <Link
        to={to}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            transition: 'all var(--transition-fast)',
            textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-variant)';
            e.currentTarget.style.transform = 'translateX(4px)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-surface)';
            e.currentTarget.style.transform = 'translateX(0)';
        }}
    >
        <div style={{
            width: '48px',
            height: '48px',
            background: color,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
        </div>
        <div>
            <div style={{
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--font-size-sm)',
            }}>
                {title}
            </div>
            <div style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
            }}>
                {subtitle}
            </div>
        </div>
    </Link>
);

const LoadingSkeleton = () => (
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
);

const ErrorState = ({ message, onRetry }) => (
    <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Oops!</div>
        <div className="empty-state-description">{message}</div>
        <button className="btn btn-primary" onClick={onRetry} style={{ marginTop: 'var(--space-md)' }}>
            Try Again
        </button>
    </div>
);

const EmptyState = () => (
    <div className="empty-state">
        <div className="empty-state-icon">🎵</div>
        <div className="empty-state-title">No content found</div>
        <div className="empty-state-description">
            Try searching for your favorite songs or artists
        </div>
    </div>
);

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
};

export default Home;
