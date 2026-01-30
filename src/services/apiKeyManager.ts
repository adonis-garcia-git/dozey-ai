/**
 * API Key Manager
 *
 * Handles storage and retrieval of API keys using localStorage.
 * For MVP, this is acceptable security. In production, use a backend proxy.
 */

// localStorage keys
const OPENAI_KEY_STORAGE = 'dozey_openai_key';
const ANTHROPIC_KEY_STORAGE = 'dozey_anthropic_key';

/**
 * Get OpenAI API key from localStorage
 * @returns API key or null if not set
 */
export const getOpenAIKey = (): string | null => {
  return localStorage.getItem(OPENAI_KEY_STORAGE);
};

/**
 * Save OpenAI API key to localStorage
 * @param key - The API key to save
 */
export const setOpenAIKey = (key: string): void => {
  localStorage.setItem(OPENAI_KEY_STORAGE, key);
};

/**
 * Get Anthropic API key from localStorage
 * @returns API key or null if not set
 */
export const getAnthropicKey = (): string | null => {
  return localStorage.getItem(ANTHROPIC_KEY_STORAGE);
};

/**
 * Save Anthropic API key to localStorage
 * @param key - The API key to save
 */
export const setAnthropicKey = (key: string): void => {
  localStorage.setItem(ANTHROPIC_KEY_STORAGE, key);
};

/**
 * Validate OpenAI API key format
 * OpenAI keys start with "sk-"
 * @param key - The key to validate
 * @returns true if valid format, false otherwise
 */
export const validateOpenAIKey = (key: string): boolean => {
  return key.trim().startsWith('sk-');
};

/**
 * Validate Anthropic API key format
 * Anthropic keys start with "sk-ant-"
 * @param key - The key to validate
 * @returns true if valid format, false otherwise
 */
export const validateAnthropicKey = (key: string): boolean => {
  return key.trim().startsWith('sk-ant-');
};
