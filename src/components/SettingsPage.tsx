/**
 * Settings Page Component
 *
 * Manages API key configuration for OpenAI and Anthropic
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { validateOpenAIKey, validateAnthropicKey } from '../services/apiKeyManager';

export const SettingsPage: React.FC = () => {
  const { openaiKey, anthropicKey, setOpenAIKey, setAnthropicKey } = useAppContext();

  // Local state for input values
  const [openaiInput, setOpenaiInput] = useState(openaiKey || '');
  const [anthropicInput, setAnthropicInput] = useState(anthropicKey || '');

  // Validation errors
  const [openaiError, setOpenaiError] = useState<string | null>(null);
  const [anthropicError, setAnthropicError] = useState<string | null>(null);

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Handle OpenAI key save
   */
  const handleSaveOpenAI = () => {
    setSuccessMessage(null);
    setOpenaiError(null);

    // Validate
    if (!openaiInput.trim()) {
      setOpenaiError('API key cannot be empty');
      return;
    }

    if (!validateOpenAIKey(openaiInput)) {
      setOpenaiError('Invalid OpenAI API key format. Key should start with "sk-"');
      return;
    }

    // Save
    setOpenAIKey(openaiInput.trim());
    setSuccessMessage('OpenAI API key saved successfully');
  };

  /**
   * Handle Anthropic key save
   */
  const handleSaveAnthropic = () => {
    setSuccessMessage(null);
    setAnthropicError(null);

    // Validate
    if (!anthropicInput.trim()) {
      setAnthropicError('API key cannot be empty');
      return;
    }

    if (!validateAnthropicKey(anthropicInput)) {
      setAnthropicError('Invalid Anthropic API key format. Key should start with "sk-ant-"');
      return;
    }

    // Save
    setAnthropicKey(anthropicInput.trim());
    setSuccessMessage('Anthropic API key saved successfully');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-white mb-8">Settings</h2>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* API Keys Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">API Keys</h3>
          <p className="text-gray-400 text-sm mb-6">
            Configure your API keys to enable transcription and note generation features.
          </p>
        </div>

        {/* OpenAI API Key */}
        <div>
          <label htmlFor="openai-key" className="block text-sm font-medium text-gray-300 mb-2">
            OpenAI API Key
          </label>
          <p className="text-gray-500 text-xs mb-2">
            Used for Whisper API (audio transcription). Get your key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              platform.openai.com
            </a>
          </p>
          <div className="flex gap-2">
            <input
              id="openai-key"
              type="password"
              value={openaiInput}
              onChange={(e) => {
                setOpenaiInput(e.target.value);
                setOpenaiError(null);
                setSuccessMessage(null);
              }}
              placeholder="sk-..."
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSaveOpenAI}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors"
            >
              Save
            </button>
          </div>
          {openaiError && (
            <p className="text-red-400 text-sm mt-2">{openaiError}</p>
          )}
          {openaiKey && !openaiError && (
            <p className="text-green-400 text-sm mt-2">✓ API key configured</p>
          )}
        </div>

        {/* Anthropic API Key */}
        <div>
          <label htmlFor="anthropic-key" className="block text-sm font-medium text-gray-300 mb-2">
            Anthropic API Key
          </label>
          <p className="text-gray-500 text-xs mb-2">
            Used for Claude API (note generation). Get your key from{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              console.anthropic.com
            </a>
          </p>
          <div className="flex gap-2">
            <input
              id="anthropic-key"
              type="password"
              value={anthropicInput}
              onChange={(e) => {
                setAnthropicInput(e.target.value);
                setAnthropicError(null);
                setSuccessMessage(null);
              }}
              placeholder="sk-ant-..."
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSaveAnthropic}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors"
            >
              Save
            </button>
          </div>
          {anthropicError && (
            <p className="text-red-400 text-sm mt-2">{anthropicError}</p>
          )}
          {anthropicKey && !anthropicError && (
            <p className="text-green-400 text-sm mt-2">✓ API key configured</p>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4 mt-6">
          <p className="text-gray-400 text-sm">
            <strong className="text-gray-300">Security Note:</strong> API keys are stored in your browser's localStorage.
            For production use, consider using a backend proxy to handle API requests securely.
          </p>
        </div>
      </div>
    </div>
  );
};
