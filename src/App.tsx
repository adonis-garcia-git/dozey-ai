/**
 * Main App Component
 *
 * Root component that provides context and handles page routing
 */

import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { SettingsPage } from './components/SettingsPage';
import { Toast } from './components/Toast';

// Toast message interface
interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * AppContent component
 * Renders different pages based on currentPage state
 * Must be inside AppProvider to access context
 */
const AppContent: React.FC = () => {
  const { currentPage } = useAppContext();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /**
   * Add a toast notification
   */
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  /**
   * Remove a toast notification
   */
  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    // Dark mode container with full height
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />

      {/* Page content */}
      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * App component
 * Wraps everything in AppProvider
 */
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
