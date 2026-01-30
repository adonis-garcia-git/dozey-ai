/**
 * Anthropic Claude API Service
 *
 * Handles note generation from transcripts using Claude Sonnet 3.5
 */

import Anthropic from '@anthropic-ai/sdk';

// System prompt for educational note-taking
const SYSTEM_PROMPT = `You are an expert educational assistant that converts lecture transcripts into well-structured study notes.

Your task is to:
1. Identify the main topics and concepts discussed
2. Organize information into clear sections with headings
3. Extract key points, definitions, and important facts
4. Highlight examples and explanations that aid understanding
5. Create a logical flow that makes the material easy to review

Format your notes using Markdown with:
- Clear section headings (## for main topics, ### for subtopics)
- Bullet points for lists of concepts or facts
- **Bold** for key terms and definitions
- Code blocks for any technical content, formulas, or examples
- Numbered lists for steps or sequences

Keep the notes concise but comprehensive. Focus on information that would be valuable for exam preparation and concept review.`;

/**
 * Generate study notes from transcript using Claude API
 * @param transcript - Lecture transcript text
 * @param apiKey - Anthropic API key
 * @returns Promise resolving to formatted notes (Markdown)
 * @throws Error if note generation fails
 */
export const generateNotes = async (
  transcript: string,
  apiKey: string
): Promise<string> => {
  try {
    // Validate input
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Cannot generate notes from empty transcript.');
    }

    // Initialize Anthropic client
    // dangerouslyAllowBrowser: true is needed for client-side usage
    // In production, this should go through a backend proxy
    const anthropic = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',  // Claude Sonnet 4.5 (most recent version)
      max_tokens: 4096,                      // Allow longer responses for detailed notes
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please convert this lecture transcript into well-structured study notes:\n\n${transcript}`,
        },
      ],
    });

    // Extract text from response
    // Claude API returns an array of content blocks
    let notes = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        notes += block.text;
      }
    }

    if (!notes || notes.trim().length === 0) {
      throw new Error('Claude returned empty notes. Please try again.');
    }

    return notes.trim();

  } catch (error) {
    // Handle Anthropic SDK errors
    if (error instanceof Anthropic.APIError) {
      // Handle specific error codes
      if (error.status === 401) {
        throw new Error('Invalid Anthropic API key. Please check your API key in Settings.');
      } else if (error.status === 429) {
        throw new Error('Anthropic API rate limit exceeded. Please try again later.');
      } else if (error.status === 400) {
        throw new Error('Invalid request to Claude API. The transcript may be too long or malformed.');
      } else {
        throw new Error(`Claude API error: ${error.message}`);
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
    throw new Error('Failed to generate notes. Please try again.');
  }
};
