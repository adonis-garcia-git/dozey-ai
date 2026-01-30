/**
 * Recording Item Component
 *
 * Displays a single recording with:
 * - Date, duration, custom name (editable)
 * - Audio playback controls
 * - Delete button
 * - "Generate Notes" button (to be implemented in Phase 5)
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Recording } from '../types';
import { updateRecording, deleteRecording } from '../services/storage';
import { useAppContext } from '../context/AppContext';
import { transcribeAudio } from '../services/whisperApi';
import { generateNotes } from '../services/claudeApi';

interface RecordingItemProps {
  recording: Recording;
}

export const RecordingItem: React.FC<RecordingItemProps> = ({ recording }) => {
  const { openaiKey, anthropicKey } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [customName, setCustomName] = useState(recording.customName || recording.filename);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // UI expansion states
  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Audio ref
  const audioRef = useRef<HTMLAudioElement>(null);

  /**
   * Create object URL for audio playback
   * useMemo ensures we don't recreate URL on every render
   * Note: In production, should revoke URL when component unmounts
   */
  const audioUrl = useMemo(() => {
    return URL.createObjectURL(recording.audioBlob);
  }, [recording.audioBlob]);

  /**
   * Auto-dismiss errors after 8 seconds
   */
  useEffect(() => {
    if (processingError) {
      const timer = setTimeout(() => {
        setProcessingError(null);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [processingError]);

  /**
   * Handle audio element loaded metadata
   * Fixes duration/seeking issues with blob URLs
   */
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleLoadedMetadata = () => {
        // Force the audio element to recognize the duration properly
        audioElement.currentTime = 0;
      };

      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [audioUrl]);

  /**
   * Format duration in seconds to MM:SS or HH:MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Save custom name to database
   */
  const handleSaveName = async () => {
    try {
      if (recording.id) {
        await updateRecording(recording.id, { customName });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving name:', error);
    }
  };

  /**
   * Delete recording after confirmation
   */
  const handleDelete = async () => {
    try {
      if (recording.id) {
        await deleteRecording(recording.id);
        // URL cleanup
        URL.revokeObjectURL(audioUrl);
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  };

  /**
   * Handle "Generate Notes" button click
   * Performs transcription followed by note generation
   */
  const handleGenerateNotes = async () => {
    if (!recording.id) return;

    try {
      setIsProcessing(true);
      setProcessingError(null);

      // Variable to hold transcript text (either existing or newly generated)
      let transcriptText = recording.transcript || '';

      // Step 1: Transcription
      if (!transcriptText) {
        // Check if OpenAI key is configured
        if (!openaiKey) {
          throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
        }

        // Update status to transcribing
        await updateRecording(recording.id, {
          status: 'transcribing',
        });

        // Call Whisper API
        transcriptText = await transcribeAudio(recording.audioBlob, openaiKey);

        // Save transcript
        await updateRecording(recording.id, {
          transcript: transcriptText,
          status: 'transcribed',
        });
      }

      // Step 2: Note Generation
      // Check if Anthropic key is configured
      if (!anthropicKey) {
        throw new Error('Anthropic API key not configured. Please add your API key in Settings.');
      }

      // Verify we have a transcript
      if (!transcriptText || transcriptText.trim().length === 0) {
        throw new Error('No transcript available for note generation.');
      }

      // Update status to generating notes
      await updateRecording(recording.id, {
        status: 'generating_notes',
      });

      // Call Claude API
      const notes = await generateNotes(transcriptText, anthropicKey);

      // Save notes and mark as complete
      await updateRecording(recording.id, {
        notes,
        status: 'complete',
      });

      // Show notes automatically
      setShowNotes(true);

    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate notes';
      setProcessingError(errorMessage);

      // Update recording with error status
      if (recording.id) {
        await updateRecording(recording.id, {
          status: 'error',
          errorMessage,
        });
      }

      console.error('Generate notes error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Header: Name and Date */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {/* Editable name */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h3
              className="text-xl font-semibold text-white cursor-pointer hover:text-blue-400"
              onClick={() => setIsEditing(true)}
            >
              {customName}
            </h3>
          )}

          {/* Date and duration */}
          <div className="text-gray-400 text-sm mt-1">
            {recording.date.toLocaleString()} • {formatDuration(recording.duration)}
          </div>
        </div>

        {/* Delete button */}
        <div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400 hover:text-red-300 p-2"
              title="Delete recording"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audio player */}
      <audio
        ref={audioRef}
        key={audioUrl}
        controls
        src={audioUrl}
        preload="metadata"
        className="w-full mb-4"
        style={{ height: '40px' }}
      />

      {/* Status and actions */}
      <div className="flex items-center justify-between">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            recording.status === 'recorded' ? 'bg-blue-900 text-blue-200' :
            recording.status === 'transcribing' ? 'bg-yellow-900 text-yellow-200' :
            recording.status === 'transcribed' ? 'bg-green-900 text-green-200' :
            recording.status === 'generating_notes' ? 'bg-purple-900 text-purple-200' :
            recording.status === 'complete' ? 'bg-green-900 text-green-200' :
            'bg-red-900 text-red-200'
          }`}>
            {recording.status === 'recorded' ? 'Ready' :
             recording.status === 'transcribing' ? 'Transcribing...' :
             recording.status === 'transcribed' ? 'Transcribed' :
             recording.status === 'generating_notes' ? 'Generating Notes...' :
             recording.status === 'complete' ? 'Complete' :
             'Error'}
          </span>
        </div>

        {/* Generate Notes button */}
        <button
          onClick={handleGenerateNotes}
          disabled={isProcessing || recording.status === 'complete'}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isProcessing || recording.status === 'complete'
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {recording.status === 'transcribing' ? 'Transcribing...' : 'Generating...'}
            </span>
          ) : recording.status === 'complete' ? (
            'Notes Generated'
          ) : (
            'Generate Notes'
          )}
        </button>
      </div>

      {/* Processing error */}
      {processingError && (
        <div className="mt-4 bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded text-sm flex items-start justify-between gap-2">
          <span className="flex-1">{processingError}</span>
          <button
            onClick={() => setProcessingError(null)}
            className="flex-shrink-0 hover:text-red-100 transition-colors"
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Error message from recording */}
      {recording.errorMessage && !processingError && (
        <div className="mt-4 bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded text-sm flex items-start justify-between gap-2">
          <span className="flex-1">{recording.errorMessage}</span>
          <button
            onClick={async () => {
              if (recording.id) {
                await updateRecording(recording.id, { errorMessage: undefined });
              }
            }}
            className="flex-shrink-0 hover:text-red-100 transition-colors"
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Transcript section (expandable) */}
      {recording.transcript && (
        <div className="mt-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
          >
            <svg
              className={`w-5 h-5 transition-transform ${showTranscript ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Transcript
          </button>

          {showTranscript && (
            <div className="mt-2 bg-gray-900 rounded p-4 border border-gray-700">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans">
                {recording.transcript}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Notes section (expandable) */}
      {recording.notes && (
        <div className="mt-4">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 text-green-400 hover:text-green-300 font-medium"
          >
            <svg
              className={`w-5 h-5 transition-transform ${showNotes ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Study Notes
          </button>

          {showNotes && (
            <div className="mt-2 bg-gray-900 rounded p-4 border border-gray-700">
              <div className="text-gray-300 text-sm prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans">{recording.notes}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
