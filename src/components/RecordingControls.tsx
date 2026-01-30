/**
 * Recording Controls Component
 *
 * Main UI for recording audio:
 * - Large "Record" button to start
 * - Timer display
 * - Pause/Resume/Stop buttons when recording
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { AudioRecorder } from '../services/audioRecorder';
import { saveRecording } from '../services/storage';
import { AudioVisualizer } from './AudioVisualizer';

export const RecordingControls: React.FC = () => {
  const { isRecording, isPaused, setIsRecording, setIsPaused } = useAppContext();

  // Local state
  const [seconds, setSeconds] = useState(0); // Total elapsed seconds
  const [error, setError] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Refs to persist across renders
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Format seconds into HH:MM:SS display
   */
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return [hours, minutes, secs]
      .map((v) => v.toString().padStart(2, '0'))
      .join(':');
  };

  /**
   * Auto-dismiss errors after 8 seconds
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * Start timer that increments every second
   */
  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  /**
   * Stop and reset timer
   */
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setSeconds(0);
  };

  /**
   * Pause timer (stop incrementing but don't reset)
   */
  const pauseTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  /**
   * Handle "Record" button click
   * Initialize recorder and start recording
   */
  const handleStartRecording = async () => {
    try {
      setError(null);

      // Create new recorder instance
      const recorder = new AudioRecorder();
      audioRecorderRef.current = recorder;

      // Initialize (request microphone permission)
      await recorder.initialize();

      // Get audio stream for visualizer
      const stream = recorder.getAudioStream();
      setAudioStream(stream);

      // Start recording
      recorder.start();

      // Update state
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      startTimer();
    } catch (err) {
      // Show error message to user
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Recording error:', err);
    }
  };

  /**
   * Handle "Pause" button click
   */
  const handlePauseRecording = () => {
    if (!audioRecorderRef.current) return;

    try {
      audioRecorderRef.current.pause();
      setIsPaused(true);
      pauseTimer();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause recording';
      setError(errorMessage);
      console.error('Pause error:', err);
    }
  };

  /**
   * Handle "Resume" button click
   */
  const handleResumeRecording = () => {
    if (!audioRecorderRef.current) return;

    try {
      audioRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume recording';
      setError(errorMessage);
      console.error('Resume error:', err);
    }
  };

  /**
   * Handle "Stop" button click
   * Save recording to IndexedDB
   */
  const handleStopRecording = async () => {
    if (!audioRecorderRef.current) return;

    try {
      // Stop recording and get audio blob
      const { blob, duration, mimeType } = await audioRecorderRef.current.stop();

      // Check file size (25MB limit for Whisper API)
      const sizeMB = blob.size / (1024 * 1024);
      if (sizeMB > 25) {
        setError(`Recording too large (${sizeMB.toFixed(1)}MB). Maximum size is 25MB.`);
        return;
      }

      // Generate filename with current date/time
      const now = new Date();
      const filename = `Recording ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

      // Save to IndexedDB
      await saveRecording({
        filename,
        date: now,
        duration,
        audioBlob: blob,
        mimeType,
        status: 'recorded', // Initial status
      });

      // Reset state
      setIsRecording(false);
      setIsPaused(false);
      setAudioStream(null);
      stopTimer();
      audioRecorderRef.current = null;

      // Clear any errors
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save recording';
      setError(errorMessage);
      console.error('Stop recording error:', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.dispose();
      }
      stopTimer();
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-8">
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded flex items-start justify-between gap-2">
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 hover:text-red-100 transition-colors"
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Audio visualizer (visible when recording) */}
      {isRecording && (
        <div className="mb-6">
          <AudioVisualizer
            isRecording={isRecording}
            isPaused={isPaused}
            audioStream={audioStream}
          />
        </div>
      )}

      {/* Timer display (visible when recording) */}
      {isRecording && (
        <div className="text-center mb-6">
          <div className="text-6xl font-mono font-bold text-white">
            {formatTime(seconds)}
          </div>
          <div className="text-gray-400 mt-2">
            {isPaused ? 'Paused' : 'Recording...'}
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex justify-center gap-4">
        {!isRecording ? (
          // Initial state: Show "Record" button
          <button
            onClick={handleStartRecording}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" />
            </svg>
            Start Recording
          </button>
        ) : (
          // Recording state: Show Pause/Resume and Stop buttons
          <>
            {!isPaused ? (
              <button
                onClick={handlePauseRecording}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={handleResumeRecording}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Resume
              </button>
            )}

            <button
              onClick={handleStopRecording}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Stop
            </button>
          </>
        )}
      </div>

      {/* Recording status indicator */}
      {isRecording && !isPaused && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-gray-400 text-sm">Recording in progress</span>
        </div>
      )}
    </div>
  );
};
