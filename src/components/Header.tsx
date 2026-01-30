/**
 * Header Component
 *
 * Navigation bar with app title and page links (Home/Settings)
 */

import React from 'react';
import { useAppContext } from '../context/AppContext';

export const Header: React.FC = () => {
  // Get navigation state and functions from context
  const { currentPage, navigateTo } = useAppContext();

  return (
    <header className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* App Title */}
          <h1 className="text-2xl font-bold text-white">
            Dozey AI
          </h1>

          {/* Navigation Links */}
          <nav className="flex space-x-4">
            {/* Home Link */}
            <button
              onClick={() => navigateTo('home')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Home
            </button>

            {/* Settings Link */}
            <button
              onClick={() => navigateTo('settings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
