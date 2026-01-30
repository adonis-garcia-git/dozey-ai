/**
 * Audio Recorder Service
 *
 * Wrapper around MediaRecorder API for recording audio from microphone.
 * Handles permission requests, format selection, and recording lifecycle.
 */

/**
 * AudioRecorder class
 * Manages audio recording state and provides start/pause/resume/stop controls
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private pauseStartTime: number = 0;

  /**
   * Request microphone permission and initialize MediaRecorder
   * @returns Promise resolving when recording is ready to start
   * @throws Error if microphone permission denied or MediaRecorder not supported
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone access with audio constraints optimized for speech
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,              // Mono audio (smaller file, good for speech)
          sampleRate: 16000,             // 16kHz sample rate (optimal for Whisper)
          echoCancellation: true,        // Remove echo
          noiseSuppression: true,        // Reduce background noise
          autoGainControl: true,         // Normalize volume
        },
      });

      // Try different MIME types in order of preference
      // WebM with Opus codec is best supported and works well with Whisper
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported audio format found');
      }

      // Initialize MediaRecorder with selected format
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType,
      });

      // Collect audio data as it becomes available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

    } catch (error) {
      // Clean up if initialization fails
      this.cleanup();

      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        }
      }
      throw new Error('Failed to initialize audio recorder');
    }
  }

  /**
   * Start recording audio
   * @throws Error if recorder not initialized
   */
  start(): void {
    if (!this.mediaRecorder) {
      throw new Error('Recorder not initialized. Call initialize() first.');
    }

    // Reset state for new recording
    this.audioChunks = [];
    this.startTime = Date.now();
    this.pausedDuration = 0;

    // Start recording with timeslice of 1000ms (collects data every second)
    this.mediaRecorder.start(1000);
  }

  /**
   * Pause recording
   * @throws Error if recorder not initialized or not recording
   */
  pause(): void {
    if (!this.mediaRecorder) {
      throw new Error('Recorder not initialized');
    }
    if (this.mediaRecorder.state !== 'recording') {
      throw new Error('Recorder is not recording');
    }

    this.pauseStartTime = Date.now();
    this.mediaRecorder.pause();
  }

  /**
   * Resume recording after pause
   * @throws Error if recorder not initialized or not paused
   */
  resume(): void {
    if (!this.mediaRecorder) {
      throw new Error('Recorder not initialized');
    }
    if (this.mediaRecorder.state !== 'paused') {
      throw new Error('Recorder is not paused');
    }

    // Track total paused time to calculate accurate duration
    this.pausedDuration += Date.now() - this.pauseStartTime;
    this.mediaRecorder.resume();
  }

  /**
   * Stop recording and return audio blob
   * @returns Promise resolving to object with audio blob, duration, and mime type
   * @throws Error if recorder not initialized
   */
  stop(): Promise<{ blob: Blob; duration: number; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not initialized'));
        return;
      }

      // Set up onstop handler before calling stop()
      this.mediaRecorder.onstop = () => {
        // Combine all audio chunks into single blob
        const blob = new Blob(this.audioChunks, {
          type: this.mediaRecorder!.mimeType,
        });

        // Calculate actual recording duration (excluding paused time)
        const totalTime = Date.now() - this.startTime;
        const duration = Math.round((totalTime - this.pausedDuration) / 1000); // Convert to seconds

        resolve({
          blob,
          duration,
          mimeType: this.mediaRecorder!.mimeType,
        });

        // Clean up after successful stop
        this.cleanup();
      };

      // Stop the recording
      this.mediaRecorder.stop();
    });
  }

  /**
   * Get the current MediaStream for visualization
   * @returns MediaStream or null if not initialized
   */
  getAudioStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Get current recording state
   * @returns MediaRecorder state or 'inactive' if not initialized
   */
  getState(): RecordingState {
    return this.mediaRecorder?.state || 'inactive';
  }

  /**
   * Clean up resources (stop tracks, clear references)
   */
  private cleanup(): void {
    // Stop all audio tracks to release microphone
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Public cleanup method for manual cleanup
   */
  dispose(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }
}

// Type for MediaRecorder state
export type RecordingState = 'inactive' | 'recording' | 'paused';
