/**
 * OpenAI Whisper API Service
 *
 * Handles audio transcription using OpenAI's Whisper model
 */

import OpenAI from 'openai';

/**
 * Transcribe audio using OpenAI Whisper API
 * @param audioBlob - Audio file as Blob
 * @param apiKey - OpenAI API key
 * @returns Promise resolving to transcript text
 * @throws Error if transcription fails
 */
export const transcribeAudio = async (
  audioBlob: Blob,
  apiKey: string
): Promise<string> => {
  try {
    // Check file size (Whisper has 25MB limit)
    const sizeMB = audioBlob.size / (1024 * 1024);
    if (sizeMB > 25) {
      throw new Error(
        `Audio file too large (${sizeMB.toFixed(1)}MB). Whisper API supports files up to 25MB. ` +
        'Consider recording shorter segments.'
      );
    }

    // Convert Blob to File object (required by OpenAI SDK)
    // Use .webm extension as that's the expected format
    const audioFile = new File([audioBlob], 'recording.webm', {
      type: audioBlob.type || 'audio/webm',
    });

    // Initialize OpenAI client
    // dangerouslyAllowBrowser: true is needed for client-side usage
    // In production, this should go through a backend proxy
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    // Call Whisper API
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',              // English language
      response_format: 'json',     // Get JSON response with text
      temperature: 0.2,            // Lower temperature for more consistent output
    });

    // Extract transcript text
    const transcript = response.text;

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcription returned empty text. The audio may be inaudible or too short.');
    }

    return transcript.trim();

  } catch (error) {
    // Handle OpenAI SDK errors
    if (error instanceof OpenAI.APIError) {
      // Handle specific error codes
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key in Settings.');
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.status === 413) {
        throw new Error('Audio file too large for Whisper API (max 25MB).');
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    // Re-throw error if it's already formatted
    if (error instanceof Error) {
      throw error;
    }

    // Generic error fallback
    throw new Error('Failed to transcribe audio. Please try again.');
  }
};
