/**
 * Global Application Context
 *
 * Manages app-wide state including:
 * - API keys (OpenAI and Anthropic)
 * - Page navigation
 * - Recording status
 *
 * This context is provided at the root level and can be accessed
 * by any component using the useAppContext hook.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppContextType } from '../types';
import { getOpenAIKey, getAnthropicKey, setOpenAIKey as saveOpenAIKey, setAnthropicKey as saveAnthropicKey } from '../services/apiKeyManager';

// Create the context with undefined as default (will be provided by AppProvider)
const AppContext = createContext<AppContextType | undefined>(undefined);

// Props for the provider component
interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider component
 * Wraps the application and provides global state to all children
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // API Keys state - loaded from localStorage on mount
  const [openaiKey, setOpenAIKeyState] = useState<string | null>(null);
  const [anthropicKey, setAnthropicKeyState] = useState<string | null>(null);

  // Navigation state
  const [currentPage, setCurrentPage] = useState<'home' | 'settings'>('home');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Load API keys from localStorage when component mounts
  useEffect(() => {
    const loadedOpenAIKey = getOpenAIKey();
    const loadedAnthropicKey = getAnthropicKey();

    setOpenAIKeyState(loadedOpenAIKey);
    setAnthropicKeyState(loadedAnthropicKey);
  }, []);

  /**
   * Sets OpenAI API key in both state and localStorage
   */
  const setOpenAIKey = (key: string) => {
    saveOpenAIKey(key);
    setOpenAIKeyState(key);
  };

  /**
   * Sets Anthropic API key in both state and localStorage
   */
  const setAnthropicKey = (key: string) => {
    saveAnthropicKey(key);
    setAnthropicKeyState(key);
  };

  /**
   * Navigate to a different page
   */
  const navigateTo = (page: 'home' | 'settings') => {
    setCurrentPage(page);
  };

  // Combine all state and functions into context value
  const value: AppContextType = {
    openaiKey,
    anthropicKey,
    setOpenAIKey,
    setAnthropicKey,
    currentPage,
    navigateTo,
    isRecording,
    isPaused,
    setIsRecording,
    setIsPaused,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Custom hook to access app context
 * Throws error if used outside of AppProvider
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
