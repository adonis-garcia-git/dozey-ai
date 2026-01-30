/**
 * Recordings List Component
 *
 * Displays all recordings using Dexie's useLiveQuery hook
 * Automatically updates when recordings are added/modified/deleted
 */

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/storage';
import { RecordingItem } from './RecordingItem';

export const RecordingsList: React.FC = () => {
  /**
   * useLiveQuery automatically subscribes to database changes
   * Component will re-render whenever recordings table changes
   */
  const recordings = useLiveQuery(
    () => db.recordings.orderBy('date').reverse().toArray(),
    [] // Empty deps array - query never changes
  );

  // Show loading state while initial query loads
  if (recordings === undefined) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p className="text-gray-400 mt-2">Loading recordings...</p>
      </div>
    );
  }

  // Show empty state if no recordings
  if (recordings.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
        <svg
          className="mx-auto h-12 w-12 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-400">No recordings yet</h3>
        <p className="mt-2 text-gray-500">
          Click "Start Recording" above to create your first lecture recording
        </p>
      </div>
    );
  }

  // Render recordings list
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">
        Your Recordings ({recordings.length})
      </h3>

      {recordings.map((recording) => (
        <RecordingItem key={recording.id} recording={recording} />
      ))}
    </div>
  );
};
