import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useSettingsStore from './stores/settingsStore';
import usePlayerStore from './stores/playerStore';

// Components
import Sidebar, { MobileNav, MobileHeader } from './components/Layout/Sidebar';
import Player from './components/Player/Player';
import PlaylistTransfer from './components/Settings/PlaylistTransfer';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import Playlist from './pages/Playlist';

// Styles
import './styles/index.css';
import './styles/components/player.css';
import './styles/components/cards.css';
import './styles/components/layout.css';
import './styles/components/transfer.css';

const App = () => {
  const { theme } = useSettingsStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Fix mobile viewport height
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <MobileNav />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/playlist/:id" element={<Playlist />} />
            <Route path="/album/:id" element={<Playlist />} />

            {/* Library Routes */}
            <Route path="/library" element={<ComingSoon title="Library" />} />
            <Route path="/library/playlists" element={<ComingSoon title="Playlists" />} />
            <Route path="/library/albums" element={<ComingSoon title="Albums" />} />
            <Route path="/library/artists" element={<ComingSoon title="Artists" />} />
            <Route path="/library/liked" element={<ComingSoon title="Liked Songs" />} />
            <Route path="/library/history" element={<ComingSoon title="History" />} />

            {/* Other Routes */}
            <Route path="/artist/:id" element={<ComingSoon title="Artist" />} />
            <Route path="/discover" element={<ComingSoon title="Discover" />} />
            <Route path="/settings" element={<Settings />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Player />
      </div>
    </BrowserRouter>
  );
};

// Placeholder Components
const ComingSoon = ({ title }) => (
  <div className="empty-state" style={{ minHeight: '60vh' }}>
    <div className="empty-state-icon">🚧</div>
    <div className="empty-state-title">{title}</div>
    <div className="empty-state-description">
      This feature is coming soon!
    </div>
  </div>
);

const Settings = () => {
  const { theme, setTheme } = useSettingsStore();
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <div className="animate-fade-in">
      <h1 style={{
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 'var(--font-weight-bold)',
        marginBottom: 'var(--space-xl)',
      }}>
        Settings
      </h1>

      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--space-md)',
        }}>
          Appearance
        </h2>

        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>Theme</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Choose your preferred color scheme
              </div>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-variant)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
              }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--space-md)',
        }}>
          Backup & Transfer
        </h2>

        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>Transfer Playlists</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Share playlists between devices via QR code or backup to file
              </div>
            </div>
            <button
              onClick={() => setTransferOpen(true)}
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'var(--font-weight-medium)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
              }}
            >
              Transfer
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--space-md)',
        }}>
          About
        </h2>

        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
        }}>
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <strong>Musify</strong>
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            A modern YouTube Music client by HRSProject.
            <br />
            Made with ❤️
          </div>
        </div>
      </section>

      <PlaylistTransfer isOpen={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
};

const NotFound = () => (
  <div className="empty-state" style={{ minHeight: '60vh' }}>
    <div className="empty-state-icon">404</div>
    <div className="empty-state-title">Page not found</div>
    <div className="empty-state-description">
      The page you're looking for doesn't exist.
    </div>
  </div>
);

export default App;
