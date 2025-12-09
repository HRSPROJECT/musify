# Musify

A modern YouTube Music client by HRSProject.

![Musify](https://img.shields.io/badge/Musify-by%20HRSProject-purple)

## Features

- 🎵 **Stream Music** - Play any song from YouTube Music
- 🔍 **Smart Search** - Dynamic search results with songs, artists, albums
- 📋 **Queue Management** - Add to queue, play next, shuffle
- ❤️ **Liked Songs** - Save your favorite tracks locally
- 📁 **Custom Playlists** - Create and manage local playlists
- 🔄 **P2P Transfer** - Share playlists via QR code
- ⚡ **Ultra Fast** - Prefetching for instant playback
- 🎨 **Dark/Light Theme** - Beautiful UI with theme support
- 📱 **Responsive** - Works on desktop and mobile

## Tech Stack

- **Frontend**: React, Vite, Zustand
- **Backend**: Node.js, Express, youtubei.js
- **Audio**: yt-dlp for reliable streaming

## Quick Start

### Prerequisites
- Node.js 18+
- yt-dlp installed (`brew install yt-dlp` or `pip install yt-dlp`)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/musify.git
cd musify

# Install dependencies
npm install
cd server && npm install && cd ..

# Start the backend
cd server && node index.js &

# Start the frontend
npm run dev
```

Open http://localhost:5173

## Deployment

### Frontend (Vercel)
```bash
npm run build
npx vercel --prod
```

### Backend (Railway)
1. Push `server/` to a separate repo
2. Connect to Railway
3. Set environment variables if needed

## License

MIT © HRSProject

## Made with ❤️
