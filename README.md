# Dozey AI - Lecture Recording & Note-Taking App

A web-based application for recording lectures, transcribing audio using OpenAI Whisper, and generating study notes using Claude Sonnet 3.5.

## Features

- **Audio Recording**: Record lectures with real-time frequency visualization
- **Transcription**: Convert audio to text using OpenAI Whisper API
- **Note Generation**: Create structured study notes using Claude Sonnet 3.5
- **Local Storage**: Recordings stored in IndexedDB (browser database)
- **Dark Mode**: Modern dark theme optimized for laptops

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Anthropic API key ([get one here](https://console.anthropic.com/settings/keys))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

4. Go to Settings and configure your API keys

### Usage

1. **Record a Lecture**:
   - Click "Start Recording" on the home page
   - Allow microphone access when prompted
   - Speak or play audio - watch the frequency bars animate
   - Use Pause/Resume as needed
   - Click Stop when finished

2. **Generate Notes**:
   - Click "Generate Notes" on any recording
   - Wait for transcription (10-30 seconds)
   - Wait for note generation (10-30 seconds)
   - View your formatted study notes

3. **Manage Recordings**:
   - Click recording name to rename it
   - Use audio player to listen to recordings
   - Click transcript/notes sections to expand/collapse
   - Delete recordings you no longer need

## Technical Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (dark mode)
- **Database**: IndexedDB (Dexie.js)
- **APIs**: OpenAI Whisper, Anthropic Claude
- **Audio**: Web Audio API + MediaRecorder API

## API Costs

Approximate costs per 1-hour lecture recording:
- OpenAI Whisper: ~$0.36
- Anthropic Claude: ~$0.02-0.05
- **Total: ~$0.40 per hour**

## Browser Support

- Chrome/Edge (latest versions) - Recommended
- Firefox (latest versions) - Supported
- Safari - May use different audio codec

## Project Structure

```
src/
├── components/        # React components
├── context/          # React Context (global state)
├── services/         # API integrations and utilities
├── types/            # TypeScript interfaces
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Known Limitations (MVP)

- 25MB file size limit (Whisper API restriction)
- English language only
- API keys stored in localStorage (use backend proxy in production)
- No cloud backup (IndexedDB only)
- No editing of generated notes
- No export to PDF/Markdown

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
