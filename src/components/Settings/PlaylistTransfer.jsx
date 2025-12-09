import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import Peer from 'peerjs';
import { Html5Qrcode } from 'html5-qrcode';
import usePlaylistStore from '../../stores/playlistStore';
import '../../styles/components/transfer.css';

// Icons
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
);

const QRIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z" />
    </svg>
);

const ScanIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5zM19 16h1.5v1.5H19V16z" />
    </svg>
);

const DownloadIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
);

const PlaylistTransfer = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState('menu'); // 'menu', 'share', 'scan', 'receive'
    const [peerId, setPeerId] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [status, setStatus] = useState('');
    const [receivedData, setReceivedData] = useState(null);
    const [scanning, setScanning] = useState(false);
    const peerRef = useRef(null);
    const scannerRef = useRef(null);

    const { playlists, likedSongs, createPlaylist, addToPlaylist } = usePlaylistStore();

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            setMode('menu');
            setStatus('');
            setReceivedData(null);
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
                scannerRef.current = null;
            }
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        }
    }, [isOpen]);

    // Initialize peer connection
    useEffect(() => {
        if (isOpen && (mode === 'share' || mode === 'receive')) {
            const peer = new Peer();
            peerRef.current = peer;

            peer.on('open', (id) => {
                setPeerId(id);
                setStatus('Ready to connect');

                // Generate QR code with peer ID
                const connectionData = JSON.stringify({ type: 'musify-transfer', peerId: id });
                QRCode.toDataURL(connectionData, { width: 256, margin: 2 })
                    .then(url => setQrCodeUrl(url))
                    .catch(console.error);
            });

            peer.on('connection', (conn) => {
                setStatus('Device connected!');

                conn.on('data', (data) => {
                    if (data.type === 'playlist-request') {
                        conn.send({
                            type: 'playlist-data',
                            playlists,
                            likedSongs,
                        });
                        setStatus('Playlists sent successfully!');
                    } else if (data.type === 'playlist-data') {
                        setReceivedData(data);
                        setStatus(`Received ${data.playlists?.length || 0} playlists!`);
                    }
                });

                conn.on('close', () => {
                    setStatus('Connection closed');
                });
            });

            peer.on('error', (err) => {
                setStatus('Connection error: ' + err.message);
            });

            return () => {
                peer.destroy();
            };
        }
    }, [isOpen, mode, playlists, likedSongs]);

    // Start QR scanner
    const startScanner = async () => {
        setScanning(true);
        setStatus('Starting camera...');

        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    // QR code scanned successfully
                    try {
                        const data = JSON.parse(decodedText);
                        if (data.type === 'musify-transfer' && data.peerId) {
                            html5QrCode.stop();
                            setScanning(false);
                            connectToPeer(data.peerId);
                        }
                    } catch (e) {
                        // Not a valid Musify QR code
                    }
                },
                (error) => {
                    // QR code not found in this frame
                }
            );
            setStatus('Point camera at QR code');
        } catch (err) {
            setStatus('Camera error: ' + err.message);
            setScanning(false);
        }
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().catch(() => { });
            scannerRef.current = null;
        }
        setScanning(false);
    };

    const connectToPeer = (targetPeerId) => {
        if (!peerRef.current) {
            // Initialize peer if not already done
            const peer = new Peer();
            peerRef.current = peer;

            peer.on('open', () => {
                doConnect(targetPeerId);
            });
        } else {
            doConnect(targetPeerId);
        }
    };

    const doConnect = (targetPeerId) => {
        setStatus('Connecting to device...');
        const conn = peerRef.current.connect(targetPeerId);

        conn.on('open', () => {
            setStatus('Connected! Requesting playlists...');
            conn.send({ type: 'playlist-request' });
        });

        conn.on('data', (data) => {
            if (data.type === 'playlist-data') {
                setReceivedData(data);
                setStatus(`Received ${data.playlists?.length || 0} playlists and ${data.likedSongs?.length || 0} liked songs!`);
            }
        });

        conn.on('error', (err) => {
            setStatus('Connection failed: ' + err.message);
        });
    };

    const handleManualConnect = () => {
        const targetPeerId = prompt('Enter the Peer ID from the sender device:');
        if (targetPeerId) {
            connectToPeer(targetPeerId);
        }
    };

    const handleImportPlaylists = () => {
        if (!receivedData) return;

        // Import playlists
        receivedData.playlists?.forEach(playlist => {
            const newPlaylist = createPlaylist(playlist.name + ' (Imported)', playlist.description);
            playlist.songs?.forEach(song => {
                addToPlaylist(newPlaylist.id, song);
            });
        });

        // Import liked songs
        receivedData.likedSongs?.forEach(song => {
            if (!usePlaylistStore.getState().isLiked(song.id)) {
                usePlaylistStore.getState().toggleLike(song);
            }
        });

        setStatus('Import complete!');
        setReceivedData(null);

        setTimeout(() => {
            onClose();
        }, 1500);
    };

    const handleExportToFile = () => {
        const data = {
            version: 1,
            exportDate: new Date().toISOString(),
            playlists,
            likedSongs,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `musify-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus('Backup downloaded!');
    };

    const handleImportFromFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                setReceivedData(data);
                setStatus(`Loaded ${data.playlists?.length || 0} playlists from file!`);
            } catch (err) {
                setStatus('Invalid backup file');
            }
        };
        reader.readAsText(file);
    };

    if (!isOpen) return null;

    return (
        <div className="transfer-modal-overlay" onClick={onClose}>
            <div className="transfer-modal" onClick={e => e.stopPropagation()}>
                <div className="transfer-modal-header">
                    <h2>Transfer Playlists</h2>
                    <button className="transfer-close-btn" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>

                <div className="transfer-modal-content">
                    {mode === 'menu' && (
                        <div className="transfer-menu">
                            <button className="transfer-option" onClick={() => setMode('share')}>
                                <QRIcon />
                                <div>
                                    <strong>Share via QR Code</strong>
                                    <p>Generate a QR code to share your playlists</p>
                                </div>
                            </button>
                            <button className="transfer-option" onClick={() => { setMode('scan'); startScanner(); }}>
                                <ScanIcon />
                                <div>
                                    <strong>Scan QR Code</strong>
                                    <p>Scan QR code from another device to receive playlists</p>
                                </div>
                            </button>
                            <div className="transfer-divider">or backup to file</div>
                            <button className="transfer-option" onClick={handleExportToFile}>
                                <DownloadIcon />
                                <div>
                                    <strong>Export to File</strong>
                                    <p>Download all playlists as a backup file</p>
                                </div>
                            </button>
                            <label className="transfer-option">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportFromFile}
                                    style={{ display: 'none' }}
                                />
                                <DownloadIcon style={{ transform: 'rotate(180deg)' }} />
                                <div>
                                    <strong>Import from File</strong>
                                    <p>Restore playlists from a backup file</p>
                                </div>
                            </label>
                        </div>
                    )}

                    {mode === 'share' && (
                        <div className="transfer-share">
                            <button className="transfer-back" onClick={() => setMode('menu')}>
                                ← Back
                            </button>
                            <div className="transfer-qr-container">
                                {qrCodeUrl ? (
                                    <>
                                        <img src={qrCodeUrl} alt="QR Code" className="transfer-qr" />
                                        <p className="transfer-peer-id">ID: <code>{peerId}</code></p>
                                    </>
                                ) : (
                                    <div className="transfer-loading">Generating QR Code...</div>
                                )}
                            </div>
                            <p className="transfer-instructions">
                                The other device should open Musify → Settings → Transfer → Scan QR Code
                            </p>
                            <div className="transfer-status">{status}</div>
                        </div>
                    )}

                    {mode === 'scan' && (
                        <div className="transfer-scan">
                            <button className="transfer-back" onClick={() => { stopScanner(); setMode('menu'); }}>
                                ← Back
                            </button>
                            <div id="qr-reader" style={{
                                width: '100%',
                                maxWidth: '300px',
                                margin: '0 auto',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                            }} />
                            <div className="transfer-status">{status}</div>

                            <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
                                <button
                                    className="transfer-connect-btn"
                                    onClick={handleManualConnect}
                                    style={{ background: 'var(--color-surface-variant)', color: 'var(--color-text-primary)' }}
                                >
                                    Enter ID Manually
                                </button>
                            </div>

                            {receivedData && (
                                <div className="transfer-received-data">
                                    <h4>Ready to Import:</h4>
                                    <ul>
                                        <li>{receivedData.playlists?.length || 0} playlists</li>
                                        <li>{receivedData.likedSongs?.length || 0} liked songs</li>
                                    </ul>
                                    <button
                                        className="transfer-import-btn"
                                        onClick={handleImportPlaylists}
                                    >
                                        Import All
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaylistTransfer;
