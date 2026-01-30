/**
 * TypeScript interfaces for the Lecture Recording app
 */

// Status tracking for the recording workflow
export type RecordingStatus =
  | 'recorded'           // Audio has been recorded
  | 'transcribing'       // Currently sending to Whisper API
  | 'transcribed'        // Transcription completed
  | 'generating_notes'   // Currently sending to Claude API
  | 'complete'           // Notes have been generated
  | 'error';             // Something went wrong

// Main recording interface stored in IndexedDB
export interface Recording {
  id?: number;              // Auto-increment primary key
  filename: string;         // Display name (e.g., "Recording 2024-01-30")
  customName?: string;      // User can override with custom name
  date: Date;               // When recording was created
  duration: number;         // Length in seconds
  audioBlob: Blob;          // The actual audio data (WebM format)
  transcript?: string;      // Text from Whisper API
  notes?: string;           // Formatted notes from Claude API
  status: RecordingStatus;  // Current workflow state
  errorMessage?: string;    // Error details if status is 'error'
  mimeType: string;         // Audio format (e.g., 'audio/webm;codecs=opus')

  // Phase 1A: Enhanced organization fields
  tags?: string[];          // User-defined tags for categorization
  category?: string;        // Category (e.g., "Math", "Physics", "CS")
  subject?: string;         // Subject/topic of the recording
  searchText?: string;      // Normalized searchable text (auto-generated)
  priority?: 'low' | 'medium' | 'high';  // Priority level
  isStudied?: boolean;      // Mark if already studied/reviewed
  lastModified?: Date;      // Last time notes were edited
  exportedAt?: Date;        // Last time exported (PDF/Markdown)

  // Phase 4A: Timestamp support
  transcriptSegments?: TranscriptSegment[];  // Whisper segments with timestamps
}

// Transcript segment with timestamp data
export interface TranscriptSegment {
  text: string;             // Segment text
  start: number;            // Start time in seconds
  end: number;              // End time in seconds
}

// Context interface for global app state
export interface AppContextType {
  // API Keys
  openaiKey: string | null;
  anthropicKey: string | null;
  setOpenAIKey: (key: string) => void;
  setAnthropicKey: (key: string) => void;

  // Navigation
  currentPage: 'home' | 'settings';
  navigateTo: (page: 'home' | 'settings') => void;

  // Recording state
  isRecording: boolean;
  isPaused: boolean;
  setIsRecording: (value: boolean) => void;
  setIsPaused: (value: boolean) => void;
}

// Toast notification types
export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

// Filter options for search and filtering
export interface FilterOptions {
  searchQuery?: string;     // Text search
  tags?: string[];          // Filter by tags (OR logic)
  category?: string;        // Filter by category
  status?: RecordingStatus; // Filter by status
  isStudied?: boolean;      // Filter by study status
  priority?: 'low' | 'medium' | 'high';  // Filter by priority
  dateFrom?: Date;          // Date range start
  dateTo?: Date;            // Date range end
}
