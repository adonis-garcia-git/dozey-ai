/**
 * Home Page Component
 *
 * Main page that displays recording controls and list of recordings
 */

import React from 'react';
import { RecordingControls } from './RecordingControls';
import { RecordingsList } from './RecordingsList';

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-white mb-8">Lecture Recordings</h2>

      {/* Recording controls */}
      <div className="mb-8">
        <RecordingControls />
      </div>

      {/* Recordings list */}
      <div>
        <RecordingsList />
      </div>
    </div>
  );
};
